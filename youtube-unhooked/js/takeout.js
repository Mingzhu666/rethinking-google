// Trap map: parse Google Takeout watch history and find the dopamine traps. Runs entirely in the browser.
import { TRAPS, personaHistory } from './data.js';
import { gemini } from './api.js';
import { $, esc, sleep, countUp, toast } from './ui.js';
import { updateReport } from './report.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const AVG_TRAP_MIN = 9; // estimated average minutes watched per trap video

export function initTakeout() {
  const dz = $('#dropzone'), file = $('#takeout-file');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && readFile(e.dataTransfer.files[0]); });
  file.addEventListener('change', () => file.files[0] && readFile(file.files[0]));
  $('#use-persona').addEventListener('click', () => run(personaHistory(), 'Sample persona', false));
}

async function readFile(f) {
  const text = await f.text();
  let entries;
  try {
    entries = f.name.endsWith('.html') ? parseHTML(text) : parseJSON(text);
  } catch (e) {
    toast('Couldn\'t read that file. Is it the watch-history export from Takeout?');
    return;
  }
  if (!entries.length) { toast('No watch history found in that file'); return; }
  run(entries, f.name, true);
}

const PREFIX = /^(Watched|已观看|已觀看|Vous avez regardé|Visto|Angesehen|視聴しました)\s*/;
function parseJSON(text) {
  return JSON.parse(text)
    .filter(e => e.title && e.time && !(e.details || []).some(d => /Ads|广告/.test(d.name))) // skip ads
    .map(e => ({ title: e.title, time: e.time }));
}
function parseHTML(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return [...doc.querySelectorAll('.content-cell')].map(cell => {
    const a = cell.querySelector('a[href*="watch?v="]');
    if (!a) return null;
    const lines = cell.innerText ? cell.innerText.split('\n') : cell.textContent.split(/\n/);
    const raw = [...cell.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).pop() || lines.pop();
    const t = parseLooseDate(raw);
    return t ? { title: 'Watched ' + a.textContent, time: t.toISOString() } : null;
  }).filter(Boolean);
}
function parseLooseDate(s = '') {
  const zh = s.match(/(\d{4})年(\d{1,2})月(\d{1,2})日.*?(\d{1,2}):(\d{2}):(\d{2})/);
  if (zh) return new Date(+zh[1], zh[2] - 1, +zh[3], +zh[4], +zh[5], +zh[6]);
  const d = new Date(s.replace(/\s[A-Z]{2,5}$/, '').replace(/ /g, ' '));
  return isNaN(d) ? null : d;
}

function keywordClass(title) {
  const t = title.toLowerCase();
  for (const [k, def] of Object.entries(TRAPS)) if (def.kw.some(w => t.includes(w.toLowerCase()))) return k;
  return 'other';
}

async function classify(titles, useAI) {
  const base = titles.map(keywordClass);
  if (!useAI) return { cats: base, source: 'mock' };
  const uniq = [...new Set(titles)].slice(0, 300);
  const prompt = `Classify these YouTube video titles. Categories: rage = outrage / political fighting, fastsci = shallow "explained in N minutes" science, binge = compilations / shorts / mindless autoplay, drama = gossip, envy = triggers money or lifestyle comparison, bait = clickbait, other = anything else (thoughtful or neutral).
Return JSON only: {"c": [one category code per title, in the same order]}
${uniq.map((t, i) => `${i}. ${t}`).join('\n')}`;
  const { data, source } = await gemini('Gemini history classifier', prompt, () => ({ c: uniq.map(keywordClass) }));
  const map = new Map(uniq.map((t, i) => [t, TRAPS[data.c?.[i]] ? data.c[i] : 'other']));
  return { cats: titles.map((t, i) => map.get(t) ?? base[i]), source };
}

function analyze(entries, cats) {
  const items = entries.map((e, i) => ({ title: e.title.replace(PREFIX, ''), t: new Date(e.time), cat: cats[i] }))
    .filter(x => !isNaN(x.t)).sort((a, b) => a.t - b.t);
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0));
  const byCat = {};
  items.forEach(x => {
    byCat[x.cat] = (byCat[x.cat] || 0) + 1;
    if (x.cat !== 'other') heat[(x.t.getDay() + 6) % 7][x.t.getHours()]++;
  });
  // Session: consecutive videos less than 30 minutes apart
  const sessions = [];
  items.forEach(x => {
    const s = sessions[sessions.length - 1];
    if (s && x.t - s.end < 30 * 60000) { s.n++; s.end = x.t; s.traps += x.cat !== 'other'; }
    else sessions.push({ start: x.t, end: x.t, n: 1, traps: +(x.cat !== 'other') });
  });
  const isLate = d => d.getHours() >= 23 || d.getHours() < 4;
  const spirals = sessions.filter(s => isLate(s.start) && s.n >= 5);
  const worst = spirals.reduce((a, b) => (!a || b.n > a.n ? b : a), null);
  const trapN = items.length - (byCat.other || 0);
  const weekAgo = Date.now() - 7 * 864e5;
  const lastWeek = items.filter(x => x.t >= weekAgo);
  const lastWeekTraps = lastWeek.filter(x => x.cat !== 'other').length;
  const recentSpiral = spirals.filter(s => s.start >= weekAgo).sort((a, b) => b.n - a.n)[0] || worst;
  return { items, heat, byCat, spirals, worst, recentSpiral, trapN, lastWeek, lastWeekTraps,
    ratio: items.length ? trapN / items.length : 0 };
}

async function run(entries, label, isUpload) {
  const log = $('#analyze-log');
  const line = async (html, wait = 380) => { log.insertAdjacentHTML('beforeend', `<div>${html}</div>`); await sleep(wait); };
  log.innerHTML = '';
  $('#trap-map').innerHTML = '<div class="empty-map">Analyzing…</div>';
  await line(`› Reading “${esc(label)}”: ${entries.length.toLocaleString('en-US')} entries`);
  await line(isUpload ? '› Parsed locally — nothing was uploaded' : '› Fictional persona — no real user data');
  await line('› Classifying trap types…', 100);
  const { cats, source } = await classify(entries.map(e => e.title.replace(PREFIX, '')), isUpload);
  await line(`<span class="ok">✓ Classified (${source === 'live' ? 'Gemini, live' : source === 'cache' ? 'Gemini, cached' : 'local keyword model'})</span>`);
  const a = analyze(entries, cats);
  await line('› Detecting late-night spirals: 5+ videos in a row, 11 PM–4 AM');
  await line(`<span class="ok">✓ Found ${a.spirals.length} late-night spirals</span>`, 200);
  render(a);
  updateReport(a);
}

function render(a) {
  const max = Math.max(1, ...a.heat.flat());
  const cats = Object.entries(TRAPS).map(([k, t]) => ({ k, t, n: a.byCat[k] || 0 })).sort((x, y) => y.n - x.n);
  const topN = Math.max(1, cats[0].n);
  const hours = Math.round(a.trapN * AVG_TRAP_MIN / 60);
  const w = a.worst;
  $('#trap-map').innerHTML = `
    <div class="map-head">
      <div class="kpi"><small>Videos watched</small><b data-to="${a.items.length}">0</b></div>
      <div class="kpi red"><small>Fell into a trap</small><b><span data-to="${Math.round(a.ratio * 100)}">0</span>%</b></div>
      <div class="kpi"><small>Hours spent in traps</small><b><span data-to="${hours}">0</span><small> h</small></b></div>
      <div class="kpi red"><small>Late-night spirals</small><b data-to="${a.spirals.length}">0</b></div>
    </div>
    <p class="heat-title">When you fall into dopamine traps <span>darker = more likely</span></p>
    <div class="heat">
      <span></span>${Array.from({ length: 24 }, (_, h) => `<span class="hr">${h % 3 ? '' : h}</span>`).join('')}
      ${a.heat.map((row, d) => `<span class="lbl">${DAYS[d]}</span>` + row.map((v, h) =>
        `<i class="cell" title="${DAYS[d]} ${h}:00 · ${v} trap videos" style="transition-delay:${(h + d * 3) * 12}ms;${v ? `background:rgba(255,0,51,${0.12 + 0.88 * v / max})` : ''}"></i>`).join('')).join('')}
    </div>
    <div class="cats">${cats.map(c => `
      <div class="cat-row"><span>${esc(c.t.short)} · <small style="color:#888">${esc(c.t.label)}</small></span>
      <div class="cat-bar"><i style="background:${c.t.color}" data-w="${c.n / topN * 100}"></i></div><b>${c.n}</b></div>`).join('')}
    </div>
    ${w ? `<div class="spiral">Your longest late-night spiral started <b>${w.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${fmtT(w.start)}</b>: <b>${w.n}</b> videos in a row, until <b>${fmtT(w.end)}</b>.<br/>Unhooked would have gently asked at video three: “Keep going?”</div>` : ''}`;
  setTimeout(() => {
    $('.heat').classList.add('in');
    document.querySelectorAll('#trap-map [data-to]').forEach(el => countUp(el, +el.dataset.to));
    document.querySelectorAll('#trap-map [data-w]').forEach(el => el.style.width = el.dataset.w + '%');
  }, 40);
}
const fmtT = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

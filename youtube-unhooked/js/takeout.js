// 陷阱地图：解析 Google Takeout 观看记录，找出多巴胺陷阱。全部在本地浏览器完成。
import { TRAPS, personaHistory } from './data.js';
import { gemini } from './api.js';
import { $, esc, sleep, countUp, toast } from './ui.js';
import { updateReport } from './report.js';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const AVG_TRAP_MIN = 9; // 单条陷阱视频的平均观看分钟数（估算）

export function initTakeout() {
  const dz = $('#dropzone'), file = $('#takeout-file');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && readFile(e.dataTransfer.files[0]); });
  file.addEventListener('change', () => file.files[0] && readFile(file.files[0]));
  $('#use-persona').addEventListener('click', () => run(personaHistory().map(({ _cat, ...e }) => e), '示例人设', false));
}

async function readFile(f) {
  const text = await f.text();
  let entries;
  try {
    entries = f.name.endsWith('.html') ? parseHTML(text) : parseJSON(text);
  } catch (e) {
    toast('没能读懂这个文件，确认是 Takeout 的 watch-history 吗？');
    return;
  }
  if (!entries.length) { toast('文件里没有找到观看记录'); return; }
  run(entries, f.name, true);
}

const PREFIX = /^(Watched|已观看|已觀看|Vous avez regardé|Visto|Angesehen|視聴しました)\s*/;
function parseJSON(text) {
  return JSON.parse(text)
    .filter(e => e.title && e.time && !(e.details || []).some(d => /Ads|广告/.test(d.name)))
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
  const prompt = `把下面的 YouTube 视频标题分类。类别：rage=愤怒对立/政治争吵，fastsci=几分钟速成的浅科普，binge=合集/短视频/适合无脑连播，drama=八卦猎奇，envy=引发收入或生活比较焦虑，bait=标题党，other=其他（有深度或中性的内容）。
只返回 JSON：{"c": [与输入顺序一一对应的类别代码]}
${uniq.map((t, i) => `${i}. ${t}`).join('\n')}`;
  const { data, source } = await gemini('Gemini 观看记录分类', prompt, () => ({ c: uniq.map(keywordClass) }));
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
  // 会话：相邻两条间隔 < 30 分钟
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
  $('#trap-map').innerHTML = '<div class="empty-map">分析中…</div>';
  await line(`› 读取「${esc(label)}」：${entries.length.toLocaleString()} 条记录`);
  await line(isUpload ? '› 文件只在本地解析，没有上传' : '› 使用虚构人设，不涉及真实用户');
  await line('› 识别陷阱类型…', 100);
  const { cats, source } = await classify(entries.map(e => e.title.replace(PREFIX, '')), isUpload);
  await line(`<span class="ok">✓ 分类完成（${source === 'live' ? 'Gemini 实时' : source === 'cache' ? 'Gemini 缓存' : '本地关键词模型'}）</span>`);
  const a = analyze(entries, cats);
  await line('› 检测深夜螺旋：23:00–04:00 连续 ≥5 个视频');
  await line(`<span class="ok">✓ 发现 ${a.spirals.length} 次深夜螺旋</span>`, 200);
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
      <div class="kpi"><small>观看记录</small><b data-to="${a.items.length}">0</b></div>
      <div class="kpi red"><small>落入陷阱</small><b><span data-to="${Math.round(a.ratio * 100)}">0</span>%</b></div>
      <div class="kpi"><small>陷阱里度过约</small><b><span data-to="${hours}">0</span><small> 小时</small></b></div>
      <div class="kpi red"><small>深夜螺旋</small><b data-to="${a.spirals.length}">0</b></div>
    </div>
    <p class="heat-title">多巴胺陷阱时间分布 <span>颜色越深 = 越容易掉进去</span></p>
    <div class="heat">
      <span></span>${Array.from({ length: 24 }, (_, h) => `<span class="hr">${h % 3 ? '' : h}</span>`).join('')}
      ${a.heat.map((row, d) => `<span class="lbl">${DAYS[d]}</span>` + row.map((v, h) =>
        `<i class="cell" title="${DAYS[d]} ${h}:00 · ${v} 个陷阱视频" style="transition-delay:${(h + d * 3) * 12}ms;${v ? `background:rgba(255,0,51,${0.12 + 0.88 * v / max})` : ''}"></i>`).join('')).join('')}
    </div>
    <div class="cats">${cats.map(c => `
      <div class="cat-row"><span>${esc(c.t.short)} · <small style="color:#888">${esc(c.t.label)}</small></span>
      <div class="cat-bar"><i style="background:${c.t.color}" data-w="${c.n / topN * 100}"></i></div><b>${c.n}</b></div>`).join('')}
    </div>
    ${w ? `<div class="spiral">最长的一次深夜螺旋：<b>${w.start.toLocaleDateString('zh-CN')} ${fmtT(w.start)}</b> 开始，连续看了 <b>${w.n}</b> 个视频，到 <b>${fmtT(w.end)}</b> 才停下。<br/>Unhooked 会在第 3 个视频时轻轻问你一句：“还要继续吗？”</div>` : ''}`;
  setTimeout(() => {
    $('.heat').classList.add('in');
    document.querySelectorAll('#trap-map [data-to]').forEach(el => countUp(el, +el.dataset.to));
    document.querySelectorAll('#trap-map [data-w]').forEach(el => el.style.width = el.dataset.w + '%');
  }, 40);
}
const fmtT = d => d.toTimeString().slice(0, 5);

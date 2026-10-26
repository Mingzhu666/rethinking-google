// 01 Anti-interest profile: name who you don't want to become, and the feed blocks it live.
import { TRAPS, FEED, ALTS } from './data.js';
import { gemini } from './api.js';
import { $, $$, cardHTML, countUp, esc, setBadge, toast } from './ui.js';

const state = {
  mode: 'unhooked',
  active: new Set(['rage']),   // one on by default, so the first frame already shows a block
  custom: [],                  // { id, label, matches: Map<feedIndex, reason> }
  swapped: new Map(),          // feedIndex → replacement video
};

const durMin = d => { const p = d.split(':').map(Number); return p.length === 3 ? p[0] * 60 + p[1] : p[0] + p[1] / 60; };

export function initAnti() {
  renderChips();
  renderFeed();
  $$('.mode-switch button').forEach(b => b.addEventListener('click', () => {
    state.mode = b.dataset.mode;
    $$('.mode-switch button').forEach(x => x.classList.toggle('on', x === b));
    $('#feed').classList.toggle('mode-algo', state.mode === 'algo');
    update();
  }));
  $('#custom-anti').addEventListener('submit', onCustom);
}

function renderChips() {
  const el = $('#anti-chips');
  el.innerHTML = Object.entries(TRAPS).map(([k, t]) =>
    `<button class="chip ${state.active.has(k) ? 'on' : ''}" data-k="${k}">${esc(t.label)}</button>`).join('') +
    state.custom.map(c => `<button class="chip on" data-c="${c.id}">${esc(c.label)}<span class="x">✕</span></button>`).join('');
  $$('.chip[data-k]', el).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.k;
    state.active.has(k) ? state.active.delete(k) : state.active.add(k);
    b.classList.toggle('on');
    update();
  }));
  $$('.chip[data-c]', el).forEach(b => b.addEventListener('click', () => {
    state.custom = state.custom.filter(c => c.id !== b.dataset.c);
    renderChips(); update();
  }));
}

function renderFeed() {
  $('#feed').innerHTML = FEED.map((v, i) => {
    const shown = state.swapped.get(i) || v;
    const altTag = state.swapped.has(i) ? `<span class="alt-tag">Swapped for you</span>` : '';
    return `<div class="vcard ${state.swapped.has(i) ? 'swapped' : ''}" data-i="${i}">
      ${cardHTML(shown, altTag)}
      ${v.trap && !state.swapped.has(i) ? `<div class="algo-why">Click probability ${v.click}% → recommend</div>` : ''}
      ${state.swapped.has(i) ? `<div class="algo-why" style="display:block;color:#0a7a3e">${esc(shown.altWhy)}</div>` : ''}
      <div class="block-layer"><span class="stamp">Blocked</span><p class="why-text"></p><button data-swap="${i}">Show me something better</button></div>
    </div>`;
  }).join('');
  $$('[data-swap]').forEach(b => b.addEventListener('click', () => swap(+b.dataset.swap)));
  update(true);
}

function blockReason(i) {
  if (state.swapped.has(i)) return null;
  const v = FEED[i];
  for (const c of state.custom) if (c.matches.has(i)) return { label: c.label, text: c.matches.get(i) };
  if (v.trap && state.active.has(v.trap)) return { label: TRAPS[v.trap].label };
  return null;
}

function update(silent) {
  let n = 0, min = 0;
  $$('#feed .vcard').forEach(card => {
    const i = +card.dataset.i, v = FEED[i];
    const r = state.mode === 'unhooked' ? blockReason(i) : null;
    const was = card.classList.contains('blocked');
    card.classList.toggle('blocked', !!r);
    if (r) {
      n++; min += durMin(v.duration);
      $('.why-text', card).innerHTML = r.text
        ? `${esc(r.text)}<br/><b>Profile: not “${esc(r.label)}”</b>`
        : `You'd probably click (<b>${v.click ?? 70}%</b> predicted), but <b>${v.regret ?? 60}%</b> of similar viewers said they regretted it.<br/><b>Profile: not “${esc(r.label)}”</b>`;
      if (!was) { const s = $('.stamp', card); s.style.animation = 'none'; s.offsetWidth; s.style.animation = ''; }
    }
  });
  countUp($('#blocked-n'), n, { dur: silent ? 1 : 600 });
  countUp($('#saved-min'), Math.round(min), { dur: silent ? 1 : 800 });
}

function swap(i) {
  const v = FEED[i];
  state.swapped.set(i, ALTS[v.trap] || ALTS.bait);
  renderFeed();
}

// A sentence in the user's own words → Gemini decides which feed items move them toward that person
async function onCustom(e) {
  e.preventDefault();
  const input = $('#custom-anti-input');
  const text = input.value.trim();
  if (!text) { toast('Write one sentence about who you don\'t want to become'); return; }
  const btn = $('#custom-anti button');
  btn.disabled = true; btn.textContent = 'Thinking…';

  const list = FEED.map((v, i) => `${i}. ${v.title} (${v.channel}, ${v.duration})`).join('\n');
  const prompt = `You are YouTube's "anti-interest profile" engine. The user says they don't want to become: "${text}".
Here is their algorithmic home feed:
${list}
Pick the videos that would make them more like that person (only clear matches, 0–5 items). For each, write a calm, kind, second-person reason in English, max 25 words.
Also compress the user's sentence into a profile label of max 6 words, phrased as a person (e.g. "Someone who argues at dinner").
Return JSON only: {"label": string, "matches": [{"index": number, "reason": string}]}`;

  const { data, source } = await gemini('Gemini anti-interest profile', prompt, () => mockMatch(text));
  setBadge($('#anti-src'), source);
  const matches = new Map((data.matches || []).filter(m => FEED[m.index]).map(m => [m.index, m.reason]));
  state.custom.push({ id: 'c' + Date.now(), label: shorten(data.label || text), matches });
  input.value = '';
  btn.disabled = false; btn.textContent = 'Add to profile';
  renderChips(); update();
  toast(matches.size ? `Your new profile blocked ${matches.size} video${matches.size > 1 ? 's' : ''}` : 'Nothing on this screen matches it');
}

// Offline fallback: keyword hints → trap categories
function mockMatch(text) {
  const t = text.toLowerCase();
  const hint = {
    argu: 'rage', angry: 'rage', outrage: 'rage', politic: 'rage', fight: 'rage', yell: 'rage',
    night: 'binge', '2 am': 'binge', scroll: 'binge', binge: 'binge', sleep: 'binge', autoplay: 'binge',
    gossip: 'drama', celebrit: 'drama', drama: 'drama',
    envy: 'envy', compar: 'envy', money: 'envy', rich: 'envy', anxious: 'envy',
    shallow: 'fastsci', minute: 'fastsci', quick: 'fastsci', 'pretend': 'fastsci',
    clickbait: 'bait', title: 'bait', thumbnail: 'bait',
  };
  const cats = new Set(Object.entries(hint).filter(([w]) => t.includes(w)).map(([, k]) => k));
  Object.entries(TRAPS).forEach(([k, def]) => def.kw.some(w => t.includes(w)) && cats.add(k));
  if (!cats.size) cats.add('binge');
  const matches = FEED.map((v, index) => ({ v, index })).filter(({ v }) => cats.has(v.trap))
    .map(({ v, index }) => ({ index, reason: `This is ${TRAPS[v.trap].short.toLowerCase()} — close to "${text.slice(0, 40)}". You rarely finish it feeling more like who you want to be.` }));
  const label = /^someone|^a person/i.test(text) ? text : 'Someone ' + text.replace(/^(i don'?t want to be|a|an)\s+/i, '');
  return { label: shorten(label), matches };
}

// Capitalize and cut on a word boundary so chips never end mid-word
function shorten(label, max = 44) {
  let s = label.trim().replace(/^./, c => c.toUpperCase());
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return s;
}

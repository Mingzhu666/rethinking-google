// 01 反兴趣画像：标注“我不想成为的人”，推荐流里实时拦截。
import { TRAPS, FEED, ALTS } from './data.js';
import { gemini } from './api.js';
import { $, $$, cardHTML, countUp, esc, setBadge, toast } from './ui.js';

const state = {
  mode: 'unhooked',
  active: new Set(['rage']),   // 开场默认勾一个，让第一眼就有拦截效果
  custom: [],                  // { id, label, matches: Map<feedIndex, reason> }
  swapped: new Map(),          // feedIndex → 替代视频
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
    const altTag = state.swapped.has(i) ? `<span class="alt-tag">替你换了一个</span>` : '';
    return `<div class="vcard ${state.swapped.has(i) ? 'swapped' : ''}" data-i="${i}">
      ${cardHTML(shown, altTag)}
      ${v.trap && !state.swapped.has(i) ? `<div class="algo-why">点击预测 ${v.click}% → 推荐</div>` : ''}
      ${state.swapped.has(i) ? `<div class="algo-why" style="display:block;color:#0a7a3e">${esc(shown.altWhy)}</div>` : ''}
      <div class="block-layer"><span class="stamp">已挡下</span><p class="why-text"></p><button data-swap="${i}">换一个更好的</button></div>
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
        ? `${esc(r.text)}<br/><b>画像：不想成为「${esc(r.label)}」</b>`
        : `你大概率会点开（预测 <b>${v.click ?? 70}%</b>），但相似用户中 <b>${v.regret ?? 60}%</b> 看完后说后悔。<br/><b>画像：不想成为「${esc(r.label)}」</b>`;
      if (!was) { const s = $('.stamp', card); s.style.animation = 'none'; s.offsetWidth; s.style.animation = ''; }
    }
  });
  countUp($('#blocked-n'), n, { dur: silent ? 1 : 600 });
  countUp($('#saved-min'), Math.round(min), { dur: silent ? 1 : 800 });
}

function swap(i) {
  const v = FEED[i];
  const alt = ALTS[v.trap] || ALTS.bait;
  state.swapped.set(i, alt);
  renderFeed();
}

// 自定义一句话 → Gemini 判断推荐流里哪些视频属于“你不想成为的人”
async function onCustom(e) {
  e.preventDefault();
  const input = $('#custom-anti-input');
  const text = input.value.trim();
  if (!text) { toast('先写一句你不想成为的人'); return; }
  const btn = $('#custom-anti button');
  btn.disabled = true; btn.textContent = '分析中…';

  const list = FEED.map((v, i) => `${i}. ${v.title}（${v.channel}，${v.duration}）`).join('\n');
  const prompt = `你是 YouTube 的“反兴趣画像”引擎。用户说他不想成为这样的人：「${text}」。
下面是算法给他的首页推荐：
${list}
请找出会让他“越来越像那个人”的视频（只挑明显相关的，0~5 个）。用第二人称写一句不超过 40 字、克制温和的拦截理由。
同时把用户这句话压缩成一个不超过 12 字的画像标签。
只返回 JSON：{"label": string, "matches": [{"index": number, "reason": string}]}`;

  const { data, source } = await gemini('Gemini 反兴趣画像', prompt, () => mockMatch(text));
  setBadge($('#anti-src'), source);
  const matches = new Map((data.matches || []).filter(m => FEED[m.index]).map(m => [m.index, m.reason]));
  state.custom.push({ id: 'c' + Date.now(), label: data.label || text.slice(0, 12), matches });
  input.value = '';
  btn.disabled = false; btn.textContent = '加入画像';
  renderChips(); update();
  toast(matches.size ? `新画像挡下了 ${matches.size} 个视频` : '这一屏里没有和它相关的内容');
}

// 离线兜底：关键词 + 标题字符重叠
function mockMatch(text) {
  const hits = Object.entries(TRAPS).filter(([, t]) => t.kw.some(k => text.includes(k)) || [...t.short].filter(c => text.includes(c)).length >= 2);
  const hint = { 吵: 'rage', 骂: 'rage', 政治: 'rage', 愤怒: 'rage', 熬夜: 'binge', 深夜: 'binge', 凌晨: 'binge', 刷: 'binge', 八卦: 'drama', 瓜: 'drama', 焦虑: 'envy', 比较: 'envy', 钱: 'envy', 速成: 'fastsci', 浅: 'fastsci', 标题: 'bait' };
  const cats = new Set(hits.map(([k]) => k));
  Object.entries(hint).forEach(([w, k]) => text.includes(w) && cats.add(k));
  if (!cats.size) cats.add('binge');
  const matches = FEED.map((v, index) => ({ v, index })).filter(({ v }) => cats.has(v.trap))
    .map(({ v, index }) => ({ index, reason: `这条和「${text.slice(0, 14)}」很接近：它属于${TRAPS[v.trap].short}，你看完通常不会更接近想成为的自己。` }));
  return { label: text.replace(/^(一个|一位)?/, '').slice(0, 12), matches };
}

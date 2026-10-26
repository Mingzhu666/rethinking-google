// 通用 UI：视频卡片、缩略图、数字滚动、提示、来源徽章。

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function thumbHTML(v) {
  if (v.img) return `<div class="thumb"><img src="${esc(v.img)}" alt="" loading="lazy" /></div>`;
  const h = v.hue ?? 0;
  const bg = `background: radial-gradient(circle at 75% 30%, hsl(${h + 30} 90% 62%), transparent 55%), linear-gradient(135deg, hsl(${h} 70% 38%), hsl(${h + 50} 60% 18%));`;
  const text = esc(v.thumbText || v.title.slice(0, 6)).replace(/\n/g, '<br/>');
  return `<div class="thumb ${v.loud ? 'loud' : ''}" style="${bg}"><span class="tt">${text}</span></div>`;
}

export function fmtViews(n) {
  if (typeof n === 'string') return n;
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿';
  if (n >= 1e4) return Math.round(n / 1e4) + '万';
  return String(n);
}

export function cardHTML(v, extra = '') {
  const initial = esc((v.channel || '?').trim()[0]);
  const h = v.hue ?? (v.channel || '').length * 37;
  const meta = [v.channel, v.views != null ? fmtViews(v.views) + '次观看' : null, v.when].filter(Boolean).map(esc).join(' · ');
  const link = v.url ? `href="${esc(v.url)}" target="_blank" rel="noopener"` : '';
  return `
    <div class="thumb-wrap">${thumbHTML(v)}<span class="dur">${esc(v.duration || '')}</span>${extra}</div>
    <div class="vmeta">
      <div class="avatar" style="background:hsl(${h} 45% 45%)">${initial}</div>
      <div><a ${link}><h4>${esc(v.title)}</h4></a><p>${meta}</p></div>
    </div>`;
}

export function countUp(el, to, { dur = 1400, dec = 0 } = {}) {
  const from = parseFloat(el.textContent) || 0;
  const t0 = performance.now();
  const token = el._countToken = {};
  const step = t => {
    if (el._countToken !== token) return;
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = (from + (to - from) * e).toFixed(dec);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  // 后台标签页里 rAF 会暂停，保证最终值一定落地
  setTimeout(() => { if (el._countToken === token) el.textContent = Number(to).toFixed(dec); }, dur + 60);
}

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

const SRC_TEXT = { live: 'LIVE 实时', cache: 'CACHED 缓存', mock: 'SAMPLE 示例', mixed: 'MIXED 部分实时' };
export function setBadge(el, source) {
  if (!el) return;
  el.className = 'src-badge ' + source;
  el.textContent = SRC_TEXT[source] || '';
}
// 多个来源合成一个徽章：全部一致就用那个，否则标为混合
export function mergeSources(list) {
  return list.every(s => s === list[0]) ? list[0] : 'mixed';
}

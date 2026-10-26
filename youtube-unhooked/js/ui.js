// Shared UI: video cards, thumbnails, count-up numbers, toasts, source badges.

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
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'K';
  return String(n);
}

export function cardHTML(v, extra = '') {
  const initial = esc((v.channel || '?').trim()[0]);
  const h = v.hue ?? (v.channel || '').length * 37;
  const meta = [v.channel, v.views != null ? fmtViews(v.views) + ' views' : null, v.when].filter(Boolean).map(esc).join(' · ');
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
  // rAF pauses in background tabs; make sure the final value always lands
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

const SRC_TEXT = { live: 'Live', cache: 'Cached', mock: 'Sample', mixed: 'Partly live' };
export function setBadge(el, source) {
  if (!el) return;
  el.className = 'src-badge ' + source;
  el.textContent = SRC_TEXT[source] || '';
}
// Merge several sources into one badge: use it if they all agree, otherwise mixed
export function mergeSources(list) {
  return list.every(s => s === list[0]) ? list[0] : 'mixed';
}

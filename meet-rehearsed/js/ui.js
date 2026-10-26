// Shared UI: count-up numbers, toasts, source badges, avatars.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

export const initials = name => name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
export const avatar = p => `<span class="av" style="background:${p.color}">${esc(initials(p.name))}</span>`;
export const fmtMin = m => { const s = Math.round(m * 60); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

import { FEED, ALTS } from './data.js';
import { getKeys, setKeys, clearCache, sourceLog } from './api.js';
import { $, $$, cardHTML, countUp, toast } from './ui.js';
import { initAnti } from './anti.js';
import { initTakeout } from './takeout.js';
import { initReport, playReport } from './report.js';
import { initBlindBox } from './blindbox.js';
import { initCapsule } from './capsule.js';

// ---------- Hero: an endlessly falling feed ----------
function heroRain() {
  const pool = [...FEED, ...Object.values(ALTS)];
  const cols = window.innerWidth < 900 ? 3 : 6;
  $('#feed-rain').innerHTML = Array.from({ length: cols }, (_, c) => {
    const list = Array.from({ length: 7 }, (_, i) => pool[(c * 5 + i * 3) % pool.length]);
    const cards = [...list, ...list].map(v => `<div class="mini">${cardHTML(v).split('<div class="vmeta">')[0]}<p>${v.title}</p></div>`).join('');
    return `<div class="rain-col" style="animation-duration:${50 + c * 7}s">${cards}</div>`;
  }).join('');
}

// ---------- Scroll reveals ----------
function reveals() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    io.unobserve(el);
    $$('[data-count]', el).forEach(n => !n.closest('#wrapped') && countUp(n, +n.dataset.count, { dur: 2200 }));
    if (el.id === 'wrapped') playReport();
  }), { threshold: 0.25 });
  $$('.reveal, .objective, .yt-window, .wrapped').forEach(el => io.observe(el));
  // hero counter
  setTimeout(() => countUp($('.hero-title .num'), 47, { dur: 2200 }), 600);

  const nav = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.chapters a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { threshold: 0.4 });
  ['problem', 'ch-anti', 'ch-box', 'ch-capsule', 'ch-metric'].forEach(id => nav.observe($('#' + id)));
}

// ---------- Presenter mode: arrow keys / space jump between screens ----------
function presenter() {
  const stops = $$('.stop');
  const current = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let idx = 0;
    stops.forEach((s, i) => { if (s.offsetTop <= y) idx = i; });
    return idx;
  };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, dialog')) return;
    const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key);
    const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key);
    if (!fwd && !back) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(stops.length - 1, current() + (fwd ? 1 : -1)));
    stops[i].scrollIntoView({ behavior: 'smooth' });
  });
}

// ---------- Data source settings ----------
function settings() {
  const dlg = $('#settings');
  const fill = () => {
    const k = getKeys();
    $('#k-yt').value = k.yt || ''; $('#k-gm').value = k.gm || ''; $('#k-model').value = k.model || ''; $('#k-offline').checked = !!k.offline;
    const names = ['YouTube Data API', 'Gemini anti-interest profile', 'Gemini history classifier', 'Gemini blind box curator', 'Open-Meteo weather', 'Wikipedia random article', 'Wikipedia on this day'];
    const txt = { live: '● live', cache: '● cached', mock: '○ sample' };
    $('#src-list').innerHTML = names.map(n => `<li><span>${n}</span><span>${txt[sourceLog[n]] || '— not called yet'}</span></li>`).join('');
  };
  $('#open-settings').addEventListener('click', () => { fill(); dlg.showModal(); });
  $('#save-keys').addEventListener('click', () => {
    setKeys({ yt: $('#k-yt').value.trim(), gm: $('#k-gm').value.trim(), model: $('#k-model').value.trim(), offline: $('#k-offline').checked });
    refreshStatus();
    toast('Saved. Reload the page to apply to every module.');
  });
  $('#clear-cache').addEventListener('click', () => { clearCache(); toast('Cache cleared'); });
  document.addEventListener('uh:source', refreshStatus);
  refreshStatus();
}
function refreshStatus() {
  const k = getKeys();
  const dot = $('#global-status');
  const text = $('#global-status-text');
  if (k.offline) { dot.className = 'status-dot'; text.textContent = 'Safe demo mode'; return; }
  const both = k.yt && k.gm;
  dot.className = 'status-dot ' + (both ? 'live' : k.yt || k.gm ? 'partial' : '');
  text.textContent = both ? 'Live data' : k.yt || k.gm ? 'Partly live' : 'Sample data · add keys';
}

heroRain();
reveals();
presenter();
settings();
initAnti();
initTakeout();
initReport();
initBlindBox();
initCapsule();

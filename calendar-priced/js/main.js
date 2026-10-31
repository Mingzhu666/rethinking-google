import { getKeys, setKeys, clearCache, sourceLog } from './api.js';
import { $, $$, toast } from './ui.js';
import { state } from './state.js';
import { initCalendar } from './calendar.js';
import { initCreate } from './create.js';
import { initIcs } from './ics.js';
import { initVeto } from './veto.js';
import { initReceipt } from './receipt.js';

// ---------- Hero: a taxi meter running on a live meeting ----------
function heroMeter() {
  const guests = 9, startedMinAgo = 32;
  const perSec = guests * state.rate / 3600;
  const t0 = performance.now() - startedMinAgo * 60 * 1000;
  const el = $('#meter'), clock = $('#meter-clock');
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    el.textContent = '$' + (s * perSec).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    clock.textContent = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 50);
  $('#meter-rate').textContent = `${guests} guests × $${state.rate}/h = $${(guests * state.rate).toLocaleString('en-US')} an hour`;
}

// ---------- Scroll reveals ----------
function reveals() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  $$('.reveal, .objective, .gw-window').forEach(el => io.observe(el));
  const nav = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.chapters a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { threshold: 0.4 });
  ['problem', 'ch-price', 'ch-veto', 'ch-receipt', 'ch-metric'].forEach(id => nav.observe($('#' + id)));
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
    if (e.target.closest('input, textarea, select, dialog, [contenteditable]')) return;
    const fwd = ['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key);
    const back = ['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key);
    if (!fwd && !back) return;
    e.preventDefault();
    stops[Math.max(0, Math.min(stops.length - 1, current() + (fwd ? 1 : -1)))].scrollIntoView({ behavior: 'smooth' });
  });
}

// ---------- Data source settings ----------
function settings() {
  const dlg = $('#settings');
  const fill = () => {
    const k = getKeys();
    $('#k-gm').value = k.gm || ''; $('#k-model').value = k.model || ''; $('#k-offline').checked = !!k.offline;
    const names = ['Gemini invite review', 'Gemini async update'];
    const txt = { live: '● live', cache: '● cached', mock: '○ sample' };
    $('#src-list').innerHTML = names.map(n => `<li><span>${n}</span><span>${txt[sourceLog[n]] || '— not called yet'}</span></li>`).join('');
  };
  $('#open-settings').addEventListener('click', () => { fill(); dlg.showModal(); });
  $('#save-keys').addEventListener('click', () => {
    setKeys({ ...getKeys(), gm: $('#k-gm').value.trim(), model: $('#k-model').value.trim(), offline: $('#k-offline').checked });
    refreshStatus();
    toast('Saved. Reload the page to apply to every module.');
  });
  $('#clear-cache').addEventListener('click', () => { clearCache(); toast('Cache cleared'); });
  document.addEventListener('uh:source', refreshStatus);
  refreshStatus();
}
function refreshStatus() {
  const k = getKeys();
  const dot = $('#global-status'), text = $('#global-status-text');
  if (k.offline) { dot.className = 'status-dot'; text.textContent = 'Safe demo mode'; return; }
  dot.className = 'status-dot ' + (k.gm ? 'live' : '');
  text.textContent = k.gm ? 'Live data' : 'Sample data · add key';
}

heroMeter();
reveals();
presenter();
settings();
initCalendar();
initCreate();
initIcs();
initVeto();
initReceipt();

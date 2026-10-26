import { FEED, ALTS } from './data.js';
import { getKeys, setKeys, clearCache, sourceLog } from './api.js';
import { $, $$, cardHTML, countUp, toast } from './ui.js';
import { initAnti } from './anti.js';
import { initTakeout } from './takeout.js';
import { initReport, playReport } from './report.js';
import { initBlindBox } from './blindbox.js';
import { initCapsule } from './capsule.js';

// ---------- Hero：无限下落的推荐流 ----------
function heroRain() {
  const pool = [...FEED, ...Object.values(ALTS)];
  const cols = window.innerWidth < 900 ? 3 : 6;
  $('#feed-rain').innerHTML = Array.from({ length: cols }, (_, c) => {
    const list = Array.from({ length: 7 }, (_, i) => pool[(c * 5 + i * 3) % pool.length]);
    const cards = [...list, ...list].map(v => `<div class="mini">${cardHTML(v).split('<div class="vmeta">')[0]}<p>${v.title}</p></div>`).join('');
    return `<div class="rain-col" style="animation-duration:${50 + c * 7}s">${cards}</div>`;
  }).join('');
}

// ---------- 滚动入场 ----------
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
  // hero 的数字
  setTimeout(() => countUp($('.hero-title .num'), 47, { dur: 2200 }), 600);

  const nav = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    $$('.chapters a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { threshold: 0.4 });
  ['problem', 'ch-anti', 'ch-box', 'ch-capsule', 'ch-metric'].forEach(id => nav.observe($('#' + id)));
}

// ---------- 演讲模式：方向键 / 空格切换下一屏 ----------
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

// ---------- 数据源设置 ----------
function settings() {
  const dlg = $('#settings');
  const fill = () => {
    const k = getKeys();
    $('#k-yt').value = k.yt || ''; $('#k-gm').value = k.gm || ''; $('#k-model').value = k.model || ''; $('#k-offline').checked = !!k.offline;
    const names = ['YouTube Data API', 'Gemini 反兴趣画像', 'Gemini 观看记录分类', 'Gemini 盲盒策展', 'Open-Meteo 天气', 'Wikipedia 随机条目', 'Wikipedia 历史上的今天'];
    const txt = { live: '● 实时', cache: '● 缓存', mock: '○ 示例' };
    $('#src-list').innerHTML = names.map(n => `<li><span>${n}</span><span>${txt[sourceLog[n]] || '— 未调用'}</span></li>`).join('');
  };
  $('#open-settings').addEventListener('click', () => { fill(); dlg.showModal(); });
  $('#save-keys').addEventListener('click', () => {
    setKeys({ yt: $('#k-yt').value.trim(), gm: $('#k-gm').value.trim(), model: $('#k-model').value.trim(), offline: $('#k-offline').checked });
    refreshStatus();
    toast('已保存。刷新页面后所有模块会用新设置');
  });
  $('#clear-cache').addEventListener('click', () => { clearCache(); toast('缓存已清空'); });
  document.addEventListener('uh:source', refreshStatus);
  refreshStatus();
}
function refreshStatus() {
  const k = getKeys();
  const dot = $('#global-status');
  const text = $('#global-status-text');
  if (k.offline) { dot.className = 'status-dot'; text.textContent = '保险模式'; return; }
  const both = k.yt && k.gm;
  dot.className = 'status-dot ' + (both ? 'live' : k.yt || k.gm ? 'partial' : '');
  text.textContent = both ? '实时数据' : k.yt || k.gm ? '部分实时' : '示例数据 · 设置 key';
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

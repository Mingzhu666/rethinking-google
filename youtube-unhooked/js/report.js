// Weekly report, Wrapped-style. Numbers come from the trap map analysis; defaults are shown until then.
import { $, countUp, toast } from './ui.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BLOCK_RATE = 0.7; // assume Unhooked blocks 70% of trap recommendations

export function updateReport(a) {
  const resist = Math.max(1, Math.round(a.lastWeekTraps * BLOCK_RATE));
  const hours = resist * 9 / 60;
  $('#w-resist').dataset.count = resist;
  $('#w-hours').dataset.count = hours.toFixed(1);
  const s = a.recentSpiral;
  if (s) {
    $('#w-danger').textContent = `${DAYS[s.start.getDay()]} ${s.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    $('#w-danger-sub').textContent = `${s.n} videos in a row that night. Next time, we'll check in at video three.`;
  }
  const oldPct = Math.round(a.ratio * 100);
  $('#w-regret-old').textContent = oldPct + '%';
  $('#w-regret-new').textContent = Math.round(oldPct * (1 - BLOCK_RATE)) + '%';
  if ($('#wrapped').classList.contains('in')) playReport();
}

export function playReport() {
  ['#w-resist', '#w-hours'].forEach(id => {
    const el = $(id);
    el.textContent = '0';
    countUp(el, +el.dataset.count, { dur: 1600, dec: +(el.dataset.dec || 0) });
  });
}

export function initReport() {
  $('#share-report').addEventListener('click', async () => {
    try {
      if (!window.html2canvas) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      const canvas = await window.html2canvas($('#wrapped'), { backgroundColor: '#0b0a09', scale: 2 });
      const a = document.createElement('a');
      a.download = 'unhooked-weekly.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast('Share card saved');
    } catch {
      toast('Can\'t render the image offline — take a screenshot instead');
    }
  });
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

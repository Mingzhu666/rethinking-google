// 每周报告：Wrapped 风格。数字来自陷阱地图的分析；没分析时用默认示例值。
import { $, countUp, toast } from './ui.js';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const BLOCK_RATE = 0.7; // 假设 Unhooked 能拦下七成陷阱推荐

export function updateReport(a) {
  const resist = Math.max(1, Math.round(a.lastWeekTraps * BLOCK_RATE));
  const hours = resist * 9 / 60;
  $('#w-resist').dataset.count = resist;
  $('#w-hours').dataset.count = hours.toFixed(1);
  const s = a.recentSpiral;
  if (s) {
    $('#w-danger').textContent = `${DAYS[s.start.getDay()]} ${s.start.toTimeString().slice(0, 5)}`;
    $('#w-danger-sub').textContent = `那晚你连续看了 ${s.n} 个视频。下一次，我们会在第 3 个时提醒你`;
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
      toast('分享卡片已保存');
    } catch {
      toast('离线状态下无法生成图片，可以直接截图');
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

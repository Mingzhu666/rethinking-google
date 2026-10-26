// 03 时间胶囊：只展示 N 年前的今天上传的视频，界面随年代变旧。
import { ytSearch, onThisDay } from './api.js';
import { mockVideos } from './data.js';
import { $, $$, esc, cardHTML, setBadge, mergeSources } from './ui.js';

let seq = 0;

export function initCapsule() {
  $$('#capsule-dial button').forEach(b => b.addEventListener('click', () => {
    $$('#capsule-dial button').forEach(x => x.classList.toggle('on', x === b));
    show(+b.dataset.y);
  }));
  show(1);
}

async function show(years) {
  const my = ++seq;
  const win = $('#capsule-window');
  win.dataset.era = years;
  const now = new Date();
  const day = new Date(Date.UTC(now.getFullYear() - years, now.getMonth(), now.getDate()));
  const y = day.getUTCFullYear(), m = day.getUTCMonth() + 1, d = day.getUTCDate();
  $('#capsule-date').textContent = `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
  $('#capsule-grid').innerHTML = '';

  const next = new Date(day.getTime() + 864e5);
  const [vids, events] = await Promise.all([
    ytSearch({ publishedAfter: day.toISOString(), publishedBefore: next.toISOString(), order: 'viewCount', maxResults: 8, safeSearch: 'strict' },
      () => mockVideos(String(y), 8, { titles: eraTitles(y), queries: eraTitles(y) })),
    onThisDay('events', m, d, () => [{ year: y, text: '这一天，世界照常运转。' }]),
  ]);
  if (my !== seq) return; // 用户已经切换到别的年份

  const evs = [...events.data].sort((a, b) => Math.abs(a.year - y) - Math.abs(b.year - y)).slice(0, 4);
  $('#world-strip').innerHTML = `<div class="ev" style="flex:.6;background:#0f0f0f;color:#fff"><b style="color:var(--calm)">那一天的世界</b>历史上的 ${m} 月 ${d} 日</div>` +
    evs.map(e => `<div class="ev"><b>${e.year}</b>${esc(e.text.slice(0, 60))}</div>`).join('');

  $('#capsule-grid').innerHTML = vids.data.map(v =>
    `<div class="vcard">${cardHTML({ ...v, when: `${years} 年前的今天` })}</div>`).join('');
  $$('#capsule-grid .vcard').forEach((el, i) => setTimeout(() => el.classList.add('in'), 80 * i));
  setBadge($('#capsule-src'), mergeSources([vids.source, events.source]));
}

function eraTitles(y) {
  return [
    `${y} 年秋天的一场城市暴雨，实拍`, `${y} 年度最火的那首歌（现场版）`, `那一年我们都在玩的游戏 · ${y}`, `${y} 毕业季 vlog：最后一次回宿舍`,
    `${y} 年的科技发布会，现在回头看`, `手机拍下的 ${y} 年街头`, `${y} 年，一碗面馆的最后一天`, `${y} 年度纪录片预告合辑`,
  ];
}

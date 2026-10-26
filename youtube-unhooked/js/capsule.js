// 03 Time capsule: only videos uploaded on this date N years ago; the UI ages with the era.
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
  $('#capsule-date').textContent = day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  $('#capsule-grid').innerHTML = '';

  const next = new Date(day.getTime() + 864e5);
  const [vids, events] = await Promise.all([
    ytSearch({ publishedAfter: day.toISOString(), publishedBefore: next.toISOString(), order: 'viewCount', maxResults: 8, safeSearch: 'strict' },
      () => mockVideos(String(y), 8, { titles: eraTitles(y), queries: eraTitles(y), thumbs: eraThumbs(y) })),
    onThisDay('events', m, d, () => [{ year: y, text: 'The world went on as usual that day.' }]),
  ]);
  if (my !== seq) return; // the user already switched to another year

  const evs = [...events.data].sort((a, b) => Math.abs(a.year - y) - Math.abs(b.year - y)).slice(0, 4);
  $('#world-strip').innerHTML = `<div class="ev" style="flex:.6;background:#0f0f0f;color:#fff"><b style="color:var(--calm)">The world that day</b>On this day in history</div>` +
    evs.map(e => `<div class="ev"><b>${e.year}</b>${esc(e.text.slice(0, 110))}</div>`).join('');

  $('#capsule-grid').innerHTML = vids.data.map(v =>
    `<div class="vcard">${cardHTML({ ...v, when: `${years} year${years > 1 ? 's' : ''} ago today` })}</div>`).join('');
  $$('#capsule-grid .vcard').forEach((el, i) => setTimeout(() => el.classList.add('in'), 80 * i));
  setBadge($('#capsule-src'), mergeSources([vids.source, events.source]));
}

function eraTitles(y) {
  return [
    `Autumn storm downtown, filmed on my phone (${y})`, `The biggest song of ${y}, live`, `The game everyone was playing in ${y}`, `Graduation vlog: last night in the dorm, ${y}`,
    `${y}'s big tech keynote, in hindsight`, `Street footage, ${y}`, `Last day at the noodle shop, ${y}`, `Documentary trailers of ${y}`,
  ];
}
function eraThumbs(y) {
  return ['Storm\n' + y, 'Live\n' + y, 'Game\nnight', 'Class of\n' + y, 'Keynote\n' + y, 'Street\n' + y, 'Last\nday', 'Docs\n' + y];
}

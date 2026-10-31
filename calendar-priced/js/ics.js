// Price your real calendar: parse an exported .ics in the browser and total the last four weeks.
import { state } from './state.js';
import { money, gaps, deepHours } from './cost.js';
import { $, esc, sleep, toast } from './ui.js';

const WEEKS = 4;

export function initIcs() {
  const dz = $('#ics-drop'), file = $('#ics-file');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); e.dataTransfer.files[0] && read(e.dataTransfer.files[0]); });
  file.addEventListener('change', () => file.files[0] && read(file.files[0]));
}

async function read(f) {
  const text = await f.text();
  if (!/BEGIN:VCALENDAR/.test(text)) { toast('That doesn\'t look like an .ics calendar file'); return; }
  const out = $('#ics-out');
  out.innerHTML = '<p class="muted-s">Reading your calendar locally…</p>';
  await sleep(300);
  const now = new Date();
  const from = new Date(now.getTime() - WEEKS * 7 * 864e5);
  const occ = expand(parse(text), from, now).filter(o => o.guests >= 2);
  if (!occ.length) { out.innerHTML = '<p class="muted-s">No meetings with other people in the last four weeks.</p>'; return; }
  render(occ, f.name);
}

// Minimal RFC 5545 parsing: unfold lines, read DTSTART/DTEND/DURATION/SUMMARY/ATTENDEE/RRULE
function parse(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = { guests: 0 };
    else if (line === 'END:VEVENT') { if (cur?.start) events.push(cur); cur = null; }
    else if (cur) {
      const i = line.indexOf(':');
      const key = line.slice(0, i).split(';')[0], val = line.slice(i + 1);
      if (key === 'DTSTART') cur.start = parseDate(val);
      else if (key === 'DTEND') cur.end = parseDate(val);
      else if (key === 'DURATION') cur.durMs = parseDuration(val);
      else if (key === 'SUMMARY') cur.title = val.replace(/\\,/g, ',').replace(/\\n/g, ' ');
      else if (key === 'ATTENDEE') cur.guests++;
      else if (key === 'RRULE') cur.rrule = Object.fromEntries(val.split(';').map(kv => kv.split('=')));
      else if (key === 'STATUS' && val === 'CANCELLED') cur.cancelled = true;
    }
  }
  return events.filter(e => !e.cancelled).map(e => ({ ...e, durMs: e.durMs ?? (e.end ? e.end - e.start : 0) })).filter(e => e.durMs > 0 && e.durMs < 10 * 36e5);
}

function parseDate(v) {
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h = '0', mi = '0', s = '0', z] = m;
  return z ? new Date(Date.UTC(+y, mo - 1, +d, +h, +mi, +s)) : new Date(+y, mo - 1, +d, +h, +mi, +s);
}
function parseDuration(v) {
  const m = v.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/) || [];
  return ((+m[1] || 0) * 24 + (+m[2] || 0)) * 36e5 + (+m[3] || 0) * 6e4;
}

// Expand DAILY / WEEKLY recurrences into the window; anything else counts once if it falls inside
function expand(events, from, to) {
  const out = [];
  const DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  for (const e of events) {
    const r = e.rrule;
    const push = start => { if (start >= from && start <= to) out.push({ title: e.title || 'Untitled', start, hours: e.durMs / 36e5, guests: e.guests }); };
    if (!r || !['DAILY', 'WEEKLY'].includes(r.FREQ)) { push(e.start); continue; }
    const until = r.UNTIL ? parseDate(r.UNTIL) : null;
    const interval = +r.INTERVAL || 1;
    const byDay = r.BYDAY ? r.BYDAY.split(',').map(d => DAYS[d.slice(-2)]) : null;
    let count = 0;
    for (let d = new Date(e.start); d <= to && (!until || d <= until) && count < 2000; d = new Date(d.getTime() + 864e5)) {
      const days = Math.round((d - e.start) / 864e5);
      const ok = r.FREQ === 'DAILY'
        ? days % interval === 0
        : Math.floor(days / 7) % interval === 0 && (byDay ? byDay.includes(d.getDay()) : d.getDay() === e.start.getDay());
      if (!ok) continue;
      if (r.COUNT && ++count > +r.COUNT) break;
      push(d);
    }
  }
  return out;
}

function render(occ, name) {
  const rate = state.rate;
  const total = occ.reduce((a, o) => a + o.guests * o.hours * rate, 0);
  const hours = occ.reduce((a, o) => a + o.hours, 0);
  const byTitle = {};
  occ.forEach(o => { const k = o.title; (byTitle[k] ||= { title: k, n: 0, cost: 0 }); byTitle[k].n++; byTitle[k].cost += o.guests * o.hours * rate; });
  const top = Object.values(byTitle).sort((a, b) => b.cost - a.cost).slice(0, 5);
  // Your focus blocks per working day
  const days = {};
  occ.forEach(o => {
    if ([0, 6].includes(o.start.getDay())) return;
    const k = o.start.toDateString();
    const h = o.start.getHours() + o.start.getMinutes() / 60;
    (days[k] ||= []).push([h, h + o.hours]);
  });
  const workdays = WEEKS * 5;
  const focus = Object.values(days).reduce((a, b) => a + deepHours(gaps(b)), 0) + (workdays - Object.keys(days).length) * 9;
  $('#ics-out').innerHTML = `
    <div class="ics-kpis">
      <div><small>Meetings, last ${WEEKS} weeks</small><b>${occ.length}</b></div>
      <div><small>Hours you spent in them</small><b>${hours.toFixed(0)}</b></div>
      <div class="red"><small>What they cost (at ${money(rate)}/h)</small><b>${money(total)}</b></div>
      <div><small>Your focus time left / day</small><b>${(focus / workdays).toFixed(1)}h</b></div>
    </div>
    <h5>Most expensive meetings</h5>
    <ol class="ics-top">${top.map(t => `<li><span>${esc(t.title)}</span><small>${t.n}×</small><b>${money(t.cost)}</b></li>`).join('')}</ol>
    <p class="muted-s">From ${esc(name)} · parsed in your browser, never uploaded · guest count from the invite's attendee list.</p>`;
}

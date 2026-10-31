// 01 Price tags: a Google Calendar week view where every meeting shows what it really costs.
import { state, person, changed, weekDates, fmtTime, fmtRange, DAY_NAMES } from './state.js';
import { eventCost, weekSummary, fragmentation, gaps, tier, money, DAY_START, DAY_END, FOCUS_MIN } from './cost.js';
import { PEOPLE } from './data.js';
import { $, $$, esc, avatar } from './ui.js';

const HOUR = 56; // px per hour in the grid

export function initCalendar() {
  const dates = weekDates();
  const first = dates[0], last = dates[4];
  $('#cal-range').textContent = `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: first.getMonth() === last.getMonth() ? undefined : 'short', day: 'numeric' })}, ${last.getFullYear()}`;
  $('#cal-days').innerHTML = '<div></div>' + dates.map((d, i) => `<div class="dayhead"><small>${DAY_NAMES[i].toUpperCase()}</small><b>${d.getDate()}</b></div>`).join('');
  $('#cal-times').innerHTML = Array.from({ length: DAY_END - DAY_START }, (_, i) => `<span style="top:${i * HOUR}px">${fmtTime(DAY_START + i)}</span>`).join('');
  $('#cal-grid').style.height = (DAY_END - DAY_START) * HOUR + 'px';

  $('#cost-toggle').addEventListener('change', e => { state.showCost = e.target.checked; render(); });
  $('#rate').addEventListener('input', e => { state.rate = +e.target.value; $('#rate-out').textContent = money(state.rate); render(); changed('rate'); });
  $('#threshold').addEventListener('change', e => { state.threshold = Math.max(50, +e.target.value || 500); render(); changed('threshold'); });
  $('#cal-settings-btn').addEventListener('click', () => $('#cal-settings').toggleAttribute('hidden'));
  $('#detail-close').addEventListener('click', closeDetail);
  document.addEventListener('week:changed', e => { if (e.detail !== 'rate' && e.detail !== 'threshold') render(); });
  render();
}

function render() {
  const win = $('#cal-window');
  win.classList.toggle('costs', state.showCost);
  const sum = weekSummary(state.events, state.rate, PEOPLE);
  const byId = Object.fromEntries(sum.costs.map(c => [c.ev.id, c]));

  $('#cal-cols').innerHTML = [0, 1, 2, 3, 4].map(day => {
    // Your own focus blocks and fragments, painted behind the meetings
    const mine = state.events.filter(e => e.day === day && !e.cancelled && e.attendees.includes('you')).map(e => [e.start, e.start + e.dur]);
    const bg = gaps(mine).map(([s, e]) => `<div class="gap ${e - s >= FOCUS_MIN ? 'focus' : 'frag'}" style="top:${(s - DAY_START) * HOUR}px;height:${(e - s) * HOUR}px">${e - s >= FOCUS_MIN ? `<span>Focus ${(e - s).toFixed(1).replace('.0', '')}h</span>` : ''}</div>`).join('');
    const evs = state.events.filter(e => e.day === day && e.attendees.includes('you')).map(e => {
      const c = byId[e.id];
      const short = e.dur <= 0.5; // 30 min and under: one line, title + price
      const t = c ? tier(c.total, state.threshold) : 'green';
      return `<button class="ev ${short ? 'short' : ''} ${e.cancelled ? 'cancelled' : ''} ${e.isNew ? 'new' : ''}" data-id="${e.id}" style="top:${(e.start - DAY_START) * HOUR + 1}px;height:${Math.max(e.dur * HOUR - 2, 12)}px">
        <b>${esc(e.title)}</b>${short ? '' : `<small>${fmtRange(e)}</small>`}
        ${e.reason ? '<i class="has-reason" title="Reason attached">✎</i>' : ''}
        ${c ? `<span class="price ${t}">${money(c.total)}</span>` : e.cancelled ? '<span class="price saved">Cancelled</span>' : ''}
      </button>`;
    }).join('');
    return `<div class="col">${bg}${evs}</div>`;
  }).join('');
  $$('#cal-cols .ev').forEach(b => b.addEventListener('click', () => openDetail(b.dataset.id)));

  // Week summary in the sidebar
  const top = [...sum.costs].sort((a, b) => b.total - a.total)[0];
  $('#sum-total').textContent = money(sum.total);
  $('#sum-frag').textContent = money(sum.fragCost);
  $('#sum-hours').textContent = sum.meetingHours.toFixed(0);
  $('#sum-focus').textContent = sum.avgFocus.toFixed(1);
  $('#sum-top').innerHTML = top ? `${esc(top.ev.title)} · ${money(top.total)}` : '—';
  $('#sum-saved').textContent = state.saved ? money(state.saved) : '—';
  if ($('#cal-detail').dataset.id) openDetail($('#cal-detail').dataset.id, true);
}

function openDetail(id, quiet) {
  const e = state.events.find(x => x.id === id);
  if (!e) return closeDetail();
  const panel = $('#cal-detail');
  panel.dataset.id = id;
  panel.hidden = false;
  $$('#cal-cols .ev').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
  if (e.cancelled) {
    $('#detail-body').innerHTML = `<h3 class="struck">${esc(e.title)}</h3><p class="when">${DAY_NAMES[e.day]} · ${fmtRange(e)}</p>
      <div class="saved-note">Cancelled after the anonymous value check. ${e.attendees.length} people got ${e.dur * 60} minutes back.</div>`;
    return;
  }
  const c = eventCost(e, state.events, state.rate);
  const frag = fragmentation(e, state.events);
  const t = tier(c.total, state.threshold);
  const max = Math.max(c.people, c.fragCost, 1);
  const pct = h => `${((h - DAY_START) / (DAY_END - DAY_START)) * 100}%`;
  const track = (g, mark) => g.map(([s, en]) => `<span class="${en - s >= FOCUS_MIN ? 'f' : 'x'}" style="left:${pct(s)};width:calc(${pct(en)} - ${pct(s)})"></span>`).join('') +
    (mark ? `<em style="left:${pct(e.start)};width:calc(${pct(e.start + e.dur)} - ${pct(e.start)})"></em>` : '');
  $('#detail-body').innerHTML = `
    <h3>${esc(e.title)}</h3>
    <p class="when">${DAY_NAMES[e.day]} · ${fmtRange(e)}${e.recurring ? ' · Repeats weekly' : ''}</p>
    <div class="guests-row">${e.attendees.map(id => avatar(person(id))).join('')}<span>${e.attendees.length} guests</span></div>
    <div class="cost-total ${t}"><small>True cost of this meeting</small><b>${money(c.total)}</b>${e.recurring ? `<span>${money(c.total * 52)} a year</span>` : ''}</div>
    <div class="cost-lines">
      <div><span>People time</span><i><u style="width:${(c.people / max) * 100}%"></u></i><b>${money(c.people)}</b><small>${e.attendees.length} × ${e.dur * 60} min × ${money(state.rate)}/h</small></div>
      <div><span>Fragmentation</span><i><u class="frag" style="width:${(c.fragCost / max) * 100}%"></u></i><b>${money(c.fragCost)}</b><small>${frag.shattered} focus block${frag.shattered === 1 ? '' : 's'} shattered · ${frag.lostHours} h of deep work lost</small></div>
    </div>
    <h4>Whose focus time it breaks</h4>
    <div class="frag-rows">${frag.perPerson.map(p => `
      <div class="frag-row ${p.lost ? 'hit' : ''}">
        ${avatar(person(p.id))}
        <div class="tracks"><div class="trk before">${track(p.before)}</div><div class="trk after">${track(p.after, true)}</div></div>
        <b>${p.lost ? '−' + p.lost.toString().replace(/\.?0+$/, '') + 'h' : '—'}</b>
      </div>`).join('')}
    </div>
    <p class="legend"><span class="lf"></span>Focus block (90+ min) <span class="lx"></span>Fragment <span class="lm"></span>This meeting · top row without it, bottom row with it</p>`;
  if (!quiet) panel.scrollTop = 0;
}

function closeDetail() {
  const panel = $('#cal-detail');
  panel.hidden = true;
  delete panel.dataset.id;
  $$('#cal-cols .ev').forEach(b => b.classList.remove('sel'));
}

export { openDetail };

// 03 Weekly receipt: the team's meeting spend, itemized like a till receipt.
import { state, weekDates } from './state.js';
import { weekSummary, money } from './cost.js';
import { PEOPLE } from './data.js';
import { $, esc, toast } from './ui.js';

const ITEMS = 6;

export function initReceipt() {
  render();
  document.addEventListener('week:changed', render);
  $('#receipt-send').addEventListener('click', () => toast('Receipt sent to the team every Friday at 4 PM'));
}

function render() {
  const sum = weekSummary(state.events, state.rate, PEOPLE);
  // Itemize the week as booked (cancellations included), then subtract what the value check saved
  const gross = weekSummary(state.events.map(e => ({ ...e, cancelled: false })), state.rate, PEOPLE);
  // Round each printed line first so the receipt adds up to the cent
  const fragLine = Math.round(gross.fragCost), totalLine = Math.round(sum.total);
  // Group recurring instances (the daily standup) into one line
  const lines = {};
  gross.costs.forEach(c => {
    const k = c.ev.title;
    (lines[k] ||= { title: k, n: 0, people: 0, total: 0 });
    lines[k].n++; lines[k].people += c.people; lines[k].total += c.people;
  });
  const sorted = Object.values(lines).sort((a, b) => b.total - a.total);
  const shown = sorted.slice(0, ITEMS), rest = sorted.slice(ITEMS);
  const restTotal = rest.reduce((a, l) => a + l.total, 0);
  const peopleTotal = Math.round(gross.total - gross.fragCost);
  const cancelledSaving = peopleTotal + fragLine - totalLine;
  const [mon, , , , fri] = weekDates();
  const d = x => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const protectedHours = state.saved ? Math.round(state.saved / state.rate) : 0;
  $('#receipt').innerHTML = `
    <div class="rc-head"><b>GOOGLE CALENDAR</b><span>Weekly meeting receipt</span><span>Product team · ${d(mon)} – ${d(fri)}</span></div>
    <div class="rc-sep"></div>
    ${shown.map(l => `<div class="rc-line"><span>${esc(l.title)}${l.n > 1 ? ` ×${l.n}` : ''}</span><b>${money(l.total)}</b></div>`).join('')}
    ${rest.length ? `<div class="rc-line"><span>${rest.length} other meetings</span><b>${money(restTotal)}</b></div>` : ''}
    <div class="rc-sep"></div>
    <div class="rc-line"><span>Subtotal · people time</span><b>${money(peopleTotal)}</b></div>
    <div class="rc-line"><span>Fragmentation surcharge</span><b>${money(fragLine)}</b></div>
    ${cancelledSaving > 0 ? `<div class="rc-line save"><span>Cancelled via value check</span><b>−${money(cancelledSaving)}</b></div>` : ''}
    <div class="rc-sep dbl"></div>
    <div class="rc-line total"><span>TOTAL</span><b>${money(totalLine)}</b></div>
    <div class="rc-sep"></div>
    <div class="rc-foot">
      <span>${sum.meetingHours.toFixed(0)} people-hours in meetings</span>
      <span>${sum.avgFocus.toFixed(1)} h of focus time left per person</span>
      ${protectedHours ? `<span>★ ${protectedHours} people-hours given back this week</span>` : ''}
      ${state.avoided ? `<span>★ ${money(state.avoided)} of meetings became docs before they were sent</span>` : ''}
    </div>
    <div class="rc-barcode"></div>
    <div class="rc-thanks">Every meeting is a purchase. Spend wisely.</div>`;
}

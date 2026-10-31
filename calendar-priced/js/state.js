// Shared state for the calendar, value check and receipt. Changes broadcast a 'week:changed' event.
import { WEEK, PEOPLE } from './data.js';

export const state = {
  events: structuredClone(WEEK),
  rate: 85,          // org-average loaded hourly cost, set by an admin
  threshold: 500,    // meetings above this need a written reason
  showCost: false,
  saved: 0,          // dollars saved this week (cancellations + meetings turned into docs)
  avoided: 0,        // of which: invites that became a doc before they were sent
};

export const person = id => PEOPLE.find(p => p.id === id);

export function changed(reason) {
  document.dispatchEvent(new CustomEvent('week:changed', { detail: reason }));
}

export function weekDates() {
  // Mon–Fri of the current week (next week if today is a weekend)
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dow + 6) % 7) + (dow === 0 || dow === 6 ? 7 : 0));
  return [0, 1, 2, 3, 4].map(i => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

export const fmtTime = h => {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  const ap = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return mm ? `${h12}:${String(mm).padStart(2, '0')} ${ap}` : `${h12} ${ap}`;
};
export const fmtRange = e => `${fmtTime(e.start)} – ${fmtTime(e.start + e.dur)}`;
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

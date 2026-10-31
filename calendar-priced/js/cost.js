// Meeting cost engine. Pure functions over a list of events.
// cost = people time (guests × hours × rate) + fragmentation (deep-work hours destroyed beyond the meeting itself)

export const DAY_START = 9, DAY_END = 18;
export const FOCUS_MIN = 1.5; // a free gap counts as deep-work time only if it's at least 90 minutes

const round = n => Math.round(n * 100) / 100;

export const peopleCost = (e, rate) => e.attendees.length * e.dur * rate;

// Free gaps in a person's working day, given their busy intervals
export function gaps(busy) {
  const sorted = [...busy].sort((a, b) => a[0] - b[0]);
  const out = [];
  let t = DAY_START;
  for (const [s, e] of sorted) {
    if (s > t) out.push([t, Math.min(s, DAY_END)]);
    t = Math.max(t, e);
  }
  if (t < DAY_END) out.push([t, DAY_END]);
  return out.filter(([s, e]) => e - s > 0.01);
}

export const deepHours = g => g.filter(([s, e]) => e - s >= FOCUS_MIN).reduce((a, [s, e]) => a + (e - s), 0);

const busyOf = (events, person, day, skipId) => events
  .filter(e => e.day === day && e.id !== skipId && !e.cancelled && e.attendees.includes(person))
  .map(e => [e.start, e.start + e.dur]);

// How much deep work this one meeting destroys, per attendee
export function fragmentation(ev, events) {
  const perPerson = ev.attendees.map(id => {
    const before = gaps(busyOf(events, id, ev.day, ev.id));
    const after = gaps([...busyOf(events, id, ev.day, ev.id), [ev.start, ev.start + ev.dur]]);
    const lost = Math.max(0, deepHours(before) - deepHours(after) - ev.dur);
    return { id, before, after, lost: round(lost) };
  });
  return {
    perPerson,
    lostHours: round(perPerson.reduce((a, p) => a + p.lost, 0)),
    shattered: perPerson.filter(p => p.lost > 0).length,
  };
}

export function eventCost(ev, events, rate) {
  const people = peopleCost(ev, rate);
  const frag = fragmentation(ev, events);
  const fragCost = frag.lostHours * rate;
  return { people, fragCost, total: people + fragCost, ...frag };
}

export function tier(total, threshold) {
  return total >= threshold ? 'red' : total >= threshold * 0.4 ? 'amber' : 'green';
}

export function weekSummary(events, rate, people) {
  const live = events.filter(e => !e.cancelled);
  const costs = live.map(e => ({ ev: e, ...eventCost(e, events, rate) }));
  const total = costs.reduce((a, c) => a + c.total, 0);
  const fragCost = costs.reduce((a, c) => a + c.fragCost, 0);
  const meetingHours = live.reduce((a, e) => a + e.attendees.length * e.dur, 0);
  // Deep work left per person per week, and what an empty week would have given
  const focusLeft = people.map(p => [0, 1, 2, 3, 4].reduce((a, d) => a + deepHours(gaps(busyOf(events, p.id, d))), 0));
  const avgFocus = focusLeft.reduce((a, b) => a + b, 0) / people.length;
  return { costs, total, fragCost, meetingHours, avgFocus, lostHours: costs.reduce((a, c) => a + c.lostHours, 0) };
}

export function money(n, cents = false) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
}

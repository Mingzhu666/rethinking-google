// Meeting simulation engine. Pure functions: meeting in → predicted timeline, risks, and fixes out.
// Deterministic on purpose, so the live demo plays the same way every time.

const clamp01 = x => Math.max(0, Math.min(1, x));

function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function predictDuration(item, present) {
  const planned = item.min;
  if (item.async) return Math.min(planned, 3); // pre-read: only questions in the room
  const maxTalk = Math.max(0, ...present.map(p => p.talk));
  let dur;
  switch (item.kind) {
    case 'update':     dur = planned * (1.1 + 0.5 * Math.max(0, maxTalk - 0.5)); break;
    case 'discussion': dur = planned * (1 + 0.25 * maxTalk); break;
    case 'debate':     dur = planned * (1 + 0.45 * maxTalk); break;
    case 'decision':   dur = planned * 1.05; break;
    default:           dur = planned;
  }
  if (item.timebox) dur = Math.min(dur, planned * 1.05);
  return dur;
}

function speakTurns(item, start, dur, present, meeting) {
  const r = rng(item.id + (item.async ? 'a' : '') + (item.ownerFirst ? 'o' : '') + meeting.title);
  const segs = [];
  let t = start;
  let end = start + dur;
  // A decider who's in the room gets the last word on their decision
  const deciders = (item.needs || []).filter(id => present.some(p => p.id === id));
  const closing = [];
  if (deciders.length) {
    const share = dur * 0.3 / deciders.length;
    deciders.forEach((id, i) => closing.push({ who: id, s: end - share * (deciders.length - i), e: end - share * (deciders.length - i - 1), item: item.id }));
    end -= dur * 0.3;
  }
  if (item.ownerFirst && present.some(p => p.id === item.owner)) {
    const e = Math.min(end, t + dur * 0.35);
    segs.push({ who: item.owner, s: t, e, item: item.id });
    t = e;
  }
  const weight = p => Math.pow(p.talk, 1.3) + (p.id === item.owner ? 0.5 : 0) + ((item.needs || []).includes(p.id) ? 0.8 : 0) + 0.02;
  let last = null;
  while (t < end - 0.05) {
    const pool = present.filter(p => p.id !== last);
    const total = pool.reduce((a, p) => a + weight(p), 0);
    let x = r() * total, who = pool[0];
    for (const p of pool) { if ((x -= weight(p)) < 0) { who = p; break; } }
    const len = (0.5 + r() * 1.6) * (0.6 + who.talk);
    const e = Math.min(end, t + len);
    segs.push({ who: who.id, s: t, e, item: item.id });
    last = who.id; t = e;
  }
  return [...segs, ...closing];
}

export function simulate(meeting) {
  const byId = Object.fromEntries(meeting.people.map(p => [p.id, p]));
  const items = [], segments = [], events = [];
  let t = 0;
  for (const item of meeting.agenda) {
    const present = meeting.people.filter(p => p.leavesAt == null || t < p.leavesAt);
    if (t >= meeting.minutes + 3) {
      items.push({ ...item, start: t, end: t, status: 'cut' });
      events.push({ t: meeting.minutes + 3, kind: 'cut', text: `“${item.title}” never happens` });
      continue;
    }
    const missing = (item.needs || []).filter(id => !present.some(p => p.id === id));
    const dur = predictDuration(item, present);
    const status = missing.length ? 'stalled' : dur > item.min * 1.1 ? 'over' : 'ok';
    items.push({ ...item, start: t, end: t + dur, status, missing });
    segments.push(...speakTurns(item, t, dur, present, meeting));
    if (status === 'stalled') events.push({ t, kind: 'stall', text: `Decision stalls — ${missing.map(id => byId[id].name).join(', ')} already left` });
    if (status === 'over') events.push({ t: t + item.min, kind: 'over', text: `“${item.title}” runs over by ${Math.round(dur - item.min)} min` });
    t += dur;
  }
  const total = t;
  meeting.people.forEach(p => {
    if (p.leavesAt != null && p.leavesAt < total) events.push({ t: p.leavesAt, kind: 'leave', text: `${p.name} leaves${p.note ? ` (${p.note.toLowerCase()})` : ''}` });
  });
  if (total > meeting.minutes + 0.5) events.push({ t: meeting.minutes, kind: 'end', text: `Scheduled end — ${Math.round(total - meeting.minutes)} min still to go` });
  events.sort((a, b) => a.t - b.t);

  const talkTime = {};
  segments.forEach(s => { talkTime[s.who] = (talkTime[s.who] || 0) + (s.e - s.s); });
  const spoken = Object.values(talkTime).reduce((a, b) => a + b, 0) || 1;
  const shares = Object.fromEntries(meeting.people.map(p => [p.id, (talkTime[p.id] || 0) / spoken]));

  const decisions = items.filter(i => i.kind === 'decision');
  const maxShare = Math.max(...Object.values(shares));
  const dominant = meeting.people.find(p => shares[p.id] === maxShare);
  // Only people who stay the whole meeting can be "silent"; an early leaver is just absent
  const quiet = meeting.people.filter(p => p.id !== 'you' && p.leavesAt == null && shares[p.id] < 0.04);
  const drift = items.filter(i => ['discussion', 'debate'].includes(i.kind)).reduce((a, i) => a + Math.max(0, (i.end - i.start) - i.min), 0);

  const risks = {
    dominance: clamp01((maxShare - 0.22) / 0.3),
    overrun:   clamp01((total - meeting.minutes) / (meeting.minutes * 0.3)),
    absence:   decisions.some(d => d.status === 'stalled' || d.status === 'cut') ? 1
             : meeting.people.some(p => p.decider && p.rsvp === 'maybe') ? 0.3 : 0,
    stall:     decisions.length ? decisions.filter(d => d.status !== 'ok' && d.status !== 'over').length / decisions.length : 0,
    drift:     clamp01(drift / (meeting.minutes * 0.25)),
    silence:   clamp01(quiet.length / 2),
  };
  const score = Math.round(Object.values(risks).reduce((a, b) => a + b, 0) / 6 * 100);
  const failAt = events.find(e => e.kind === 'stall' || e.kind === 'cut')
    ? (meeting.people.find(p => p.decider && p.leavesAt != null)?.leavesAt ?? events.find(e => e.kind === 'stall' || e.kind === 'cut').t)
    : null;
  return { items, segments, events, total, shares, risks, score, dominant, quiet, failAt };
}

export const RISK_LABELS = {
  dominance: 'One voice dominates',
  overrun: 'Runs over time',
  absence: 'Decider missing',
  stall: 'Decision stalls',
  drift: 'Discussion drifts',
  silence: 'Silent voices',
};

// Rule-based fixes, each a pure transform on the meeting. Order matters: it's the order they're explained.
export function suggestFixes(meeting, sim) {
  const fixes = [];
  const byId = Object.fromEntries(meeting.people.map(p => [p.id, p]));

  const stalled = sim.items.find(i => i.kind === 'decision' && (i.status === 'stalled' || i.status === 'cut'));
  if (stalled) {
    const who = (stalled.needs || []).map(id => byId[id]).filter(Boolean);
    const leaver = who.find(p => p.leavesAt != null) || who[0];
    fixes.push({
      id: 'move-decision', dm: leaver?.id,
      title: `Move “${stalled.title}” to the top`,
      detail: leaver?.leavesAt != null ? `${leaver.name} leaves at minute ${leaver.leavesAt}. Decide while they're still in the room.` : 'Decide first, discuss execution after.',
      apply: m => {
        const agenda = m.agenda.filter(i => i.id !== stalled.id);
        const at = agenda.findIndex(i => !i.async);
        agenda.splice(at < 0 ? agenda.length : at, 0, m.agenda.find(i => i.id === stalled.id));
        return { ...m, agenda };
      },
    });
  }

  const updates = meeting.agenda.filter(i => i.kind === 'update' && i.min >= 6 && !i.async);
  updates.forEach(u => fixes.push({
    id: 'async-' + u.id,
    title: `Turn “${u.title}” into a pre-read`,
    detail: `Status doesn't need a meeting. ${u.min} minutes become 3 minutes of questions.`,
    apply: m => ({ ...m, agenda: m.agenda.map(i => i.id === u.id ? { ...i, async: true } : i) }),
  }));
  // Pre-reads go first
  if (updates.length) fixes.push({ id: 'preread-first', hidden: true, apply: m => ({ ...m, agenda: [...m.agenda.filter(i => i.async), ...m.agenda.filter(i => !i.async)] }) });

  const dom = sim.dominant;
  const talky = meeting.agenda.filter(i => ['discussion', 'debate'].includes(i.kind) && !i.timebox);
  if (dom && sim.shares[dom.id] > 0.3 && talky.length) {
    fixes.push({
      id: 'timebox', dm: dom.id,
      title: `Timebox ${talky.map(i => `“${i.title}”`).join(' and ')}`,
      detail: `${dom.name} is predicted to hold ${Math.round(sim.shares[dom.id] * 100)}% of the airtime. Ask for concerns in writing first.`,
      apply: m => ({
        ...m,
        agenda: m.agenda.map(i => talky.some(t => t.id === i.id) ? { ...i, timebox: true } : i),
        people: m.people.map(p => p.id === dom.id ? { ...p, talk: Math.max(0.3, p.talk - 0.3) } : p),
      }),
    });
  }

  sim.quiet.forEach(q => {
    const owned = meeting.agenda.find(i => i.owner === q.id);
    fixes.push({
      id: 'voice-' + q.id, dm: q.id,
      title: owned ? `Let ${q.name} open “${owned.title}”` : `Invite ${q.name} in by name`,
      detail: `${q.name} is predicted to speak ${Math.max(1, Math.round(sim.shares[q.id] * 100))}% of the time${q.note ? ` — ${q.note.toLowerCase()}` : ''}.`,
      apply: m => ({
        ...m,
        agenda: m.agenda.map(i => owned && i.id === owned.id ? { ...i, ownerFirst: true } : i),
        people: m.people.map(p => p.id === q.id ? { ...p, talk: Math.max(p.talk, 0.25) } : p),
      }),
    });
  });

  // The decision move must run last so it lands right after the pre-reads
  const move = fixes.findIndex(f => f.id === 'move-decision');
  const ordered = move >= 0 ? [...fixes.slice(0, move), ...fixes.slice(move + 1), fixes[move]] : fixes;
  return { visible: fixes.filter(f => !f.hidden), ordered };
}

export function applyFixes(meeting, ordered) {
  return ordered.reduce((m, f) => f.apply(m), structuredClone(meeting));
}

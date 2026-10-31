// Creating an event: a live cost meter, a required reason above the threshold, and a Gemini check
// that suggests a cheaper format.
import { state, person, changed, fmtTime, DAY_NAMES } from './state.js';
import { eventCost, tier, money } from './cost.js';
import { PEOPLE, SAMPLE_REASON_CHECK } from './data.js';
import { gemini } from './api.js';
import { $, $$, esc, avatar, setBadge, toast } from './ui.js';

const draft = { title: 'Weekly status update', day: 3, start: 10, dur: 1, guests: new Set(['you', 'marcus', 'lena', 'sam', 'jordan', 'aiko', 'diego']), reason: '' };
const EXAMPLE_REASON = 'Everyone shares what they worked on this week so the whole team stays aligned.';
let checked = null;

export function initCreate() {
  $('#create-btn').addEventListener('click', open);
  $('#create-close').addEventListener('click', close);
  $('#c-day').innerHTML = DAY_NAMES.map((d, i) => `<option value="${i}">${d}</option>`).join('');
  $('#c-start').innerHTML = Array.from({ length: 17 }, (_, i) => 9 + i * 0.5).map(h => `<option value="${h}">${fmtTime(h)}</option>`).join('');
  $('#c-guests').innerHTML = PEOPLE.map(p => `<button type="button" class="g-chip" data-id="${p.id}" ${p.id === 'you' ? 'disabled' : ''}>${avatar(p)}${esc(p.name.split(' ')[0])}</button>`).join('');
  $$('#c-guests .g-chip').forEach(b => b.addEventListener('click', () => {
    draft.guests.has(b.dataset.id) ? draft.guests.delete(b.dataset.id) : draft.guests.add(b.dataset.id);
    checked = null; update();
  }));
  ['c-title', 'c-day', 'c-start', 'c-dur'].forEach(id => $('#' + id).addEventListener('input', () => { read(); checked = null; update(); }));
  $('#c-reason').addEventListener('input', e => { draft.reason = e.target.value; update(); });
  $('#c-example').addEventListener('click', () => { $('#c-reason').value = draft.reason = EXAMPLE_REASON; update(); });
  $('#c-check').addEventListener('click', check);
  $('#c-save').addEventListener('click', save);
}

function open() {
  $('#c-title').value = draft.title;
  $('#c-day').value = draft.day;
  $('#c-start').value = draft.start;
  $('#c-dur').value = draft.dur;
  $('#c-reason').value = draft.reason;
  $('#create').hidden = false;
  update();
}
function close() { $('#create').hidden = true; }

function read() {
  draft.title = $('#c-title').value.trim() || 'Untitled meeting';
  draft.day = +$('#c-day').value;
  draft.start = +$('#c-start').value;
  draft.dur = +$('#c-dur').value;
}

const asEvent = () => ({ id: 'draft', day: draft.day, start: draft.start, dur: draft.dur, title: draft.title, attendees: [...draft.guests], organizer: 'you' });

function update() {
  $$('#c-guests .g-chip').forEach(b => b.classList.toggle('on', draft.guests.has(b.dataset.id)));
  const c = eventCost(asEvent(), state.events, state.rate);
  const t = tier(c.total, state.threshold);
  const meter = $('#c-meter');
  meter.className = 'meter ' + t;
  $('#c-total').textContent = money(c.total);
  $('#c-people').textContent = `${draft.guests.size} people × ${draft.dur * 60} min = ${money(c.people)}`;
  $('#c-frag').textContent = c.lostHours ? `+ ${money(c.fragCost)} fragmentation · breaks ${c.shattered} focus block${c.shattered === 1 ? '' : 's'}` : 'No focus blocks broken at this time';
  const over = c.total >= state.threshold;
  $('#c-reason-box').hidden = !over;
  $('#c-threshold').textContent = money(state.threshold);
  $('#c-save').disabled = over && draft.reason.trim().length < 10;
  $('#c-save').textContent = over ? 'Save with reason' : 'Save';
  if (!checked) $('#c-verdict').innerHTML = '';
}

async function check() {
  if (draft.reason.trim().length < 10) { toast('Write a reason first — one sentence is enough'); return; }
  const e = asEvent();
  const c = eventCost(e, state.events, state.rate);
  const btn = $('#c-check');
  btn.disabled = true; btn.textContent = 'Checking…';
  const prompt = `You review calendar invites before they are sent. Be direct and kind.
Meeting: "${e.title}", ${e.dur * 60} min, ${e.attendees.length} guests (${e.attendees.map(id => person(id).role).join(', ')}).
Estimated cost: ${money(c.total)} (people time ${money(c.people)}, fragmentation ${money(c.fragCost)}).
Organizer's reason: "${draft.reason}"
Decide the cheapest format that still achieves the reason: "meeting" (it is justified), "shorter", "smaller", or "async" (a doc or recorded update).
Return JSON only: {"verdict": "meeting|shorter|smaller|async", "headline": max 12 words, "why": max 35 words}`;
  const { data, source } = await gemini('Gemini invite review', prompt, () => localVerdict(e));
  btn.disabled = false; btn.textContent = 'Check with Gemini';
  setBadge($('#c-src'), source);
  checked = data;
  const opts = fixes(e);
  $('#c-verdict').innerHTML = `<div class="verdict ${data.verdict === 'meeting' ? 'ok' : ''}">
      <b>${esc(data.headline)}</b><p>${esc(data.why)}</p>
      <div class="fix-opts">${opts.map((o, i) => `<button type="button" data-i="${i}" class="${o.kind === data.verdict ? 'rec' : ''}">${esc(o.label)}<small>saves ${money(o.saving)}</small></button>`).join('')}</div>
    </div>`;
  $$('#c-verdict .fix-opts button').forEach(b => b.addEventListener('click', () => opts[+b.dataset.i].apply()));
}

function localVerdict(e) {
  if (/status|update|sync|share|aligned|what .* worked/i.test(draft.reason + ' ' + e.title)) return SAMPLE_REASON_CHECK;
  if (e.attendees.length > 5) return { verdict: 'smaller', headline: 'The decision needs fewer people than this invite has.', why: 'Keep the people who own the outcome; send everyone else the notes.' };
  if (e.dur >= 1) return { verdict: 'shorter', headline: 'This fits in half the time.', why: 'Set a 30-minute default and end early if you can.' };
  return { verdict: 'meeting', headline: 'This one earns its place on the calendar.', why: 'Clear purpose and the right people. Send the agenda ahead so it stays short.' };
}

function fixes(e) {
  const full = eventCost(e, state.events, state.rate).total;
  const cost = over => eventCost({ ...e, ...over }, state.events, state.rate).total;
  const core = ['you', ...[...draft.guests].filter(id => id !== 'you').slice(0, 2)];
  return [
    { kind: 'shorter', label: 'Cut to 25 min', saving: full - cost({ dur: 25 / 60 }), apply: () => { draft.dur = 25 / 60; $('#c-dur').value = '0.4166666666666667'; refresh(); } },
    { kind: 'smaller', label: `Invite only ${core.length}`, saving: full - cost({ attendees: core }), apply: () => { draft.guests = new Set(core); refresh(); } },
    { kind: 'async', label: 'Make it a doc instead', saving: full, apply: () => saveAsync() },
  ];
}

function refresh() { checked = null; update(); toast(`New cost: ${money(eventCost(asEvent(), state.events, state.rate).total)}`); }

function save() {
  read();
  const e = { ...asEvent(), id: 'new-' + Date.now(), isNew: true, reason: draft.reason || undefined };
  state.events.push(e);
  close();
  changed('created');
  toast(`Saved · ${money(eventCost(e, state.events, state.rate).total)}${e.reason ? ' · reason attached for guests' : ''}`);
}

function saveAsync() {
  const c = eventCost(asEvent(), state.events, state.rate);
  state.saved += c.total;
  state.avoided += c.total;
  close();
  changed('async');
  toast(`Sent as a doc instead · ${money(c.total)} and ${draft.guests.size * draft.dur}h of meetings avoided`);
}

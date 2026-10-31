// 02 Anonymous value check: guests rate a meeting privately; the organizer sees only the distribution.
import { state, person, changed, fmtRange, DAY_NAMES } from './state.js';
import { VETO_EVENT, VOTE_OPTIONS, SAMPLE_VOTES, SAMPLE_ASYNC_DOC } from './data.js';
import { eventCost, money } from './cost.js';
import { gemini } from './api.js';
import { $, $$, esc, sleep, avatar, setBadge, toast } from './ui.js';

const UNLOCK_AT = 3; // k-anonymity: no results until at least three people have answered

const vote = { sent: false, votes: [], mine: null, cancelled: false };
const ev = () => state.events.find(e => e.id === VETO_EVENT);

export function initVeto() {
  renderEvent();
  renderPhone();
  renderResults();
  $('#veto-send').addEventListener('click', send);
  document.addEventListener('week:changed', e => { if (e.detail === 'rate') renderEvent(); });
}

function renderEvent() {
  const e = ev();
  const c = eventCost(e, state.events, state.rate);
  $('#veto-event').innerHTML = `
    <div class="ve-title"><span class="ve-dot"></span><div><b class="${e.cancelled ? 'struck' : ''}">${esc(e.title)}</b><small>${DAY_NAMES[e.day]} · ${fmtRange(e)} · Repeats weekly</small></div></div>
    <div class="guests-row">${e.attendees.map(id => avatar(person(id))).join('')}<span>${e.attendees.length} guests</span></div>
    <div class="ve-cost"><div><small>Each week</small><b>${money(c.total)}</b></div><div><small>Each year</small><b>${money(c.total * 52)}</b></div><div><small>People-hours / year</small><b>${(e.attendees.length * e.dur * 52).toFixed(0)}</b></div></div>`;
}

function renderPhone() {
  const e = ev();
  const me = person('aiko');
  $('#phone').innerHTML = !vote.sent ? `<div class="ph-idle"><span class="ph-cal"></span><p>No new notifications</p></div>` : `
    <div class="ph-notif"><span class="ph-cal"></span><div><b>Quick, anonymous check</b><small>Google Calendar · now</small></div></div>
    <div class="ph-card">
      <small>${esc(e.title)} · ${DAY_NAMES[e.day]} ${fmtRange(e)}</small>
      <h4>How valuable is this meeting for you?</h4>
      ${VOTE_OPTIONS.map(o => `<button class="ph-opt ${vote.mine === o.id ? 'on' : ''}" data-v="${o.id}" ${vote.mine ? 'disabled' : ''}><i style="background:${o.color}"></i>${o.label}</button>`).join('')}
      <p class="ph-anon">🔒 Anonymous. The organizer only sees totals, never who voted what.</p>
    </div>
    <p class="ph-who">Viewing as ${esc(me.name)}</p>`;
  $$('.ph-opt').forEach(b => b.addEventListener('click', () => {
    vote.mine = b.dataset.v;
    vote.votes.push(b.dataset.v);
    renderPhone(); renderResults();
    toast('Vote recorded anonymously');
  }));
}

function renderResults() {
  const e = ev();
  const n = vote.votes.length, invited = e.attendees.length - 1; // the organizer doesn't vote
  const locked = n < UNLOCK_AT;
  const counts = Object.fromEntries(VOTE_OPTIONS.map(o => [o.id, vote.votes.filter(v => v === o.id).length]));
  $('#veto-results').innerHTML = `
    <div class="vr-head"><b>Results</b><span>${n} / ${invited} responded</span></div>
    ${locked ? `<div class="vr-locked">🔒 Results unlock after ${UNLOCK_AT} responses, so no single vote can be traced.<br/><small>${vote.sent ? 'Waiting for responses…' : 'Send the check to start.'}</small></div>` : `
      <div class="vr-bar">${VOTE_OPTIONS.map(o => counts[o.id] ? `<span style="flex:${counts[o.id]};background:${o.color}"></span>` : '').join('')}</div>
      <div class="vr-rows">${VOTE_OPTIONS.map(o => `<div><i style="background:${o.color}"></i><span>${o.label}</span><b>${counts[o.id]}</b></div>`).join('')}</div>`}`;
  if (!locked && n >= invited - 1 && !vote.cancelled) verdict(counts, n);
}

async function send() {
  if (vote.sent) return;
  vote.sent = true;
  $('#veto-send').disabled = true;
  $('#veto-send').textContent = 'Sent to 8 guests';
  renderPhone(); renderResults();
  for (const v of SAMPLE_VOTES.slice(0, ev().attendees.length - 2)) { // leave one slot for the presenter's own vote
    await sleep(650);
    vote.votes.push(v);
    renderResults();
  }
}

function verdict(counts, n) {
  const e = ev();
  const skip = counts.notes + counts.cancel;
  const c = eventCost(e, state.events, state.rate);
  const box = $('#vr-verdict');
  if (skip * 2 <= n) {
    box.innerHTML = `<div class="verdict ok"><b>Most guests need to be there.</b><p>Keep it — and share the agenda ahead.</p></div>`;
    return;
  }
  box.innerHTML = `<div class="verdict">
      <b>${skip} of ${n} say they don't need to attend.</b>
      <p>Suggested: cancel this week and send an async update. Keep it live only for the ${counts.must} who must attend.</p>
      <div class="fix-opts">
        <button class="rec" id="veto-cancel">Cancel this week, send an update<small>saves ${money(c.total)}</small></button>
        <button id="veto-biweekly">Make it every two weeks<small>saves ${money(c.total * 26)}/yr</small></button>
      </div>
    </div>`;
  $('#veto-cancel').addEventListener('click', cancel);
  $('#veto-biweekly').addEventListener('click', () => toast('Changed to every two weeks'));
}

async function cancel() {
  const e = ev();
  const c = eventCost(e, state.events, state.rate);
  e.cancelled = true;
  vote.cancelled = true;
  state.saved += c.total;
  changed('cancelled');
  renderEvent();
  $('#vr-verdict').innerHTML = `<div class="verdict ok"><b>Cancelled. ${e.attendees.length} people just got an hour back.</b><p>${money(c.total)} saved this week. Drafting the async update…</p></div>`;
  const prompt = `A recurring meeting "${e.title}" (${e.attendees.length} people: ${e.attendees.map(id => person(id).role).join(', ')}) was cancelled this week because most guests said notes were enough.
Write the outline of a short async update doc that replaces it. Each section has a heading and a one-line prompt telling people what to write. End with a one-line note on the deadline and how unresolved items get handled.
Return JSON only: {"title": string, "sections": [{"heading": string, "prompt": string}], "note": string}`;
  const { data, source } = await gemini('Gemini async update', prompt, () => SAMPLE_ASYNC_DOC);
  setBadge($('#veto-src'), source);
  $('#doc').hidden = false;
  $('#doc').innerHTML = `<div class="doc-top"><span class="doc-icon"></span><b>${esc(data.title)}</b><small>Google Docs · shared with ${e.attendees.length - 1} people</small></div>
    <div class="doc-page">${(data.sections || []).map(s => `<h5>${esc(s.heading)}</h5><p>${esc(s.prompt)}</p>`).join('')}<p class="doc-note">${esc(data.note || '')}</p></div>`;
}

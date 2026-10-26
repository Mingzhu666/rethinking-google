// 01 Simulate: play the meeting forward, show where it fails, fix the agenda, play it again.
import { simulate, suggestFixes, applyFixes, RISK_LABELS } from './sim.js';
import { SAMPLE_MEETING, SAMPLE_AGENDA_TEXT, SAMPLE_DMS } from './data.js';
import { gemini } from './api.js';
import { $, $$, esc, sleep, avatar, fmtMin, setBadge, mergeSources, toast } from './ui.js';

const PALETTE = ['#1a73e8', '#a142f4', '#e8710a', '#12b5cb', '#1e8e3e', '#d01884', '#f9ab00', '#5f6368'];
const KIND_LABEL = { update: 'Update', discussion: 'Discussion', debate: 'Debate', decision: 'Decision', wrap: 'Wrap-up' };

const state = { meeting: SAMPLE_MEETING, before: null, after: null, fixes: null, busy: false, sources: [] };

export const currentMeeting = () => state.meeting;

export function initSimulator() {
  renderMeeting(state.meeting);
  drawRadar(null);
  $('#run-btn').addEventListener('click', run);
  $('#fix-btn').addEventListener('click', fix);
  $('#paste-text').value = SAMPLE_AGENDA_TEXT;
  $$('[data-src]').forEach(b => b.addEventListener('click', () => {
    $$('[data-src]').forEach(x => x.classList.toggle('on', x === b));
    const paste = b.dataset.src === 'paste';
    $('#paste-panel').hidden = !paste;
    if (!paste) load(SAMPLE_MEETING);
  }));
  $('#parse-btn').addEventListener('click', parse);
}

function load(meeting, source) {
  state.meeting = meeting; state.before = state.after = state.fixes = null;
  state.sources = source ? [source] : [];
  setBadge($('#sim-src'), source || '');
  renderMeeting(meeting);
  $('#timeline').innerHTML = '';
  $('#feed').innerHTML = '<p class="feed-empty">Press <b>Run simulation</b> to play this meeting forward.</p>';
  $('#fixes').hidden = true;
  $('#fix-btn').disabled = true;
  $('#risk-score').textContent = '—';
  $('#risk-pill').className = 'risk-pill';
  $('#clock').textContent = '0:00';
  drawRadar(null);
  document.dispatchEvent(new CustomEvent('meeting:changed', { detail: meeting }));
}

// ---------- Rendering ----------
function renderMeeting(m, changed = new Set()) {
  $('#m-title').textContent = m.title;
  $('#m-when').textContent = `${m.when} · ${m.minutes} min`;
  $('#m-goal').textContent = m.goal;
  $('#guests').innerHTML = m.people.map(p => `<li>${avatar(p)}<div><b>${esc(p.name)}</b><small>${esc(p.role)}${p.note ? ` · <span class="note">${esc(p.note)}</span>` : ''}</small></div>
    <span class="rsvp ${p.rsvp === 'maybe' ? 'maybe' : ''}">${p.rsvp === 'maybe' ? 'Maybe' : 'Yes'}</span></li>`).join('');

  // FLIP: remember old positions so reordering animates
  const old = Object.fromEntries($$('#agenda li').map(li => [li.dataset.id, li.getBoundingClientRect().top]));
  const owner = id => m.people.find(p => p.id === id)?.name || '';
  $('#agenda').innerHTML = m.agenda.map(i => `<li data-id="${i.id}" class="${changed.has(i.id) ? 'changed' : ''}">
    <span>${esc(i.title)}${i.async ? '<span class="tag async">Pre-read</span>' : ''}${i.timebox ? '<span class="tag tb">Timeboxed</span>' : ''}</span>
    <span class="min">${i.async ? `<s>${i.min}</s>3` : i.min} min</span>
    <small>${KIND_LABEL[i.kind] || i.kind}${owner(i.owner) ? ` · ${esc(owner(i.owner))}` : ''}${i.ownerFirst ? ' opens' : ''}</small></li>`).join('');
  $$('#agenda li').forEach(li => {
    const was = old[li.dataset.id];
    if (was == null) return;
    const dy = was - li.getBoundingClientRect().top;
    if (!dy) return;
    li.style.transition = 'none';
    li.style.transform = `translateY(${dy}px)`;
    li.offsetWidth;
    li.style.transition = '';
    li.style.transform = '';
  });
}

function renderTimeline(m, sim, span) {
  const pct = t => `${(t / span) * 100}%`;
  const ticks = [];
  for (let t = 0; t <= span; t += 5) ticks.push(`<span class="tick" style="left:${pct(t)}">${t}</span>`);
  const band = sim.items.map(i => `<div class="blk ${i.async ? 'async' : i.status}" style="left:${pct(i.start)};width:calc(${pct(Math.max(i.end - i.start, 0.6))} - 2px)" title="${esc(i.title)}">${esc(i.title)}</div>`).join('');
  const lanes = m.people.map(p => `<div class="tl-row"><span class="tl-name">${esc(p.name.split(' ')[0])}</span><div class="tl-track">${
    sim.segments.filter(s => s.who === p.id).map(s => `<span class="seg-b" style="left:${pct(s.s)};width:calc(${pct(s.e - s.s)} - 1px);background:${p.color}"></span>`).join('')}</div></div>`).join('');
  const pins = sim.events.map((e, n) => `<span class="pin ${e.kind}" data-n="${n}" style="left:${pct(e.t)}"></span>`).join('');
  $('#timeline').innerHTML = `<div class="tl">
    <div class="tl-row axis"><span></span><div class="tl-track">${ticks.join('')}</div></div>
    <div class="tl-row band"><span class="tl-name">Agenda</span><div class="tl-track">${band}</div></div>
    ${lanes}
    <div class="tl-over">
      ${sim.total > m.minutes ? `<div class="overzone" style="left:${pct(m.minutes)};right:0"></div>` : ''}
      <div class="endline" style="left:${pct(m.minutes)}"><span>Scheduled end</span></div>
      ${pins}
      <div class="mask" id="mask"></div>
      <div class="playhead" id="playhead"></div>
    </div></div>`;
}

// ---------- Playback ----------
async function play(m, sim, { from = null, tone = 'bad', extra = [] } = {}) {
  const span = Math.max(sim.total, m.minutes) + 2;
  renderTimeline(m, sim, span);
  $('#feed').innerHTML = '';
  const head = $('#playhead'), mask = $('#mask');
  head.style.opacity = 1;
  const DURATION = 5200;
  const events = [...sim.events.map((e, n) => ({ ...e, n })), ...extra].sort((a, b) => a.t - b.t);
  let shown = 0;
  const t0 = performance.now();
  await new Promise(resolve => {
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / DURATION);
      const t = p * span;
      head.style.left = `${p * 100}%`;
      mask.style.left = `${p * 100}%`;
      $('#clock').textContent = fmtMin(Math.min(t, sim.total));
      while (shown < events.length && events[shown].t <= t) {
        const e = events[shown++];
        if (e.n != null) $(`.pin[data-n="${e.n}"]`)?.classList.add('on');
        if (e.kind !== 'end' || tone === 'bad') addFeed(e);
      }
      drawRadar(lerpRisks(from, sim.risks, p), tone, from);
      if (p < 1) setTimeout(tick, 16); else resolve();
    };
    tick();
  });
  head.style.opacity = 0;
  mask.style.display = 'none';
  $('#clock').textContent = fmtMin(sim.total);
  $('#risk-score').textContent = sim.score;
  $('#risk-pill').className = 'risk-pill ' + (sim.score >= 50 ? 'high' : sim.score <= 25 ? 'low' : '');
}

function addFeed(e) {
  $('#feed').insertAdjacentHTML('beforeend', `<div class="ev ${e.kind}"><code>${fmtMin(e.t)}</code><span>${esc(e.text)}</span></div>`);
  $('#feed').scrollTop = 1e6;
}

const lerpRisks = (a, b, p) => Object.fromEntries(Object.keys(RISK_LABELS).map(k => [k, (a ? a[k] : 0) + (b[k] - (a ? a[k] : 0)) * p]));

function drawRadar(risks, tone = 'bad', ghost = null) {
  const keys = Object.keys(RISK_LABELS);
  const cx = 160, cy = 150, R = 92;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i / keys.length) * Math.PI * 2;
    return [cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r];
  };
  const ring = r => keys.map((_, i) => pt(i, r).join(',')).join(' ');
  const shape = risks ? keys.map((k, i) => pt(i, Math.max(0.04, risks[k])).join(',')).join(' ') : ring(0.04);
  const color = tone === 'good' ? ['rgba(30,142,62,.18)', '#1e8e3e'] : ['rgba(217,48,37,.16)', '#d93025'];
  $('#radar').innerHTML = `
    ${[0.25, 0.5, 0.75, 1].map(r => `<polygon class="grid" points="${ring(r)}"/>`).join('')}
    ${keys.map((_, i) => `<line class="grid" x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}"/>`).join('')}
    ${ghost ? `<polygon points="${keys.map((k, i) => pt(i, Math.max(0.04, ghost[k])).join(',')).join(' ')}" fill="none" stroke="#d93025" stroke-dasharray="4 4" opacity=".6"/>` : ''}
    <polygon class="shape" points="${shape}" fill="${color[0]}" stroke="${color[1]}"/>
    ${keys.map((k, i) => {
      const [x, y] = pt(i, 1.2);
      return `<text x="${x}" y="${y + 4}" text-anchor="${Math.abs(x - cx) < 5 ? 'middle' : x > cx ? 'start' : 'end'}">${RISK_LABELS[k]}</text>`;
    }).join('')}`;
}

// ---------- Flow ----------
async function run() {
  if (state.busy) return;
  state.busy = true;
  $('#run-btn').disabled = true;
  $('#fix-btn').disabled = true;
  $('#fixes').hidden = true;
  if (state.after) { renderMeeting(state.meeting); state.after = null; }
  state.before = simulate(state.meeting);
  state.fixes = suggestFixes(state.meeting, state.before);
  const drafts = draftMessages(); // start Gemini now, while the playback runs
  await play(state.meeting, state.before);
  showFixes(drafts);
  $('#run-btn').disabled = false;
  $('#run-btn').textContent = 'Replay';
  $('#fix-btn').disabled = !state.fixes.visible.length;
  state.busy = false;
}

function draftMessages() {
  const m = state.meeting, fx = state.fixes.visible;
  const targets = [...new Set(fx.map(f => f.dm).filter(Boolean))].map(id => m.people.find(p => p.id === id)).filter(Boolean);
  const prompt = `You help a meeting organizer prevent a meeting from failing. Meeting: "${m.title}" (${m.minutes} min). Goal: ${m.goal}.
Agenda: ${m.agenda.map(i => `${i.title} (${i.min} min, ${i.kind})`).join('; ')}.
Planned fixes: ${fx.map(f => f.title + ' — ' + f.detail).join(' | ')}.
Write one short, warm, specific pre-meeting Google Chat message from the organizer to each of: ${targets.map(p => `${p.id} = ${p.name}, ${p.role}${p.note ? ', ' + p.note : ''}`).join('; ')}.
Max 40 words each, no greeting fluff, no emojis, English.
Return JSON only: {"dms": [{"to": id, "text": string}]}`;
  return gemini('Gemini pre-meeting messages', prompt, () => ({
    dms: targets.map(p => ({ to: p.id, text: SAMPLE_DMS[p.id] || `Hi ${p.name.split(' ')[0]} — quick heads-up before “${m.title}”: ${fx.find(f => f.dm === p.id)?.detail}` })),
  }));
}

async function showFixes(drafts) {
  const m = state.meeting, fx = state.fixes.visible;
  const panel = $('#fixes');
  panel.hidden = false;
  if (!fx.length) { panel.innerHTML = '<h4><span class="spark"></span>This meeting looks healthy. Nothing to fix.</h4>'; return; }
  panel.innerHTML = `<h4><span class="spark"></span>Gemini suggests ${fx.length} change${fx.length > 1 ? 's' : ''} before you send this invite</h4>
    ${fx.map(f => `<div class="fix" data-f="${f.id}"><span class="chk"></span><div><b>${esc(f.title)}</b><p>${esc(f.detail)}</p></div></div>`).join('')}
    <div class="dms" id="dms"><p class="muted-s">Drafting messages…</p></div>`;
  const { data, source } = await drafts;
  if (state.meeting !== m || !$('#dms')) return;
  state.sources.push(source);
  setBadge($('#sim-src'), mergeSources(state.sources));
  $('#dms').innerHTML = (data.dms || []).map(d => {
    const p = m.people.find(x => x.id === d.to);
    return p ? `<div class="dm"><header>${avatar(p)}${esc(p.name)}<small>Google Chat · draft</small></header><p>${esc(d.text)}</p></div>` : '';
  }).join('');
}

async function fix() {
  if (state.busy || !state.fixes) return;
  state.busy = true;
  $('#fix-btn').disabled = true;
  $('#run-btn').disabled = true;
  for (const f of state.fixes.visible) {
    $(`.fix[data-f="${f.id}"]`)?.classList.add('done');
    await sleep(350);
  }
  const fixed = applyFixes(state.meeting, state.fixes.ordered);
  const changed = new Set(fixed.agenda.filter((i, n) => {
    const o = state.meeting.agenda.find(x => x.id === i.id);
    return state.meeting.agenda[n]?.id !== i.id || o.async !== i.async || o.timebox !== i.timebox || o.ownerFirst !== i.ownerFirst;
  }).map(i => i.id));
  renderMeeting(fixed, changed);
  await sleep(900);
  state.after = simulate(fixed);
  const decision = state.after.items.find(i => i.kind === 'decision');
  const extra = [];
  if (decision && decision.status !== 'stalled' && decision.status !== 'cut') {
    const who = (decision.needs || []).map(id => fixed.people.find(p => p.id === id)?.name).filter(Boolean);
    extra.push({ t: decision.end, kind: 'good', text: `Decision made${who.length ? ` — ${who.join(', ')} still in the room` : ''}` });
  }
  if (state.after.total < fixed.minutes) extra.push({ t: state.after.total, kind: 'good', text: `Ends ${Math.round(fixed.minutes - state.after.total)} min early` });
  await play(fixed, state.after, { from: state.before.risks, tone: 'good', extra });
  toast(`Meeting risk ${state.before.score} → ${state.after.score}`);
  $('#run-btn').disabled = false;
  state.busy = false;
}

// ---------- Paste your agenda ----------
async function parse() {
  const text = $('#paste-text').value.trim();
  if (!text) { toast('Paste an agenda first'); return; }
  const btn = $('#parse-btn');
  btn.disabled = true; btn.textContent = 'Parsing…';
  const prompt = `Turn this meeting agenda into JSON for a meeting simulator.
Text:
"""${text}"""
Rules:
- people: include the organizer as id "you", name "You". Other ids: lowercase first name. talk: 0–1 how much they tend to speak (0.9 = very talkative, 0.1 = quiet, default 0.4). decider: true for whoever makes the final call. leavesAt: minute they must leave if stated. rsvp: "yes" or "maybe". note: a short note if the text says something about them, else omit.
- agenda: id "a1", "a2"… min: minutes. kind: one of update, discussion, debate, decision, wrap. owner: person id. For decision items, needs: [decider ids].
- minutes: total length. when: short human time string or "Upcoming". goal: one sentence.
Return JSON only, exactly this shape:
{"title": "Launch review", "when": "Upcoming", "minutes": 30, "goal": "Decide whether to launch",
 "people": [{"id": "you", "name": "You", "role": "PM", "talk": 0.4, "rsvp": "yes"}, {"id": "dana", "name": "Dana", "role": "Director", "talk": 0.5, "decider": true, "leavesAt": 15, "rsvp": "yes", "note": "Can only stay 15 min"}],
 "agenda": [{"id": "a1", "title": "Readiness recap", "min": 8, "kind": "update", "owner": "you"}, {"id": "a2", "title": "Go / no-go", "min": 5, "kind": "decision", "owner": "dana", "needs": ["dana"]}]}`;
  const { data, source } = await gemini('Gemini agenda parser', prompt, () => localParse(text));
  btn.disabled = false; btn.textContent = 'Parse agenda';
  const meeting = normalize(data);
  if (!meeting.agenda.length) { toast('Couldn\'t find agenda items — try one item per line with minutes'); return; }
  load(meeting, source);
  toast(`Parsed ${meeting.agenda.length} agenda items and ${meeting.people.length} guests`);
}

function normalize(d) {
  const people = (d.people || []).map((p, i) => ({
    id: String(p.id || 'p' + i), name: p.name || 'Guest', role: p.role || p.title || p.position || '', talk: Math.max(0.05, Math.min(1, +p.talk || 0.4)),
    color: PALETTE[i % PALETTE.length], decider: !!p.decider, leavesAt: p.leavesAt ? +p.leavesAt : undefined, rsvp: p.rsvp === 'maybe' ? 'maybe' : 'yes', note: p.note,
  }));
  if (!people.some(p => p.id === 'you')) people.unshift({ id: 'you', name: 'You', role: 'Organizer', talk: 0.4, color: PALETTE[0], rsvp: 'yes' });
  const ids = new Set(people.map(p => p.id));
  const agenda = (d.agenda || []).map((a, i) => ({
    id: a.id || 'a' + (i + 1), title: a.title || a.name || a.topic || a.item || `Item ${i + 1}`, min: Math.max(1, +(a.min ?? a.minutes ?? a.duration) || 5),
    kind: KIND_LABEL[a.kind] ? a.kind : 'discussion', owner: ids.has(a.owner) ? a.owner : 'you',
    needs: (a.needs || []).filter(id => ids.has(id)),
  }));
  agenda.filter(a => a.kind === 'decision' && !a.needs.length).forEach(a => { a.needs = people.filter(p => p.decider).map(p => p.id); });
  return { title: d.title || 'Your meeting', when: d.when || 'Upcoming', minutes: +d.minutes || agenda.reduce((s, a) => s + a.min, 0), goal: d.goal || 'Leave with a clear decision', people, agenda };
}

// Offline fallback: a small rule-based parser that handles "N. Title — X min" agendas
function localParse(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const [head] = lines;
  const title = head.replace(/[—–-]\s*\d+\s*min.*$/i, '').trim();
  const minutes = +(head.match(/(\d+)\s*min/i) || [])[1] || 30;
  const att = lines.find(l => /^attendees?:/i.test(l)) || '';
  const people = att.replace(/^attendees?:/i, '').split(/,(?![^()]*\))/).map(s => s.trim()).filter(Boolean).map(s => {
    const name = s.replace(/\(.*\)/, '').trim();
    const info = (s.match(/\((.*)\)/) || [])[1] || '';
    const isYou = /^you$/i.test(name);
    return {
      id: isYou ? 'you' : name.toLowerCase().split(' ')[0], name: isYou ? 'You' : name, role: info.split(',')[0] || '',
      talk: /talkative|dominat/i.test(info) ? 0.9 : /quiet/i.test(info) ? 0.08 : 0.4,
      decider: /final call|decides|approver/i.test(info),
      leavesAt: +(info.match(/(\d+)\s*min/) || [])[1] || undefined,
      note: /stay|leave|stop/i.test(info) ? info.split(',').slice(1).join(',').trim() : /quiet|talkative/i.test(info) ? info.split(',').slice(1).join(',').trim() : undefined,
    };
  });
  const kindOf = t => /decid|go\s*\/\s*no-go|approv|sign-off/i.test(t) && !/legal/i.test(t) ? 'decision' : /recap|status|update/i.test(t) ? 'update' : /risk|bug|review|vs\.?/i.test(t) ? 'debate' : /comms|next steps|wrap/i.test(t) ? 'wrap' : 'discussion';
  const agenda = lines.filter(l => /^\d+[.)]/.test(l)).map((l, i) => {
    const t = l.replace(/^\d+[.)]\s*/, '');
    const tTitle = t.replace(/[—–-]\s*\d+\s*min.*$/i, '').trim();
    const ownerName = (tTitle.match(/\((\w+)\)/) || [])[1];
    return { id: 'a' + (i + 1), title: tTitle.replace(/\s*\(\w+\)/, ''), min: +(t.match(/(\d+)\s*min/i) || [])[1] || 5, kind: kindOf(tTitle), owner: ownerName ? ownerName.toLowerCase() : 'you' };
  });
  return { title, minutes, when: 'Upcoming', goal: agenda.some(a => a.kind === 'decision') ? `Make the call: ${agenda.find(a => a.kind === 'decision').title.toLowerCase()}` : 'Leave aligned', people, agenda };
}

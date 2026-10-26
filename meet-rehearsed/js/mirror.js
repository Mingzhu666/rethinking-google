// 03 Mirror: a private, game-film style review of how you showed up in a meeting.
import { SAMPLE_TRANSCRIPT, SAMPLE_MIRROR } from './data.js';
import { gemini } from './api.js';
import { $, $$, esc, countUp, setBadge, toast } from './ui.js';

const DIMS = { clarity: 'Clarity', brevity: 'Brevity', listening: 'Listening', decisiveness: 'Decisiveness', inclusion: 'Inclusion' };
const FILLERS = /\b(um+|uh+|like|basically|sort of|kind of|you know|i think|maybe|just)\b/gi;

export function initMirror() {
  $$('[data-tsrc]').forEach(b => b.addEventListener('click', () => {
    $$('[data-tsrc]').forEach(x => x.classList.toggle('on', x === b));
    $('#tpaste').hidden = b.dataset.tsrc !== 'paste';
  }));
  $('#mirror-btn').addEventListener('click', run);
}

// "[mm:ss]" isn't how Meet labels time; we read "[hh:mm]" or "[h:mm:ss]" and treat the result as minutes
function parseTranscript(text) {
  const lines = text.split('\n').map(l => l.match(/^\[?(\d+):(\d+)(?::(\d+))?\]?\s*([^:]{1,40}):\s*(.+)$/)).filter(Boolean)
    .map(m => ({ t: m[3] != null ? +m[1] * 60 + +m[2] + +m[3] / 60 : +m[1] * 60 + +m[2], who: m[4].trim(), text: m[5].trim() }));
  lines.forEach((l, i) => { l.end = lines[i + 1] ? Math.max(l.t + 0.3, lines[i + 1].t) : l.t + 1; });
  return lines;
}

function localMetrics(lines, me) {
  const words = l => l.text.split(/\s+/).length;
  const total = lines.reduce((a, l) => a + words(l), 0) || 1;
  const mine = lines.filter(l => l.who === me);
  const interruptions = lines.filter((l, i) => l.who === me && i > 0 && lines[i - 1].who !== me && (/^[—–-]/.test(l.text) || /[—–-]$/.test(lines[i - 1].text))).length;
  let longest = 0, run = 0;
  lines.forEach((l, i) => {
    if (l.who === me) { run += l.end - l.t; longest = Math.max(longest, run); }
    if (l.who !== me || lines[i + 1]?.who !== me) run = 0;
  });
  return {
    share: mine.reduce((a, l) => a + words(l), 0) / total,
    interruptions,
    questions: mine.reduce((a, l) => a + (l.text.match(/\?/g) || []).length, 0),
    fillers: mine.reduce((a, l) => a + (l.text.match(FILLERS) || []).length, 0),
    longest,
    length: lines.length ? lines[lines.length - 1].end : 0,
  };
}

async function run() {
  const paste = !$('#tpaste').hidden;
  const text = paste ? $('#tpaste-text').value.trim() : SAMPLE_TRANSCRIPT;
  const lines = parseTranscript(text);
  if (lines.length < 3) { toast('Paste a transcript with lines like “[00:05] Alex: …”'); return; }
  const speakers = [...new Set(lines.map(l => l.who))];
  const me = speakers.find(s => /^you$/i.test(s)) || speakers[0];
  const metrics = localMetrics(lines, me);

  const btn = $('#mirror-btn');
  btn.disabled = true; btn.textContent = 'Watching the tape…';
  // Local numbers and the game film appear instantly; Gemini's judgment fills in when it arrives
  renderLocal(lines, me, metrics);
  const prompt = `You are a private meeting coach reviewing game film for ONE person: "${me}". Be specific, fair, and kind. Never grade other people.
Transcript (timestamps are minutes):
${lines.map(l => `[${Math.round(l.t)}] ${l.who}: ${l.text}`).join('\n')}
Local metrics for ${me}: talk share ${Math.round(metrics.share * 100)}%, interruptions ${metrics.interruptions}, questions asked ${metrics.questions}, filler words ${metrics.fillers}.
Return JSON only:
{"summary": one sentence about how ${me} showed up,
 "scores": {"clarity": 0-10, "brevity": 0-10, "listening": 0-10, "decisiveness": 0-10, "inclusion": 0-10},
 "moments": [3-5 items {"t": minute number, "kind": "good" or "improve", "note": max 25 words, second person}],
 "oneThing": the single most valuable thing to try in the next meeting, max 15 words, imperative}`;
  const { data, source } = await gemini('Gemini meeting mirror', prompt, () => paste ? fallbackMirror(metrics) : SAMPLE_MIRROR);
  setBadge($('#mirror-src'), source);
  btn.disabled = false; btn.textContent = 'Show me my mirror again';
  fillAI(data, Math.max(metrics.length, 1));
}

function fallbackMirror(m) {
  return {
    summary: 'Here is how you showed up, based on talk time, interruptions, and filler words.',
    scores: { clarity: m.fillers > 6 ? 5 : 7, brevity: m.longest > 4 ? 4 : 7, listening: m.interruptions ? 5 : 8, decisiveness: 5, inclusion: m.share > 0.4 ? 4 : 7 },
    moments: [],
    oneThing: m.share > 0.4 ? 'Speak less than a third of the time.' : 'End with a decision and an owner, out loud.',
  };
}

function renderLocal(lines, me, m) {
  const span = Math.max(m.length, 1);
  const pct = t => `${Math.min(100, (t / span) * 100)}%`;
  const box = $('#mirror');
  box.hidden = false;
  box.innerHTML = `
    <div class="mirror-head">
      <div class="big-ring" style="--p:0" id="ring"><div><b id="overall">–</b><small>out of 100</small></div></div>
      <p class="mirror-summary pending" id="m-summary">Gemini is reviewing the tape…</p>
      <div class="dims">${Object.entries(DIMS).map(([k, label]) => `<div class="dim"><span>${label}</span><i><u data-k="${k}"></u></i><b data-k="${k}">·</b></div>`).join('')}</div>
    </div>
    <div class="stats">
      <div class="stat ${m.share > 0.4 ? 'warn' : ''}"><small>Your talk time</small><b>${Math.round(m.share * 100)}%</b></div>
      <div class="stat ${m.interruptions ? 'warn' : ''}"><small>Interruptions</small><b>${m.interruptions}</b></div>
      <div class="stat"><small>Questions you asked</small><b>${m.questions}</b></div>
      <div class="stat ${m.fillers > 5 ? 'warn' : ''}"><small>Filler words</small><b>${m.fillers}</b></div>
      <div class="stat"><small>Longest monologue</small><b>${m.longest.toFixed(1)} min</b></div>
    </div>
    <div class="film">
      <h5>Game film · ${Math.round(span)} min</h5>
      <div class="film-track" id="film-track">
        <div class="film-lane you">${lines.filter(l => l.who === me).map(l => `<span style="left:${pct(l.t)};width:${pct(l.end - l.t)}"></span>`).join('')}</div>
        <div class="film-lane others">${lines.filter(l => l.who !== me).map(l => `<span style="left:${pct(l.t)};width:${pct(l.end - l.t)}"></span>`).join('')}</div>
        <div class="film-scan" id="film-scan"></div>
      </div>
      <div class="film-axis"><span>0</span><span>${Math.round(span / 2)} min</span><span>${Math.round(span)} min</span></div>
      <div class="film-legend"><span><i style="background:#8ab4f8"></i>${esc(me)}</span><span><i style="background:#5f6368"></i>Everyone else</span><span><i style="background:#81c995"></i>Worked</span><span><i style="background:#fdd663"></i>Try differently</span></div>
    </div>
    <div id="m-moments"></div>
    <div id="m-one"></div>`;
}

async function fillAI(d, span) {
  const scores = Object.fromEntries(Object.keys(DIMS).map(k => [k, Math.max(0, Math.min(10, +d.scores?.[k] || 0))]));
  const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5 * 10);
  const pct = t => `${Math.min(100, (t / span) * 100)}%`;
  const moments = (d.moments || []).filter(x => x && x.note).sort((a, b) => a.t - b.t);
  $('#film-scan')?.remove();
  const summary = $('#m-summary');
  summary.classList.remove('pending');
  summary.textContent = d.summary;
  $$('.dim u').forEach(u => { const v = scores[u.dataset.k]; u.classList.toggle('low', v < 5); u.style.width = v * 10 + '%'; });
  $$('.dim b').forEach(b => { b.textContent = scores[b.dataset.k]; });
  $('#film-track').insertAdjacentHTML('beforeend', moments.map((x, i) => `<span class="film-pin ${x.kind === 'good' ? 'good' : 'improve'}" data-n="${i + 1}" data-i="${i}" style="left:${pct(x.t)}"></span>`).join(''));
  $('#m-moments').innerHTML = moments.length ? `<div class="moments"><h5>Key moments</h5>${moments.map((x, i) => `<div class="moment ${x.kind === 'good' ? 'good' : 'improve'}" data-i="${i}"><span>${i + 1}</span><code>${Math.round(x.t)} min</code><div>${esc(x.note)}</div></div>`).join('')}</div>` : '';
  $('#m-one').innerHTML = `<div class="one-thing"><div style="flex:1"><small>ONE THING FOR NEXT TIME</small><p>${esc(d.oneThing)}</p></div><button class="meet-btn" id="adopt">Add to my next rehearsal</button></div>`;

  $$('.film-pin').forEach(pin => {
    pin.addEventListener('mouseenter', () => $(`.moment[data-i="${pin.dataset.i}"]`)?.classList.add('hl'));
    pin.addEventListener('mouseleave', () => $(`.moment[data-i="${pin.dataset.i}"]`)?.classList.remove('hl'));
  });
  $('#adopt').addEventListener('click', () => {
    const goal = $('#loop-goal');
    goal.textContent = d.oneThing;
    goal.parentElement.classList.remove('pulse'); goal.parentElement.offsetWidth; goal.parentElement.classList.add('pulse');
    toast('Added. Your next rehearsal will check for it.');
  });

  const ring = $('#ring');
  const t0 = performance.now();
  const step = () => {
    const p = Math.min(1, (performance.now() - t0) / 1200);
    ring.style.setProperty('--p', overall * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => ring.style.setProperty('--p', overall), 1300);
  $('#overall').textContent = '0';
  countUp($('#overall'), overall, { dur: 1200 });
}

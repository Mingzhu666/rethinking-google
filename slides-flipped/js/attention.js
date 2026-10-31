// 02 Audience attention replay: model how a room would have followed a rehearsal, then scrub through it.
import { DECK, SAMPLE_REHEARSAL } from './data.js';
import { slideHTML } from './deck.js';
import { $, $$, esc, toast } from './ui.js';

const FILLERS = /\b(um+|uh+|like|basically|so,? um|you know|kind of|sort of)\b/gi;
const JARGON = /\b(?:[A-Z]{2,}\d*|p\d{2})\b/g;           // LLM, RAG, P95 …
const STORY = /\b(last (week|month|year)|yesterday|imagine|for example|when (i|we))\b/i;
const MEMORABLE = /(\d+(\.\d+)?\s*(×|times)|down to|from .* to .*\d|\d+ (minutes|hours))/i;
const words = t => t.trim().split(/\s+/).filter(Boolean);

// ---------- The model: one sample per second ----------
export function model(segs) {
  const end = segs[segs.length - 1].end;
  const series = [];
  const events = [];
  let a = 0.9;
  const defined = new Set();
  segs.forEach((seg, k) => {
    const w = words(seg.text);
    const dur = Math.max(1, seg.end - seg.start);
    const wpm = w.length / (dur / 60);
    const fillers = (seg.text.match(FILLERS) || []).length;
    seg.wpm = Math.round(wpm);
    seg.fillers = fillers;
    // Moments inside the segment, placed by word position
    const at = idx => seg.start + (idx / Math.max(1, w.length)) * dur;
    const moments = [];
    if (k > 0) moments.push({ t: seg.start, d: +0.1 });
    w.forEach((word, idx) => {
      const jargon = word.match(/^(?:[A-Z]{2,}\d*|[Pp]\d{2})[,.]?$/);
      if (jargon) {
        const term = word.replace(/[,.]/g, '');
        if (!defined.has(term.toUpperCase())) {
          defined.add(term.toUpperCase());
          moments.push({ t: at(idx), d: -0.12 });
          events.push({ t: at(idx), kind: 'confusion', slide: seg.slide, text: `"${term}" is never explained — part of the room stops following.` });
        }
      }
    });
    const sentences = seg.text.split(/(?<=[.?!])\s+/);
    let pos = 0;
    sentences.forEach(sentence => {
      const n = words(sentence).length;
      const t = at(pos);
      if (STORY.test(sentence)) { moments.push({ t, d: +0.15 }); events.push({ t, kind: 'memorable', slide: seg.slide, text: 'A concrete story — attention climbs back.', quote: sentence }); }
      else if (MEMORABLE.test(sentence)) { moments.push({ t, d: +0.12 }); events.push({ t, kind: 'memorable', slide: seg.slide, text: 'A number with a comparison — this is the line people repeat later.', quote: sentence }); }
      if (/\?\s*$/.test(sentence)) moments.push({ t, d: +0.1 });
      pos += n;
    });
    if (wpm > 180) events.push({ t: seg.start + dur * 0.35, kind: 'drift', slide: seg.slide, text: `Speech rate jumps to ${Math.round(wpm)} words a minute — the room can't keep up.` });
    if (fillers >= 4) events.push({ t: seg.start + dur * 0.6, kind: 'drift', slide: seg.slide, text: `${fillers} filler words in ${Math.round(dur)} seconds — it sounds unsure.` });
    seg._moments = moments.sort((x, y) => x.t - y.t);
  });

  let m = 0, segIdx = 0;
  const allMoments = segs.flatMap(s => s._moments);
  for (let t = 0; t <= end; t++) {
    while (segIdx < segs.length - 1 && t >= segs[segIdx].end) segIdx++;
    const seg = segs[segIdx];
    let decay = 0.0009;                                    // ~5% a minute just from time passing
    if (seg.wpm > 170) decay += (seg.wpm - 170) * 0.0005;  // talking too fast
    decay += (seg.fillers / Math.max(1, seg.end - seg.start)) * 0.02;
    a -= decay;
    while (m < allMoments.length && allMoments[m].t <= t) { a += allMoments[m].d; m++; }
    a = Math.max(0.15, Math.min(0.97, a));
    series.push({ t, a, slide: seg.slide });
  }
  // Smooth for display
  const smooth = series.map((p, i) => { const win = series.slice(Math.max(0, i - 3), i + 4); return { ...p, a: win.reduce((s, q) => s + q.a, 0) / win.length }; });
  // Biggest single drop worth calling out
  const perSlide = DECK.slides.map(s => {
    const pts = smooth.filter(p => p.slide === s.id);
    return { id: s.id, avg: pts.length ? pts.reduce((x, p) => x + p.a, 0) / pts.length : 0, min: pts.length ? Math.min(...pts.map(p => p.a)) : 0, drop: pts.length ? pts[0].a - pts[pts.length - 1].a : 0 };
  });
  return { series: smooth, events: events.sort((x, y) => x.t - y.t), end, perSlide, segs };
}

// ---------- Replay UI ----------
let current = null, playing = null;

export function initAttention() {
  $('#at-sample').addEventListener('click', () => show(structuredClone(SAMPLE_REHEARSAL), 'Sample run-through'));
  $('#at-record').addEventListener('click', record);
  $('#at-play').addEventListener('click', play);
  const track = $('#at-chart');
  const seek = e => {
    if (!current) return;
    const r = track.getBoundingClientRect();
    scrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * current.end);
  };
  let dragging = false;
  track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); stop(); seek(e); });
  track.addEventListener('pointermove', e => dragging && seek(e));
  track.addEventListener('pointerup', () => { dragging = false; });
}

export function show(segs, label) {
  current = model(segs);
  current.label = label;
  draw();
  // Open on the most telling moment: a rushed stretch if there is one, else the first drift
  scrub(current.events.find(e => /words a minute/.test(e.text))?.t ?? current.events.find(e => e.kind === 'drift')?.t ?? 0);
  $('#at-empty').hidden = true;
  $('#at-stage').hidden = false;
  document.dispatchEvent(new CustomEvent('attention:ready', { detail: current }));
}

const W = 1000, H = 220, PAD = 8;
const x = t => PAD + (t / current.end) * (W - PAD * 2);
const y = a => H - PAD - a * (H - PAD * 2);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function draw() {
  const c = current;
  const line = c.series.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.a).toFixed(1)}`).join('');
  const bands = c.segs.map((s, i) => `<rect x="${x(s.start)}" y="0" width="${x(s.end) - x(s.start)}" height="${H}" class="band ${i % 2 ? 'odd' : ''}"/>`).join('');
  const marks = c.events.map((e, i) => {
    const p = c.series[Math.min(c.series.length - 1, Math.round(e.t))];
    return `<g class="mark ${e.kind}" data-i="${i}" transform="translate(${x(e.t)},${y(p.a)})"><circle r="7"/><text y="4">${e.kind === 'memorable' ? '★' : e.kind === 'confusion' ? '?' : '!'}</text></g>`;
  }).join('');
  $('#at-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="curve">
      ${bands}
      ${[0.25, 0.5, 0.75].map(v => `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" class="grid"/>`).join('')}
      <path d="${line}L${x(c.end)},${H}L${x(0)},${H}Z" class="area"/>
      <path d="${line}" class="line"/>
    </svg>
    <svg viewBox="0 0 ${W} ${H}" class="marks">${marks}</svg>
    <div class="head" id="at-head"><span></span></div>`;
  $('#at-slides').innerHTML = c.segs.map((s, i) => `<button style="left:${(x(s.start) / W) * 100}%;width:${((x(s.end) - x(s.start)) / W) * 100}%" data-t="${s.start}">${i + 1}</button>`).join('');
  $$('#at-slides button').forEach(b => b.addEventListener('click', () => { stop(); scrub(+b.dataset.t + 0.5); }));
  $$('#at-chart .mark').forEach(g => g.addEventListener('pointerdown', e => { e.stopPropagation(); stop(); scrub(c.events[+g.dataset.i].t); }));
  $('#at-label').textContent = `${c.label} · ${mmss(c.end)}`;
  $('#at-axis').innerHTML = Array.from({ length: Math.floor(c.end / 60) + 1 }, (_, m) => `<span style="left:${(x(m * 60) / W) * 100}%">${m}:00</span>`).join('');
}

function scrub(t) {
  const c = current;
  t = Math.max(0, Math.min(c.end, t));
  const p = c.series[Math.min(c.series.length - 1, Math.round(t))];
  const seg = c.segs.find(s => t >= s.start && t < s.end) || c.segs[c.segs.length - 1];
  const slideIdx = DECK.slides.findIndex(s => s.id === seg.slide);
  const head = $('#at-head');
  head.style.left = `${(x(t) / W) * 100}%`;
  head.querySelector('span').style.top = `${(y(p.a) / H) * 100}%`;
  $('#at-slide').innerHTML = slideHTML(DECK.slides[slideIdx], { n: slideIdx + 1 });
  $('#at-time').textContent = mmss(t);
  $('#at-att').textContent = Math.round(p.a * 100) + '%';
  $('#at-att').className = p.a < 0.45 ? 'bad' : p.a < 0.65 ? 'mid' : 'good';
  $('#at-wpm').textContent = seg.wpm;
  $('#at-wpm').className = seg.wpm > 170 ? 'bad' : '';
  // Show the words being spoken right now
  const w = words(seg.text);
  const idx = Math.floor(((t - seg.start) / Math.max(1, seg.end - seg.start)) * w.length);
  $('#at-words').innerHTML = w.map((word, i) => `<span class="${i < idx ? 'said' : i === idx ? 'now' : ''}">${esc(word)}</span>`).join(' ');
  // Nearest event within the slide, before or just after the playhead
  const ev = [...c.events].filter(e => e.slide === seg.slide && e.t <= t + 4).pop() || c.events.find(e => e.slide === seg.slide);
  const startA = c.series[Math.round(seg.start)].a;
  const delta = Math.round((p.a - startA) * 100);
  const total = Math.round((c.series[Math.min(c.series.length - 1, Math.round(seg.end) - 1)].a - startA) * 100);
  const sign = n => (n > 0 ? '+' : '') + n + '%';
  const trend = `Attention on this slide: ${sign(delta)} so far · ${sign(total)} by the end of it`;
  $('#at-note').innerHTML = ev
    ? `<i class="${ev.kind}">${ev.kind === 'memorable' ? '★' : ev.kind === 'confusion' ? '?' : '!'}</i><div><b>${esc(ev.text)}</b>${ev.quote ? `<q>${esc(ev.quote)}</q>` : ''}<small>${trend}</small></div>`
    : `<div><b>Steady.</b><small>${trend}</small></div>`;
  $$('#at-slides button').forEach((b, i) => b.classList.toggle('on', i === c.segs.indexOf(seg)));
  current.t = t;
}

function play() {
  if (!current) return;
  if (playing) return stop();
  $('#at-play').textContent = '❚❚ Pause';
  let t = current.t >= current.end - 1 ? 0 : current.t;
  const speed = current.end / 20; // the whole run-through in 20 seconds
  let last = performance.now();
  const step = now => {
    t += ((now - last) / 1000) * speed; last = now;
    scrub(t);
    if (t >= current.end) return stop();
    playing = requestAnimationFrame(step);
  };
  playing = requestAnimationFrame(step);
}
function stop() { if (playing) cancelAnimationFrame(playing); playing = null; $('#at-play').textContent = '▶ Replay'; }

// ---------- Record your own run-through ----------
function record() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('Recording needs Chrome — try the sample run-through'); return; }
  const btn = $('#at-record');
  if (btn.rec) { btn.rec.stop(); return; }
  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  const segs = [{ slide: DECK.slides[0].id, start: 0, end: 0, text: '' }];
  let slide = 0;
  const rec = new SR();
  rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = false;
  rec.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) segs[segs.length - 1].text += ' ' + e.results[i][0].transcript; };
  rec.onend = () => {
    btn.rec = null; btn.textContent = '● Record your run-through';
    document.removeEventListener('keydown', next, true);
    $('#at-rec').hidden = true;
    segs[segs.length - 1].end = now();
    const ok = segs.filter(s => words(s.text).length >= 3);
    if (ok.length < 2) { toast('Too short to analyze — speak through at least two slides'); return; }
    ok.forEach(s => { s.text = s.text.trim(); });
    show(ok, 'Your run-through');
  };
  const next = e => {
    if (e.key !== 'ArrowRight' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    if (slide >= DECK.slides.length - 1) return rec.stop();
    segs[segs.length - 1].end = now();
    slide++;
    segs.push({ slide: DECK.slides[slide].id, start: now(), end: 0, text: '' });
    $('#at-rec-slide').innerHTML = slideHTML(DECK.slides[slide], { n: slide + 1 });
  };
  document.addEventListener('keydown', next, true);
  rec.start();
  btn.rec = rec; btn.textContent = '■ Stop recording';
  $('#at-rec').hidden = false;
  $('#at-rec-slide').innerHTML = slideHTML(DECK.slides[0], { n: 1 });
  toast('Recording — press → to move to the next slide');
}

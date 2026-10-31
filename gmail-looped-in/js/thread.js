// 03 Conversation-level detection: every message looks harmless; the six-week trajectory doesn't.
import { THREAD, SAMPLE_THREAD_ANALYSIS } from './data.js';
import { trajectory, MEDIUM, HIGH } from './detect.js';
import { $, esc, sleep } from './ui.js';

const W = 640, H = 300, L = 44, R = 20, T = 20, B = 36;
let playing = false;

export function initThread() {
  $('#th-play').addEventListener('click', play);
  draw(trajectory().length);
  messages(trajectory().length);
}

function draw(upto) {
  const pts = trajectory();
  const xs = i => L + (i / (pts.length - 1)) * (W - L - R);
  const ys = v => T + (1 - v) * (H - T - B);
  const path = key => pts.slice(0, upto).map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(p[key]).toFixed(1)}`).join('');
  const crossM = pts.findIndex(p => p.conv >= MEDIUM), crossH = pts.findIndex(p => p.conv >= HIGH);
  const marker = (i, cls, label) => i >= 0 && i < upto
    ? `<g class="flag ${cls}" transform="translate(${xs(i)},${ys(pts[i].conv)})"><circle r="7"/><text x="10" y="-12">${label}</text></g>` : '';
  $('#th-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Single-message risk versus conversation risk over six weeks">
    <line class="thr" x1="${L}" x2="${W - R}" y1="${ys(HIGH)}" y2="${ys(HIGH)}"/><text class="thr-l" x="${W - R}" y="${ys(HIGH) - 6}">Emma is told</text>
    <line class="thr m" x1="${L}" x2="${W - R}" y1="${ys(MEDIUM)}" y2="${ys(MEDIUM)}"/><text class="thr-l m" x="${W - R}" y="${ys(MEDIUM) - 6}">Mom gets a reminder</text>
    ${pts.map((p, i) => `<text class="ax" x="${xs(i)}" y="${H - 12}">W${p.week}</text>`).join('')}
    <text class="ax" x="${L - 8}" y="${ys(0) + 4}" text-anchor="end">0</text><text class="ax" x="${L - 8}" y="${ys(1) + 4}" text-anchor="end">1</text>
    <path class="single" d="${path('single')}"/>
    <path class="conv" d="${path('conv')}"/>
    ${marker(crossM, 'm', 'Reminder to Mom')}
    ${marker(crossH, 'h', 'Emma looped in')}
  </svg>`;
  const ask = pts.findIndex(p => /\$8,000/.test(p.text));
  $('#th-callout').innerHTML = crossH >= 0 && upto > crossH
    ? `<b>Emma heard about it in week ${pts[crossH].week}</b> — ${ask > crossH ? `a week before the $8,000 wire request.` : 'when the money request arrived.'} Not one message scored above ${Math.round(Math.max(...pts.map(p => p.single)) * 100)}% on its own.`
    : 'Each message on its own looks like a friendly chat.';
}

function messages(upto) {
  const pts = trajectory();
  const stages = Object.fromEntries(SAMPLE_THREAD_ANALYSIS.stages.map(s => [s.week, s]));
  let lastWeek = 0;
  $('#th-msgs').innerHTML = pts.slice(0, upto).map(p => {
    const head = p.week !== lastWeek ? `<div class="wk"><span>Week ${p.week}</span>${stages[p.week] ? `<em>${esc(stages[p.week].stage)}</em>` : ''}</div>` : '';
    lastWeek = p.week;
    return `${head}<div class="bubble ${p.stages.length ? 'hit' : ''}"><p>${esc(p.text)}</p><small>This message alone: ${Math.round(p.single * 100)}% · conversation: <b>${Math.round(p.conv * 100)}%</b></small></div>`;
  }).join('');
  $('#th-msgs').scrollTop = 1e6;
}

async function play() {
  if (playing) return;
  playing = true;
  $('#th-play').disabled = true;
  const n = trajectory().length;
  for (let i = 1; i <= n; i++) { draw(i); messages(i); await sleep(900); }
  $('#th-play').disabled = false;
  playing = false;
}
export { THREAD };

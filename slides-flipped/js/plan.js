// 03 Next rehearsal plan: combine "which slides you don't own" with "where the audience drifted".
import { DECK } from './data.js';
import { slideHTML } from './deck.js';
import { gemini } from './api.js';
import { $, esc, setBadge } from './ui.js';

const inputs = { own: null, missed: [], attention: null };

export function initPlan() {
  document.addEventListener('reverse:revealed', e => { inputs.own = e.detail.own; inputs.missed = e.detail.missed; render(); });
  document.addEventListener('attention:ready', e => { inputs.attention = e.detail; render(); });
  render();
}

function render() {
  const box = $('#plan');
  const have = [inputs.own && 'reverse', inputs.attention && 'attention'].filter(Boolean);
  $('#plan-status').innerHTML = `
    <span class="${inputs.own ? 'done' : ''}">${inputs.own ? '✓' : '1'} Reverse rehearsal</span>
    <span class="${inputs.attention ? 'done' : ''}">${inputs.attention ? '✓' : '2'} Attention replay</span>`;
  if (!have.length) { box.innerHTML = '<p class="plan-empty">Finish the reverse rehearsal or the attention replay above, and your plan appears here.</p>'; return; }

  const rows = DECK.slides.map((s, n) => {
    const own = inputs.own?.[s.id];
    const att = inputs.attention?.perSlide.find(p => p.id === s.id);
    const evs = inputs.attention?.events.filter(e => e.slide === s.id && e.kind !== 'memorable') || [];
    const misses = inputs.missed.filter(m => m.slide === s.id);
    const reasons = [
      ...misses.map(m => m.kind === 'missing' ? 'didn\'t notice a point was skipped' : m.kind === 'wrong' ? 'didn\'t catch a wrong fact' : 'didn\'t notice a line that isn\'t you'),
      ...evs.map(e => e.kind === 'confusion' ? 'unexplained jargon' : /words a minute/.test(e.text) ? 'rushed delivery' : 'sounded unsure'),
    ];
    const score = (own === 'weak' ? 2 : own === 'unsure' ? 0.5 : 0) + (att ? Math.max(0, 0.7 - att.min) * 5 : 0) + evs.length * 0.6;
    return { s, n, own, att, reasons: [...new Set(reasons)], score };
  }).sort((a, b) => b.score - a.score);
  const focus = rows.filter(r => r.score >= 1).slice(0, 3);
  const ready = rows.filter(r => !focus.includes(r));

  box.innerHTML = `
    <div class="plan-cols">
      <div>
        <h5>Rehearse these out loud</h5>
        ${focus.length ? focus.map((r, i) => `<div class="plan-row">
          <span class="rank">${i + 1}</span>
          <div class="plan-thumb">${slideHTML(r.s, { n: r.n + 1 })}</div>
          <div><b>${esc(r.s.title)}</b><p>${esc(r.reasons.join(' · ') || 'attention dipped here')}</p>
          ${r.att ? `<small>Lowest attention ${Math.round(r.att.min * 100)}%</small>` : ''}</div></div>`).join('') : '<p class="plan-empty">Nothing stands out — you are ready.</p>'}
      </div>
      <div>
        <h5>Ready</h5>
        <div class="ready">${ready.map(r => `<span>${r.n + 1} · ${esc(r.s.title)}</span>`).join('')}</div>
        <div class="coach-note" id="plan-note"><small>Coach's note</small><p>…</p></div>
      </div>
    </div>`;
  note(focus);
}

async function note(focus) {
  const el = $('#plan-note p');
  if (!focus.length) { el.textContent = 'Every slide held up. Do one full run-through standing up, then stop rehearsing.'; return; }
  const prompt = `You are a presentation coach. In two or three short sentences, tell the presenter what to rehearse before their talk and why. Be specific and encouraging; no lists.
Slides that need work: ${focus.map(r => `slide ${r.n + 1} "${r.s.title}" (${r.reasons.join(', ') || 'attention dipped'})`).join('; ')}.
Return JSON only: {"note": string}`;
  const [first, ...rest] = focus;
  const sample = `Start with slide ${first.n + 1}, "${first.s.title}" — ${first.reasons.join(' and ') || 'the room drifted there'}.` +
    (rest.length ? ` Then ${rest.map(r => `slide ${r.n + 1} (${r.reasons[0] || 'attention dipped'})`).join(' and ')}.` : '') +
    ' Say them out loud twice, slower than feels natural. Everything else is ready.';
  const { data, source } = await gemini('Gemini rehearsal coach', prompt, () => ({ note: sample }));
  setBadge($('#plan-src'), source);
  if ($('#plan-note p') === el) el.textContent = data.note || sample;
}

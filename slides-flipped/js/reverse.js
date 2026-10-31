// 01 Reverse rehearsal: the AI gives the talk, the presenter flags what it got wrong, skipped, or said unlike them.
import { DECK, SAMPLE_TALK } from './data.js';
import { slideHTML, slideText } from './deck.js';
import { gemini } from './api.js';
import { $, $$, esc, setBadge, toast } from './ui.js';

const TYPES = { wrong: 'Wrong', voice: 'Not like me', missing: 'Skipped' };

const st = { i: 0, talk: SAMPLE_TALK, flags: new Map(), missing: new Set(), revealed: false, speaking: false };

export function initReverse() {
  $('#rv-play').addEventListener('click', togglePlay);
  $('#rv-reveal').addEventListener('click', reveal);
  $('#rv-reset').addEventListener('click', () => reset(st.talk));
  $('#rv-regen').addEventListener('click', regenerate);
  $('#rv-prev').addEventListener('click', () => go(st.i - 1));
  $('#rv-next').addEventListener('click', () => go(st.i + 1));
  document.addEventListener('click', e => { if (!e.target.closest('.flag-menu, .sent')) closeMenu(); });
  render();
}

function go(i) {
  st.i = Math.max(0, Math.min(DECK.slides.length - 1, i));
  render();
}

function reset(talk) {
  speechSynthesis?.cancel();
  st.talk = talk; st.flags = new Map(); st.missing = new Set(); st.revealed = false; st.speaking = false; st.i = 0;
  $('#rv-play').textContent = '▶ Play the AI\'s talk';
  $('#rv-result').hidden = true;
  render();
}

// Planted issues, flattened, for scoring
function issues() {
  const out = [];
  for (const s of DECK.slides) {
    const t = st.talk[s.id] || { sentences: [] };
    t.sentences.forEach(x => x.issue && out.push({ slide: s.id, kind: x.issue.type, id: x.id, note: x.issue.note, text: x.text }));
    if (t.missing) out.push({ slide: s.id, kind: 'missing', id: t.missing.bullet, note: t.missing.note, text: (s.bullets || s.stats || []).find(b => b.id === t.missing.bullet)?.text || t.missing.bullet });
  }
  return out;
}

function render() {
  const s = DECK.slides[st.i];
  const t = st.talk[s.id] || { sentences: [] };
  const own = st.revealed ? ownership() : {};
  $('#rv-strip').innerHTML = DECK.slides.map((x, n) => `<button class="thumb ${n === st.i ? 'on' : ''} ${own[x.id] || ''}" data-n="${n}"><span>${n + 1}</span><div class="thumb-in">${slideHTML(x)}</div>${own[x.id] ? `<i>${own[x.id] === 'owned' ? '✓' : '!'}</i>` : ''}</button>`).join('');
  $$('#rv-strip .thumb').forEach(b => b.addEventListener('click', () => go(+b.dataset.n)));

  const missingIssue = t.missing?.bullet;
  const bulletClass = id => {
    const flagged = st.missing.has(id);
    if (!st.revealed) return flagged ? 'flag-missing' : 'pickable';
    if (id === missingIssue) return flagged ? 'caught' : 'missed';
    return flagged ? 'false-flag' : '';
  };
  $('#rv-slide').innerHTML = slideHTML(s, { bulletClass, n: st.i + 1 });
  $$('#rv-slide [data-b]').forEach(el => el.addEventListener('click', () => {
    if (st.revealed) return;
    const id = el.dataset.b;
    st.missing.has(id) ? st.missing.delete(id) : st.missing.add(id);
    render();
    if (st.missing.has(id)) toast('Marked: the AI skipped this point');
  }));

  $('#rv-talk').innerHTML = t.sentences.map(x => {
    const f = st.flags.get(x.id);
    let cls = f ? 'flagged ' + f : '';
    if (st.revealed) cls = x.issue ? (f ? 'caught' : 'missed') : (f ? 'false-flag' : '');
    const tag = st.revealed && x.issue ? `<em class="tag ${x.issue.type}">${TYPES[x.issue.type]}</em>` : f ? `<em class="tag ${f}">${TYPES[f]}</em>` : '';
    const note = st.revealed && (x.issue || f) ? `<small class="why">${esc(x.issue ? x.issue.note : 'This one was fine.')}</small>` : '';
    return `<span class="sent ${cls}" data-id="${x.id}">${esc(x.text)}${tag}</span>${note}`;
  }).join(' ') + (st.revealed && t.missing ? `<small class="why ${st.missing.has(t.missing.bullet) ? 'ok' : 'bad'}">${st.missing.has(t.missing.bullet) ? '✓ You caught the skipped point. ' : '✗ Skipped point you didn\'t catch: '}${esc(t.missing.note)}</small>` : '');
  $$('#rv-talk .sent').forEach(el => el.addEventListener('click', e => { if (!st.revealed) openMenu(el, e); }));

  $('#rv-pos').textContent = `${st.i + 1} / ${DECK.slides.length}`;
  const n = st.flags.size + st.missing.size;
  $('#rv-count').textContent = `${n} flag${n === 1 ? '' : 's'}`;
}

function openMenu(el, e) {
  e.stopPropagation();
  closeMenu();
  const id = el.dataset.id;
  const menu = document.createElement('div');
  menu.className = 'flag-menu';
  menu.innerHTML = `<button data-t="wrong">✗ Wrong</button><button data-t="voice">≠ Not like me</button>${st.flags.has(id) ? '<button data-t="">Clear</button>' : ''}`;
  const box = $('#rv-talk-box').getBoundingClientRect(), r = el.getBoundingClientRect();
  menu.style.left = Math.min(r.left - box.left, box.width - 190) + 'px';
  menu.style.top = (r.bottom - box.top + 6) + 'px';
  $('#rv-talk-box').appendChild(menu);
  menu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    b.dataset.t ? st.flags.set(id, b.dataset.t) : st.flags.delete(id);
    closeMenu(); render();
  }));
}
function closeMenu() { $$('.flag-menu').forEach(m => m.remove()); }

// Read the talk aloud, slide by slide, highlighting the sentence being spoken
function togglePlay() {
  if (!('speechSynthesis' in window)) { toast('Speech isn\'t available in this browser — read the talk instead'); return; }
  if (st.speaking) { speechSynthesis.cancel(); st.speaking = false; $('#rv-play').textContent = '▶ Play the AI\'s talk'; return; }
  st.speaking = true;
  $('#rv-play').textContent = '■ Stop';
  const queue = [];
  DECK.slides.forEach((s, n) => (st.talk[s.id]?.sentences || []).forEach(x => queue.push({ n, id: x.id, text: x.text })));
  const start = queue.findIndex(q => q.n >= st.i);
  const speak = k => {
    if (!st.speaking || k >= queue.length) { st.speaking = false; $('#rv-play').textContent = '▶ Play the AI\'s talk'; $$('.sent.speaking').forEach(x => x.classList.remove('speaking')); return; }
    const q = queue[k];
    if (q.n !== st.i) go(q.n);
    $$('.sent').forEach(x => x.classList.toggle('speaking', x.dataset.id === q.id));
    const u = new SpeechSynthesisUtterance(q.text);
    u.lang = 'en-US'; u.rate = 1.02;
    u.onend = () => speak(k + 1);
    u.onerror = () => speak(k + 1);
    speechSynthesis.speak(u);
  };
  speak(Math.max(0, start));
}

function ownership() {
  const own = {};
  for (const s of DECK.slides) {
    const t = st.talk[s.id] || { sentences: [] };
    const missedSent = t.sentences.some(x => x.issue && !st.flags.has(x.id));
    const falseSent = t.sentences.some(x => !x.issue && st.flags.has(x.id));
    const missedSkip = t.missing && !st.missing.has(t.missing.bullet);
    const falseSkip = [...st.missing].some(b => (s.bullets || s.stats || []).some(x => x.id === b) && b !== t.missing?.bullet);
    own[s.id] = missedSent || missedSkip ? 'weak' : falseSent || falseSkip ? 'unsure' : 'owned';
  }
  return own;
}

function reveal() {
  speechSynthesis?.cancel();
  st.speaking = false;
  st.revealed = true;
  const all = issues();
  const caught = all.filter(x => x.kind === 'missing' ? st.missing.has(x.id) : st.flags.has(x.id));
  const falseFlags = [...st.flags.keys()].filter(id => !all.some(x => x.id === id)).length + [...st.missing].filter(id => !all.some(x => x.id === id)).length;
  const own = ownership();
  const weak = DECK.slides.map((s, n) => ({ s, n })).filter(({ s }) => own[s.id] === 'weak');
  render();
  const box = $('#rv-result');
  box.hidden = false;
  box.innerHTML = `
    <div class="score"><b>${caught.length}<small>/${all.length}</small></b><span>issues caught</span></div>
    <div class="score-text">
      <p><b>${caught.length === all.length ? 'You own this deck.' : weak.length === 1 ? 'You own all but one slide.' : `${weak.length} slides you don't fully own yet.`}</b>
      ${falseFlags ? ` ${falseFlags} flag${falseFlags > 1 ? 's were' : ' was'} on lines that were actually fine.` : ''}</p>
      <div class="own-row">${DECK.slides.map((s, n) => `<span class="own ${own[s.id]}" title="${esc(s.title)}">${n + 1}</span>`).join('')}<small>✓ owned · ! missed something · ? flagged a correct line</small></div>
      ${weak.length ? `<ul>${weak.map(({ s, n }) => `<li><b>Slide ${n + 1}</b> · ${esc(all.filter(x => x.slide === s.id && !caught.includes(x)).map(x => TYPES[x.kind].toLowerCase()).join(', '))} — ${esc(s.title)}</li>`).join('')}</ul>` : ''}
    </div>`;
  document.dispatchEvent(new CustomEvent('reverse:revealed', { detail: { own, missed: all.filter(x => !caught.includes(x)) } }));
}

async function regenerate() {
  const btn = $('#rv-regen');
  btn.disabled = true; btn.textContent = 'Writing a new talk…';
  const prompt = `You are generating a rehearsal exercise for a presenter. Write the spoken talk for each slide of this deck (2-3 sentences per slide, first person plural, natural spoken English).
Plant exactly 6 problems for the presenter to catch: 2 "wrong" sentences that contradict a number or date on the slide, 2 "voice" sentences that sound unlike a calm professional (hype or jargon), and 2 slides where the talk skips one bullet ("missing", give the bullet id). Don't make the problems obvious.
Deck:
${DECK.slides.map(s => `[${s.id}] ${slideText(s)}${(s.bullets || s.stats) ? '\n  ids: ' + (s.bullets || s.stats).map(b => b.id).join(', ') : ''}`).join('\n')}
Return JSON only: {"talk": {"<slideId>": {"sentences": [{"id": "unique", "text": string, "issue": null or {"type": "wrong" | "voice", "note": why, max 25 words}}], "missing": null or {"bullet": bulletId, "note": why it matters, max 25 words}}}}`;
  const { data, source } = await gemini('Gemini talk writer', prompt, () => ({ talk: SAMPLE_TALK }));
  btn.disabled = false; btn.textContent = '↻ New talk with Gemini';
  setBadge($('#rv-src'), source);
  const talk = valid(data.talk) ? data.talk : SAMPLE_TALK;
  reset(talk);
  toast(talk === SAMPLE_TALK ? 'Using the sample talk' : 'New talk ready — 6 new problems are hiding in it');
}

function valid(t) {
  if (!t || typeof t !== 'object') return false;
  for (const s of DECK.slides) {
    const x = t[s.id];
    if (!x || !Array.isArray(x.sentences) || !x.sentences.every(y => y && typeof y.text === 'string')) return false;
    x.sentences.forEach((y, k) => { y.id = y.id ? `${s.id}-${y.id}` : `${s.id}-${k}`; if (y.issue && !TYPES[y.issue.type]) y.issue = null; });
    if (x.missing && !(s.bullets || s.stats || []).some(b => b.id === x.missing.bullet)) x.missing = null;
  }
  return true;
}

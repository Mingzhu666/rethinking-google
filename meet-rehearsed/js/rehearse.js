// 02 Rehearse: AI plays the toughest people in the room; you answer out loud and get coached.
import { SAMPLE_MEETING, SAMPLE_QUESTIONS, sampleFeedback } from './data.js';
import { gemini } from './api.js';
import { currentMeeting } from './simulator.js';
import { $, $$, esc, avatar, setBadge, toast } from './ui.js';

const state = { meeting: null, questions: [], active: 0, rec: null };

export function initRehearse() {
  load(currentMeeting());
  document.addEventListener('meeting:changed', e => load(e.detail));
  $('#coach-btn').addEventListener('click', coach);
  setupMic();
}

async function load(meeting) {
  state.meeting = meeting;
  $('#r-meeting').textContent = meeting.title;
  $('#q-list').innerHTML = '<p class="feed-empty">Reading the invite…</p>';
  const others = meeting.people.filter(p => p.id !== 'you');
  const prompt = `You are rehearsing a meeting organizer before "${meeting.title}" (${meeting.minutes} min). Goal: ${meeting.goal}.
Agenda: ${meeting.agenda.map(i => `${i.title} (${i.kind})`).join('; ')}.
Guests: ${others.map(p => `${p.id} = ${p.name}, ${p.role}${p.note ? ', ' + p.note : ''}${p.decider ? ', makes the final call' : ''}`).join('; ')}.
Predict the 3 hardest questions the organizer ("You") will get, each from a different guest, asked directly to the organizer in that guest's voice. Make them specific and uncomfortable, max 30 words each. Don't invent precise statistics. Add a one-line "why" explaining why this person would ask it.
Return JSON only: {"questions": [{"from": guestId, "q": string, "why": string}]}`;
  const { data, source } = await gemini('Gemini question predictor', prompt, () => ({
    questions: meeting.title === SAMPLE_MEETING.title ? SAMPLE_QUESTIONS : fallbackQuestions(meeting),
  }));
  if (state.meeting !== meeting) return;
  setBadge($('#q-src'), source);
  state.questions = (data.questions || []).filter(q => meeting.people.some(p => p.id === q.from)).slice(0, 3);
  if (!state.questions.length) state.questions = fallbackQuestions(meeting);
  $('#q-list').innerHTML = state.questions.map((q, i) => {
    const p = meeting.people.find(x => x.id === q.from);
    return `<div class="q" data-i="${i}">${avatar(p)}<div><small>${esc(p.name)} will likely ask</small>${esc(q.q)}</div></div>`;
  }).join('');
  $$('.q').forEach(el => el.addEventListener('click', () => select(+el.dataset.i)));
  select(0);
}

function fallbackQuestions(m) {
  const others = m.people.filter(p => p.id !== 'you');
  const decider = others.find(p => p.decider) || others[0];
  const talky = [...others].sort((a, b) => b.talk - a.talk)[0];
  const quiet = [...others].sort((a, b) => a.talk - b.talk)[0];
  const decision = m.agenda.find(i => i.kind === 'decision');
  return [
    { from: decider.id, q: `What's the single thing you need from me today, and what happens if I say no?`, why: `${decider.name} makes the call and wants the ask in one sentence.` },
    { from: talky.id, q: `What's the riskiest assumption in “${(decision || m.agenda[0]).title}”, and who owns it if it's wrong?`, why: `${talky.name} probes edge cases and ownership.` },
    { from: quiet.id, q: `Which data point would change your mind?`, why: `${quiet.name} rarely speaks, but when they do it's about evidence.` },
  ].filter((q, i, a) => a.findIndex(x => x.from === q.from) === i);
}

function select(i) {
  state.active = i;
  $$('.q').forEach(el => el.classList.toggle('on', +el.dataset.i === i));
  const q = state.questions[i];
  const p = state.meeting.people.find(x => x.id === q.from);
  $('#asker').innerHTML = `${avatar(p)}<div><small>${esc(p.name)} · ${esc(p.role)}</small><blockquote>“${esc(q.q)}”</blockquote><small style="margin-top:8px">${esc(q.why || '')}</small></div>`;
  $('#answer').value = '';
  $('#coach').hidden = true;
}

function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = $('#mic');
  if (!SR) {
    mic.style.display = 'none';
    $('#mic-hint').textContent = 'Voice input isn\'t available in this browser — type your answer instead';
    return;
  }
  mic.addEventListener('click', () => {
    if (state.rec) { state.rec.stop(); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
    const base = $('#answer').value ? $('#answer').value + ' ' : '';
    rec.onresult = e => { $('#answer').value = base + [...e.results].map(r => r[0].transcript).join(''); };
    rec.onerror = e => { toast(e.error === 'not-allowed' ? 'Microphone access was blocked — type your answer instead' : 'Voice input stopped'); };
    rec.onend = () => { state.rec = null; mic.classList.remove('rec'); $('#mic-hint').textContent = 'Speak your answer — it\'s transcribed in your browser'; };
    rec.start();
    state.rec = rec;
    mic.classList.add('rec');
    $('#mic-hint').textContent = 'Listening… press again to stop';
  });
}

async function coach() {
  const answer = $('#answer').value.trim();
  if (answer.split(/\s+/).length < 4) { toast('Give an answer first — at least a sentence'); return; }
  state.rec?.stop();
  const q = state.questions[state.active];
  const p = state.meeting.people.find(x => x.id === q.from);
  const btn = $('#coach-btn');
  btn.disabled = true; btn.textContent = 'Listening back…';
  const prompt = `You are a blunt but kind meeting coach. In "${state.meeting.title}", ${p.name} (${p.role}${p.note ? ', ' + p.note : ''}) asks: "${q.q}"
The organizer answered: "${answer}"
Score the answer 1–10 for how well it would land with this specific person. Say what worked (one sentence), the single most important fix (one sentence), and write a stronger answer in the organizer's voice (max 45 words).
Return JSON only: {"score": number, "worked": string, "fix": string, "stronger": string}`;
  const { data, source } = await gemini('Gemini answer coach', prompt, () => sampleFeedback(answer));
  btn.disabled = false; btn.textContent = 'Coach me';
  setBadge($('#q-src'), source);
  const score = Math.max(1, Math.min(10, Math.round(+data.score || 5)));
  const color = score >= 8 ? '#1e8e3e' : score >= 5 ? '#f29900' : '#d93025';
  const box = $('#coach');
  box.hidden = false;
  box.innerHTML = `<div class="score-ring" style="--p:${score * 10};--c:${color}"><b>${score}</b></div>
    <div><h5>What worked</h5><p>${esc(data.worked)}</p><h5>Fix this first</h5><p>${esc(data.fix)}</p><h5>A stronger version</h5><p class="stronger">${esc(data.stronger)}</p></div>`;
}

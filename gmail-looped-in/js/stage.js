// 02 The main stage: Mom's Gmail on the left, Emma's phone on the right.
// Scanning runs the three layers; high-risk mail notifies Emma with the risk only, never the email.
import { INBOX, MOM, GUARDIAN, GUIDANCE } from './data.js';
import { rules, links, intent } from './detect.js';
import { $, $$, esc, sleep, setBadge, toast } from './ui.js';

const st = { scanned: false, scanning: false, res: {}, sel: 'm2', on: true, log: [], view: 'mail' };
const RISK = { high: 'High risk', medium: 'Be careful', low: 'Looks fine' };
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export function initStage() {
  $('#scan-btn').addEventListener('click', scan);
  $('#guard-off').addEventListener('click', turnOff);
  $('#guard-activity').addEventListener('click', () => { st.view = 'activity'; renderPane(); });
  renderList();
  renderPane();
  phone.home();
}

// ---------- Inbox ----------
function renderList() {
  $('#inbox').innerHTML = INBOX.map(m => {
    const r = st.res[m.id];
    const chip = r?.risk ? `<span class="risk ${r.risk}">${RISK[r.risk]}</span>` : r?.layer ? `<span class="risk low">Cleared · layer ${r.layer}</span>` : '';
    return `<button class="row ${st.sel === m.id ? 'sel' : ''} ${r?.risk === 'high' ? 'danger' : ''}" data-id="${m.id}">
      <span class="av" style="background:${m.color}">${esc(m.from[0])}</span>
      <b class="from">${esc(m.from)}</b>
      <span class="subj"><b>${esc(m.subject)}</b> — ${esc(m.snippet)}</span>
      ${chip}<span class="time">${m.time}</span>
      ${r?.passing ? `<i class="pass l${r.passing}"></i>` : ''}
    </button>`;
  }).join('');
  $$('#inbox .row').forEach(b => b.addEventListener('click', () => { st.sel = b.dataset.id; st.view = 'mail'; renderList(); renderPane(); }));
}

function renderPane() {
  const pane = $('#pane');
  if (st.view === 'activity') {
    pane.innerHTML = `<div class="activity"><h3>What Emma has been told</h3><p class="muted-s">You see exactly what she sees. She never sees your emails.</p>
      ${st.log.length ? st.log.map(a => `<div class="act-row ${a.kind}"><b>${esc(a.title)}</b><span>${esc(a.text)}</span><small>${a.time}</small></div>`).join('') : '<p class="muted-s">Nothing yet.</p>'}
      <button class="gw-btn small" id="back-mail">Back to inbox</button></div>`;
    $('#back-mail').addEventListener('click', () => { st.view = 'mail'; renderPane(); });
    return;
  }
  const m = INBOX.find(x => x.id === st.sel);
  const r = st.res[m.id];
  let body = esc(m.body);
  (r?.highlights || []).forEach(h => {
    const e = esc(h);
    if (e && body.includes(e)) body = body.replace(e, `<mark>${e}</mark>`);
  });
  (m.links || []).forEach((l, i) => { body = body.replace(esc(`[${l.text}]`), `<button class="mail-link" data-i="${i}">${esc(l.text)}</button>`); });
  const banner = r?.risk && r.risk !== 'low' ? `
    <div class="warn ${r.risk}">
      <div class="warn-head"><span class="shield"></span><b>${r.risk === 'high' ? 'This looks like a scam' : 'Be careful with this email'}</b>${r.risk === 'high' && st.on ? `<span class="looped">Emma was notified · risk only</span>` : ''}</div>
      <div class="tactics">${(r.tactics || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
      <ol class="layers">
        <li><b>Rules</b>${esc(r.signals.join(' · ') || 'nothing unusual')}</li>
        <li><b>Links</b>${r.links.length ? r.links.map(l => l.unsafe ? `"${esc(l.text)}" is a known unsafe page` : `"${esc(l.text)}" looks fine`).join(' · ') : 'no links'}</li>
        <li><b>Gemini</b>${esc(r.reason || (r.tactics || []).join(', '))}</li>
      </ol>
    </div>` : r?.layer ? `<div class="warn ok"><div class="warn-head"><span class="shield"></span><b>Cleared at layer ${r.layer}</b></div><p>${r.layer === 1 ? 'Known sender, nothing unusual — it never needed the AI.' : 'Its links checked out — it never needed the AI.'}</p></div>` : '';
  pane.innerHTML = `
    <h2 class="mail-subj">${esc(m.subject)}</h2>
    <div class="mail-from"><span class="av" style="background:${m.color}">${esc(m.from[0])}</span><div><b>${esc(m.from)}</b> <small>&lt;${esc(m.addr)}&gt;</small><small>to me · ${m.time}</small></div></div>
    ${banner}
    <div class="mail-body">${body}</div>`;
  $$('.mail-link').forEach(b => b.addEventListener('click', () => clickLink(m, m.links[+b.dataset.i])));
}

// ---------- Scanning ----------
async function scan() {
  if (st.scanning) return;
  st.scanning = true;
  const btn = $('#scan-btn');
  btn.disabled = true;
  st.res = {}; st.log = st.log.filter(a => a.kind === 'system');
  phone.home();
  const counts = { 1: 0, 2: 0, 3: 0 };
  const showFunnel = () => {
    $('#funnel').innerHTML = `
      <div class="fl"><small>Layer 1 · Rules</small><b>${counts[1]}</b><span>cleared in microseconds</span></div>
      <div class="fl"><small>Layer 2 · Link check</small><b>${counts[2]}</b><span>cleared by link reputation</span></div>
      <div class="fl ai"><small>Layer 3 · Gemini</small><b>${counts[3]}</b><span>sent to the AI for intent</span></div>`;
  };
  showFunnel();
  // Decide layers locally first, then start Gemini for the suspicious ones while the animation runs
  const plan = INBOX.map(m => {
    const signals = rules(m), ls = links(m);
    const layer = signals.length || ls.some(l => l.unsafe) ? 3 : ls.length ? 2 : 1;
    return { m, signals, ls, layer };
  });
  const ai = intent(plan.filter(p => p.layer === 3).map(p => p.m));
  btn.textContent = 'Scanning…';
  for (const p of plan) {
    for (let l = 1; l <= p.layer; l++) {
      st.res[p.m.id] = { passing: l };
      renderList();
      await sleep(l === 3 ? 260 : 160);
    }
    st.res[p.m.id] = { layer: p.layer, signals: p.signals, links: p.ls };
    counts[p.layer]++;
    showFunnel();
    renderList();
  }
  btn.textContent = `Gemini is reading ${counts[3]} emails…`;
  const { data, source } = await ai;
  setBadge($('#scan-src'), source);
  for (const p of plan.filter(x => x.layer === 3)) {
    const x = data[p.m.id];
    st.res[p.m.id] = { ...st.res[p.m.id], ...x, reason: x.guardian };
  }
  st.scanned = true;
  renderList(); renderPane();
  btn.textContent = 'Scan again'; btn.disabled = false;
  st.scanning = false;
  // Tiered alerts: medium stays with Mom, high also reaches Emma
  const high = plan.filter(p => st.res[p.m.id].risk === 'high');
  const medium = plan.filter(p => st.res[p.m.id].risk === 'medium');
  $('#mom-note').innerHTML = medium.length ? `<b>Just for you:</b> ${medium.length} email${medium.length > 1 ? 's' : ''} to be careful with. Emma wasn't told about ${medium.length > 1 ? 'these' : 'this one'}.` : '';
  if (!st.on) return;
  for (const p of high) {
    await sleep(700);
    const r = st.res[p.m.id];
    const alert = { kind: 'high', title: (r.tactics || [])[0] || 'High-risk email', text: `${r.guardian} From ${p.m.addr.split('@')[1]}.`, time: now(), id: p.m.id };
    st.log.unshift(alert);
    phone.notify(alert);
  }
}

// ---------- "Let's pause" ----------
function clickLink(m, link) {
  const r = st.res[m.id];
  if (!r?.risk || r.risk === 'low') { toast('Opening links is disabled in this demo'); return; }
  const ask = (r.tactics || []).join(', ').toLowerCase();
  $('#pause').hidden = false;
  $('#pause').innerHTML = `<div class="pause-card">
    <span class="pause-icon">✋</span>
    <h3>Let's pause for a second.</h3>
    <p>This email ${r.risk === 'high' ? 'is asking for something scammers ask for' : 'doesn\'t look like it\'s really from who it says'}: <b>${esc(ask)}</b>. ${/bank/i.test(ask) ? 'Your bank will never ask for a code by email.' : 'Real organizations don\'t ask for this by email.'}</p>
    <p>Would you like to call ${GUARDIAN.short} first?</p>
    <div class="pause-actions">
      <button class="gw-btn primary" id="call-emma">📞 Call ${GUARDIAN.short}</button>
      <button class="gw-btn" id="wait">I'll wait</button>
      <button class="link-btn" id="go-anyway">Continue anyway</button>
    </div>
    <small>${link.unsafe ? 'This link is a known unsafe page.' : ''} ${GUARDIAN.short} won't see this email.</small>
  </div>`;
  $('#call-emma').addEventListener('click', () => { $('#pause').hidden = true; phone.call(); });
  $('#wait').addEventListener('click', () => { $('#pause').hidden = true; toast('Good call. The email will be here later.'); });
  $('#go-anyway').addEventListener('click', () => { $('#pause').hidden = true; toast('In the demo, the link stays closed — it\'s Google\'s Safe Browsing test page.'); });
}

// ---------- Mom stays in control ----------
function turnOff() {
  if (!st.on) {
    st.on = true;
    $('#guard-bar').classList.remove('off');
    $('#guard-text').innerHTML = `<b>Looped in with ${GUARDIAN.short}</b> (your ${GUARDIAN.relation}) · she sees the type of risk and the sender, never the email`;
    $('#guard-off').textContent = 'Turn off';
    toast(`${GUARDIAN.short} is looped in again`);
    phone.notify({ kind: 'system', title: 'Mom turned Looped In back on', text: 'You\'ll hear about high-risk emails again.', time: now() });
    return;
  }
  st.on = false;
  $('#guard-bar').classList.add('off');
  $('#guard-text').innerHTML = `<b>Looped In is off.</b> ${GUARDIAN.short} was told it's off. She can't turn it back on — only you can.`;
  $('#guard-off').textContent = 'Turn back on';
  const alert = { kind: 'system', title: 'Mom turned off Looped In', text: 'That\'s her choice to make. If you\'re worried, talk to her — you can\'t turn it back on.', time: now() };
  st.log.unshift(alert);
  phone.notify(alert);
}

// ---------- Emma's phone ----------
const phone = {
  home() {
    $('#phone-screen').innerHTML = `<div class="lock"><div class="clock">${now().replace(/ (AM|PM)/, '')}</div><div class="date">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div><div class="notifs" id="notifs"></div></div>`;
  },
  notify(a) {
    if (!$('#notifs')) phone.home();
    const n = document.createElement('button');
    n.className = 'notif ' + a.kind;
    n.innerHTML = `<span class="app-icon"></span><div><small>Gmail · Looped In · ${a.time}</small><b>${esc(a.title)}</b><p>${esc(a.text)}</p>${a.kind === 'high' ? '<em>You can\'t see the email.</em>' : ''}</div>`;
    n.addEventListener('click', () => a.kind === 'high' && phone.detail(a));
    $('#notifs').prepend(n);
  },
  detail(a) {
    $('#phone-screen').innerHTML = `<div class="app">
      <button class="back" id="ph-back">‹ Alerts</button>
      <div class="alert-card"><span class="risk high">High risk</span><h4>${esc(a.title)}</h4><p>${esc(a.text)}</p><small>${a.time} · Mom can see this alert too</small></div>
      <div class="sees"><div><b>You can see</b><span>Type of risk · sender's domain · time</span></div><div class="no"><b>You can't see</b><span>The email · her other mail · her contacts</span></div></div>
      <h5>How to bring it up</h5>
      <ul class="guide do">${GUIDANCE.do.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <ul class="guide dont">${GUIDANCE.dont.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <button class="call-btn" id="ph-call">📞 Call Mom</button>
    </div>`;
    $('#ph-back').addEventListener('click', () => { phone.home(); st.log.slice().reverse().forEach(x => phone.notify(x)); });
    $('#ph-call').addEventListener('click', () => toast('Calling Mom…'));
  },
  call() {
    $('#phone-screen').innerHTML = `<div class="incoming"><small>Incoming call</small><span class="caller" style="background:${MOM.color}">M</span><h4>Mom</h4><p>Margaret Chen</p>
      <div class="call-actions"><button class="decline">✕</button><button class="accept" id="accept">✆</button></div></div>`;
    $('#accept').addEventListener('click', () => {
      let s = 0;
      $('#phone-screen').innerHTML = `<div class="incoming live"><small id="call-time">0:00</small><span class="caller" style="background:${MOM.color}">M</span><h4>Mom</h4>
        <div class="tip"><b>Tip</b> Ask, don't tell. "Want to look at it together?"</div><button class="decline" id="hang">✕</button></div>`;
      const t = setInterval(() => { s++; const el = $('#call-time'); if (!el) return clearInterval(t); el.textContent = `0:${String(s).padStart(2, '0')}`; }, 1000);
      $('#hang').addEventListener('click', () => { clearInterval(t); phone.home(); st.log.slice().reverse().forEach(x => phone.notify(x)); toast('Call ended. Nothing was sent.'); });
    });
  },
};

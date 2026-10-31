// 01 Consent: Mom chooses who looks out for her; Emma accepts. Mom can see and stop everything.
import { GUARDIAN } from './data.js';
import { $, $$, toast } from './ui.js';

const CONTACTS = [
  { id: 'emma', name: 'Emma Chen', rel: 'Daughter', color: '#1e8e3e' },
  { id: 'david', name: 'David Chen', rel: 'Son', color: '#1a73e8' },
  { id: 'ruth', name: 'Ruth Park', rel: 'Friend', color: '#e8710a' },
];

export function initConsent() {
  let pick = 'emma';
  const render = () => {
    $('#c-contacts').innerHTML = CONTACTS.map(c => `<button class="contact ${pick === c.id ? 'on' : ''}" data-id="${c.id}"><span class="av" style="background:${c.color}">${c.name[0]}</span><div><b>${c.name}</b><small>${c.rel}</small></div><i></i></button>`).join('');
    $$('#c-contacts .contact').forEach(b => b.addEventListener('click', () => { pick = b.dataset.id; render(); }));
  };
  render();
  $('#c-invite').addEventListener('click', () => {
    const c = CONTACTS.find(x => x.id === pick);
    $('#c-invite').disabled = true;
    $('#c-invite').textContent = `Invite sent to ${c.name.split(' ')[0]}`;
    $('#c-phone').innerHTML = `<div class="invite">
      <span class="app-icon big"></span>
      <h4>Mom asked you to be looped in</h4>
      <p>If a high-risk scam email reaches her, you'll get a heads-up with the <b>type of risk</b> and the <b>sender</b> — never the email itself.</p>
      <p class="small">She can see every alert you get, and turn this off anytime. You can't change her settings.</p>
      <button class="gw-btn primary" id="c-accept">Accept</button>
    </div>`;
    $('#c-accept').addEventListener('click', () => {
      $('#c-phone').innerHTML = `<div class="invite done"><span class="tick">✓</span><h4>You're looped in</h4><p>We'll only bother you when it matters.</p></div>`;
      $('#c-status').innerHTML = `<span class="tick small">✓</span> ${c.name.split(' ')[0]} accepted. You're looped in.`;
      $('#c-status').classList.add('ok');
      toast(`${c.name.split(' ')[0]} is looped in`);
    });
  });
}
export { GUARDIAN };

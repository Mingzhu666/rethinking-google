// Three-layer scam detection. Each layer only sees what the previous one couldn't clear,
// so most mail never reaches the AI.
import { TEST_UNSAFE, SAMPLE_INTENT, THREAD } from './data.js';
import { gemini } from './api.js';

const BRANDS = {
  chase: 'chase.com', 'bank of america': 'bankofamerica.com', 'wells fargo': 'wellsfargo.com', paypal: 'paypal.com',
  amazon: 'amazon.com', apple: 'apple.com', microsoft: 'microsoft.com', usps: 'usps.com', irs: 'irs.gov',
  medicare: 'medicare.gov', walgreens: 'walgreens.com', aarp: 'aarp.org',
};
const KEYWORDS = [
  [/gift cards?/i, 'Gift cards'],
  [/\bwire\b|western union|money ?gram/i, 'Wire transfer'],
  [/bitcoin|crypto/i, 'Crypto'],
  [/verification code|\d-digit code|one-time code/i, 'Verification code'],
  [/\bpassword\b/i, 'Password'],
  [/anydesk|teamviewer|remote access/i, 'Remote-access software'],
  [/within 24 hours|immediately|suspension|suspended|permanently locked/i, 'Urgency'],
  [/between us|keep this (quiet|secret)|don.t tell/i, 'Secrecy'],
];
const domainOf = addr => addr.split('@')[1].toLowerCase();
const official = (domain, root) => domain === root || domain.endsWith('.' + root);
const normalize = s => s.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/[^a-z]/g, '');

// Layer 1 — rules, in microseconds
export function rules(mail) {
  const domain = domainOf(mail.addr);
  const signals = [];
  for (const [brand, root] of Object.entries(BRANDS)) {
    const inName = mail.from.toLowerCase().includes(brand);
    const inDomain = normalize(domain).includes(normalize(brand));
    if (inName && !official(domain, root)) signals.push(`"${mail.from}" isn't sending from ${root}`);
    if (inDomain && !official(domain, root)) signals.push(`Lookalike domain: ${domain}`);
  }
  const text = mail.subject + ' ' + mail.body;
  for (const [re, label] of KEYWORDS) if (re.test(text)) signals.push(label);
  return [...new Set(signals)];
}

// Layer 2 — link reputation. The demo checks Google's Safe Browsing test pages locally;
// in production this is a Web Risk / Safe Browsing lookup.
export function links(mail) {
  return (mail.links || []).map(l => ({ ...l, unsafe: TEST_UNSAFE.includes(l.url) || /testsafebrowsing/.test(l.url) }));
}

// Layer 3 — intent, only for mail the first two layers flagged
export async function intent(mails) {
  if (!mails.length) return { data: {}, source: 'mock' };
  const prompt = `You protect an older adult's inbox from scams. For each email, judge the sender's intent.
risk: "high" if it asks for money, gift cards, wire transfers, passwords, verification codes or remote-access software; "medium" if it is deceptive but low-stakes; "low" if benign.
tactics: up to 3 short labels (e.g. "Impersonates a bank", "Urgency", "Secrecy").
guardian: ONE sentence for a family member describing the risk WITHOUT quoting or revealing the email's content, max 16 words, refer to the recipient as "her".
highlights: up to 4 exact phrases copied from the body that show the scam.
Emails:
${mails.map(m => `[${m.id}] From: ${m.from} <${m.addr}>\nSubject: ${m.subject}\n${m.body}`).join('\n\n')}
Return JSON only: {"results": {"<id>": {"risk": string, "tactics": [string], "guardian": string, "highlights": [string]}}}`;
  const r = await gemini('Gemini scam intent', prompt, () => ({ results: Object.fromEntries(mails.map(m => [m.id, SAMPLE_INTENT[m.id] || fallback(m)])) }));
  const results = {};
  for (const m of mails) {
    const x = r.data.results?.[m.id];
    results[m.id] = x && ['low', 'medium', 'high'].includes(x.risk) ? x : SAMPLE_INTENT[m.id] || fallback(m);
  }
  return { data: results, source: r.source };
}

function fallback(m) {
  const s = rules(m);
  const high = s.some(x => /Gift|Wire|Crypto|Verification|Password|Remote/.test(x));
  return { risk: high ? 'high' : 'medium', tactics: s.slice(0, 3), guardian: high ? 'An email asked her for money or account access.' : 'A suspicious email reached her inbox.', highlights: [] };
}

// Conversation-level risk: no single message is a scam, the trajectory is
const STAGES = [
  { key: 'trust', weight: 0.15, re: /lost my wife|best part of my day|is that silly/i, label: 'Trust' },
  { key: 'isolation', weight: 0.25, re: /between us|wouldn.t understand|don.t tell/i, label: 'Isolation' },
  { key: 'pitch', weight: 0.2, re: /crypto|grew \d+%|advisor|returns|coinvault/i, label: 'The pitch' },
  { key: 'money', weight: 0.25, re: /\$\s?\d|wire|release fee|pay you back/i, label: 'The ask' },
];
export const MEDIUM = 0.4, HIGH = 0.8;

export function trajectory() {
  const seen = new Set();
  let risk = 0.05; // a stranger from a game app
  return THREAD.messages.map(m => {
    const hits = STAGES.filter(s => s.re.test(m.text));
    hits.forEach(s => { if (!seen.has(s.key)) { seen.add(s.key); risk += s.weight; } else risk += 0.03; });
    risk = Math.min(0.97, risk);
    return { ...m, conv: risk, stages: hits.map(s => s.label) };
  });
}

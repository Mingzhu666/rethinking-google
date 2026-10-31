// Sample people, inbox, and a six-week conversation. All emails are written for this demo;
// the only "malicious" links are Google's official Safe Browsing test pages.

export const MOM = { name: 'Margaret Chen', short: 'Mom', email: 'margaret.chen@gmail.com', color: '#a142f4' };
export const GUARDIAN = { name: 'Emma Chen', short: 'Emma', relation: 'daughter', phone: '+1 (415) 555-0148', color: '#1e8e3e' };

// Google's Safe Browsing test URLs — safe to link, always reported as unsafe
export const TEST_UNSAFE = [
  'https://testsafebrowsing.appspot.com/s/phishing.html',
  'https://testsafebrowsing.appspot.com/s/malware.html',
];

export const INBOX = [
  {
    id: 'm1', from: 'Lily Chen', addr: 'lily.chen.07@gmail.com', time: '10:52 AM', color: '#f9ab00',
    subject: 'Photos from the recital!', snippet: 'Grandma!! Here are the pictures from Saturday, I can\'t believe you came…',
    body: 'Grandma!!\n\nHere are the pictures from Saturday. I can\'t believe you came all that way. The one where I\'m bowing is my favorite.\n\nLove you,\nLily',
    links: [{ text: 'Recital album', url: 'https://photos.google.com/share/recital-album' }],
  },
  {
    id: 'm2', from: 'Chase Security', addr: 'alerts@chase-secure-verify.co', time: '10:41 AM', color: '#117aca',
    subject: 'Unusual sign-in detected — action required',
    snippet: 'We detected an unusual sign-in to your account. To avoid suspension, verify your identity within 24 hours…',
    body: 'Dear Customer,\n\nWe detected an unusual sign-in to your Chase account from a new device. To avoid suspension of your account, you must verify your identity within 24 hours.\n\nPlease reply to this email with the 6-digit verification code we just sent to your phone, or verify here:\n[Verify my account]\n\nIf you do not respond, your account will be permanently locked.\n\nChase Security Team',
    links: [{ text: 'Verify my account', url: 'https://testsafebrowsing.appspot.com/s/phishing.html' }],
  },
  {
    id: 'm3', from: 'Walgreens', addr: 'pharmacy@walgreens.com', time: '9:30 AM', color: '#e31837',
    subject: 'Your prescription is ready for pickup', snippet: 'Your refill is ready at the Main St store. Pickup by Friday.',
    body: 'Hi Margaret,\n\nYour refill is ready at our Main St store. Please pick it up by Friday.\n\nWalgreens Pharmacy',
  },
  {
    id: 'm4', from: 'Pastor David', addr: 'pastor.david.grace@gmail.com', time: '8:12 AM', color: '#5f6368',
    subject: 'Are you available?', snippet: 'I need a quick favor, please keep this between us for now…',
    body: 'Good morning Margaret,\n\nAre you available? I need a quick favor and I\'m in meetings all day so I can\'t talk on the phone. Please keep this between us for now.\n\nI need you to purchase four $200 Apple gift cards for a member of our congregation who is going through cancer treatment. Scratch the back and send me photos of the codes. I will pay you back on Sunday.\n\nGod bless,\nPastor David',
  },
  {
    id: 'm5', from: 'USPS', addr: 'notice@usps-redelivery-help.com', time: 'Yesterday', color: '#333366',
    subject: 'Your package is on hold', snippet: 'A $1.99 redelivery fee is required to release your package…',
    body: 'Your package could not be delivered due to an incomplete address. A $1.99 redelivery fee is required to release it.\n\n[Pay redelivery fee]\n\nUSPS Delivery Services',
    links: [{ text: 'Pay redelivery fee', url: 'https://testsafebrowsing.appspot.com/s/malware.html' }],
  },
  {
    id: 'm6', from: 'Garden Club', addr: 'news@oakmontgardenclub.org', time: 'Yesterday', color: '#188038',
    subject: 'November meeting: winter bulbs', snippet: 'Join us Thursday at 2 PM in the community room for winter bulb planting…',
    body: 'Join us Thursday at 2 PM in the community room. We\'ll be planting winter bulbs and sharing cuttings.\n\nSee you there!\nOakmont Garden Club',
    links: [{ text: 'RSVP', url: 'https://oakmontgardenclub.org/rsvp' }],
  },
  {
    id: 'm7', from: 'Microsoft Support', addr: 'support@micros0ft-helpdesk.net', time: 'Mon', color: '#0078d4',
    subject: 'WARNING: Your computer is infected', snippet: 'We have detected 5 viruses on your computer. Call our certified technicians now…',
    body: 'WARNING\n\nWe have detected 5 viruses on your computer. Your files and banking information are at risk.\n\nCall our certified technicians now at 1-888-555-0199, or install AnyDesk so a technician can remove the viruses for you.\n\nMicrosoft Windows Support',
  },
  {
    id: 'm8', from: 'AARP', addr: 'newsletter@aarp.org', time: 'Mon', color: '#e2231a',
    subject: 'Your November member benefits', snippet: 'Travel deals, a new walking challenge, and how to spot a scam call…',
    body: 'This month: travel deals, a new walking challenge, and how to spot a scam call.\n\nAARP',
  },
];

// What Gemini returns for the emails that reach layer 3 (used offline and when no key is set)
export const SAMPLE_INTENT = {
  m2: { risk: 'high', tactics: ['Impersonates a bank', 'Urgency', 'Asks for a verification code'], guardian: 'An email pretending to be her bank asked for a verification code.', highlights: ['avoid suspension', 'within 24 hours', '6-digit verification code', 'permanently locked'] },
  m4: { risk: 'high', tactics: ['Impersonates someone she trusts', 'Secrecy', 'Asks for gift cards'], guardian: 'Someone posing as her pastor asked her to buy gift cards and keep it secret.', highlights: ['keep this between us', 'Apple gift cards', 'send me photos of the codes', 'can\'t talk on the phone'] },
  m5: { risk: 'medium', tactics: ['Lookalike delivery site', 'Small payment request'], guardian: 'A fake delivery notice asked for a small payment.', highlights: ['$1.99 redelivery fee'] },
  m7: { risk: 'high', tactics: ['Impersonates tech support', 'Fear', 'Asks to install remote-access software'], guardian: 'A fake tech-support email asked her to install remote-access software.', highlights: ['5 viruses', 'banking information are at risk', 'install AnyDesk'] },
};

// Six weeks with "Robert", met on a word-game app. No single message looks like a scam.
export const THREAD = {
  from: 'Robert Hayes', addr: 'robert.hayes.offshore@gmail.com', color: '#e8710a',
  messages: [
    { week: 1, text: 'Margaret, you beat me again at Words! Where did you learn "QUIXOTIC"? I\'m Robert by the way.', single: 0.05 },
    { week: 1, text: 'Your garden photos made my day. I\'m an engineer on an oil platform in the North Sea, so green things are a luxury.', single: 0.08 },
    { week: 2, text: 'I lost my wife four years ago. Talking to you is the best part of my day. Is that silly?', single: 0.1 },
    { week: 3, text: 'My daughter doesn\'t call much either. Maybe it\'s better we keep our friendship just between us — people wouldn\'t understand.', single: 0.18 },
    { week: 4, text: 'Good news! My crypto account with CoinVault Pro grew 40% this month. My advisor says it\'s the safest it has ever been.', single: 0.2 },
    { week: 5, text: 'I could show you how. Even $1,000 would grow fast, and you\'d never have to worry about money again.', single: 0.24 },
    { week: 6, text: 'I\'m in trouble, Margaret. My account is frozen until I pay a $8,000 release fee. Could you wire it? I\'ll pay you back double when I\'m ashore.', single: 0.32 },
  ],
};

export const SAMPLE_THREAD_ANALYSIS = {
  stages: [
    { week: 1, stage: 'Contact', note: 'A stranger starts a friendly conversation on a game app.' },
    { week: 2, stage: 'Trust', note: 'Shares grief and emotional closeness quickly.' },
    { week: 3, stage: 'Isolation', note: 'Suggests keeping the friendship secret from family.' },
    { week: 4, stage: 'The pitch', note: 'Brags about a crypto platform with impossible returns.' },
    { week: 6, stage: 'The ask', note: 'Asks her to wire $8,000 to unlock frozen money.' },
  ],
  guardian: 'A six-week online friendship has turned to investing and now a request to wire money.',
};

export const GUIDANCE = {
  do: ['Ask, don\'t tell: "I got a heads-up about an email — want to look at it together?"', 'Call. A voice works better than a text.', 'Thank her for keeping you looped in.'],
  dont: ['Don\'t say "you almost got scammed."', 'Don\'t take over her accounts.', 'Don\'t ask to read her email.'],
};

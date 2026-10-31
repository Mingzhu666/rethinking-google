// Sample team and week. Days are 0–4 (Mon–Fri); times are decimal hours (13.5 = 1:30 PM).

export const PEOPLE = [
  { id: 'you',    name: 'You',          role: 'Product Manager',     color: '#1a73e8' },
  { id: 'priya',  name: 'Priya Shah',   role: 'VP Product',          color: '#a142f4' },
  { id: 'marcus', name: 'Marcus Lee',   role: 'Eng Lead',            color: '#e8710a' },
  { id: 'lena',   name: 'Lena Ortiz',   role: 'Design Lead',         color: '#12b5cb' },
  { id: 'sam',    name: 'Sam Okafor',   role: 'Data Scientist',      color: '#1e8e3e' },
  { id: 'jordan', name: 'Jordan Kim',   role: 'Product Marketing',   color: '#d01884' },
  { id: 'aiko',   name: 'Aiko Tanaka',  role: 'Software Engineer',   color: '#f9ab00' },
  { id: 'diego',  name: 'Diego Ramos',  role: 'Software Engineer',   color: '#5f6368' },
  { id: 'nora',   name: 'Nora Weiss',   role: 'Engineering Manager', color: '#c5221f' },
];

const ENG = ['you', 'marcus', 'aiko', 'diego', 'lena', 'sam', 'jordan'];
const ev = (id, day, start, dur, title, attendees, extra = {}) => ({ id, day, start, dur, title, attendees, organizer: attendees[0], ...extra });

export const WEEK = [
  ...[0, 1, 2, 3, 4].map(d => ev('standup-' + d, d, 9.5, 0.25, 'Daily standup', ENG, { recurring: true })),
  ev('roadmap',  0, 11,   1,    'Q4 Roadmap Review',            ['you', 'priya', 'marcus', 'lena', 'sam', 'jordan']),
  ev('1on1',     0, 14,   0.5,  '1:1 Priya / You',              ['priya', 'you'], { recurring: true }),
  ev('crit',     0, 15.5, 1,    'Design critique',              ['lena', 'you', 'aiko', 'diego', 'jordan']),
  ev('hiring',   1, 10.5, 0.5,  'Hiring sync',                  ['nora', 'you', 'marcus']),
  ev('sync',     1, 13,   1,    'Weekly product sync',          ['you', 'priya', 'marcus', 'lena', 'sam', 'jordan', 'aiko', 'diego', 'nora'], { recurring: true }),
  ev('vendor',   1, 16,   0.5,  'Vendor demo: SearchCo',        ['marcus', 'you', 'diego']),
  ev('deepdive', 2, 11,   1.5,  'Search build vs. buy',         ['marcus', 'you', 'aiko', 'diego', 'sam']),
  ev('comms',    2, 14,   0.5,  'Launch comms',                 ['jordan', 'you']),
  ev('allhands', 2, 15.5, 1,    'All-hands prep',               ['priya', 'you', 'jordan', 'nora']),
  ev('sprint',   3, 11,   1,    'Sprint planning',              ['nora', 'you', 'marcus', 'aiko', 'diego', 'lena']),
  ev('metrics',  3, 14.5, 0.5,  'Metrics review',               ['sam', 'you', 'priya']),
  ev('syncsync', 3, 16.5, 0.5,  'Sync on the sync',             ['marcus', 'you', 'lena', 'jordan', 'aiko', 'diego']),
  ev('retro',    4, 11,   1,    'Sprint retro',                 ['nora', 'you', 'marcus', 'aiko', 'diego', 'lena']),
  ev('coffee',   4, 14,   0.5,  'Coffee chat',                  ['sam', 'you']),
];

// The meeting the anonymous value check runs on, and the votes it collects (deterministic for the demo)
export const VETO_EVENT = 'sync';
export const VOTE_OPTIONS = [
  { id: 'must',     label: 'I must attend',          color: '#1a73e8' },
  { id: 'delegate', label: 'Someone can represent me', color: '#12b5cb' },
  { id: 'notes',    label: 'Notes are enough',        color: '#f9ab00' },
  { id: 'cancel',   label: 'This should be cancelled', color: '#d93025' },
];
export const SAMPLE_VOTES = ['notes', 'must', 'notes', 'delegate', 'notes', 'cancel', 'notes', 'notes'];

export const SAMPLE_REASON_CHECK = {
  verdict: 'async',
  headline: 'This reads like a status update. A doc would do it.',
  why: 'The reason describes sharing progress, not making a decision together. Status travels well in writing; save the meeting for the open question.',
};

export const SAMPLE_ASYNC_DOC = {
  title: 'Weekly product sync — async update',
  sections: [
    { heading: 'What shipped', prompt: 'Two lines per team. Link the demo or the PR.' },
    { heading: 'What is blocked', prompt: 'Name the blocker and the one person who can unblock it.' },
    { heading: 'Decisions needed', prompt: 'If anything needs a live discussion, list it here — we will book 15 minutes with only the people involved.' },
    { heading: 'Metrics', prompt: 'Sam drops the weekly dashboard screenshot here by Tuesday noon.' },
  ],
  note: 'Comment by Wednesday 5 PM. Anything unresolved becomes a 15-minute call on Thursday.',
};

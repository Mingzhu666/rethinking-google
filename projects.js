// All projects in the series. To add one: append an object here and run `node tools/capture.mjs <id>`.

export const SITE = {
  title: 'Rethinking Google',
  lead: 'Product proposals for Google products, each built as a working demo with real APIs. Open one and click around — every demo also runs offline on sample data.',
  repo: 'https://github.com/Mingzhu666/rethinking-google',
};

export const GROUPS = [
  {
    id: 'proposals',
    title: 'Product proposals',
    lead: 'Each proposal names a problem in a Google product, reframes the metric it optimizes, and ships a prototype to prove it.',
  },
];

export const PROJECTS = [
  {
    id: 'youtube-unhooked',
    group: 'proposals',
    product: 'YouTube',
    productColor: '#ff0033',
    kind: 'Media',
    date: '2026-10',
    title: 'Unhooked',
    tagline: 'Optimize recommendations for regret, not watch time.',
    idea: 'Recommenders learn what you like. Unhooked also learns who you don\'t want to become — and lets the outside world and the past pick for you.',
    demo: 'youtube-unhooked/',
    tags: [
      'Anti-interest profile',
      'Blind box channel',
      'Time capsule',
      'Gemini API',
      'YouTube Data API',
      'Open-Meteo',
      'Wikimedia',
    ],
    problem: 'More than 70% of watch time on YouTube comes from recommendations (Neal Mohan, CES 2018). The algorithm is excellent at predicting what you will click, and never asks whether you will regret it.',
    shift: { from: 'maximize Σ watch_time(user, video)', to: 'minimize Σ regret(user, video)' },
    features: [
      {
        name: 'Anti-interest profile',
        text: 'Name the person you don\'t want to become ("someone led around by outrage"). Gemini blocks matching videos in the feed, explains why, and offers a better alternative. Import Google Takeout to see your own trap map and late-night spirals.',
      },
      {
        name: 'Blind box channel',
        text: 'Once a day, the outside world programs your feed: today\'s date, the weather where you are, a stranger\'s birthday, a random Wikipedia article. Every video says why you are seeing it today.',
      },
      {
        name: 'Time capsule',
        text: 'A separate entrance that only shows videos uploaded on this date one, three, five, or ten years ago. The interface ages with the era.',
      },
    ],
    metric: { from: 'Watch time', to: 'Worth-it rate', note: 'Sessions rated "worth it" / all sessions' },
    business: [
      'Regret compounds into uninstalls, screen-time limits and lost trust; worth-it rate tracks long-term retention.',
      'A natural YouTube Premium differentiator: advertisers buy attention, members pay for control over it.',
      'The EU DSA requires a non-profiling feed option; blind box and time capsule make compliance something people want to use.',
    ],
    tech: [
      'Gemini blocks feed items against a free-text profile, classifies real Takeout history, and curates the blind box.',
      'YouTube Data API v3 search with publishedAfter/Before powers the time capsule.',
      'Open-Meteo, reverse geocoding and Wikimedia REST provide the outside-world clues — no keys needed.',
      'Every call falls back live → cache → sample data, so the demo never breaks on stage.',
    ],
    limits: [
      'The YouTube API only exposes current view counts, so the time capsule sorts by all-time views, not popularity on that day.',
      'Regret predictions in the feed are illustrative; a real system would learn them from post-watch surveys.',
    ],
    shots: ['assets/youtube-unhooked/cover-1.jpg', 'assets/youtube-unhooked/cover-2.jpg'],
  },
  {
    id: 'meet-rehearsed',
    group: 'proposals',
    product: 'Google Meet',
    productColor: '#00ac47',
    kind: 'Productivity',
    date: '2026-10',
    title: 'Rehearsed',
    tagline: 'Move the post-mortem before the meeting.',
    idea: 'Most meeting failures are visible in the invite. Simulate the meeting before it happens, fix the agenda, rehearse the hard questions, then review yourself afterwards.',
    demo: 'meet-rehearsed/',
    tags: ['Meeting simulator', 'Risk radar', 'Rehearsal room', 'Meeting mirror', 'Gemini API', 'Web Speech API'],
    problem: 'Every AI meeting feature today — notes, summaries, action items, recaps — works after the call. By then the meeting has already failed: the decider left early, one person dominated, the decision slipped to "offline".',
    shift: { from: 'post-mortem: record what went wrong', to: 'pre-mortem: prevent it from going wrong' },
    features: [
      {
        name: 'Meeting flight simulator',
        text: 'From the agenda and guest list alone, a simulator plays the meeting forward: who dominates, which item overruns, whether the decision survives the decider\'s hard stop. One click applies fixes, drafts pre-meeting messages with Gemini, and replays it — risk drops from 76 to 10.',
      },
      {
        name: 'Rehearsal room',
        text: 'Gemini plays the toughest people in the room and asks the questions you are dreading. Answer out loud; get a score, the one fix that matters, and a stronger version of your answer.',
      },
      {
        name: 'Meeting mirror',
        text: 'A private game-film review of how you showed up: talk share, interruptions, filler words, key moments on a timeline, and exactly one thing to try next time — which feeds the next rehearsal.',
      },
    ],
    metric: {
      from: 'Minutes in meetings',
      to: 'Decision rate',
      note: 'Meetings that end with a recorded decision / all meetings',
    },
    business: [
      'Zoom and Teams are racing to the best recap; Meet can own the moment before the call.',
      'A Gemini for Workspace feature admins can measure in hours saved.',
      'Privacy by design: risks describe the agenda, not people; only you see your mirror.',
    ],
    tech: [
      'A deterministic simulation engine predicts durations, airtime and failure events, and generates rule-based agenda fixes.',
      'Gemini parses free-text agendas, predicts hard questions, coaches answers, drafts messages and scores transcripts.',
      'Web Speech API transcribes spoken answers in the browser.',
      'Local metrics render instantly; Gemini results fill in when they arrive, with live → cache → sample fallback.',
    ],
    limits: [
      'The simulator does not model dependencies between agenda items, so a fix can move a decision ahead of a sign-off it depends on.',
      'Meet\'s speaking-time data is only available to Workspace accounts, so the demo uses sample meetings and pasted transcripts.',
    ],
    shots: ['assets/meet-rehearsed/cover-1.jpg', 'assets/meet-rehearsed/cover-2.jpg'],
  },
];

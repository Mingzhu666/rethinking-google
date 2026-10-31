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
        shots: ['assets/youtube-unhooked/trap-map.jpg', 'assets/youtube-unhooked/report.jpg'],
      },
      {
        name: 'Blind box channel',
        text: 'Once a day, the outside world programs your feed: today\'s date, the weather where you are, a stranger\'s birthday, a random Wikipedia article. Every video says why you are seeing it today.',
        shots: ['assets/youtube-unhooked/blind-box.jpg'],
      },
      {
        name: 'Time capsule',
        text: 'A separate entrance that only shows videos uploaded on this date one, three, five, or ten years ago. The interface ages with the era.',
        shots: ['assets/youtube-unhooked/time-capsule.jpg'],
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
        shots: ['assets/meet-rehearsed/simulator-fixed.jpg'],
      },
      {
        name: 'Rehearsal room',
        text: 'Gemini plays the toughest people in the room and asks the questions you are dreading. Answer out loud; get a score, the one fix that matters, and a stronger version of your answer.',
        shots: ['assets/meet-rehearsed/rehearsal.jpg'],
      },
      {
        name: 'Meeting mirror',
        text: 'A private game-film review of how you showed up: talk share, interruptions, filler words, key moments on a timeline, and exactly one thing to try next time — which feeds the next rehearsal.',
        shots: ['assets/meet-rehearsed/mirror.jpg'],
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
  {
    id: 'calendar-priced',
    group: 'proposals',
    product: 'Google Calendar',
    productColor: '#4285f4',
    kind: 'Productivity',
    date: '2026-11',
    title: 'Priced',
    tagline: 'Every meeting shows what it really costs.',
    idea: 'A calendar invite is free to send and expensive to receive. Show the organizer the price — people time plus the focus time it shatters — and give guests an anonymous way to say "I don\'t need to be there."',
    demo: 'calendar-priced/',
    tags: ['True cost', 'Fragmentation cost', 'Reason threshold', 'Anonymous value check', 'Weekly receipt', 'Gemini API', '.ics import'],
    problem: 'Meetings are an externality: the person who sends the invite pays nothing, everyone who accepts it pays in hours. A 15-minute standup at 9:30 costs $149 of people time — and $829 of shattered mornings, because it cuts everyone\'s first two-hour focus block into pieces too short for deep work.',
    shift: { from: 'calendar.show(time)', to: 'calendar.show(time, cost, focus_lost)' },
    features: [
      {
        name: 'Price tags and true cost',
        text: 'One switch puts a price on every meeting: guests × duration × an admin-set hourly cost, plus a fragmentation cost for the 90-minute focus blocks it breaks. Open any meeting to see whose focus time it destroys, before and after. Drop an exported .ics to price your own last four weeks, in the browser.',
        shots: ['assets/calendar-priced/price-detail.jpg'],
      },
      {
        name: 'Reason threshold with a Gemini check',
        text: 'Creating an invite shows a live cost meter. Above $500 the organizer must write why it needs to be a meeting; Gemini reads the reason and suggests the cheapest format that still works — shorter, smaller, or a doc — with the saving for each.',
        shots: ['assets/calendar-priced/create.jpg'],
      },
      {
        name: 'Anonymous value check',
        text: 'Guests rate a recurring meeting privately: must attend, can delegate, notes are enough, should be cancelled. Results unlock only after three answers and show a distribution, never names. When most say notes are enough, Calendar suggests cancelling and Gemini drafts the async update.',
        shots: ['assets/calendar-priced/value-check.jpg'],
      },
      {
        name: 'Weekly receipt',
        text: 'Every Friday the team gets its meeting spend itemized like a till receipt — top meetings, the fragmentation surcharge, what value checks saved, and the focus hours left per person.',
        shots: ['assets/calendar-priced/receipt.jpg'],
      },
    ],
    metric: { from: 'Meetings scheduled', to: 'Focus hours protected', note: 'Deep-work hours per person per week, kept intact' },
    business: [
      'Meeting load is the top complaint in engagement surveys; admins who can show focus hours returned have a reason to stay on Workspace and buy Gemini for it.',
      'Builds on Time Insights, which already shows time in meetings — Priced adds what that time is worth.',
      'Privacy by design: costs use an org-average rate, never individual salaries; value checks are anonymous with a minimum of three answers.',
    ],
    tech: [
      'A deterministic cost model computes people cost and fragmentation from each attendee\'s free gaps (a gap counts as focus time at 90+ minutes).',
      'Gemini reviews the organizer\'s reason and drafts the async update that replaces a cancelled meeting.',
      'A small RFC 5545 parser reads exported .ics files in the browser, expanding daily and weekly recurrences.',
      'Calendar, value check and receipt share one state, so cancelling a meeting updates the week and the receipt live.',
    ],
    limits: [
      'Fragmentation only sees meetings on the calendar; real focus time also depends on travel, lunch and personal blocks.',
      'The .ics import expands daily and weekly recurrences only, and counts guests from the attendee list.',
    ],
    shots: ['assets/calendar-priced/cover-1.jpg', 'assets/calendar-priced/cover-2.jpg'],
  },
  {
    id: 'slides-flipped',
    group: 'proposals',
    product: 'Google Slides',
    productColor: '#f4b400',
    kind: 'Productivity',
    date: '2026-11',
    title: 'Flipped',
    tagline: 'The AI gives your talk. You find what it got wrong.',
    idea: 'Flip rehearsal: instead of the presenter speaking and the AI grading, the AI speaks and the presenter audits it. Every planted mistake you miss marks a slide you don\'t own — then replay your own run-through as the audience heard it.',
    demo: 'slides-flipped/',
    tags: ['Reverse rehearsal', 'Ownership map', 'Attention replay', 'Rehearsal plan', 'Gemini API', 'Web Speech API'],
    problem: 'Gemini can build a deck in a minute, but understanding it still takes the presenter. Rehearsal tools listen to you and grade pace and filler words; they never test whether you know what each slide is supposed to say, and their feedback is a score at the end rather than a moment you can go back to.',
    shift: { from: 'you speak → AI grades', to: 'AI speaks → you audit → the room replays' },
    features: [
      {
        name: 'Reverse rehearsal',
        text: 'Gemini presents the deck — read it or have it spoken aloud — with six problems hidden in the talk: a wrong number, a changed date, a skipped point, a line that sounds nothing like you. Flag sentences and skipped bullets, then reveal: each miss marks a slide you don\'t own yet.',
        shots: ['assets/slides-flipped/reverse.jpg'],
      },
      {
        name: 'Audience attention replay',
        text: 'Record a run-through in the browser and get a simulated attention curve: it decays with time, climbs at slide changes, stories and comparisons, and falls with rushed delivery, filler words and unexplained jargon. Drag the timeline like game film to see the slide, the words and the reason at every moment.',
        shots: ['assets/slides-flipped/attention.jpg'],
      },
      {
        name: 'Next rehearsal plan',
        text: 'The slides you didn\'t own and the moments the room drifted are usually the same slides. The plan ranks them, says why, and lists the slides you can stop rehearsing.',
        shots: ['assets/slides-flipped/plan.jpg'],
      },
    ],
    metric: { from: 'Decks created', to: 'Slides owned', note: 'Share of slides a presenter can defend before they present' },
    business: [
      'Generated decks create a new risk — presenters who don\'t understand their own slides. Flipped turns Gemini in Slides from a shortcut into a coach.',
      'A reason for sales, education and enablement teams to pay for Gemini in Workspace: measurable presenter readiness.',
      'Privacy by design: speech is transcribed in the browser, and the attention curve is a model of a room, not a recording of one.',
    ],
    tech: [
      'Gemini writes a fresh talk with six annotated planted problems; a validator falls back to the sample talk if the structure is wrong.',
      'Web Speech API synthesis reads the talk aloud with sentence highlighting; recognition captures the run-through, segmented by slide with the arrow key.',
      'An attention model samples every second from speech rate, filler words, jargon, stories and comparisons, then smooths the curve for an SVG timeline you can scrub.',
      'The plan combines ownership and attention per slide; Gemini writes the coach\'s note.',
    ],
    limits: [
      'The attention curve is a heuristic model, not measured audience data; it is a prompt for reflection rather than a prediction.',
      'Recording relies on the browser\'s speech recognition, which is Chrome-only and English-only in this demo.',
    ],
    shots: ['assets/slides-flipped/cover-1.jpg', 'assets/slides-flipped/cover-2.jpg'],
  },
];

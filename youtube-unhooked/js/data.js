// Sample data: trap categories, home feed, alternatives, and a fictional persona's watch history.

// Keywords cover English and Chinese titles, since real Takeout files can be either.
export const TRAPS = {
  rage:    { label: 'Someone led around by outrage',         short: 'Outrage',         color: '#ff2d3d',
             kw: ['destroyed', 'destroys', 'owned', 'rant', 'reacts to', ' vs ', 'debate', 'slams', 'stupid', 'idiot', 'meltdown on air', '怼', '吵', '蠢', '骂', '炸了', '打脸', '愤怒'] },
  fastsci: { label: 'Someone who thinks 3 minutes is enough',  short: 'Fast-food science', color: '#ff8a00',
             kw: ['explained in', 'in 60 seconds', 'in 1 minute', 'in 3 minutes', 'in 5 minutes', 'in 10 minutes', 'facts you', '分钟看懂', '分钟学会', '秒懂', '一口气'] },
  binge:   { label: 'Someone still scrolling at 2 AM',        short: 'Late-night binge', color: '#8a6bff',
             kw: ['compilation', 'best of', 'moments', 'ranked', 'entire season', '#shorts', 'top 50', 'top 100', '合集', '盘点', '名场面', '离谱瞬间'] },
  drama:   { label: 'Someone living on other people\'s gossip', short: 'Gossip',           color: '#ff4fa3',
             kw: ['exposed', 'exposes', 'drama', 'scandal', 'divorce', 'downfall', 'spill the tea', 'meltdown', '曝光', '内幕', '塌房', '离婚'] },
  envy:    { label: 'Someone anxious about other people\'s lives', short: 'Comparison',     color: '#e8b400',
             kw: ['day in the life', 'making $', 'retired at', 'penthouse', 'millionaire', 'luxury', 'already buying', '月入', '年薪', '财务自由', '豪宅'] },
  bait:    { label: 'Someone who falls for clickbait',        short: 'Clickbait',        color: '#00a9bd',
             kw: ["you won't believe", 'never watch', 'wait for it', '!!', '?!', 'gone wrong', 'shocking', 'insane', '绝对想不到', '居然', '竟然', '千万别'] },
};

const T = (title, channel, dur, views, trap, thumbText, hue, extra = {}) =>
  ({ id: Math.random().toString(36).slice(2), title, channel, duration: dur, views, trap, thumbText, hue, ...extra });

// The home feed: everything here is something the algorithm knows you'll click
export const FEED = [
  T('Quantum Physics Explained in 3 Minutes | You\'re Basically a Physicist Now', 'Knowledge Rush', '3:12', 4120000, 'fastsci', '3 min\nquantum', 24, { click: 91, regret: 68 }),
  T('He DESTROYED the Panel — and the Comments Went Nuclear', 'Hot Take Daily', '8:47', 8900000, 'rage', 'Totally\ndestroyed', 0, { click: 87, regret: 74, loud: true }),
  T('The Last Lighthouse Keeper', 'Slow Docs', '48:20', 630000, null, 'The last\nkeeper', 205),
  T('SHOCKING: This Family\'s Real Income, Finally Exposed…', 'Tea Time TV', '11:05', 12030000, 'drama', 'Income\nexposed', 330, { click: 84, regret: 71, loud: true }),
  T('Day in the Life of a 28-Year-Old Making $300K', 'Life of Leo', '14:32', 3560000, 'envy', '$300K\nat 28', 45, { click: 79, regret: 63 }),
  T('MIT 18.06 Linear Algebra, Lecture 1', 'MIT OpenCourseWare', '39:49', 10200000, null, '18.06\nLecture 1', 190),
  T('[Compilation] 100 Most Unhinged Moments to Watch at 2 AM', 'Unhinged Lab', '1:02:14', 23100000, 'binge', '100\nunhinged', 280, { click: 93, regret: 82, loud: true }),
  T('Building a Chair from Scratch: How Long Does It Really Take?', 'Wood & Time', '27:18', 880000, null, 'One\nchair', 32),
  T('Why Is the Other Side So Stupid?', 'Straight Talk', '12:40', 5400000, 'rage', 'So\nstupid?', 355, { click: 82, regret: 77 }),
  T('Learn Economics in 1 Minute | Never Get Scammed Again', 'Knowledge Rush', '1:04', 6700000, 'fastsci', 'Econ in\n60 sec', 140, { click: 76, regret: 59 }),
  T('Ryuichi Sakamoto — Opus (excerpt)', 'Ryuichi Sakamoto', '18:06', 4100000, null, 'Opus', 220),
  T('You Won\'t Believe What Happened at the End…', 'Daily Wow', '9:59', 15800000, 'bait', 'Wait\nfor it…', 60, { click: 88, regret: 80, loud: true }),
];

// What replaces a blocked video: the same curiosity, satisfied better
export const ALTS = {
  fastsci: T('Why Is Quantum Mechanics So Hard? A Physicist\'s Honest 40-Minute Answer', 'Physics, Plainly', '41:30', 1200000, null, 'An honest\n40 min', 170, { altWhy: 'Same curiosity — minus the illusion that you get it now' }),
  rage:    T('When Both Sides Have a Point: A Debate Without Shouting', 'Slow Conversations', '52:12', 450000, null, 'No\nshouting', 160, { altWhy: 'Same topic — the best version of the other side\'s argument' }),
  drama:   T('Ten Years of One Ordinary Family\'s Budget', 'Real Lives', '33:40', 2100000, null, 'Ten-year\nledger', 100, { altWhy: 'Someone else\'s life — told honestly and in full' }),
  envy:    T('28 and Slowing Down: A Day with a Furniture Maker', 'Wood & Time', '22:05', 770000, null, 'Slow\ndown', 80, { altWhy: 'Someone else\'s life — without making you feel behind' }),
  binge:   T('That\'s Enough for Tonight: 10 Minutes of Sleep Sounds', 'Sleep Room', '10:00', 9300000, null, 'Good\nnight', 250, { altWhy: 'It\'s past 1 AM. This one ends on its own.' }),
  bait:    T('What Makes a Great Story? Pixar\'s 22 Rules', 'Film Language', '24:48', 3300000, null, '22\nrules', 15, { altWhy: 'Want a surprise? This one actually delivers.' }),
};

// Sample videos for the blind box and time capsule
export function mockVideos(seedText, n = 4, opts = {}) {
  const pool = opts.pool || [
    ['City walk', 'Walking Alone'], ['Vinyl', 'Record Room'], ['Handmade', 'Maker\'s Diary'], ['Travel', 'Far Away'],
    ['Documentary', 'Slow Docs'], ['Live music', 'Live Session'], ['Lecture', 'Open Lecture'], ['Food', 'Corner Kitchen'],
  ];
  const r = rng(seedText);
  return Array.from({ length: n }, (_, i) => {
    const [kind, ch] = pool[Math.floor(r() * pool.length)];
    return {
      id: 'mock' + i + seedText.length,
      title: opts.titles?.[i] || `${kind} | ${seedText}`,
      channel: ch,
      duration: `${3 + Math.floor(r() * 40)}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
      views: Math.floor(r() * 3e6),
      thumbText: opts.thumbs?.[i] || kind,
      hue: Math.floor(r() * 360),
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(opts.queries?.[i] || seedText)}`,
      mock: true,
    };
  });
}

// Deterministic PRNG so sample data is identical every run
export function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 3432918353), h = (h << 13) | (h >>> 19);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// ---------- Fictional persona: Alex, 28, product manager — 8 weeks of history in Takeout format ----------
const PERSONA_TITLES = {
  rage:    ['Host gets DESTROYED live on air', 'Why the other side is so stupid — a rant', 'Comment section debate gets heated', 'Expert slams critic in brutal reply', 'He reacts to the worst take of the year'],
  fastsci: ['Relativity explained in 3 minutes', 'Economics in 1 minute', 'AI explained in 5 minutes', 'Quantum entanglement in 60 seconds', 'All of world history in 10 minutes'],
  binge:   ['[Compilation] 100 most unhinged moments', 'Top 50 scenes, ranked', 'The entire season in one video', 'Cats being weird #shorts', 'Best of 3 AM fails'],
  drama:   ['Celebrity downfall: the inside story exposed', 'Their divorce: the real truth', 'Ex-employee exposes the whole company', 'Influencer meltdown: full timeline'],
  envy:    ['Day in the life of a 28-year-old making $300K', 'I retired at 30. Here\'s how', 'My friends are already buying houses', 'A week in my $5M penthouse'],
  bait:    ['You won\'t believe what happened at the end', 'Never watch this at night', 'He actually did THIS!!', 'Wait for it… ?!'],
  deep:    ['The last lighthouse keeper (documentary)', 'MIT 18.06 Linear Algebra, Lecture 3', 'Ryuichi Sakamoto: Playing the Piano', 'Building a chair from scratch', 'A lecture on cognitive science', 'How cities grow (documentary)'],
};
const PERSONA_MIX = [['deep', 120], ['fastsci', 18], ['binge', 22], ['rage', 14], ['drama', 9], ['envy', 8], ['bait', 7]];

export function personaHistory() {
  const r = rng('alex-28-pm');
  const pick = list => list[Math.floor(r() * list.length)];
  const weighted = () => {
    let x = r() * PERSONA_MIX.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of PERSONA_MIX) { if ((x -= w) < 0) return k; }
    return 'deep';
  };
  const out = [];
  const now = new Date();
  for (let d = 0; d < 56; d++) {
    const day = new Date(now); day.setDate(now.getDate() - d);
    const sessions = 1 + Math.floor(r() * 3);
    for (let s = 0; s < sessions; s++) {
      const late = r() < 0.38; // late-night session
      const hour = late ? [23, 0, 1, 2][Math.floor(r() * 4)] : [8, 12, 13, 19, 20, 21, 22][Math.floor(r() * 7)];
      const len = late ? 4 + Math.floor(r() * 10) : 1 + Math.floor(r() * 6);
      let t = new Date(day); t.setHours(hour, Math.floor(r() * 60), 0, 0);
      for (let i = 0; i < len; i++) {
        const cat = late && r() < 0.4 ? pick(['binge', 'binge', 'rage', 'drama']) : weighted();
        out.push({ header: 'YouTube', title: 'Watched ' + pick(PERSONA_TITLES[cat]), time: t.toISOString() });
        t = new Date(t.getTime() + (4 + r() * 14) * 60000);
      }
    }
  }
  return out;
}

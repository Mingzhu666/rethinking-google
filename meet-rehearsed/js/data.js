// Sample meeting, its "what actually happened" transcript, and sample AI outputs used offline.

export const SAMPLE_MEETING = {
  title: 'Q4 Roadmap Review',
  when: 'Thursday · 10:00 – 10:45 AM',
  minutes: 45,
  goal: 'Agree on the top 3 priorities for Q4',
  people: [
    { id: 'you',    name: 'You',          role: 'PM · organizer',  talk: 0.45, color: '#1a73e8' },
    { id: 'priya',  name: 'Priya Shah',   role: 'VP Product',      talk: 0.5,  color: '#a142f4', decider: true, leavesAt: 30, rsvp: 'maybe', note: 'Hard stop at 10:30' },
    { id: 'marcus', name: 'Marcus Lee',   role: 'Eng Lead',        talk: 0.95, color: '#e8710a', note: 'Goes deep on edge cases' },
    { id: 'lena',   name: 'Lena Ortiz',   role: 'Design Lead',     talk: 0.45, color: '#12b5cb' },
    { id: 'sam',    name: 'Sam Okafor',   role: 'Data Scientist',  talk: 0.08, color: '#1e8e3e', note: 'Owns the metrics, rarely speaks up' },
    { id: 'jordan', name: 'Jordan Kim',   role: 'Product Marketing', talk: 0.35, color: '#d01884' },
  ],
  agenda: [
    { id: 'a1', title: 'Round-robin status updates', min: 10, kind: 'update',     owner: 'you' },
    { id: 'a2', title: 'Q3 metrics deep-dive',        min: 10, kind: 'discussion', owner: 'sam' },
    { id: 'a3', title: 'Search: build vs. buy',       min: 15, kind: 'debate',     owner: 'marcus' },
    { id: 'a4', title: 'Decide Q4 top 3 priorities',  min: 5,  kind: 'decision',   owner: 'you', needs: ['priya'] },
    { id: 'a5', title: 'Next steps',                  min: 5,  kind: 'wrap',       owner: 'you' },
  ],
};

export const SAMPLE_AGENDA_TEXT = `Launch go/no-go: Smart Compose for Sheets — 30 min
Attendees: You (PM, organizer), Dana (Director, final call, can only stay 15 min), Raj (Eng lead, very talkative), Mei (Legal, quiet), Tom (Support lead)

1. Launch readiness recap — 8 min
2. Open bugs and risk review — 10 min
3. Legal sign-off on data use — 5 min
4. Go / no-go decision (Dana) — 5 min
5. Comms plan — 2 min`;

// Questions the sample meeting will likely throw at you (offline fallback for Gemini)
export const SAMPLE_QUESTIONS = [
  { from: 'marcus', q: 'If we buy search instead of building it, who owns relevance tuning when it breaks at 2 AM?', why: 'Marcus goes deep on operational edge cases and owns on-call.' },
  { from: 'priya',  q: 'Which of these three priorities would you cut first if we lose two engineers in November?', why: 'Priya has to defend the plan upward and will test your trade-offs.' },
  { from: 'sam',    q: 'The Q3 retention lift was inside the noise band. Are we sure it justifies doubling down?', why: 'Sam owns the metrics and knows where the numbers are weak.' },
];

export const SAMPLE_DMS = {
  priya:  'Hi Priya — I know you have a hard stop at 10:30, so I moved the Q4 top-3 decision to the first 15 minutes. The one-page proposal is linked in the invite.',
  marcus: 'Hey Marcus — could you drop your build-vs-buy concerns in the doc before Thursday? I want to give the debate a hard 12 minutes so we still get to the decision.',
  sam:    'Hi Sam — would you open with the Q3 metrics? Your numbers should frame everything else, and I want the room to hear them first.',
};

export function sampleFeedback(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasNumber = /\d/.test(answer);
  const hedges = (answer.match(/\b(maybe|i think|kind of|sort of|probably|just)\b/gi) || []).length;
  let score = 6 + (hasNumber ? 1 : -1) + (words > 25 && words < 90 ? 1 : -1) - Math.min(2, hedges);
  score = Math.max(2, Math.min(9, score));
  return {
    score,
    worked: hasNumber ? 'You anchored the answer in a concrete number, which is what this asker trusts.' : 'You answered the question directly instead of deflecting.',
    fix: words > 90 ? 'Cut it in half. Lead with the decision, then one reason.' : hedges ? `Drop the hedges (${hedges} found) — they read as uncertainty to a skeptical room.` : 'Name the trade-off you are accepting, out loud.',
    stronger: 'Short answer: we keep ownership in-house. We buy the index, we own ranking, and on-call stays with search infra — I will put that in the RACI before Thursday.',
  };
}

// What actually happened when the meeting ran without fixes.
export const SAMPLE_TRANSCRIPT = `[00:00] You: Thanks everyone. Quick round-robin first, then metrics, the build versus buy debate, and we decide the top three at the end.
[00:01] Marcus: Before updates, I want to flag the search latency regression from last night, because it changes the whole build versus buy conversation.
[00:03] You: Okay, um, let's hold that for the debate section.
[00:03] Marcus: Sure, but basically the vendor benchmarks assume a warm cache, and our p95 is cold. So the comparison is, like, not apples to apples.
[00:06] Lena: Design update: the new onboarding flow is in usability testing, results next week.
[00:07] Jordan: Marketing has the launch brief drafted, waiting on the final scope.
[00:08] Marcus: And on eng, we also lost two days to the migration, which is why I keep saying the build path is riskier than it looks on paper.
[00:12] You: Okay, we're a bit over. Sam, do you want to walk through Q3?
[00:12] Sam: Sure. Retention went up 1.8 points, but the confidence interval overlaps zero for the second cohort.
[00:14] Marcus: Which is exactly why I don't trust the vendor's numbers either —
[00:14] You: — right, right, so I think, um, the takeaway is retention is basically trending up?
[00:15] Sam: Partly. It's trending up for new users.
[00:16] Priya: Can we get to build versus buy? I have a hard stop at 10:30.
[00:17] Marcus: So, three concerns. Latency, cost at scale, and who owns relevance tuning when it breaks.
[00:22] Lena: From design, buying gets us typo tolerance and facets for free, which users keep asking for.
[00:24] Marcus: Free until we need to customize ranking, which is every quarter.
[00:27] Jordan: Customers don't care how we build it, they care that it ships before the holidays.
[00:29] You: Okay, so, I think we should, maybe, lean towards buying, but let's sort of park it.
[00:30] Priya: I have to drop. Send me the proposal and I'll decide async.
[00:31] You: Sure. So for the top three, um, let's just capture candidates and finalize offline.
[00:38] Lena: My vote is onboarding, search, and the billing cleanup.
[00:41] Jordan: Agree on onboarding and search.
[00:44] You: Great, I'll send a summary and we'll close it out with Priya. Thanks all.
[00:47] Marcus: One more thing on the latency regression —`;

export const SAMPLE_MIRROR = {
  summary: 'You kept the meeting moving and stayed calm, but the room left without the decision it was booked for.',
  scores: { clarity: 5, brevity: 6, listening: 5, decisiveness: 3, inclusion: 6 },
  moments: [
    { t: 3,  kind: 'good',    note: 'You parked Marcus\'s latency tangent instead of letting it take over the updates.' },
    { t: 12, kind: 'good',    note: 'You handed the floor to Sam, the quietest person in the room.' },
    { t: 14, kind: 'improve', note: 'You cut Sam off to summarize, and the summary overstated the result.' },
    { t: 29, kind: 'improve', note: '"I think we should, maybe, lean towards…" — three hedges in one sentence right before the decider left.' },
    { t: 31, kind: 'improve', note: 'The decision was deferred to "offline". This was the one thing the meeting was for.' },
  ],
  oneThing: 'Put the decision in the first third of the meeting, while the decider is still in the room.',
};

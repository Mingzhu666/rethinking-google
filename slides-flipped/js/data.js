// Sample deck, the AI's "standard talk" with planted issues, and a sample rehearsal recording.

export const DECK = {
  title: 'Smart Compose for Sheets — launch review',
  slides: [
    { id: 's1', layout: 'title', title: 'Smart Compose for Sheets', subtitle: 'Launch review · asking for GA on Dec 2' },
    {
      id: 's2', layout: 'bullets', title: 'Formulas are where analysts get stuck',
      bullets: [
        { id: 's2b1', text: 'A third of spreadsheet time goes to writing formulas' },
        { id: 's2b2', text: 'Most errors come from lookups and date math' },
        { id: 's2b3', text: 'New hires take weeks to learn our sheet conventions' },
      ],
    },
    {
      id: 's3', layout: 'bullets', title: 'What we built',
      bullets: [
        { id: 's3b1', text: 'Formula suggestions as you type, from the sheet\'s own columns' },
        { id: 's3b2', text: 'Explains every suggestion in plain language' },
        { id: 's3b3', text: 'Works offline with an on-device model' },
      ],
    },
    {
      id: 's4', layout: 'stats', title: 'Beta results · 4,200 users, 6 weeks',
      stats: [
        { id: 's4a', value: '2.3×', label: 'faster formula entry' },
        { id: 's4b', value: '41%', label: 'of suggestions accepted' },
        { id: 's4c', value: '−38%', label: 'formula errors' },
      ],
    },
    {
      id: 's5', layout: 'bullets', title: 'Pricing and rollout',
      bullets: [
        { id: 's5b1', text: 'Included in Business Standard and above' },
        { id: 's5b2', text: '10% of eligible users on Nov 4' },
        { id: 's5b3', text: '100% on Dec 2, with a kill switch per domain' },
      ],
    },
    {
      id: 's6', layout: 'bullets', title: 'Risks and the ask',
      bullets: [
        { id: 's6b1', text: 'Risk: wrong suggestions in finance sheets — mitigated by explanations' },
        { id: 's6b2', text: 'Risk: on-device model size on older Chromebooks' },
        { id: 's6b3', text: 'Ask: approve general availability on Dec 2' },
      ],
    },
  ],
};

// The AI's talk. `issue` marks a planted problem the presenter should catch.
// wrong = contradicts the slide · voice = doesn't sound like the presenter · missing = skips a bullet (slide-level)
export const SAMPLE_TALK = {
  s1: { sentences: [
    { id: 't1a', text: 'Good morning. Today we are asking for one decision: general availability of Smart Compose for Sheets on December 2nd.' },
  ] },
  s2: { sentences: [
    { id: 't2a', text: 'Analysts spend about a third of their spreadsheet time writing formulas.' },
    { id: 't2b', text: 'Honestly, spreadsheets are a total nightmare and literally everyone hates them!', issue: { type: 'voice', note: 'Hype and absolutes. You would say "formulas are where people get stuck", not that everyone hates spreadsheets.' } },
    { id: 't2c', text: 'And new hires take weeks to learn how our sheets are put together.' },
  ], missing: { bullet: 's2b2', note: 'Skipped where the errors come from — lookups and date math — which is the setup for the −38% result later.' } },
  s3: { sentences: [
    { id: 't3a', text: 'Smart Compose suggests formulas as you type, using the column names already in your sheet.' },
    { id: 't3b', text: 'Every suggestion comes with a plain-language explanation, so you can check it before you accept it.' },
  ], missing: { bullet: 's3b3', note: 'Never mentioned offline support — the on-device model is also why the Chromebook risk exists on slide 6.' } },
  s4: { sentences: [
    { id: 't4a', text: 'In a six-week beta with 4,200 users, formula entry got 2.3 times faster.' },
    { id: 't4b', text: 'Over sixty percent of suggestions were accepted.', issue: { type: 'wrong', note: 'The slide says 41%. A skeptical exec will remember the number you said, not the one on the slide.' } },
    { id: 't4c', text: 'And formula errors dropped by thirty-eight percent.' },
  ] },
  s5: { sentences: [
    { id: 't5a', text: 'It is included for Business Standard customers and above, at no extra cost.' },
    { id: 't5b', text: 'We start with ten percent of eligible users on November 4th.' },
    { id: 't5c', text: 'Then we ramp to everyone by the middle of January.', issue: { type: 'wrong', note: 'The plan is 100% on December 2 — the very date you are asking approval for.' } },
  ] },
  s6: { sentences: [
    { id: 't6a', text: 'The main risk is wrong suggestions in finance sheets, which the explanations are designed to catch.' },
    { id: 't6b', text: 'Going forward, we will leverage cross-functional synergies to operationalize learnings at scale.', issue: { type: 'voice', note: 'Pure jargon. Name the actual risk instead: model size on older Chromebooks.' } },
    { id: 't6c', text: 'So we are asking you to approve general availability on December 2nd.' },
  ] },
};

// A run-through of the deck, as speech recognition would capture it (seconds from the start)
export const SAMPLE_REHEARSAL = [
  { slide: 's1', start: 0, end: 9, text: 'Hi everyone. Today I want one decision from you: approve Smart Compose for Sheets for everyone on December 2nd.' },
  { slide: 's2', start: 9, end: 32, text: 'Last week Maria on our finance team spent forty minutes on a single lookup formula. That is not unusual. Analysts spend about a third of their spreadsheet time writing formulas, and most of the errors we see come from lookups and date math. New hires take weeks just to learn how our sheets are put together.' },
  { slide: 's3', start: 32, end: 57, text: 'So what we built is, um, basically an LLM that suggests formulas as you type, with context from the sheet schema and, like, RAG over the formula docs. P95 latency is about 180 ms. Every suggestion has an explanation. And it works offline with an on-device model, so, um, yeah.' },
  { slide: 's4', start: 57, end: 75, text: 'Here is what happened in the beta. Four thousand two hundred people, six weeks. Formula entry got 2.3 times faster, which is Maria\'s forty minutes down to seventeen. Forty-one percent of suggestions were accepted, and formula errors dropped by thirty-eight percent.' },
  { slide: 's5', start: 75, end: 92, text: 'Pricing is included in Business Standard and above no extra cost rollout is ten percent of eligible users on November 4th then we watch the error dashboards and the support queue and the latency and then we go to one hundred percent on December 2nd with a kill switch per domain so any admin can turn it off.' },
  { slide: 's6', start: 92, end: 112, text: 'Two risks. Wrong suggestions in finance sheets, which the explanations are there to catch. And model size on older Chromebooks, where we fall back to the cloud model. So my ask is simple: approve general availability on December 2nd. What questions do you have?' },
];

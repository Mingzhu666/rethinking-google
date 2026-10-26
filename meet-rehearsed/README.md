# Meet, Rehearsed

**English** | [中文](README.zh-CN.md)

An interactive product proposal for Google Meet, built for live demos: move the post-mortem *before* the meeting.

| Chapter | Feature | How it works |
|---|---|---|
| 01 | Meeting flight simulator | A deterministic simulator plays the agenda forward (timeline, risk radar, failure events), suggests fixes, and re-runs. Gemini drafts pre-meeting Chat messages and parses pasted agendas. |
| 02 | Rehearsal room | Gemini predicts the three hardest questions and coaches your answer. Answer by typing or out loud (Web Speech API). |
| 03 | Meeting mirror | Local metrics (talk share, interruptions, filler words) plus a Gemini game-film review, ending in one goal for next time. |

## Run

From the repository root:

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173/meet-rehearsed/. Press `→` / space to advance, `←` to go back.

## Gemini key (optional)

Click **Data sources** in the top-right. The key is stored only in your browser and shared with the other demos served from the same address. Without a key, every module falls back to cached, then sample data.

Gemini free-tier latency varies (often 10–25 s). Before a live demo, click through once so responses are cached, then turn on **Safe demo mode**.

## Privacy

Risks describe the agenda, not people. Transcripts are analyzed in the browser; text is sent to Gemini only when a key is set.

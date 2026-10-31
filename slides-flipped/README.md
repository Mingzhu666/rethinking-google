# Flipped for Google Slides

**English** | [中文](README.zh-CN.md)

An interactive product proposal for Google Slides: the AI gives your talk, and you find what it got wrong.

| Chapter | Feature | How it works |
|---|---|---|
| 01 | Reverse rehearsal | Gemini presents the deck (text or spoken with the Web Speech API) with six planted problems. Flag wrong lines, lines unlike you, and skipped bullets; the reveal maps which slides you own. |
| 02 | Audience attention replay | Record a run-through in the browser or use the sample. A per-second attention model drives a scrubbable curve with drift, confusion and memorable moments. |
| 03 | Next rehearsal plan | Ranks slides by missed issues and attention dips; Gemini writes the coach's note. |

## Run

From the repository root:

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173/slides-flipped/. Press `→` / space to advance, `←` to go back. Recording needs Chrome.

## Gemini key (optional)

Click **Data sources** in the top-right. Without a key, the sample talk and sample coaching are used.

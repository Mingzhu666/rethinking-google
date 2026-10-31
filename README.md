# Rethinking Google

**English** | [中文](README.zh-CN.md)

A series of interactive product proposals for Google products, built as live, clickable demos.

| # | Product | Proposal | Demo |
|---|---|---|---|
| 01 | YouTube | **Unhooked** — optimize recommendations for regret, not watch time | [`youtube-unhooked/`](youtube-unhooked/) |
| 02 | Google Meet | **Rehearsed** — move the post-mortem before the meeting | [`meet-rehearsed/`](meet-rehearsed/) |
| 03 | Google Calendar | **Priced** — every meeting shows what it really costs | [`calendar-priced/`](calendar-priced/) |
| 04 | Google Slides | **Flipped** — the AI gives your talk, you find what it got wrong | [`slides-flipped/`](slides-flipped/) |
| 05 | Gmail | **Looped In** — when a scam reaches Mom, her daughter hears about the risk, never the email | [`gmail-looped-in/`](gmail-looped-in/) |

## Run locally

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173. Every demo works without keys (cached and sample data); add a Gemini or YouTube Data API key under **Data sources** in each demo for live data. Keys stay in your browser.

## Projects page

The root `index.html` is a projects summary, and `project.html?id=…` is each project's detail page. Both render from [`projects.js`](projects.js).

To add a project:

1. Build the demo in its own folder, e.g. `maps-xyz/`.
2. Add an entry to `PROJECTS` in `projects.js`.
3. Add its two cover shots to `SHOTS` in [`tools/capture.mjs`](tools/capture.mjs), serve the repo on :5173, then run:

```bash
cd tools && npm install && cd .. && node tools/capture.mjs maps-xyz
```

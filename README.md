# Rethinking Google

**English** | [中文](README.zh-CN.md)

A series of interactive product proposals for Google products, built as live, clickable demos.

| # | Product | Proposal | Demo |
|---|---|---|---|
| 01 | YouTube | **Unhooked** — optimize recommendations for regret, not watch time | [`youtube-unhooked/`](youtube-unhooked/) |
| 02 | Google Meet | **Rehearsed** — move the post-mortem before the meeting | [`meet-rehearsed/`](meet-rehearsed/) |

## Run locally

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173. Every demo works without keys (cached and sample data); add a Gemini or YouTube Data API key under **Data sources** in each demo for live data. Keys stay in your browser.

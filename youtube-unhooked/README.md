# YouTube Unhooked

**English** | [中文](README.zh-CN.md)

An interactive product proposal built for live demos: change YouTube's recommendation objective from *maximize watch time* to *minimize regret*.

| Chapter | Feature | Data |
|---|---|---|
| 01 | Anti-interest profile + trap map + weekly report | Gemini API (custom profiles, classifying real Takeout history), in-browser analysis |
| 02 | Blind box channel | Open-Meteo weather, Wikipedia random article / on this day, Gemini curation, YouTube search |
| 03 | Time capsule | YouTube Data API (`publishedAfter/Before`), Wikipedia on this day |

## Run

From the repository root:

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173/youtube-unhooked/. While presenting, press `→` / space to advance one screen and `←` to go back.

## API keys (optional)

Click **Data sources** in the top-right. Keys are stored only in your browser:

- **YouTube Data API v3**: Google Cloud Console → enable YouTube Data API v3 → Credentials → Create API key
- **Gemini API**: https://aistudio.google.com/apikey

Without keys, every module falls back automatically: live → cache → sample data. The badge in each window (Live / Cached / Sample) shows the current source.

Before a live demo, click through everything once so the results are cached, then turn on **Safe demo mode** — the full demo will play even with no network.

## Privacy

Google Takeout watch history is parsed locally in the browser and never uploaded. Video titles are sent to Gemini for classification only when a Gemini key is set.

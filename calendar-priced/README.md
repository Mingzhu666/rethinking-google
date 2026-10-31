# Priced for Google Calendar

**English** | [中文](README.zh-CN.md)

An interactive product proposal for Google Calendar: every meeting shows what it really costs.

| Chapter | Feature | How it works |
|---|---|---|
| 01 | Price tags and true cost | Guests × duration × an org-average rate, plus a fragmentation cost for the 90-minute focus blocks a meeting breaks. Live cost meter and a required reason above a threshold, checked by Gemini. Import an `.ics` to price your own calendar. |
| 02 | Anonymous value check | Guests rate a meeting privately; results unlock after three answers and show only a distribution. Gemini drafts the async update when a meeting is cancelled. |
| 03 | Weekly receipt | The team's meeting spend, itemized, updating live. |

## Run

From the repository root:

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173/calendar-priced/. Press `→` / space to advance, `←` to go back.

## Gemini key (optional)

Click **Data sources** in the top-right. Without a key, the invite review and async update use sample responses.

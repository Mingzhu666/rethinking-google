# Looped In for Gmail

**English** | [中文](README.zh-CN.md)

An interactive product proposal for Gmail: when a scam reaches an older adult, the family member she chose hears about the risk — never the email.

| Chapter | Feature | How it works |
|---|---|---|
| 01 | Two-way consent | Mom picks a guardian, sees every alert they get, and can turn it off anytime. |
| 02 | Three layers, a pause, a heads-up | Rules → link reputation (Google Safe Browsing test pages) → Gemini intent, only for flagged mail. High risk notifies the guardian with a content-free sentence; clicking a risky link opens "Let's pause" with a one-tap call. |
| 03 | Conversation-level detection | A six-week thread scored by stage (trust, isolation, pitch, ask) crosses the guardian threshold before the money request. |

## Run

From the repository root:

```bash
npx -y http-server . -p 5173 -c-1
```

Open http://localhost:5173/gmail-looped-in/. Press `→` / space to advance, `←` to go back.

All emails are written for this demo. The only "unsafe" links are Google's Safe Browsing test pages. No paid APIs are used; a free Gemini key (optional) powers layer 3, otherwise sample results are shown.

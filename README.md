# 🗂️ dailytask-bot

> Personal productivity dashboard — tasks, jobs, email, AI, and a Telegram bot that keeps you on track.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Haiku_4.5-D4A017?style=flat-square&logo=anthropic&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=flat-square&logo=telegram&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ What it does

| Feature | Description |
|---|---|
| ✅ **Task Manager** | Daily / tomorrow task list with categories, priorities, subtasks |
| 💼 **Job Tracker** | Track applications: saved → applied → interview → offer |
| 📬 **Gmail Reader** | Unread inbox via IMAP, no browser needed |
| 📄 **CV Scanner** | Catalog local CV files by target company |
| 💾 **Backup Monitor** | Track when project folders were last backed up |
| 🤖 **AI Assistant** | Claude-powered chat to prioritize tasks and draft messages |
| 📲 **Telegram Bot** | Morning digest, evening preview, on-demand commands |
| ⏰ **Cron Reminders** | Per-task and per-job Telegram alerts at set times |

---

## 🖥️ Stack

```
Backend   →  Node.js + Express
Frontend  →  Vanilla JS + HTML/CSS  (single file, zero build step)
AI        →  Anthropic Claude (claude-haiku-4-5)
Email     →  ImapFlow  (Gmail IMAP)
Bot       →  node-telegram-bot-api
Storage   →  JSON files  (no database)
```

---

## 🚀 Quick Start

### 1 — Clone & install

```bash
git clone https://github.com/iacreatorcar/dailytask-bot.git
cd dailytask-bot
npm install
```

### 2 — Configure

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | [console.anthropic.com](https://console.anthropic.com) |
| `TELEGRAM_TOKEN` | ⚡ | Create bot via [@BotFather](https://t.me/BotFather) |
| `USER_NAME` | ⚡ | Your name for the morning greeting |
| `GMAIL_USER` | ⚡ | Gmail address |
| `GMAIL_APP_PASSWORD` | ⚡ | [App Password](https://myaccount.google.com/apppasswords) (not your login password) |
| `CV_PATH` | ➖ | Absolute path to folder with PDF/DOC CV files |
| `PORT` | ➖ | Default: `3000` |

### 3 — Init data files

```bash
cp data/tasks.example.json data/tasks.json
cp data/jobs.example.json data/jobs.json
cp data/config.example.json data/config.json
```

### 4 — Run

```bash
node server.js
# or
npm run dev   # auto-reload on change
```

Open → [http://localhost:3000](http://localhost:3000)

---

## 📲 Telegram Commands

Send `/start` to your bot to register your chat ID, then:

| Command | What you get |
|---|---|
| `/start` | Register + command list |
| `/oggi` | Today's pending tasks |
| `/domani` | Tomorrow's task list |
| `/digest` | Full morning summary |
| `/jobs` | Active job applications |
| `/gmail` | Latest unread emails |
| `/stats` | Task & job statistics |
| `/backup` | Backup status for all tracked folders |

---

## ⏰ Cron Schedule

| Time | Action |
|---|---|
| 🌅 Daily 08:00 | Morning digest → Telegram |
| 🌙 Daily 21:00 | Tomorrow's task preview |
| 🔔 Every minute | Per-task reminders (if `reminderTime` set) |
| 📅 Monday 09:00 | Alert for applications pending 3+ days |
| 💾 Sunday 10:00 | Alert for backups overdue 7+ days |

> All times use `Europe/Rome` timezone (edit in `server.js`).

---

## 🔌 REST API

```
GET    /api/tasks            List tasks
POST   /api/tasks            Create task
PUT    /api/tasks/:id        Update task
DELETE /api/tasks/:id        Delete task

GET    /api/jobs             List jobs
POST   /api/jobs             Create job
PUT    /api/jobs/:id         Update job
DELETE /api/jobs/:id         Delete job

GET    /api/stats            Task statistics
GET    /api/gmail            Unread Gmail (cached 5 min)
POST   /api/gmail/refresh    Force Gmail refresh
GET    /api/cv-scan          Scan CV folder
GET    /api/backup           List tracked backup folders
POST   /api/backup/mark      Mark folder as backed up
POST   /api/ai               Claude AI proxy
```

---

## 📁 Project Structure

```
dailytask-bot/
├── server.js               # Express server + Telegram bot + cron jobs
├── public/
│   └── index.html          # Full frontend (single file)
├── data/
│   ├── tasks.json          # Task storage (git-ignored)
│   ├── jobs.json           # Job storage (git-ignored)
│   ├── config.json         # App config (git-ignored)
│   ├── tasks.example.json  # Demo data
│   ├── jobs.example.json   # Demo data
│   └── config.example.json # Demo config
├── .env.example            # Environment template
└── docs/
    └── panoramica.html     # Project overview doc
```

---

## 📜 License

[MIT](LICENSE) — free to use, modify, and share.

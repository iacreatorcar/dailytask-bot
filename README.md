# dailytask-bot

A personal productivity dashboard with AI assistant, Telegram bot, and email integration.

## Features

- **Task Manager** — daily/tomorrow task list with categories, priorities, and subtasks
- **Job Tracker** — track job applications through the hiring pipeline (saved → applied → interview → offer)
- **Gmail Integration** — view unread emails via IMAP directly from the dashboard
- **CV Scanner** — scan a local folder and catalog your CV files by company/target
- **Backup Tracker** — monitor which project folders have been backed up and when
- **AI Assistant** — Claude-powered chat to help prioritize tasks and draft messages
- **Telegram Bot** — morning digest at 8am, evening preview at 9pm, and on-demand commands
- **Cron Reminders** — per-task and per-job time-based Telegram alerts

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JS + HTML/CSS (single file, no build step)
- **AI**: Anthropic Claude (`claude-haiku-4-5`) via REST proxy
- **Email**: ImapFlow (Gmail IMAP)
- **Bot**: node-telegram-bot-api
- **Storage**: JSON files (no database required)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/yourusername/dailytask-bot.git
cd dailytask-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your own values:

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Get at [console.anthropic.com](https://console.anthropic.com) |
| `TELEGRAM_TOKEN` | No | Create a bot via [@BotFather](https://t.me/BotFather) |
| `USER_NAME` | No | Your name for the morning digest greeting |
| `GMAIL_USER` | No | Gmail address |
| `GMAIL_APP_PASSWORD` | No | Gmail App Password (not your regular password) |
| `CV_PATH` | No | Absolute path to a folder with PDF/DOC CV files |
| `PORT` | No | Default: `3000` |

### 3. Initialize data files

```bash
cp data/tasks.example.json data/tasks.json
cp data/jobs.example.json data/jobs.json
cp data/config.example.json data/config.json
```

### 4. Run

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000)

## Telegram Bot Commands

After starting the server, open Telegram and send `/start` to your bot.

| Command | Description |
|---|---|
| `/start` | Register your chat ID for notifications |
| `/oggi` | Today's pending tasks |
| `/domani` | Tomorrow's task list |
| `/digest` | Full morning summary |
| `/jobs` | Active job applications |
| `/gmail` | Latest unread emails |
| `/stats` | Task and job statistics |
| `/backup` | Backup status for tracked folders |

## Cron Schedule

| Time | Action |
|---|---|
| Daily 08:00 | Morning digest sent to Telegram |
| Daily 21:00 | Tomorrow's task preview |
| Every minute | Per-task reminders (if `reminderTime` is set) |
| Monday 09:00 | Alert for job applications pending 3+ days |
| Sunday 10:00 | Alert for overdue backups (7+ days) |

All times use `Europe/Rome` timezone by default (configurable in `server.js`).

## API Endpoints

```
GET    /api/tasks          List all tasks
POST   /api/tasks          Create task
PUT    /api/tasks/:id      Update task
DELETE /api/tasks/:id      Delete task

GET    /api/jobs           List all jobs
POST   /api/jobs           Create job
PUT    /api/jobs/:id       Update job
DELETE /api/jobs/:id       Delete job

GET    /api/stats          Task statistics
GET    /api/gmail          Unread Gmail (cached 5min)
POST   /api/gmail/refresh  Force Gmail refresh
GET    /api/cv-scan        Scan CV folder
GET    /api/backup         List tracked backup folders
POST   /api/backup/mark    Mark folder as backed up
POST   /api/ai             Claude AI proxy
```

## License

MIT

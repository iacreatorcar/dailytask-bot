require('dotenv').config();
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const cron    = require('node-cron');

const app  = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data', 'tasks.json');
const JOBS = path.join(__dirname, 'data', 'jobs.json');
const CFG  = path.join(__dirname, 'data', 'config.json');
const OTOK = path.join(__dirname, 'data', 'outlook-token.json');

app.use(express.json());
app.use(express.static('public'));

const readJSON  = (f, def) => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return def; } };
const writeJSON = (f, d)   => { fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,JSON.stringify(d,null,2)); };

// ── Tasks API ─────────────────────────────────────────────────────────────────
app.get('/api/tasks', (_, res) => res.json(readJSON(DATA, { tasks:[] })));
app.post('/api/tasks', (req, res) => {
  const d = readJSON(DATA, { tasks:[] });
  const t = { id: Date.now().toString(), done:false, subtasks:[], notes:'', createdAt: new Date().toISOString(), ...req.body };
  d.tasks.push(t); writeJSON(DATA, d); res.json(t);
});
app.put('/api/tasks/:id', (req, res) => {
  const d = readJSON(DATA, { tasks:[] });
  const i = d.tasks.findIndex(t => t.id === req.params.id);
  if (i===-1) return res.status(404).json({ error:'Not found' });
  d.tasks[i] = { ...d.tasks[i], ...req.body, updatedAt: new Date().toISOString() };
  writeJSON(DATA, d); res.json(d.tasks[i]);
});
app.delete('/api/tasks/:id', (req, res) => {
  const d = readJSON(DATA, { tasks:[] });
  d.tasks = d.tasks.filter(t => t.id !== req.params.id);
  writeJSON(DATA, d); res.json({ ok:true });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', (_, res) => {
  const { tasks } = readJSON(DATA, { tasks:[] });
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
  const cats = ['projects','cv','clients','email','social','accounts','other'];
  const byCategory = {};
  cats.forEach(c => { byCategory[c] = { total: tasks.filter(t=>t.category===c).length, done: tasks.filter(t=>t.category===c&&t.done).length }; });
  res.json({
    total: tasks.length, done: tasks.filter(t=>t.done).length, pending: tasks.filter(t=>!t.done).length,
    today: { total: tasks.filter(t=>t.day==='today').length, done: tasks.filter(t=>t.day==='today'&&t.done).length },
    tomorrow: tasks.filter(t=>t.day==='tomorrow'&&!t.done).length,
    weekDone: tasks.filter(t=>t.done&&new Date(t.updatedAt||t.createdAt)>weekAgo).length,
    byCategory
  });
});

// ── CV Scanner ────────────────────────────────────────────────────────────────
app.get('/api/cv-scan', (_, res) => {
  const cvPath = process.env.CV_PATH || path.join(os.homedir(),'Desktop','cv');
  if (!fs.existsSync(cvPath)) return res.status(404).json({ error:`Cartella non trovata: ${cvPath}`, tip:'Aggiungi CV_PATH nel .env' });
  try {
    const files = fs.readdirSync(cvPath).filter(f => /\.(pdf|doc|docx)$/i.test(f));
    const skip  = new Set(['cv','curriculum','vitae','resume','carmine','dalise','2024','2025','2026','it','en','new','old']);
    const catalog = {};
    files.forEach(f => {
      const base  = f.replace(/\.(pdf|doc|docx)$/i,'');
      const parts = base.split(/[\s_\-\.]+/).filter(p=>p.length>1&&!skip.has(p.toLowerCase())&&isNaN(p));
      const co    = parts[0] ? parts[0].charAt(0).toUpperCase()+parts[0].slice(1) : 'Altro';
      if (!catalog[co]) catalog[co]=[];
      catalog[co].push(f);
    });
    res.json({ catalog, path: cvPath, total: files.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Backup Tracker ────────────────────────────────────────────────────────────
app.get('/api/backup', (_, res) => res.json({ backups: readJSON(CFG,{}).backups||[] }));
app.post('/api/backup/mark', (req, res) => {
  const cfg = readJSON(CFG,{}); if (!cfg.backups) cfg.backups=[];
  const { folder } = req.body;
  const i = cfg.backups.findIndex(b=>b.folder===folder);
  const e = { folder, lastBackup: new Date().toISOString() };
  if (i>=0) cfg.backups[i]=e; else cfg.backups.push(e);
  writeJSON(CFG,cfg); res.json({ ok:true, entry:e });
});
app.post('/api/backup/folders', (req, res) => {
  const cfg = readJSON(CFG,{}); if (!cfg.backups) cfg.backups=[];
  if (!cfg.backups.find(b=>b.folder===req.body.folder)) cfg.backups.push({ folder:req.body.folder, lastBackup:null });
  writeJSON(CFG,cfg); res.json({ ok:true });
});
app.delete('/api/backup/:folder', (req, res) => {
  const cfg = readJSON(CFG,{});
  cfg.backups = (cfg.backups||[]).filter(b=>b.folder!==decodeURIComponent(req.params.folder));
  writeJSON(CFG,cfg); res.json({ ok:true });
});

// ── LinkedIn Jobs ─────────────────────────────────────────────────────────────
app.get('/api/jobs', (_, res) => res.json(readJSON(JOBS, { jobs:[] })));
app.post('/api/jobs', (req, res) => {
  const d = readJSON(JOBS, { jobs:[] });
  const j = { id: Date.now().toString(), status:'saved', notes:'', createdAt: new Date().toISOString(), ...req.body };
  d.jobs.push(j); writeJSON(JOBS, d); res.json(j);
});
app.put('/api/jobs/:id', (req, res) => {
  const d = readJSON(JOBS, { jobs:[] });
  const i = d.jobs.findIndex(j => j.id === req.params.id);
  if (i===-1) return res.status(404).json({ error:'Not found' });
  d.jobs[i] = { ...d.jobs[i], ...req.body, updatedAt: new Date().toISOString() };
  writeJSON(JOBS, d); res.json(d.jobs[i]);
});
app.delete('/api/jobs/:id', (req, res) => {
  const d = readJSON(JOBS, { jobs:[] });
  d.jobs = d.jobs.filter(j => j.id !== req.params.id);
  writeJSON(JOBS, d); res.json({ ok:true });
});

// ── Gmail IMAP ────────────────────────────────────────────────────────────────
let gCache = null, gCacheTime = 0;
const G_TTL = 5 * 60 * 1000;

async function fetchGmail(force = false) {
  if (!force && gCache && Date.now()-gCacheTime < G_TTL) return gCache;
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)
    throw new Error('GMAIL_USER e GMAIL_APP_PASSWORD non configurati nel .env');
  const { ImapFlow } = require('imapflow');
  const client = new ImapFlow({
    host:'imap.gmail.com', port:993, secure:true,
    auth:{ user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    logger: false
  });
  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  const emails = [];
  try {
    for await (const msg of client.fetch({ seen:false }, { envelope:true, uid:true })) {
      emails.push({
        uid:       msg.uid,
        from:      msg.envelope.from?.[0]?.name || msg.envelope.from?.[0]?.address || '—',
        fromEmail: msg.envelope.from?.[0]?.address || '',
        subject:   msg.envelope.subject || '(nessun oggetto)',
        date:      msg.envelope.date
      });
    }
  } finally { lock.release(); await client.logout(); }
  emails.reverse();
  gCache = { emails: emails.slice(0,30), total: emails.length, fetchedAt: new Date().toISOString() };
  gCacheTime = Date.now();
  return gCache;
}

app.get('/api/gmail',          async (_, res) => { try { res.json(await fetchGmail());      } catch(e) { res.status(500).json({ error: e.message }); } });
app.post('/api/gmail/refresh', async (_, res) => { try { res.json(await fetchGmail(true));  } catch(e) { res.status(500).json({ error: e.message }); } });

// ── Outlook — disabilitato ────────────────────────────────────────────────────
app.get('/api/outlook',          (_, res) => res.status(503).json({ error:'Outlook non configurato' }));
app.post('/api/outlook/refresh', (_, res) => res.status(503).json({ error:'Outlook non configurato' }));

// ── AI proxy ──────────────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const msg = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 1024,
      messages: [{ role:'user', content: req.body.prompt }]
    });
    res.json({ text: msg.content[0].text });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Telegram Bot ──────────────────────────────────────────────────────────────
let bot = null;
if (process.env.TELEGRAM_TOKEN) {
  try {
    const TelegramBot = require('node-telegram-bot-api');
    bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling:true });
    console.log('🤖 Telegram bot attivo');

    const getList = day => readJSON(DATA,{tasks:[]}).tasks.filter(t=>t.day===day&&!t.done);
    const fmtList = (list,label) => !list.length ? `${label}: nessun task 🎉`
      : `${label} — ${list.length} task:\n\n${list.map(t=>`⬜ ${t.title}`).join('\n')}`;

    const sendDigest = async chatId => {
      const { tasks } = readJSON(DATA,{tasks:[]});
      const today   = tasks.filter(t=>t.day==='today');
      const done    = today.filter(t=>t.done).length;
      const pending = today.filter(t=>!t.done);
      const tmrw    = tasks.filter(t=>t.day==='tomorrow'&&!t.done).length;
      const userName = process.env.USER_NAME || 'there';
      let msg = `☀️ *Good morning, ${userName}!*\n📅 ${new Date().toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long'})}\n\n`;
      msg += `✅ Fatti ieri: ${done}\n⏳ Da fare oggi: ${pending.length}\n📅 In coda domani: ${tmrw}\n`;
      if (pending.length) {
        const grp = {};
        pending.forEach(t=>{ if(!grp[t.category])grp[t.category]=[]; grp[t.category].push(t); });
        msg += '\n*📋 Task di oggi:*\n';
        Object.entries(grp).forEach(([cat,ts]) => { msg += `\n*${cat}:*\n${ts.map(t=>`  • ${t.title}`).join('\n')}\n`; });
      }
      const { jobs } = readJSON(JOBS,{jobs:[]});
      const savedJobs = jobs.filter(j=>j.status==='saved');
      if (savedJobs.length) msg += `\n💼 *Candidature da inviare:* ${savedJobs.length}\n${savedJobs.slice(0,5).map(j=>`  • ${j.company} — ${j.position}`).join('\n')}`;
      if (process.env.GMAIL_USER) {
        try { const g=await fetchGmail(); if(g.total>0) msg+=`\n📬 *Gmail non lette:* ${g.total}`; } catch {}
      }
      if (process.env.OUTLOOK_CLIENT_ID) {
        try { const o=await fetchOutlook(); if(o.total>0) msg+=`\n📮 *Outlook non lette:* ${o.total}`; } catch {}
      }
      bot.sendMessage(chatId, msg, { parse_mode:'Markdown' });
    };

    bot.onText(/\/start/, msg => {
      const cfg = readJSON(CFG,{}); cfg.telegramChatId = msg.chat.id; writeJSON(CFG,cfg);
      bot.sendMessage(msg.chat.id,
        '✅ *AI Daily Planner connesso!*\n\nComandi:\n/oggi /domani /digest\n/jobs /gmail /outlook\n/stats /backup',
        { parse_mode:'Markdown' }
      );
    });
    bot.onText(/\/oggi/,   m => bot.sendMessage(m.chat.id, fmtList(getList('today'),   '☀️ *Oggi*'),   { parse_mode:'Markdown' }));
    bot.onText(/\/domani/, m => bot.sendMessage(m.chat.id, fmtList(getList('tomorrow'), '📅 *Domani*'), { parse_mode:'Markdown' }));
    bot.onText(/\/digest/, m => sendDigest(m.chat.id));

    bot.onText(/\/jobs/, m => {
      const { jobs } = readJSON(JOBS,{jobs:[]});
      if (!jobs.length) return bot.sendMessage(m.chat.id,'💼 Nessuna candidatura salvata.');
      const statusEmoji = { saved:'🔵', applied:'🟡', interview:'🟣', offer:'🟢', rejected:'🔴' };
      const lines = jobs.filter(j=>j.status!=='rejected').map(j=>`${statusEmoji[j.status]||'⚪'} *${j.company}* — ${j.position}`);
      bot.sendMessage(m.chat.id, `💼 *Candidature (${lines.length})*\n\n${lines.join('\n')}`, { parse_mode:'Markdown' });
    });

    bot.onText(/\/gmail/, async m => {
      try {
        const g = await fetchGmail(true);
        if (!g.total) return bot.sendMessage(m.chat.id,'📬 Gmail: nessuna email non letta!');
        const lines = g.emails.slice(0,8).map(e=>`• *${e.from}*\n  ${e.subject}`);
        bot.sendMessage(m.chat.id, `📬 *Gmail — ${g.total} non lette:*\n\n${lines.join('\n\n')}`, { parse_mode:'Markdown' });
      } catch(e) { bot.sendMessage(m.chat.id, `❌ Gmail: ${e.message}`); }
    });

    bot.onText(/\/outlook/, async m => {
      try {
        const o = await fetchOutlook(true);
        if (!o.total) return bot.sendMessage(m.chat.id,'📮 Outlook: nessuna email non letta!');
        const lines = o.emails.slice(0,8).map(e=>`• *${e.from}*\n  ${e.subject}`);
        bot.sendMessage(m.chat.id, `📮 *Outlook — ${o.total} non lette:*\n\n${lines.join('\n\n')}`, { parse_mode:'Markdown' });
      } catch(e) { bot.sendMessage(m.chat.id, `❌ Outlook: ${e.message}`); }
    });

    bot.onText(/\/stats/, m => {
      const { tasks } = readJSON(DATA,{tasks:[]});
      const { jobs }  = readJSON(JOBS,{jobs:[]});
      bot.sendMessage(m.chat.id,
        `📊 *Stats*\n\n✅ Task completati: ${tasks.filter(t=>t.done).length}\n⏳ Pendenti: ${tasks.filter(t=>!t.done).length}\n💼 Candidature attive: ${jobs.filter(j=>!['rejected'].includes(j.status)).length}`,
        { parse_mode:'Markdown' }
      );
    });

    bot.onText(/\/backup/, m => {
      const { backups=[] } = readJSON(CFG,{});
      if (!backups.length) return bot.sendMessage(m.chat.id,'💾 Nessuna cartella monitorata.');
      const lines = backups.map(b=>{
        const days = b.lastBackup ? Math.floor((Date.now()-new Date(b.lastBackup))/86400000) : null;
        const st   = days===null?'❌ Mai':days===0?'✅ Oggi':days<=7?`⚠️ ${days}gg fa`:`❌ ${days}gg fa`;
        return `${st} — ${path.basename(b.folder)}`;
      });
      bot.sendMessage(m.chat.id, `💾 *Backup:*\n\n${lines.join('\n')}`, { parse_mode:'Markdown' });
    });

    cron.schedule('0 8 * * *',  () => { const { telegramChatId } = readJSON(CFG,{}); if (telegramChatId) sendDigest(telegramChatId); }, { timezone:'Europe/Rome' });
    cron.schedule('0 21 * * *', () => {
      const { telegramChatId } = readJSON(CFG,{});
      if (!telegramChatId) return;
      const list = getList('tomorrow');
      if (list.length) bot.sendMessage(telegramChatId, `🌙 *Piano per domani* (${list.length} task)\n\n${list.map(t=>`• ${t.title}`).join('\n')}`, { parse_mode:'Markdown' });
    }, { timezone:'Europe/Rome' });

    cron.schedule('* * * * *', () => {
      const { telegramChatId } = readJSON(CFG,{});
      if (!telegramChatId) return;
      const hhmm = new Date().toTimeString().slice(0,5);
      readJSON(DATA,{tasks:[]}).tasks.filter(t=>!t.done&&t.reminderTime===hhmm).forEach(t => bot.sendMessage(telegramChatId, `⏰ *Task:* ${t.title}`, { parse_mode:'Markdown' }));
      readJSON(JOBS,{jobs:[]}).jobs.filter(j=>j.status!=='rejected'&&j.reminderTime===hhmm).forEach(j => bot.sendMessage(telegramChatId, `💼 *Candidatura:* ${j.company} — ${j.position}`, { parse_mode:'Markdown' }));
    }, { timezone:'Europe/Rome' });

    cron.schedule('0 10 * * 0', () => {
      const cfg = readJSON(CFG,{});
      if (!cfg.telegramChatId || !cfg.backups?.length) return;
      const old = cfg.backups.filter(b=>!b.lastBackup||(Date.now()-new Date(b.lastBackup))>7*86400000);
      if (old.length) bot.sendMessage(cfg.telegramChatId, `💾 *Backup in ritardo!*\n\n${old.map(b=>`• ${b.folder}`).join('\n')}\n\nFai il backup su TeraBox!`, { parse_mode:'Markdown' });
    }, { timezone:'Europe/Rome' });

    cron.schedule('0 9 * * 1', () => {
      const { telegramChatId } = readJSON(CFG,{});
      if (!telegramChatId) return;
      const stale = readJSON(JOBS,{jobs:[]}).jobs.filter(j=>j.status==='saved'&&Math.floor((Date.now()-new Date(j.createdAt))/86400000)>=3);
      if (stale.length) bot.sendMessage(telegramChatId, `💼 *${stale.length} candidature in attesa da 3+ giorni!*\n\n${stale.map(j=>`• ${j.company} — ${j.position}`).join('\n')}`, { parse_mode:'Markdown' });
    }, { timezone:'Europe/Rome' });

  } catch(e) { console.error('Telegram error:', e.message); }
} else {
  console.log('⚠️  TELEGRAM_TOKEN non impostato — bot disabilitato');
}

app.listen(PORT, () => console.log(`🚀 AI Daily Planner → http://localhost:${PORT}`));
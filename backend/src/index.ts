import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'node:crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Env
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const BOT_TOKEN = process.env.BOT_TOKEN as string;
const CHAT_ID = process.env.CHAT_ID as string;
const INVITE_SECRET = process.env.INVITE_SECRET || 'change_me';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Utils: Telegram notify
async function sendTelegramMessage(text: string) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
    });
  } catch (e) {
    console.error('Telegram send error', (e as any)?.response?.data || e);
  }
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Auth: register by invite token (creates owner user in users table)
app.post('/api/auth/register', async (req, res) => {
  const { inviteToken, email } = req.body as { inviteToken?: string; email?: string };
  if (!inviteToken) return res.status(400).json({ error: 'inviteToken required' });
  try {
    const payload = jwt.verify(inviteToken, INVITE_SECRET) as any;
    // Create user record with role 'owner'
    const { data, error } = await supabase.from('users').insert({ email, role: 'owner' }).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid invite token' });
  }
});

// Weeks — get all
app.get('/api/weeks', async (_req, res) => {
  const { data, error } = await supabase.from('weeks').select('*').order('id');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ weeks: data });
});

// Approve week
app.post('/api/weeks/:id/approve', async (req, res) => {
  const id = Number(req.params.id);
  const { data, error } = await supabase.from('weeks').update({ status: 'approved' }).eq('id', id).select('*').single();
  if (error) return res.status(400).json({ error: error.message });
  await sendTelegramMessage(`Руководитель согласовал план на неделю ${data?.title ?? id}`);
  res.json({ week: data });
});

// Create event
app.post('/api/events', async (req, res) => {
  const { day_id, type, author_id, content, file_urls } = req.body as any;
  if (!day_id || !type) return res.status(400).json({ error: 'day_id and type required' });
  const id = crypto.randomUUID();
  const { data, error } = await supabase
    .from('events')
    .insert({ id, day_id, type, author_id, content, file_urls })
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ event: data });
});

// Internal notify
app.post('/api/notify', async (req, res) => {
  const { message } = req.body as { message?: string };
  if (!message) return res.status(400).json({ error: 'message required' });
  await sendTelegramMessage(message);
  res.json({ ok: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
});

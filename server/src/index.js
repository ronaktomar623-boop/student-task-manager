import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './db.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This web origin is not allowed by the API.'));
  },
}));
app.use(express.json({ limit: '1mb' }));

const demoUserId = 1;
const priorities = new Set(['low', 'medium', 'high']);
const statuses = new Set(['pending', 'in_progress', 'completed']);

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: 'connected' }); }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }); }
});

app.get('/api/tasks', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const clauses = ['user_id = ?'];
    const params = [demoUserId];
    if (statuses.has(status)) { clauses.push('status = ?'); params.push(status); }
    if (typeof search === 'string' && search.trim()) {
      clauses.push('(title LIKE ? OR subject LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }
    const [rows] = await pool.execute(`SELECT id, title, description, subject, due_date, priority, status, created_at FROM tasks WHERE ${clauses.join(' AND ')} ORDER BY status = 'completed', due_date IS NULL, due_date ASC, created_at DESC`, params);
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title, description = '', subject = 'General', due_date = null, priority = 'medium' } = req.body;
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'A task title is required.' });
    if (!priorities.has(priority)) return res.status(400).json({ error: 'Priority must be low, medium, or high.' });
    const [result] = await pool.execute('INSERT INTO tasks (user_id, title, description, subject, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)', [demoUserId, title.trim(), String(description).trim(), String(subject).trim() || 'General', due_date || null, priority]);
    const [rows] = await pool.execute('SELECT id, title, description, subject, due_date, priority, status, created_at FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

app.patch('/api/tasks/:id', async (req, res, next) => {
  try {
    const fields = [];
    const values = [];
    for (const key of ['title', 'description', 'subject', 'due_date', 'priority', 'status']) {
      if (!(key in req.body)) continue;
      if (key === 'title' && (typeof req.body.title !== 'string' || !req.body.title.trim())) return res.status(400).json({ error: 'Task title cannot be empty.' });
      if (key === 'priority' && !priorities.has(req.body.priority)) return res.status(400).json({ error: 'Invalid priority.' });
      if (key === 'status' && !statuses.has(req.body.status)) return res.status(400).json({ error: 'Invalid status.' });
      fields.push(`${key} = ?`);
      values.push(key === 'title' ? req.body[key].trim() : req.body[key]);
    }
    if (!fields.length) return res.status(400).json({ error: 'No valid task fields were provided.' });
    values.push(req.params.id, demoUserId);
    const [result] = await pool.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    if (!result.affectedRows) return res.status(404).json({ error: 'Task not found.' });
    const [rows] = await pool.execute('SELECT id, title, description, subject, due_date, priority, status, created_at FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

app.delete('/api/tasks/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, demoUserId]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Task not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

app.post('/api/ai/breakdown', async (req, res, next) => {
  const { title, description = '' } = req.body;
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'A task title is required.' });
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ steps: [`Review the requirements for “${title.trim()}”.`, 'Gather your notes and materials.', 'Complete a focused first draft or working solution.', 'Review your work and submit it.'], source: 'demo' });
  }
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', temperature: 0.5, messages: [
        { role: 'system', content: 'Break a student assignment into exactly 4 short, practical steps. Return only a JSON array of strings.' },
        { role: 'user', content: `Task: ${title.trim()}\nDetails: ${String(description).slice(0, 1500)}` },
      ] }),
    });
    if (!response.ok) throw new Error('AI provider returned an error.');
    const body = await response.json();
    const steps = JSON.parse(body.choices?.[0]?.message?.content || '[]');
    if (!Array.isArray(steps) || !steps.length || steps.some((step) => typeof step !== 'string')) throw new Error('AI response was not a list of steps.');
    res.json({ steps: steps.slice(0, 6), source: 'ai' });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Check the server configuration and try again.' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`StudyFlow API listening on http://localhost:${port}`));

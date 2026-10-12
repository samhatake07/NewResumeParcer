import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// All API routes live under /api
app.use('/api', routes);

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Central error handler — service functions should `next(err)`.
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;

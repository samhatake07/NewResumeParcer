import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { config } from './config/index.js';

const app = express();

app.use(cors());
app.use(express.json());

// All API routes live under /api
app.use('/api', routes);

// Health/diagnostic check, mounted under /api on purpose.
//
// It must live under /api: the Vercel rewrites in vercel.json send /api/* to the
// backend service and *everything else* to the frontend, so a /health route
// would be answered by the frontend and never reach this code in production.
//
// This exists because a deploy that cannot connect is otherwise almost
// un-debuggable from the browser: the only symptom is "Database unavailable".
// It answers the actual question — "is this deployment configured?" — from the
// outside, and it is the first thing to open after a deploy.
//
// It reports only *presence* and a masked host. Never the password, the key, or
// the full URI: this route is public, and a credential in a JSON response is a
// credential handed to anyone who loads the URL.
app.get('/api/health', (_req, res) => {
  const uri = config.mongoUri || '';
  const host = uri.match(/@([^/?]+)/)?.[1] || null;

  res.json({
    ok: true,
    config: {
      mongoUriSet: Boolean(uri) && !uri.includes('localhost:27017'),
      mongoHost: host,
      mongoPlaceholdersLeft: /<[^>]+>/.test(uri),
      labdApiKeySet: Boolean(config.labdApiKey),
      labdApiUrl: config.labdApiUrl,
    },
  });
});

// Central error handler — service functions should `next(err)`.
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

export default app;

import 'dotenv/config';
import app from '../app.js';
import { connectDB } from '../config/db.js';

// Vercel's entry point for the backend project.
//
// On Vercel there is no long-running process to hold the "listen" call that
// server.js makes — the platform invokes a handler per request instead. So this
// file connects to MongoDB (reusing the cached connection where it can) and then
// hands the request to the same Express app you use locally.
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    return res.status(503).json({ error: 'Database unavailable' });
  }

  return app(req, res);
}

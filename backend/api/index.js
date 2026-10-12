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

    // `res` is Node's raw ServerResponse here, NOT an Express response — it only
    // becomes one inside app(req, res) below. So res.status(...).json(...) does
    // not exist yet at this point, and calling it throws a TypeError from inside
    // the error handler itself. Vercel turns that into a bare 500 with no reason
    // attached, which is exactly the message that cannot be debugged.
    // Write the raw response fields instead.
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Database unavailable',
        // The real reason — bad auth, IP not allowlisted, DNS — so a failed
        // deploy says *why* instead of just "500". Delete this line if you would
        // rather not return it publicly.
        detail: err.message,
      })
    );
    return;
  }

  return app(req, res);
}

import mongoose from 'mongoose';
import { config } from './index.js';

// One cached connection, reused across calls.
//
// Locally this is just "connect once at boot". On Vercel it matters more: each
// request may run in a fresh function instance, and if every request opened its
// own mongoose.connect() you would exhaust MongoDB's connection limit under
// load. Serverless instances are frozen between requests, not destroyed, so the
// cached connection survives and gets reused.
//
// What is cached here is the *promise*, not the resolved connection — and that
// distinction is the whole point. With `let connection` holding the resolved
// value, the variable stays undefined for the entire time the first connect is
// in flight, so every request that arrives during a cold start sees undefined,
// calls mongoose.connect() itself, and opens its own pool. The check only
// protects you once a connection already exists, which is exactly when you do
// not need protecting. Caching the promise means callers 2..N await the same
// in-flight connect instead of starting a new one.
let connectionPromise;

export async function connectDB() {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(config.mongoUri, {
    // Fail in seconds rather than hanging for the 30s default. A serverless
    // function that sits waiting on an unreachable database is billed for the
    // wait and then returns a bare timeout with no reason in it; failing fast
    // surfaces the actual error (bad credentials, IP not allowlisted, DNS).
    serverSelectionTimeoutMS: 10000,
  });

  try {
    const conn = await connectionPromise;
    console.log('[db] connected to MongoDB');
    return conn;
  } catch (err) {
    // Drop the rejected promise so the *next* request retries. A promise, once
    // rejected, stays rejected forever: without this line one bad connect
    // poisons the instance for its whole warm lifetime, and every later request
    // awaits the same failure and reports it as if it were happening now.
    connectionPromise = undefined;
    throw err;
  }
}

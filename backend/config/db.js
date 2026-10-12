import mongoose from 'mongoose';
import { config } from './index.js';

// One cached connection, reused across calls.
//
// Locally this is just "connect once at boot". On Vercel it matters more: each
// request may run in a fresh function instance, and if every request opened its
// own mongoose.connect() you would exhaust MongoDB's connection limit under
// load. Serverless instances are frozen between requests, not destroyed, so the
// cached connection survives and gets reused.
let connection;

export async function connectDB() {
  if (connection) return connection;

  connection = await mongoose.connect(config.mongoUri);
  console.log('[db] connected to MongoDB');
  return connection;
}

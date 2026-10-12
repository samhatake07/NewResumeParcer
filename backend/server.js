import 'dotenv/config';
import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const PORT = config.port || 5000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}

start();

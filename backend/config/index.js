// Central config, read from environment variables.
// See env.example for what to set.
export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/resume-parser',

  // labd's chat API. The key is server-side only — the browser never sees it.
  labdApiKey: process.env.LABD_API_KEY || '',
  labdApiUrl: process.env.LABD_API_URL || 'https://agent.thedevlabs.io',
};

// Central config, read from environment variables.
// See env.example for what to set.
//
// Loaded here as well as in server.js so this module works on its own (tests,
// scripts, the Vercel handler) and not only when something else loaded dotenv
// first. Importing it twice is harmless.
import 'dotenv/config';

// Each name is read under both spellings we have seen in the wild: the
// documented one from env.example, and the MONGODB_-prefixed alias. A name that
// does not match silently falls back to a default, which is how a perfectly good
// key ends up looking "not set" — the fallback hides the typo instead of
// reporting it.
const env = (name, ...aliases) =>
  [name, ...aliases].map((key) => process.env[key]).find((value) => value && value.trim()) || '';

// Atlas hands out a URI with a placeholder where the username and/or password
// go, and it is common to put those in their own variables so the password is
// not written twice. Fill the placeholders in here, and percent-encode while
// doing it: a literal '@' or '#' in a password otherwise silently corrupts the
// URI, because '@' is what separates the credentials from the host.
//
// The token is matched loosely — <username>, <db_username>, <user>, <password>,
// <db_password> are all spelling variants we have seen from Atlas and from
// hand-edited .env files. Matching only the one spelling in our docs is how the
// username silently stayed literal and every connection failed auth, so each
// side is replaced independently and only when we actually have a value.
function resolveMongoUri() {
  const template = env('MONGO_URI', 'MONGODB_URI');
  if (!template) return 'mongodb://localhost:27017/resume-parser';

  const user = env('MONGODB_USERNAME');
  const pass = env('MONGODB_PASSWORD');

  const filled = template
    .replace(/<[^>]*user[^>]*>/gi, user ? encodeURIComponent(user) : '$&')
    .replace(/<[^>]*(pass|pwd)[^>]*>/gi, pass ? encodeURIComponent(pass) : '$&');

  // Anything still in angle brackets is a placeholder we could not fill — say so
  // plainly, because the alternative is a confusing auth failure at connect time.
  const remaining = filled.match(/<[^>]+>/g);
  if (remaining) {
    console.warn(
      `[config] MONGODB_URI still contains the placeholder(s) ${remaining.join(', ')} ` +
        'and the matching variable(s) are not set — the connection will fail.'
    );
  }

  return filled;
}

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: resolveMongoUri(),

  // labd's chat API. The key is server-side only — the browser never sees it.
  labdApiKey: env('LABD_API_KEY', 'LABDAPI_KEY'),
  labdApiUrl: env('LABD_API_URL') || 'https://agent.thedevlabs.io',
};

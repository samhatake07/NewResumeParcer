import { config } from '../config/index.js';

// The only place the labd API key is used.
//
// Requests come here from our own controller, not from the browser: the key is
// read from the environment on the server, and a key shipped in the frontend
// bundle is a key anyone can read in devtools.
//
// One request = one answer. labd remembers nothing between requests, so a whole
// conversation has to be sent every time — here, a single user turn carrying
// both the instructions and the documents.
export async function askLabd(prompt) {
  if (!config.labdApiKey) {
    const err = new Error('LABD_API_KEY is not set on the server — add it to backend/.env');
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${config.labdApiUrl}/v1/api/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.labdApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });

  if (!res.ok) throw labdError(res.status);

  const { message, credits } = await res.json();

  return {
    content: message?.content ?? '',
    percentLeft: credits?.percentLeft,
  };
}

// The documented failure modes, in words the learner can act on.
function labdError(status) {
  const messages = {
    401: 'labd rejected the API key — check LABD_API_KEY',
    402: 'this key has spent its labd allowance for the month',
    403: 'the labd API is switched off for this account',
    429: 'labd is rate limiting — try again in a minute',
  };

  const err = new Error(messages[status] || `labd request failed (${status})`);

  // 402 and 429 are worth passing through so the caller can see why. A bad key
  // or a switched-off API is our misconfiguration, not the visitor's, so it
  // goes back as a 502 to keep that detail out of the browser's error message.
  err.status = status === 402 || status === 429 ? status : 502;
  return err;
}

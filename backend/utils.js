// The single source of truth for what the parser looks for.
// The frontend mock uses the same list — keep them in sync or share via a package.

export const SKILL_CHECKLIST = [
  'HTML & CSS',
  'JavaScript',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'TypeScript',
  'Git & GitHub',
  'REST APIs',
  'Testing (Jest)',
  'Docker',
  'CI/CD',
  'SQL',
  'Python',
  'Deployment (Vercel)',
];

// ---------------------------------------------------------------------------
// Comparison helpers.
//
// labd answers in prose that is *supposed* to contain a JSON object, and the
// numbers and arrays inside it are not guaranteed to have the shape we asked
// for. Everything below exists to turn that reply into something safe to store
// and render.
// ---------------------------------------------------------------------------

// Roughly 4 characters per token. These caps matter twice over: a long resume
// and a long posting both cost allowance, and a pasted 40-page document would
// otherwise be sent whole on every comparison.
export const MAX_RESUME_CHARS = 15000;
export const MAX_JD_CHARS = 8000;

export function clamp(text, max) {
  const value = String(text ?? '').trim();
  return value.length <= max ? value : `${value.slice(0, max)}\n\n[...truncated...]`;
}

// Pulls the JSON object out of the reply, tolerating ```json fences and any
// sentence the model wraps around it.
export function extractJson(reply) {
  const cleaned = String(reply ?? '').replace(/```json/gi, '```');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end <= start) {
    const err = new Error('labd did not answer with JSON');
    err.status = 502;
    throw err;
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    const err = new Error('labd answered with JSON that could not be parsed');
    err.status = 502;
    throw err;
  }
}

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

const stripBullet = (value) =>
  value.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();

// A list field comes back as a real array, or as one string, or as null — the
// model is not obliged to honour the shape we asked for. Anything other than an
// array used to collapse to [], which silently threw away a requirement the
// model *had* reported ("missing": "SQL" -> no missing skills shown at all).
// Splitting only on newlines and semicolons, never commas: "Testing (Jest, Mocha)"
// is one item, not two.
const asList = (value) => {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n;]+/)
      : [];

  return raw.map((item) => stripBullet(asText(item))).filter(Boolean);
};

// Coerces whatever came back into exactly the fields the model and the UI agree
// on, so a missing key becomes an empty list instead of a crash in the render.
export function normaliseComparison(raw) {
  const score = Number(raw?.score);

  return {
    jobTitle: asText(raw?.jobTitle).slice(0, 120),
    score: Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0,
    verdict: asText(raw?.verdict),
    matched: asList(raw?.matched),
    missing: asList(raw?.missing),
    strengths: asList(raw?.strengths),
    gaps: asList(raw?.gaps),
  };
}

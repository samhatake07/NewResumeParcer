import pdf from 'pdf-parse';
import { SKILL_CHECKLIST } from '../utils.js';

// Extracts the text from a PDF buffer and scores it against the fixed checklist.
//
// Two consumers now: POST /api/resume/upload still uses the deterministic
// checklist score below, while POST /api/resume/compare sends the raw text to
// labd instead — see services/comparisonService.js. The checklist kept its value
// as the free, instant, no-allowance baseline.
export async function parseResume(buffer) {
  const { text } = await pdf(buffer);
  const lower = text.toLowerCase();

  const present = SKILL_CHECKLIST.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
  const missing = SKILL_CHECKLIST.filter(
    (skill) => !lower.includes(skill.toLowerCase())
  );

  const score = Math.round((present.length / SKILL_CHECKLIST.length) * 100);

  // `text` is returned so the comparison step can hand the model the real
  // document. Callers that persist a result deliberately leave it off: the DB
  // gets the score, not the candidate's whole resume.
  return { text, textLength: text.length, score, present, missing };
}

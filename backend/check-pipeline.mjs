// Throwaway check for the compare path — run once with `node check-pipeline.mjs`
// from backend/, then delete. It proves a PDF buffer becomes text, that the text
// reaches the prompt, and that a messy labd-style reply normalises safely.
// Nothing here touches the network, the API key, or the database.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { parseResume } from './services/resumeService.js';
import { buildPrompt } from './services/comparisonService.js';
import { extractJson, normaliseComparison } from './utils.js';

// Minimal one-page text PDF, written by hand so the check needs no extra dependency.
const stream = 'BT /F1 12 Tf 72 720 Td (React Node.js MongoDB Docker SQL) Tj ET';
const objs = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offsets = [];
objs.forEach((o, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((o) => {
  pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

const samplePath = path.join(os.tmpdir(), 'sample-resume.pdf');
fs.writeFileSync(samplePath, pdf, 'latin1');

// Extraction only if the fixture is valid — a bad test PDF should not hide the
// results of the checks below it.
let resumeText = 'React, Node.js, MongoDB, Docker, SQL';
let textLength = resumeText.length;
try {
  const parsed = await parseResume(fs.readFileSync(samplePath));
  resumeText = parsed.text;
  textLength = parsed.textLength;
  console.log('extracted text  :', JSON.stringify(parsed.text));
  console.log('checklist score :', parsed.score, '| present:', parsed.present.join(', '));
} catch (e) {
  console.log('extraction      : fixture PDF rejected ->', e.message);
  console.log('extraction      : using sample text instead:', JSON.stringify(resumeText));
}
console.log('textLength      :', textLength);

const prompt = buildPrompt({
  resumeText,
  jobDescription: 'We need a React and Node engineer who knows Docker. Nice to have: SQL.',
});
console.log('prompt has resume:', prompt.includes('React, Node.js'));
console.log('prompt has the JD:', prompt.includes('Nice to have: SQL'));
console.log('prompt chars     :', prompt.length);

// The kind of reply labd actually sends: prose, a fence, a score as a string,
// a null in an array, and a string where a list was asked for.
const messy =
  'Sure! Here you go:\n```json\n' +
  '{"score":"78","jobTitle":"Frontend Engineer","verdict":"Good fit.",' +
  '"matched":["React",null,"Node"],"missing":"SQL","gaps":[]}\n```\nHope that helps.';
console.log('normalised       :', JSON.stringify(normaliseComparison(extractJson(messy))));

// A list field arriving as one string, and one arriving as bullets in a
// multi-line string, must both survive as arrays.
const asString =
  '{"score":50,"missing":"SQL","gaps":"- Add metrics\\n- Trim to one page\\n- Fix the typo"}';
console.log('string list      :', JSON.stringify(normaliseComparison(extractJson(asString)).missing));
console.log('bulleted list    :', JSON.stringify(normaliseComparison(extractJson(asString)).gaps));

// A score outside 0-100 and a non-numeric score are clamped, not trusted.
console.log('clamped score    :', normaliseComparison({ score: 240 }).score, normaliseComparison({ score: 'great' }).score);

try {
  extractJson('no json at all');
} catch (e) {
  console.log('non-JSON reply   : handled ->', e.message);
}

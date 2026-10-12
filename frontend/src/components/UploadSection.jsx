import { useState, useRef } from "react";
import { compareResumeFile } from "../lib/api";
import "./UploadSection.css";

const PARSE_STEPS = [
  "Reading your resume…",
  "Reading the job description…",
  "Checking requirements against your experience…",
  "Scoring the match…",
];

// Below this a job description is too short to score against — a title and
// nothing else produces a meaningless number. Kept in sync with the same check
// in backend/controllers/resumeController.js, so the button disables before the
// request can be rejected.
const MIN_JD_CHARS = 30;

export default function UploadSection() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [comparing, setComparing] = useState(false);
  const [parseStep, setParseStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const stepTimerRef = useRef(null);

  // Picking a file no longer starts any work. A comparison needs both halves, so
  // the file is just held here until the learner presses Compare.
  function handleFile(picked) {
    if (!picked || picked.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    setFile(picked);
    setResult(null);
    setError(null);
  }

  function handleCompare() {
    if (!file || jd.trim().length < MIN_JD_CHARS) return;

    setComparing(true);
    setResult(null);
    setError(null);
    setParseStep(0);

    // Cycle the status messages while the upload and the labd call run. The
    // model round trip takes seconds, so these are what stop the UI looking
    // frozen — decorative, not real progress reporting.
    let i = 0;
    stepTimerRef.current = setInterval(() => {
      i = (i + 1) % PARSE_STEPS.length;
      setParseStep(i);
    }, 900);

    compareResumeFile(file, jd.trim())
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => {
        clearInterval(stepTimerRef.current);
        setComparing(false);
      });
  }

  function reset() {
    setFile(null);
    setJd("");
    setResult(null);
    setComparing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <section id="upload" className="upload-section">
      <div className="container">
        <div
          className="dropzone"
          tabIndex={0}
          role="button"
          aria-label="Upload your resume PDF"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept="application/pdf"
            hidden
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {!file ? (
            <div className="dropzone-idle">
              <div className="dz-icon">📄</div>
              <p className="dz-title">Drop your resume here</p>
              <p className="dz-hint">or click to browse — PDF only</p>
            </div>
          ) : (
            <div className="dropzone-file">
              <div className="dz-icon">✅</div>
              <p className="dz-title">{file.name}</p>
              <p className="dz-hint">{(file.size / 1024).toFixed(0)} KB · PDF</p>
            </div>
          )}
        </div>

        <div className="panel jd-panel">
          <label className="jd-label" htmlFor="jd">
            The job you're applying to
          </label>
          <p className="jd-hint">
            Paste the whole posting — responsibilities and requirements included.
            The more of it we can read, the more specific the comparison.
          </p>
          <textarea
            id="jd"
            className="jd-input"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here…"
          />
          <div className="jd-actions">
            <span className="jd-count">
              {jd.trim().length} characters
              {jd.trim().length > 0 && jd.trim().length < MIN_JD_CHARS
                ? ` — at least ${MIN_JD_CHARS} needed`
                : ""}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={!file || jd.trim().length < MIN_JD_CHARS || comparing}
            >
              {comparing ? "Comparing…" : "Compare my resume"}
            </button>
          </div>
        </div>

        {comparing && (
          <div className="panel parsing">
            <div className="spinner" />
            <p>{PARSE_STEPS[parseStep]}</p>
          </div>
        )}

        {error && (
          <div className="panel parsing">
            <p>Couldn't compare that: {error}</p>
            <button className="btn btn-ghost" onClick={reset}>
              Try again
            </button>
          </div>
        )}

        {result && (
          <div className="results">
            <div className="score-card panel">
              <ScoreRing score={result.score} />
              <div className="score-copy">
                <h2>
                  {result.jobTitle ? `Match for ${result.jobTitle}` : "Your match score"}
                </h2>
                <p>{result.verdict}</p>
                <button className="btn btn-ghost" onClick={reset}>
                  Compare another resume
                </button>
              </div>
            </div>

            <div className="skills-grid">
              <div className="panel">
                <h3>
                  <span className="dot dot-good" /> The job asks for, you have{" "}
                  <span className="count">({result.matched.length})</span>
                </h3>
                <ul className="skill-list">
                  {result.matched.map((s) => (
                    <li key={s} className="present">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel">
                <h3>
                  <span className="dot dot-bad" /> The job asks for, you don't show{" "}
                  <span className="count">({result.missing.length})</span>
                </h3>
                <ul className="skill-list">
                  {result.missing.map((s) => (
                    <li key={s} className="missing">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="skills-grid">
              <div className="panel">
                <h3>What's working</h3>
                <ul className="notes-list">
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="panel">
                <h3>What to fix</h3>
                <ul className="notes-list">
                  {result.gaps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ScoreRing({ score }) {
  const RING_LENGTH = 2 * Math.PI * 52;

  return (
    <div className="score-ring">
      <svg viewBox="0 0 120 120">
        <circle className="ring-bg" cx="60" cy="60" r="52" />
        <circle
          className="ring-fill"
          cx="60"
          cy="60"
          r="52"
          style={{ strokeDashoffset: RING_LENGTH * (1 - score / 100) }}
        />
      </svg>
      <div className="score-number">
        <span>{score}</span>
        <small>/100</small>
      </div>
    </div>
  );
}

// Talks to the Express backend in ../backend.
//
// Requests are same-origin. Both services deploy as one Vercel project, and the
// top-level rewrite sends /api/* to the backend service, so the browser never
// needs the backend's hostname compiled into it. Locally the Vite dev server
// proxies /api to localhost:5000 (see vite.config.js), which keeps the very same
// paths working without a base URL.
//
// VITE_API_URL survives as an optional override for pointing at a *different*
// backend. Vite only exposes VITE_-prefixed vars to the browser bundle, and it
// substitutes them at build time, not at runtime.
const API_URL = import.meta.env.VITE_API_URL || "";

// Sends the PDF to POST /api/resume/upload as multipart/form-data.
//
// Note we do NOT set Content-Type by hand. The browser has to add it itself,
// because only it knows the multipart "boundary" string that separates the
// parts. Setting the header manually omits the boundary and the server's
// multipart parser rejects the request.
export async function parseResumeFile(file) {
  const formData = new FormData();
  formData.append("resume", file); // field name must match upload.single("resume")

  const res = await fetch(`${API_URL}/api/resume/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }

  return res.json();
}

// Sends the PDF *and* the job description to POST /api/resume/compare.
//
// The job description is a plain text field in the same multipart body as the
// file. Note which server this talks to: our Express app, never
// agent.thedevlabs.io directly. The labd API key lives in the backend's
// environment, and a key in a frontend bundle is public the moment it ships.
export async function compareResumeFile(file, jobDescription) {
  const formData = new FormData();
  formData.append("resume", file); // must match upload.single("resume")
  formData.append("jobDescription", jobDescription); // must match req.body.jobDescription

  const res = await fetch(`${API_URL}/api/resume/compare`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Include `detail` when the server sent one. Without it, a failed deploy
    // only ever shows "Database unavailable" — the actual reason (bad auth, IP
    // not allowlisted, no env vars set) is dropped right here, which is what
    // makes this class of bug take an afternoon instead of a minute.
    const reason = body.detail ? `: ${body.detail}` : "";
    throw new Error((body.error || `Comparison failed (${res.status})`) + reason);
  }

  return res.json();
}

// Kept: /api/resume/upload still works and still returns the free checklist
// score without touching the labd allowance.
export function feedbackFor(score) {
  if (score >= 80) return "Strong resume — you're ready to ship it. 🚀";
  if (score >= 60) return "Solid foundation. A couple of missing skills are worth adding.";
  if (score >= 40) return "Decent start, but the checklist shows clear gaps to fill.";
  return "Early days — work through the missing skills and resubmit.";
}

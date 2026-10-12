// Talks to the Express backend in ../backend.
//
// The base URL is configurable so the same build works locally and on Vercel:
// local dev points at localhost:5000, production points at the deployed API.
// Vite only exposes env vars prefixed with VITE_ to the browser bundle.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    throw new Error(body.error || `Comparison failed (${res.status})`);
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

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, BulletList } = require('docx');

const outDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const doc = new Document({
  sections: [{ children: [] }],
});

function addHeading(text, level = 1) {
  doc.addSection({ children: [new Paragraph({ text, heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 })] });
}

function addParagraph(text) {
  doc.addSection({ children: [new Paragraph(text)] });
}

function addBullets(items) {
  const paras = items.map(it => new Paragraph({ text: it, bullet: { level: 0 } }));
  doc.addSection({ children: paras });
}

// Report content
addHeading('Smart-Attendance Project Review', 1);
addParagraph('Date: March 14, 2026');
addParagraph('Scope: Full repository audit for production readiness; includes findings, prioritized fixes, suggested changes, and extra features.');

addHeading('Overall Rating', 2);
addParagraph('Functional prototype: 7/10. Production readiness: 4/10.');

addHeading('Critical Findings (must fix before production)', 2);
addBullets([
  'Secrets in repo: backend/.env contains MongoDB credentials and JWT secret — remove immediately and rotate.',
  'Hardcoded super-admin credentials in backend/server.js — remove and seed securely via env or migrations.',
  'Sensitive logs: backend/debug.log and console logs printing passwords or generated passwords — delete and stop logging secrets.',
  'JWT usage falls back to "secret" when JWT_SECRET missing — enforce presence and fail fast.',
  'Tokens in frontend are stored in localStorage; use secure httpOnly cookies or rotate refresh tokens.',
  'No rate limiting, helmet, or input sanitization — add standard security middleware.'
]);

addHeading('High Priority Improvements', 2);
addBullets([
  'Add security middleware: helmet, express-rate-limit, xss-clean, hpp.',
  'Centralized error handling middleware and structured logging (winston/pino).',
  'Server-side input validation: express-validator or Joi; sanitize inputs.',
  'Restrictive CORS configuration for production origin(s).',
  'Replace mock email console output with real email provider integration and remove plaintext password printing.'
]);

addHeading('Medium Priority Improvements', 2);
addBullets([
  'Add unit and integration tests for critical controllers and models.',
  'Add CI pipeline (GitHub Actions): lint, test, build, dependency audit.',
  'Add Dockerfile and docker-compose for reproducible deployments.',
  'Address npm audit vulnerabilities and keep dependencies up-to-date.'
]);

addHeading('Frontend Recommendations', 2);
addBullets([
  'Remove build artifacts from the repo (frontend/dist) and add to .gitignore.',
  'Implement auth guards, error boundaries, and better error messages.',
  'Prefer httpOnly cookies for tokens; implement refresh token flow.',
  'Add accessibility (a11y) checks and run a bundle analysis to reduce size.'
]);

addHeading('Operational / Observability', 2);
addBullets([
  'Add structured logging and log rotation; do not log secrets.',
  'Integrate Sentry (or similar) for error monitoring.',
  'Add basic metrics and health checks; create a DB backup strategy.'
]);

addHeading('Extra Features to Consider', 2);
addBullets([
  'Role-based dashboards with improved UX and reporting.',
  'Attendance analytics and export (CSV/PDF) for admins.',
  'SSO integration (OAuth/OIDC) for enterprise adoption.',
  'Mobile-friendly PWA frontend with offline support.',
  'Integrate QR code attendance with tamper protection (signed tokens).'
]);

addHeading('Quick Patches I Recommend Now', 2);
addBullets([
  'Remove `backend/.env` from git and add `.env.example`.',
  'Fail fast if `JWT_SECRET` not set in startup.',
  'Remove hardcoded super-admin password from `server.js` and read seed values from env.',
  'Install and configure `helmet` and a simple rate limiter in `server.js`.',
  'Delete `backend/debug.log` and add it to `.gitignore`.'
]);

addHeading('Implementation Plan (phased)', 2);
addBullets([
  'Phase 1 (1-2 days): Secrets removal, env enforcement, add helmet & rate limiter, stop logging secrets.',
  'Phase 2 (3-7 days): Add structured logging, input validation, replace mock email, set up CI and tests.',
  'Phase 3 (1-2 weeks): Dockerization, monitoring, metrics, refresh-token auth flow, frontend improvements.',
]);

addHeading('Next Steps', 2);
addBullets([
  'Which quick fixes do you want me to implement now? (I recommend Phase 1 items).',
  'If you want the DOCX regenerated with different wording or added screenshots, tell me specifics.'
]);

const filePath = path.join(outDir, 'Smart-Attendance-Review.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(filePath, buffer);
  console.log('DOCX written to', filePath);
}).catch(err => {
  console.error('Failed to write DOCX:', err);
  process.exit(1);
});

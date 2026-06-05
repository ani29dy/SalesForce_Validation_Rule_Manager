/**
 * Copies the Vite production build into backend/public for single-service hosting.
 * Used by Render build command: npm run build:render
 */
const fs = require('fs');
const path = require('path');

const frontendDist = path.join(__dirname, '../../frontend/dist');
const backendPublic = path.join(__dirname, '../public');

if (!fs.existsSync(frontendDist)) {
  console.error('Frontend build not found. Run: cd frontend && npm run build');
  process.exit(1);
}

if (fs.existsSync(backendPublic)) {
  fs.rmSync(backendPublic, { recursive: true, force: true });
}

fs.cpSync(frontendDist, backendPublic, { recursive: true });
console.log('Frontend copied to backend/public');

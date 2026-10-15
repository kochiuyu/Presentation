import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio container uses Nginx on 8080 proxying to 3000
const PORT = Number(process.env.DEFAULT_APP_PORT || process.env.APP_PORT) || 3000;
const distPath = path.join(__dirname, 'dist');

// Middleware to serve static files with cache headers
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1h',
    index: 'index.html'
  }));

  // Fallback for Single Page Application client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).send('Application is building. Please refresh in a moment.');
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Presentation Facilitator server running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown handling for Cloud Run containers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

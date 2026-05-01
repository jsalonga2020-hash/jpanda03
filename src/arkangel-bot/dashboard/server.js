import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function startDashboard(port = 3000) {
  const app = express();

  // Serve the dashboard HTML page
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  // API endpoint — returns live server data as JSON
  app.get('/api/status', (req, res) => {
    try {
      const data = JSON.parse(readFileSync(join(__dirname, '../data/servers.json'), 'utf-8'));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: 'Could not read server data.' });
    }
  });

  app.listen(port, () => {
    console.log(`📊 Dashboard running at http://localhost:${port}`);
  });
}

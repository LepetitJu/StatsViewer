import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Déclarer les dossiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/youtube', express.static(path.join(__dirname, 'youtube')));
app.use('/reddit', express.static(path.join(__dirname, 'reddit')));
app.use('/spotify', express.static(path.join(__dirname, 'spotify')));

// 2. Redirections vers les index.html respectifs
app.get('/youtube', (req, res) => {
  res.sendFile(path.join(__dirname, 'youtube', 'index.html'));
});

app.get('/reddit', (req, res) => {
  res.sendFile(path.join(__dirname, 'reddit', 'index.html'));
});

app.get('/spotify', (req, res) => {
  res.sendFile(path.join(__dirname, 'spotify', 'index.html'));
});

// 3. API YouTube
app.get('/api/youtube/search', async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Recherche manquante' });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur YouTube' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
  });
}

export default app;
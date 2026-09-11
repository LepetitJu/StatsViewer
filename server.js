import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Servir les fichiers statiques de chaque dossier
app.use(express.static(path.join(__dirname, 'public')));
app.use('/youtube', express.static(path.join(__dirname, 'youtube')));
app.use('/spotify', express.static(path.join(__dirname, 'spotify', 'public')));

// 2. Routes principales pour charger les pages index.html
app.get('/youtube', (req, res) => {
  res.sendFile(path.join(__dirname, 'youtube', 'index.html'));
});

app.get('/spotify', (req, res) => {
  res.sendFile(path.join(__dirname, 'spotify', 'public', 'index.html'));
});

// 3. API YouTube (charge la clé du .env)
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

app.listen(PORT, () => {
  console.log(`Serveur prêt sur http://localhost:${PORT}`);
});
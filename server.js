const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Pour charger les clés .env en local

const app = express();
app.use(cors());
app.use(express.json());

// Routes API Backend
app.get('/api/youtube', async (req, res) => {
  try {
    const { channel } = req.query;
    if (!channel) return res.status(400).json({ error: 'Nom de chaîne requis' });

    // Appel sécurisé à l'API YouTube avec votre clé API secrète
    const apiKey = process.env.YOUTUBE_API_KEY;
    // ... votre logique fetch/axios ici ...

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération YouTube' });
  }
});

app.get('/api/spotify', async (req, res) => {
  try {
    const apiKey = process.env.LASTFM_API_KEY; // Utilisation sécurisée côté backend
    // ... votre logique Last.fm ...
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ error: 'Erreur Spotify/Last.fm' });
  }
});

app.get('/api/reddit', async (req, res) => {
  try {
    // ... logique Reddit ...
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ error: 'Erreur Reddit' });
  }
});

// Lancement uniquement en mode développement local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur local lancé sur http://localhost:${PORT}`);
  });
}

// Export requis pour Vercel Serverless
module.exports = app;
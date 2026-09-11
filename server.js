const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- 1. API YouTube ---
app.get('/api/youtube', async (req, res) => {
  try {
    const { channel, handle } = req.query;
    const query = handle || channel;
    
    if (!query) {
      return res.status(400).json({ error: 'Nom ou identifiant de chaîne requis' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY; //[cite: 2]
    if (!apiKey) {
      return res.status(500).json({ error: 'Clé API YouTube non configurée dans .env' });
    }

    const cleanHandle = query.replace(/^@/, '');
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`; //[cite: 2]
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.items || data.items.length === 0) {
      return res.status(404).json({ error: 'Chaîne YouTube introuvable' });
    }

    const channelData = data.items[0];
    res.json({
      success: true,
      data: {
        title: channelData.snippet.title,
        avatar: channelData.snippet.thumbnails?.default?.url,
        subscribers: channelData.statistics.subscriberCount,
        views: channelData.statistics.viewCount,
        videoCount: channelData.statistics.videoCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération YouTube' });
  }
});

// --- 2. API Spotify / Last.fm ---
app.get('/api/spotify', async (req, res) => {
  try {
    const { artist, track } = req.query;
    
    if (!artist) {
      return res.status(400).json({ error: 'Nom d\'artiste requis' });
    }

    const apiKey = process.env.LASTFM_API_KEY; //[cite: 2]
    if (!apiKey) {
      return res.status(500).json({ error: 'Clé API Last.fm non configurée dans .env' });
    }

    let url = '';
    if (track) {
      url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
    } else {
      url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=${apiKey}&artist=${encodeURIComponent(artist)}&format=json`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(404).json({ error: data.message || 'Données introuvables sur Last.fm' });
    }

    if (track && data.track) {
      return res.json({
        success: true,
        data: {
          name: data.track.name,
          artist: data.track.artist.name,
          listeners: Number(data.track.listeners || 0),
          playcount: Number(data.track.playcount || 0),
          image: data.track.album?.image?.[3]?.['#text'] || '',
          url: data.track.url,
          tags: data.track.toptags?.tag?.map(t => t.name) || []
        }
      });
    }

    if (data.artist) {
      return res.json({
        success: true,
        data: {
          name: data.artist.name,
          listeners: Number(data.artist.stats?.listeners || 0),
          playcount: Number(data.artist.stats?.playcount || 0),
          bio: data.artist.bio?.summary || '',
          url: data.artist.url
        }
      });
    }

    res.status(404).json({ error: 'Aucun résultat trouvé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur Spotify/Last.fm' });
  }
});

// --- 3. API Reddit ---
app.get('/api/reddit', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ error: 'Nom d\'utilisateur Reddit requis' });
    }

    const cleanUsername = username.replace(/^u\//, '').trim(); //[cite: 3]
    const response = await fetch(`https://www.reddit.com/user/${encodeURIComponent(cleanUsername)}/about.json`, {
      headers: {
        'User-Agent': 'StatsViewerApp/1.0 (by /u/statsviewer_app)' // En-tête obligatoire pour éviter l'erreur 429
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Utilisateur Reddit introuvable ou privé' });
    }

    const data = await response.json();
    if (!data || !data.data) {
      return res.status(404).json({ error: 'Profil Reddit introuvable' });
    }

    const user = data.data;
    res.json({
      success: true,
      data: {
        username: user.name,
        totalKarma: user.total_karma,
        linkKarma: user.link_karma,
        commentKarma: user.comment_karma,
        avatar: user.icon_img ? user.icon_img.split('?')[0] : null,
        createdUtc: user.created_utc
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur Reddit' });
  }
});

// Lancement en mode développement local
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) { //[cite: 1]
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Serveur local lancé sur http://localhost:${PORT}`);
  });
}

module.exports = app; //[cite: 1]
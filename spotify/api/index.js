import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

// Supprime app.use(express.static('public')) car Vercel gère le dossier public automatiquement.

async function lastfm(params) {
  const u = new URL('https://ws.audioscrobbler.com/2.0/');
  u.searchParams.set('api_key', process.env.LASTFM_API_KEY || '');
  u.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  const text = await r.text();
  let d;
  try { d = JSON.parse(text) } catch { throw new Error('Last.fm a renvoyé une réponse invalide. Vérifie ta clé API.') }
  if (!r.ok || d.error) throw new Error(d.message || `Last.fm HTTP ${r.status}`);
  return d;
}

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ tracks: [] });
  try {
    const d = await lastfm({ method: 'track.search', track: q, limit: '10' });
    const tracks = (d.results?.trackmatches?.track || []).map(t => ({
      name: t.name,
      artist: t.artist,
      url: t.url,
      image: (t.image || []).find(x => x.size === 'large')?.['#text'] || '',
      listeners: Number(t.listeners || 0)
    }));
    res.json({ tracks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/track', async (req, res) => {
  const artist = String(req.query.artist || '').trim();
  const track = String(req.query.track || '').trim();
  if (!artist || !track) return res.status(400).json({ error: 'Artiste et titre requis.' });
  try {
    const d = await lastfm({ method: 'track.getInfo', artist, track, autocorrect: '1' });
    const t = d.track || {};
    res.json({
      name: t.name,
      artist: t.artist?.name || artist,
      url: t.url || '',
      listeners: Number(t.listeners || 0),
      playcount: Number(t.playcount || 0),
      image: (t.album?.image || []).find(x => x.size === 'large')?.['#text'] || '',
      tags: (t.toptags?.tag || []).slice(0, 5).map(x => x.name)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
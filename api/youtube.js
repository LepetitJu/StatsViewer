export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Veuillez spécifier le nom d'une chaîne." });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "La clé API YouTube n'est pas configurée sur le serveur." });
  }

  try {
    // 1. Recherche de l'ID de la chaîne
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: "Aucune chaîne trouvée." });
    }

    const channelId = searchData.items[0].id.channelId;

    // 2. Récupération des infos globales de la chaîne
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return res.status(404).json({ error: "Impossible de récupérer les détails de la chaîne." });
    }

    const channelInfo = channelData.items[0];
    const uploadsPlaylistId = channelInfo.contentDetails?.relatedPlaylists?.uploads;

    let videos = [];
    if (uploadsPlaylistId) {
      // 3. Récupération des dernières vidéos publiées
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=6&key=${API_KEY}`;
      const playlistRes = await fetch(playlistUrl);
      const playlistData = await playlistRes.json();

      if (playlistData.items && playlistData.items.length > 0) {
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

        // 4. Récupération des statistiques individuelles des vidéos
        const videosStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`;
        const videosStatsRes = await fetch(videosStatsUrl);
        const videosStatsData = await videosStatsRes.json();
        videos = videosStatsData.items || [];
      }
    }

    return res.status(200).json({
      channel: channelInfo,
      videos: videos
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Erreur serveur lors de la récupération des données YouTube." });
  }
}
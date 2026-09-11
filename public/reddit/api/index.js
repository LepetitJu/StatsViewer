export default async function handler(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Nom d'utilisateur requis." });
  }

  const cleanUsername = username.replace(/^u\//, '').trim();

  try {
    const headers = { 'User-Agent': 'StatsViewerApp/1.0 (by /u/statsviewer_app)' };

    // 1. Récupération des données du profil
    const userRes = await fetch(`https://www.reddit.com/user/${encodeURIComponent(cleanUsername)}/about.json`, { headers });
    
    if (!userRes.ok) {
      if (userRes.status === 404) {
        return res.status(404).json({ error: "Utilisateur introuvable ou banni." });
      }
      return res.status(userRes.status).json({ error: "Erreur lors de la communication avec Reddit." });
    }

    const userData = await userRes.json();
    if (!userData || !userData.data) {
      return res.status(404).json({ error: "Profil introuvable ou privé." });
    }

    // 2. Récupération des 6 derniers posts
    const postsRes = await fetch(`https://www.reddit.com/user/${encodeURIComponent(cleanUsername)}/submitted.json?limit=6`, { headers });
    let posts = [];
    
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      if (postsData && postsData.data && postsData.data.children) {
        posts = postsData.data.children.map(child => child.data);
      }
    }

    return res.status(200).json({
      user: userData.data,
      posts: posts
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erreur serveur interne." });
  }
}
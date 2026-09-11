// Clé d'API YouTube v3
const API_KEY = process.env.YOUTUBE_API_KEY || ''; 

document.getElementById('search-btn').addEventListener('click', searchChannel);

async function searchChannel() {
  const query = document.getElementById('search-input').value.trim();

  if (!query) {
    showError("Veuillez entrer le nom d'une chaîne.");
    return;
  }

  hideError();
  showLoader(true);
  document.getElementById('results').classList.add('hidden');

  try {
    // 1. Recherche de l'ID de la chaîne
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("Aucune chaîne trouvée.");
    }

    const channelId = searchData.items[0].id.channelId;

    // 2. Récupération des infos globales de la chaîne + ID du dossier des vidéos uploadées
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error("Impossible de récupérer les détails de la chaîne.");
    }

    const channelInfo = channelData.items[0];
    const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;

    // 3. Récupération des dernières vidéos publiées via la playlist d'uploads (évite les bugs)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=6&key=${API_KEY}`;
    const playlistRes = await fetch(playlistUrl);
    const playlistData = await playlistRes.json();

    const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');

    // 4. Récupération des statistiques individuelles de chaque vidéo (vues, likes...)
    const videosStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${API_KEY}`;
    const videosStatsRes = await fetch(videosStatsUrl);
    const videosStatsData = await videosStatsRes.json();

    renderUI(channelInfo, videosStatsData.items);

  } catch (err) {
    showError(err.message || "Une erreur est survenue lors de la requête.");
  } finally {
    showLoader(false);
  }
}

function renderUI(channel, videos) {
  const stats = channel.statistics;
  const snippet = channel.snippet;

  document.getElementById('channel-avatar').src = snippet.thumbnails.medium.url;
  document.getElementById('channel-title').textContent = snippet.title;
  document.getElementById('channel-description').textContent = snippet.description ? snippet.description.substring(0, 120) + '...' : '';

  document.getElementById('stat-subscribers').textContent = Number(stats.subscriberCount).toLocaleString('fr-FR');
  document.getElementById('stat-views').textContent = Number(stats.viewCount).toLocaleString('fr-FR');
  document.getElementById('stat-videos').textContent = Number(stats.videoCount).toLocaleString('fr-FR');

  const estimatedEarnings = ((Number(stats.viewCount) / 1000) * 1.50).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  });
  document.getElementById('stat-earnings').textContent = estimatedEarnings;

  const videoGrid = document.getElementById('video-grid');
  videoGrid.innerHTML = '';

  videos.forEach(video => {
    const vStats = video.statistics;
    const vViews = Number(vStats.viewCount || 0).toLocaleString('fr-FR');
    const vLikes = Number(vStats.likeCount || 0).toLocaleString('fr-FR');
    const vEstRevenue = ((Number(vStats.viewCount || 0) / 1000) * 1.50).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });

    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
        <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
      </a>
      <div class="video-card-content">
        <h4>${video.snippet.title}</h4>
        <p class="sub-text">Publié le : ${new Date(video.snippet.publishedAt).toLocaleDateString('fr-FR')}</p>
        <div class="video-metrics">
          <span><strong>👁 Vues :</strong> ${vViews}</span>
          <span><strong>👍 Likes :</strong> ${vLikes}</span>
          <span><strong>💰 Est. :</strong> ${vEstRevenue}</span>
        </div>
      </div>
    `;
    videoGrid.appendChild(card);
  });

  document.getElementById('results').classList.remove('hidden');
}

function showLoader(show) {
  document.getElementById('loader').classList.toggle('hidden', !show);
}

function showError(msg) {
  const errDiv = document.getElementById('error-message');
  errDiv.textContent = msg;
  errDiv.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-message').classList.add('hidden');
}
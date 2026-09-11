document.getElementById('search-btn').addEventListener('click', searchChannel);
document.getElementById('search-input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') searchChannel();
});

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
    // Appelle la fonction Serverless au lieu de contacter YouTube directement depuis le navigateur
    const response = await fetch(`/api/youtube?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Une erreur est survenue lors de la requête.");
    }

    renderUI(data.channel, data.videos);

  } catch (err) {
    showError(err.message);
  } finally {
    showLoader(false);
  }
}

function renderUI(channel, videos) {
  const stats = channel.statistics || {};
  const snippet = channel.snippet || {};

  document.getElementById('channel-avatar').src = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '';
  document.getElementById('channel-title').textContent = snippet.title || 'Inconnu';
  document.getElementById('channel-description').textContent = snippet.description ? snippet.description.substring(0, 120) + '...' : 'Aucune description.';

  document.getElementById('stat-subscribers').textContent = Number(stats.subscriberCount || 0).toLocaleString('fr-FR');
  document.getElementById('stat-views').textContent = Number(stats.viewCount || 0).toLocaleString('fr-FR');
  document.getElementById('stat-videos').textContent = Number(stats.videoCount || 0).toLocaleString('fr-FR');

  const estimatedEarnings = ((Number(stats.viewCount || 0) / 1000) * 1.50).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  });
  document.getElementById('stat-earnings').textContent = estimatedEarnings;

  const videoGrid = document.getElementById('video-grid');
  videoGrid.innerHTML = '';

  if (!videos || videos.length === 0) {
    videoGrid.innerHTML = '<p>Aucune vidéo récente disponible.</p>';
  } else {
    videos.forEach(video => {
      const vStats = video.statistics || {};
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
          <img src="${video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url}" alt="${escapeHtml(video.snippet.title)}">
        </a>
        <div class="video-card-content">
          <h4>${escapeHtml(video.snippet.title)}</h4>
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
  }

  document.getElementById('results').classList.remove('hidden');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
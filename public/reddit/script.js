document.getElementById('search-btn').addEventListener('click', searchUser);

document.getElementById('search-input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') searchUser();
});

async function searchUser() {
  let query = document.getElementById('search-input').value.trim();

  if (query.startsWith('u/')) {
    query = query.substring(2);
  }

  if (!query) {
    showError("Veuillez entrer un nom d'utilisateur Reddit.");
    return;
  }

  hideError();
  showLoader(true);
  document.getElementById('results').classList.add('hidden');

  try {
    // Utilisation d'un proxy CORS pour éviter d'être bloqué par la protection bot de Reddit
    const targetUserUrl = `https://www.reddit.com/user/${encodeURIComponent(query)}/about.json`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUserUrl)}`;

    const userRes = await fetch(proxyUrl);
    if (!userRes.ok) {
      throw new Error("Erreur lors de la communication avec le serveur.");
    }

    const proxyData = await userRes.json();
    
    // Tente de parser le contenu JSON renvoyé par le proxy
    let userData;
    try {
      userData = JSON.parse(proxyData.contents);
    } catch (e) {
      throw new Error("Reddit a bloqué la requête ou l'utilisateur n'existe pas.");
    }

    if (userData.error === 404 || !userData.data) {
      throw new Error("Utilisateur introuvable ou banni.");
    }

    const userInfo = userData.data;

    // Récupération des 6 dernières publications
    const targetPostsUrl = `https://www.reddit.com/user/${encodeURIComponent(query)}/submitted.json?limit=6`;
    const postsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetPostsUrl)}`;
    
    const postsRes = await fetch(postsProxyUrl);
    const postsProxyData = await postsRes.json();
    
    let postsData = {};
    try {
      postsData = JSON.parse(postsProxyData.contents);
    } catch (e) {
      postsData = { data: { children: [] } };
    }

    const posts = postsData.data ? postsData.data.children.map(child => child.data) : [];

    renderUI(userInfo, posts);

  } catch (err) {
    showError(err.message || "Une erreur est survenue lors de la requête.");
  } finally {
    showLoader(false);
  }
}

function renderUI(user, posts) {
  let avatarUrl = user.icon_img ? user.icon_img.split('?')[0] : '';
  if (!avatarUrl) {
    avatarUrl = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png';
  }
  document.getElementById('user-avatar').src = avatarUrl;

  document.getElementById('user-name').textContent = `u/${user.name}`;
  const description = user.subreddit ? user.subreddit.public_description : '';
  document.getElementById('user-bio').textContent = description ? description.substring(0, 120) + '...' : 'Aucune biographie fournie.';

  const createdDate = new Date(user.created_utc * 1000).toLocaleDateString('fr-FR');
  document.getElementById('user-created').textContent = `Membre depuis le : ${createdDate}`;

  const linkKarma = user.link_karma || 0;
  const commentKarma = user.comment_karma || 0;
  const totalKarma = user.total_karma || (linkKarma + commentKarma);

  document.getElementById('stat-total-karma').textContent = Number(totalKarma).toLocaleString('fr-FR');
  document.getElementById('stat-post-karma').textContent = Number(linkKarma).toLocaleString('fr-FR');
  document.getElementById('stat-comment-karma').textContent = Number(commentKarma).toLocaleString('fr-FR');
  
  document.getElementById('stat-premium').textContent = user.is_gold ? 'Oui 🌟' : 'Non';

  const postsGrid = document.getElementById('posts-grid');
  postsGrid.innerHTML = '';

  if (posts.length === 0) {
    postsGrid.innerHTML = '<p>Cet utilisateur n\'a publié aucun contenu récent.</p>';
  } else {
    posts.forEach(post => {
      const upvotes = Number(post.score || 0).toLocaleString('fr-FR');
      const comments = Number(post.num_comments || 0).toLocaleString('fr-FR');
      const subreddit = post.subreddit_name_prefixed;
      
      let thumbnail = post.thumbnail;
      const isImage = thumbnail && thumbnail.startsWith('http');
      const defaultImg = 'https://www.redditstatic.com/icon.png';

      const card = document.createElement('div');
      card.className = 'post-card';
      card.innerHTML = `
        <img class="post-thumbnail" src="${isImage ? thumbnail : defaultImg}" alt="Vignette du post">
        <div class="post-card-content">
          <h4>
            <a href="https://www.reddit.com${post.permalink}" target="_blank" rel="noopener noreferrer">
              ${post.title}
            </a>
          </h4>
          <p class="sub-text">Publié sur <strong>${subreddit}</strong> le ${new Date(post.created_utc * 1000).toLocaleDateString('fr-FR')}</p>
          <div class="post-metrics">
            <span><strong>⬆ Upvotes :</strong> ${upvotes}</span>
            <span><strong>💬 Commentaires :</strong> ${comments}</span>
            <span><strong>🔥 Ratio Upvote :</strong> ${Math.round((post.upvote_ratio || 0) * 100)}%</span>
          </div>
        </div>
      `;
      postsGrid.appendChild(card);
    });
  }

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
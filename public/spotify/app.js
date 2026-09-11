const q = document.querySelector('#q'),
      go = document.querySelector('#go'),
      results = document.querySelector('#results'),
      error = document.querySelector('#error'),
      detail = document.querySelector('#detail');

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
}[c]));

async function search() {
  const term = q.value.trim();
  error.innerHTML = '';

  if (!term) {
    results.innerHTML = '';
    return;
  }

  results.innerHTML = '<div class="livebox">Recherche en cours…</div>';

  try {
    // Appelle la Serverless Function Vercel locale au dossier spotify
    const r = await fetch('/spotify/api?action=search&q=' + encodeURIComponent(term)),
          d = await r.json();

    if (!r.ok) throw Error(d.error || 'Erreur serveur');

    render(d.tracks || []);
  } catch (e) {
    results.innerHTML = '';
    error.innerHTML = '<b>Recherche impossible.</b><br>' + esc(e.message);
  }
}

function render(tracks) {
  results.innerHTML = '';

  if (!tracks.length) {
    results.innerHTML = '<div class="livebox">Aucun résultat.</div>';
    return;
  }

  tracks.forEach(t => {
    const b = document.createElement('button');
    b.className = 'result';
    const listenersCount = (t.listeners || 0).toLocaleString('fr-FR');
    b.innerHTML = `<img src="${esc(t.image)}" alt=""><div><h3>${esc(t.name)}</h3><p>${esc(t.artist)} · ${listenersCount} auditeurs</p></div>`;
    b.onclick = () => load(t.artist, t.name);
    results.appendChild(b);
  });
}

async function load(artist, track) {
  try {
    const r = await fetch(`/spotify/api?action=track&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`),
          d = await r.json();

    if (!r.ok) throw Error(d.error || 'Erreur serveur');

    document.querySelector('#cover').src = d.image || '';
    document.querySelector('#title').textContent = d.name || track;
    document.querySelector('#artist').textContent = d.artist || artist;
    document.querySelector('#link').href = d.url || '#';
    
    // Sécurité contre les valeurs undefined
    const listeners = (d.listeners || 0).toLocaleString('fr-FR');
    const plays = (d.playcount || 0).toLocaleString('fr-FR');
    
    document.querySelector('#listeners').textContent = listeners;
    document.querySelector('#plays').textContent = plays;
    document.querySelector('#tags').innerHTML = (d.tags || []).map(x => `<span class="tag">${esc(x)}</span>`).join('');

    detail.classList.remove('hidden');
  } catch (e) {
    error.innerHTML = '<b>Impossible de charger ce titre.</b><br>' + esc(e.message);
  }
}

go.onclick = search;

q.addEventListener('keydown', e => {
  if (e.key === 'Enter') search();
});
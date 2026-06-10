const API = '';
let currentUser = null;

function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.classList.add('showing');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  } else {
    input.type = 'password';
    btn.classList.remove('showing');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}
let currentProfile = null;
let searchTimeout = null;
let feedCursor = 0;
let feedLoading = false;
let feedHasMore = true;

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.data;
}

async function checkAuth() {
  try {
    const data = await api('/api/auth/me');
    currentUser = data.user;
    showNav();
    navigate(window.location.pathname);
  } catch {
    currentUser = null;
    showNav();
    navigate(window.location.pathname);
  }
}

function showNav() {
  const nav = document.getElementById('navbar');
  const landing = document.getElementById('page-landing');

  if (currentUser) {
    nav.classList.remove('hidden');
    landing.classList.add('hidden');
    document.getElementById('navUsername').textContent = currentUser.username;
    const img = document.getElementById('navAvatarImg');
    const initials = document.getElementById('navAvatarInitials');
    if (currentUser.avatar_url) {
      img.src = currentUser.avatar_url;
      img.alt = currentUser.username;
      img.style.display = '';
      initials.style.display = 'none';
    } else {
      initials.textContent = currentUser.username.slice(0, 2).toUpperCase();
      initials.style.display = '';
      img.style.display = 'none';
    }
    document.getElementById('ddProfile').href = `/u/${currentUser.username}`;
    document.getElementById('ddStats').href = `/u/${currentUser.username}/stats`;
  } else {
    nav.classList.add('hidden');
    landing.classList.remove('hidden');
  }
}

function hideAllPages() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
}

function hideAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function showPage(id) {
  hideAllPages();
  const page = document.getElementById(`page-${id}`);
  if (page) page.classList.remove('hidden');
  window.scrollTo(0, 0);
  return false;
}

function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('settingsProfileForm').addEventListener('submit', handleSaveSettings);
  document.getElementById('settingsPasswordForm').addEventListener('submit', handleChangePassword);
  document.getElementById('feedLoadMore').addEventListener('click', loadFeed);
  document.getElementById('ddLogout').addEventListener('click', handleLogout);
  document.getElementById('navAvatar').addEventListener('click', toggleUserDropdown);
  document.getElementById('searchInput').addEventListener('input', handleSearchInput);
  document.getElementById('searchInput').addEventListener('keydown', handleSearchKeydown);

  document.addEventListener('mousedown', (e) => {
    const dd = document.getElementById('userDropdown');
    if (!e.target.closest('.nav-user')) dd.classList.add('hidden');
    const sd = document.getElementById('searchDropdown');
    if (!e.target.closest('.nav-search') && !e.target.closest('.search-dropdown')) sd.classList.add('hidden');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideAllModals();
      document.getElementById('searchDropdown').classList.add('hidden');
    }
  });
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('hidden');
}

/* Auth */
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');

  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    currentUser = data.user;
    errEl.classList.add('hidden');
    showNav();
    navigate('/');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const errEl = document.getElementById('registerError');

  if (password !== confirm) {
    errEl.textContent = 'Passwords do not match';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    currentUser = data.user;
    errEl.classList.add('hidden');
    showNav();
    navigate('/');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

async function handleLogout(e) {
  e.preventDefault();
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  document.getElementById('userDropdown').classList.add('hidden');
  showNav();
  navigate('/');
}

/* Search */
let searchResults = [];
let searchSelectedIndex = -1;

async function handleSearchInput(e) {
  clearTimeout(searchTimeout);
  const q = e.target.value.trim();
  if (q.length < 2) {
    document.getElementById('searchDropdown').classList.add('hidden');
    return;
  }
  searchTimeout = setTimeout(async () => {
    try {
      const data = await api(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
      searchResults = data.results || [];
      renderSearchResults();
    } catch {
      searchResults = [];
      renderSearchResults();
    }
  }, 300);
}

function handleSearchKeydown(e) {
  const dd = document.getElementById('searchDropdown');
  const items = dd.querySelectorAll('.search-result-item');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchSelectedIndex = Math.min(searchSelectedIndex + 1, items.length - 1);
    highlightSearch(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchSelectedIndex = Math.max(searchSelectedIndex - 1, 0);
    highlightSearch(items);
  } else if (e.key === 'Enter' && searchSelectedIndex >= 0 && items[searchSelectedIndex]) {
    e.preventDefault();
    items[searchSelectedIndex].click();
  }
}

function highlightSearch(items) {
  items.forEach((item, i) => {
    item.style.background = i === searchSelectedIndex ? 'var(--surface)' : '';
  });
}

function renderSearchResults() {
  const dd = document.getElementById('searchDropdown');
  searchSelectedIndex = -1;

  if (searchResults.length === 0) {
    dd.innerHTML = '<div class="search-no-results">No films found. Try a different title.</div>';
    dd.classList.remove('hidden');
    return;
  }

  dd.innerHTML = searchResults.map((r, i) => `
    <div class="search-result-item" data-index="${i}" onclick="openLogModal(${r.id})">
      <img src="${r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : ''}" alt="${r.title}" loading="lazy">
      <div class="search-result-info">
        <h4>${r.title}</h4>
        <p>${r.year || ''} · ${r.genres.slice(0, 2).join(', ')} ${r.rating ? `· ★ ${r.rating}` : ''}</p>
      </div>
    </div>
  `).join('');
  dd.classList.remove('hidden');
}

/* Log Modal */
let logFilmData = null;

async function openLogModal(tmdbId) {
  document.getElementById('searchDropdown').classList.add('hidden');
  try {
    const data = await api(`/api/tmdb/film/${tmdbId}`);
    logFilmData = data.film;
    const body = document.getElementById('logModalBody');
    const f = data.film;

    body.innerHTML = `
      <div class="log-modal-content">
        <div class="log-modal-film">
          <img class="log-modal-poster" src="${f.poster_path ? `https://image.tmdb.org/t/p/w342${f.poster_path}` : ''}" alt="${f.title}">
          <div class="log-modal-info">
            <h2>${f.title}</h2>
            <p>${f.year || ''} · ${f.runtime ? f.runtime + ' min' : ''}</p>
            <p class="tmdb-rating">★ ${f.vote_average || '—'} TMDB</p>
            <p>${(f.genres || []).join(', ')}</p>
          </div>
        </div>
        <div class="log-modal-form">
          <div class="field">
            <label>Watched on</label>
            <input type="date" id="logDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="field">
            <label>Your rating</label>
            <div class="star-input" id="logStarInput"></div>
            <input type="hidden" id="logRating" value="0">
          </div>
          <div class="field">
            <label>Private note (optional)</label>
            <textarea id="logReview" maxlength="500" placeholder="What did you think?"></textarea>
          </div>
          <button class="btn btn-primary btn-full" id="logSubmitBtn" onclick="submitLog()">Log Film →</button>
        </div>
      </div>
    `;
    document.getElementById('logModal').classList.remove('hidden');
    initStarInput('logStarInput', 'logRating');
  } catch (err) {
    showToast('Failed to load film details');
  }
}

function closeLogModal() {
  document.getElementById('logModal').classList.add('hidden');
  logFilmData = null;
}

async function submitLog() {
  const btn = document.getElementById('logSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Logging...';

  try {
    await api('/api/logs', {
      method: 'POST',
      body: JSON.stringify({
        tmdb_id: logFilmData.id,
        watched_date: document.getElementById('logDate').value,
        rating: parseInt(document.getElementById('logRating').value),
        review: document.getElementById('logReview').value.trim() || null,
      }),
    });
    closeLogModal();
    showToast(`${logFilmData.title} logged`);
    if (currentProfile && currentProfile.username === currentUser.username) {
      loadProfile(currentUser.username, 'films');
    }
  } catch (err) {
    showToast(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log Film →';
  }
}

/* Star Input */
function initStarInput(containerId, inputId) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  let value = 0;

  function render() {
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const star = document.createElement('span');
      star.className = `star ${i <= value ? 'active' : ''}`;
      star.textContent = '★';
      star.addEventListener('mouseenter', () => {
        container.querySelectorAll('.star').forEach((s, idx) => {
          s.classList.toggle('hovered', idx < i);
        });
      });
      star.addEventListener('mouseleave', () => {
        container.querySelectorAll('.star').forEach(s => s.classList.remove('hovered'));
      });
      star.addEventListener('click', () => {
        value = i;
        input.value = i;
        render();
      });
      container.appendChild(star);
    }
    const valSpan = document.createElement('span');
    valSpan.className = 'star-value';
    valSpan.textContent = value > 0 ? `${value} / 10` : '';
    container.appendChild(valSpan);

    if (value > 0) {
      const clear = document.createElement('button');
      clear.className = 'star-clear';
      clear.textContent = '× Clear';
      clear.addEventListener('click', () => {
        value = 0;
        input.value = 0;
        render();
      });
      container.appendChild(clear);
    }
  }
  render();
}

/* Stars Display */
function renderStars(rating, size = 14) {
  const full = Math.floor(rating / 2);
  const half = rating % 2 >= 1 ? 1 : 0;
  const empty = 5 - full - half;
  let html = '';
  for (let i = 0; i < full; i++) html += '<span class="star-full">★</span>';
  if (half) html += '<span class="star-half">★</span>';
  for (let i = 0; i < empty; i++) html += '<span class="star-empty">★</span>';
  return `<span class="stars-display" style="font-size:${size}px">${html}</span>`;
}

/* Toast */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden', 'toast-fade');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('toast-fade');
    setTimeout(() => el.classList.add('hidden'), 260);
  }, 3000);
}

/* Film Card Helper */
function renderFilmCard(film, tmdbId, year, rating) {
  const poster = film.poster_path ? `https://image.tmdb.org/t/p/w342${film.poster_path}` : '';
  const initials = (film.title || '').split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return `
    <div class="film-card" onclick="openFilmDetail(${tmdbId})">
      <div class="film-card-poster-wrap">
        ${poster
          ? `<img src="${poster}" alt="${film.title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
             <div class="film-card-poster-fallback" style="display:none">${initials}</div>`
          : `<div class="film-card-poster-fallback">${initials}</div>`
        }
        <div class="film-card-overlay">VIEW</div>
      </div>
      <div class="film-card-info">
        <div class="film-card-title">${film.title}</div>
        <div class="film-card-meta">
          ${year ? `<span>${year}</span>` : ''}
          ${rating ? renderStars(rating, 11) : ''}
        </div>
      </div>
    </div>
  `;
}

/* Feed */
async function loadFeed() {
  if (feedLoading || !feedHasMore) return;
  feedLoading = true;

  try {
    const data = await api(`/api/feed?cursor=${feedCursor}&limit=20`);
    const list = document.getElementById('feedList');
    const empty = document.getElementById('feedEmpty');
    const loadMore = document.getElementById('feedLoadMore');

    if (feedCursor === 0) list.innerHTML = '';

    if (!data.feed || data.feed.length === 0) {
      if (feedCursor === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
      }
      loadMore.classList.add('hidden');
      feedHasMore = false;
      feedLoading = false;
      loadSidebar();
      return;
    }

    empty.classList.add('hidden');

    data.feed.forEach(item => {
      const el = document.createElement('div');
      el.className = 'feed-item';
      const timeAgo = getTimeAgo(item.log.created_at);
      const initials = item.user.username.slice(0, 2).toUpperCase();
      const avatarHtml = item.user.avatar_url
        ? `<img class="feed-item-avatar" src="${item.user.avatar_url}" alt="${item.user.username}" onerror="this.outerHTML='<div class=feed-avatar-initial>${initials}</div>'">`
        : `<div class="feed-avatar-initial">${initials}</div>`;
      el.innerHTML = `
        ${avatarHtml}
        <img class="feed-item-poster" src="${item.log.poster_path ? `https://image.tmdb.org/t/p/w154${item.log.poster_path}` : ''}" alt="${item.log.title}" onclick="openFilmDetail(${item.log.tmdb_id})" loading="lazy">
        <div class="feed-item-content">
          <a class="feed-item-user" href="/u/${item.user.username}" onclick="return navigateClick(event, '/u/${item.user.username}')">@${item.user.username}</a>
          <div class="feed-item-title" onclick="openFilmDetail(${item.log.tmdb_id})">${item.log.title}</div>
          <div class="feed-item-stars">${renderStars(item.log.rating)}</div>
          <div class="feed-item-meta">${timeAgo}</div>
        </div>
      `;
      list.appendChild(el);
    });

    feedCursor = parseInt(data.next_cursor || '0');
    feedHasMore = data.feed.length === 20;
    loadMore.classList.toggle('hidden', !feedHasMore);
    loadSidebar();
  } catch (err) {
    showToast('Failed to load feed');
  } finally {
    feedLoading = false;
  }
}

function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

async function loadSidebar() {
  try {
    const data = await api(`/api/stats/${currentUser.username}?year=${new Date().getFullYear()}`);
    document.getElementById('sidebarYearCount').textContent = data.total_this_year || 0;
    document.getElementById('sidebarYearLabel').textContent = `films ${new Date().getFullYear()}`;

    const prevYear = new Date().getFullYear() - 1;
    const prevData = await api(`/api/stats/${currentUser.username}?year=${prevYear}`);
    const max = Math.max(data.total_this_year || 0, prevData.total_this_year || 1);
    const pct = max > 0 ? ((data.total_this_year || 0) / max) * 100 : 0;
    document.getElementById('sidebarStreakBar').style.width = `${Math.min(pct, 100)}%`;
  } catch {}

  try {
    const data = await api('/api/feed?limit=20');
    if (data.feed) {
      const users = [...new Map(data.feed.map(f => [f.user.username, f.user])).values()]
        .filter(u => u.username !== currentUser.username)
        .slice(0, 5);

      const list = document.getElementById('whoToFollowList');
      list.innerHTML = users.map(u => {
        const initials = u.username.slice(0, 2).toUpperCase();
        const avatarHtml = u.avatar_url
          ? `<img class="wtf-avatar" src="${u.avatar_url}" alt="" onerror="this.outerHTML='<div class=wtf-avatar style=background:var(--amber-dim);color:var(--amber);display:flex;align-items:center;justify-content:center;border-radius:50%;width:32px;height:32px;font-size:12px;font-weight:600;flex-shrink:0>${initials}</div>'">`
          : `<div class="wtf-avatar" style="background:var(--amber-dim);color:var(--amber);display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:12px;font-weight:600;">${initials}</div>`;
        return `
          <div class="wtf-item">
            ${avatarHtml}
            <div class="wtf-info">
              <a class="wtf-name" href="/u/${u.username}" onclick="return navigateClick(event, '/u/${u.username}')">@${u.username}</a>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch {}
}

/* Profile */
async function loadProfile(username, tab) {
  showPage('profile');
  document.getElementById('profileFilms').classList.remove('hidden');
  document.getElementById('profileStats').classList.add('hidden');
  switchProfileTab(tab);

  try {
    const data = await api(`/api/users/${username}`);
    currentProfile = data.profile;
    renderProfileHeader(data.profile);
    loadProfileFilms(username);

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    if (tab === 'stats') {
      document.getElementById('profileFilms').classList.add('hidden');
      document.getElementById('profileStats').classList.remove('hidden');
      loadStats(username);
    }
  } catch (err) {
    showToast('User not found');
    navigate('/');
  }
}

function renderProfileHeader(profile) {
  const header = document.getElementById('profileHeader');
  const initials = (profile.display_name || profile.username).slice(0, 2).toUpperCase();
  const avatarHtml = profile.avatar_url
    ? `<img class="profile-avatar ${profile.is_own_profile ? 'own' : ''}" src="${profile.avatar_url}" alt="${profile.username}" onerror="this.outerHTML='<div class=profile-avatar-initials>${initials}</div>'">`
    : `<div class="profile-avatar-initials ${profile.is_own_profile ? 'own' : ''}">${initials}</div>`;
  header.innerHTML = `
    ${avatarHtml}
    <div class="profile-info">
      <h1 class="profile-display-name">${profile.display_name || profile.username}</h1>
      <div class="profile-username">@${profile.username}</div>
      ${profile.bio ? `<div class="profile-bio">${profile.bio}</div>` : ''}
      ${profile.favourite_quote ? `<div class="profile-quote">"${profile.favourite_quote}"</div>` : ''}
      <div class="profile-stats-row">
        <a href="/u/${profile.username}/followers" onclick="return navigateClick(event, '/u/${profile.username}/followers')">${profile.follower_count} <span style="color:var(--text-muted)">followers</span></a>
        <span class="dot">·</span>
        <a href="/u/${profile.username}/following" onclick="return navigateClick(event, '/u/${profile.username}/following')">${profile.following_count} <span style="color:var(--text-muted)">following</span></a>
      </div>
      <div class="profile-actions">
        ${profile.is_own_profile ? `<a href="/settings" class="btn btn-secondary btn-sm" onclick="return navigateClick(event, '/settings')">Edit profile</a>` : `
          <button class="btn ${profile.is_following ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="toggleFollow('${profile.username}', ${profile.is_following})">
            ${profile.is_following ? 'Following ✓' : 'Follow'}
          </button>
        `}
      </div>
    </div>
  `;
  loadTopFilms(profile.username);
}

async function toggleFollow(username, currentlyFollowing) {
  try {
    if (currentlyFollowing) {
      await api(`/api/users/${username}/follow`, { method: 'DELETE' });
      showToast(`Unfollowed @${username}`);
    } else {
      await api(`/api/users/${username}/follow`, { method: 'POST' });
      showToast(`Following @${username}`);
    }
    loadProfile(username, document.querySelector('#profileContent .tab.active')?.dataset.tab || 'films');
  } catch (err) {
    showToast(err.message);
  }
}

async function loadTopFilms(username) {
  try {
    const data = await api(`/api/favourites/${username}`);
    const favs = data.favourites || [];
    const top5 = favs.slice(0, 5);

    const strip = document.getElementById('topFilmsStrip');
    strip.innerHTML = top5.map(f => renderFilmCard(f, f.tmdb_id, f.release_year)).join('');

    const allFavs = document.getElementById('favouritesGrid');
    allFavs.innerHTML = favs.map(f => renderFilmCard(f, f.tmdb_id, f.release_year)).join('');

    document.getElementById('toggleFavouritesBtn').textContent = favs.length > 5 ? 'See all favourites ↓' : '';
    document.getElementById('toggleFavouritesBtn').style.display = favs.length > 5 ? '' : 'none';
  } catch {}
}

let allFavouritesVisible = false;

function toggleAllFavourites() {
  allFavouritesVisible = !allFavouritesVisible;
  document.getElementById('allFavouritesSection').classList.toggle('hidden', !allFavouritesVisible);
  document.getElementById('toggleFavouritesBtn').textContent = allFavouritesVisible ? 'Collapse ↑' : 'See all favourites ↓';
}

function switchProfileTab(tab) {
  document.querySelectorAll('.profile-tabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('profileFilms').classList.toggle('hidden', tab !== 'films');
  document.getElementById('profileStats').classList.toggle('hidden', tab !== 'stats');
}

async function loadProfileFilms(username) {
  try {
    const data = await api(`/api/logs/${username}?sort=watched_date&order=desc`);
    const logs = data.logs || [];
    const grid = document.getElementById('filmsGrid');
    const empty = document.getElementById('profileFilmsEmpty');

    if (logs.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    grid.innerHTML = logs.map(l => renderFilmCard(l, l.tmdb_id, l.release_year, l.rating)).join('');
  } catch {}
}

/* Stats */
async function loadStats(username) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);

  const yearSelector = document.getElementById('statsYearSelector');
  yearSelector.innerHTML = years.map(y => `
    <button class="year-btn ${y === currentYear ? 'active' : ''}" onclick="changeStatsYear(${y}, '${username}')">${y}</button>
  `).join('');

  await loadStatsForYear(username, currentYear);
}

async function changeStatsYear(year, username) {
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.year-btn[onclick*="${year}"]`).classList.add('active');
  await loadStatsForYear(username, year);
}

async function loadStatsForYear(username, year) {
  try {
    const data = await api(`/api/stats/${username}?year=${year}`);

    const cards = document.getElementById('statsCards');
    cards.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-value">${data.total_this_year}</div>
        <div class="stat-card-label">films</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">★ ${data.average_rating}</div>
        <div class="stat-card-label">avg rating</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">${data.longest_streak}</div>
        <div class="stat-card-label">day streak</div>
      </div>
    `;

    const totalLastYear = data.total_all_time - data.total_this_year;
    const maxVal = Math.max(data.total_this_year, totalLastYear, 1);
    const pct = (data.total_this_year / Math.max(maxVal, 1)) * 100;
    document.getElementById('statsStreakBar').style.width = `${Math.min(pct, 100)}%`;

    renderHeatmap(data.heatmap, year);
    renderMonthChart(data.by_month);
    renderGenreChart(data.by_genre);
    renderDecadeChart(data.by_decade);
  } catch {}
}

function renderHeatmap(heatmap, year) {
  const container = document.getElementById('heatmapContainer');
  const heatmapData = {};
  (heatmap || []).forEach(h => { heatmapData[h.date] = h.count; });

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const days = [];

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    days.push({ date: dateStr, day: current.getDay(), count: heatmapData[dateStr] || 0 });
    current.setDate(current.getDate() + 1);
  }

  const weeks = [];
  let week = new Array(7).fill(null);
  days.forEach(d => {
    if (d.day === 0 && week.some(w => w !== null)) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
    week[d.day] = d;
  });
  if (week.some(w => w !== null)) weeks.push(week);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months = [];
  weeks.forEach((w, wi) => {
    const firstDay = w.find(d => d);
    if (firstDay) {
      const m = new Date(firstDay.date).getMonth();
      if (!months.find(mm => mm.month === m)) {
        months.push({ month: m, week: wi });
      }
    }
  });

  const colorScale = ['', '#3D2F0D', '#6B5015', '#9A7520', '#E8A838'];

  let html = '<div class="heatmap-wrapper">';

  months.forEach(m => {
    html += `<div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">${monthLabels[m.month]}</div>`;
  });

  html += '<div style="display:flex;gap:3px;">';
  weeks.forEach(w => {
    html += '<div class="heatmap-col">';
    w.forEach(d => {
      if (!d) {
        html += '<div class="heatmap-cell" style="visibility:hidden"></div>';
      } else {
        const level = Math.min(d.count, 4);
        html += `<div class="heatmap-cell" style="background:${colorScale[level] || 'var(--surface)'}" data-tooltip="${d.date}: ${d.count} film${d.count !== 1 ? 's' : ''}"></div>`;
      }
    });
    html += '</div>';
  });
  html += '</div></div>';

  container.innerHTML = html;
}

function renderMonthChart(byMonth) {
  const container = document.getElementById('monthChart');
  const months = byMonth || [];
  const max = Math.max(...months.map(m => m.count), 1);
  const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  let html = '<div class="bar-chart">';
  months.forEach(m => {
    const h = max > 0 ? (m.count / max) * 100 : 0;
    html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;">
      <div class="bar" style="height:${Math.max(h, 2)}%"></div>
      <div class="bar-label">${labels[m.month - 1]}</div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderGenreChart(byGenre) {
  const container = document.getElementById('genreChart');
  const genres = (byGenre || []).sort((a, b) => b.count - a.count).slice(0, 8);
  const total = genres.reduce((s, g) => s + g.count, 0);

  if (genres.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">No genre data yet</div>';
    return;
  }

  const colors = ['#E8A838', '#7A5A1E', '#C0392B', '#2A7A5A', '#5A5A7A', '#8A5A3A', '#3A5A8A', '#5A3A8A'];

  let html = '<div class="donut-chart"><svg width="120" height="120" viewBox="0 0 120 120">';
  let cumulative = 0;
  const cx = 60, cy = 60, r = 50;

  genres.forEach((g, i) => {
    const pct = g.count / total;
    const angle = pct * 360;
    const startAngle = (cumulative / total) * 360;
    cumulative += g.count;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((startAngle + angle - 90) * Math.PI) / 180;

    if (angle >= 360) {
      html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="20"/>`;
      return;
    }

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    html += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="20"/>`;
  });

  html += '</svg><div class="donut-legend">';
  genres.forEach((g, i) => {
    html += `<div class="donut-item"><span class="donut-dot" style="background:${colors[i % colors.length]}"></span>${g.genre} (${g.count})</div>`;
  });
  html += '</div></div>';
  container.innerHTML = html;
}

function renderDecadeChart(byDecade) {
  const container = document.getElementById('decadeChart');
  const decades = (byDecade || []).sort((a, b) => a.decade.localeCompare(b.decade));
  const max = Math.max(...decades.map(d => d.count), 1);

  if (decades.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px;">No decade data yet</div>';
    return;
  }

  let html = '<div class="hbar-chart">';
  decades.forEach(d => {
    const pct = (d.count / max) * 100;
    html += `
      <div class="hbar-row">
        <span class="hbar-label">${d.decade}</span>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${pct}%"></div>
        </div>
        <span class="hbar-count">${d.count}</span>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

/* Film Detail */
async function openFilmDetail(tmdbId) {
  try {
    const data = await api(`/api/tmdb/film/${tmdbId}`);
    const f = data.film;
    const body = document.getElementById('filmDetailBody');

    let logSection = '';
    if (currentUser) {
      try {
        const logsData = await api(`/api/logs/${currentUser.username}?sort=watched_date&order=desc`);
        const userLog = (logsData.logs || []).find(l => l.tmdb_id === tmdbId);
        if (userLog) {
          logSection = `
            <div class="film-detail-log">
              <h4>YOUR LOG</h4>
              <div class="film-detail-log-info">
                <span>Watched: ${new Date(userLog.watched_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>·</span>
                <span>Your rating: ${renderStars(userLog.rating)}</span>
              </div>
              ${userLog.review ? `<div class="film-detail-log-review">"${userLog.review}"</div>` : ''}
              <div class="film-detail-log-actions">
                <button class="btn btn-secondary btn-sm" onclick="editLog('${userLog.id}', ${userLog.rating}, '${userLog.review || ''}', '${userLog.watched_date}')">Edit log</button>
                <button class="btn btn-danger btn-sm" onclick="deleteLog('${userLog.id}')">Remove</button>
              </div>
            </div>
          `;
        }
      } catch {}
    }

    const backdrop = f.backdrop_path ? `https://image.tmdb.org/t/p/w1280${f.backdrop_path}` : '';
    const poster = f.poster_path ? `https://image.tmdb.org/t/p/w500${f.poster_path}` : '';

    body.innerHTML = `
      ${backdrop ? `<img class="film-detail-backdrop" src="${backdrop}" alt="" onerror="this.style.display='none'">` : ''}
      <div class="film-detail-body">
        <div class="film-detail-main">
          <img class="film-detail-poster" src="${poster}" alt="${f.title}" onerror="this.style.display='none'">
          <div class="film-detail-info">
            <h2>${f.title}</h2>
            <div class="film-detail-meta">
              ${f.year || ''}${f.director && f.director.length ? ` · ${f.director.join(', ')}` : ''}
              ${f.runtime ? ` · ${f.runtime} min` : ''}
            </div>
            <div class="film-detail-rating">
              ${f.vote_average ? renderStars(Math.round(f.vote_average), 16) : ''}
              ${f.vote_average ? `<span class="score">${f.vote_average}</span>` : ''}
              ${f.vote_count ? `<span class="votes">(${(f.vote_count / 1000).toFixed(1)}K votes)</span>` : ''}
            </div>
            ${f.overview ? `<div class="film-detail-overview">${f.overview}</div>` : ''}
            <div class="film-detail-genres">
              ${(f.genres || []).map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
            ${f.cast && f.cast.length ? `
              <div class="film-detail-cast">
                <h4>CAST</h4>
                <div class="film-detail-cast-list">
                  ${f.cast.map(c => `
                    <div class="cast-item">
                      <img src="${c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ''}" alt="${c.name}" onerror="this.src=''">
                      <div class="cast-name">${c.name}</div>
                      <div class="cast-char">${c.character || ''}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        ${logSection}
      </div>
    `;
    document.getElementById('filmDetailModal').classList.remove('hidden');
  } catch (err) {
    showToast('Failed to load film details');
  }
}

function closeFilmDetail() {
  document.getElementById('filmDetailModal').classList.add('hidden');
}

function editLog(logId, currentRating, currentReview, currentDate) {
  closeFilmDetail();
  showToast('Edit feature coming soon');
}

async function deleteLog(logId) {
  if (!confirm('Remove this film from your logs?')) return;
  try {
    await api(`/api/logs/${logId}`, { method: 'DELETE' });
    showToast('Film removed');
    closeFilmDetail();
    if (currentProfile && currentProfile.username === currentUser.username) {
      loadProfile(currentUser.username, 'films');
    }
  } catch (err) {
    showToast(err.message);
  }
}

/* Settings */
async function loadSettings() {
  if (!currentUser) return;

  document.getElementById('settingsAvatar').src = currentUser.avatar_url || '';
  document.getElementById('settingsDisplayName').value = currentUser.display_name || '';
  document.getElementById('settingsBio').value = currentUser.bio || '';
  document.getElementById('settingsQuote').value = currentUser.favourite_quote || '';

  try {
    const data = await api(`/api/favourites/${currentUser.username}`);
    const favList = document.getElementById('settingsFavourites');
    const favs = data.favourites || [];
    favList.innerHTML = favs.map(f => `
      <div class="settings-fav-item">
        <img src="${f.poster_path ? `https://image.tmdb.org/t/p/w92${f.poster_path}` : ''}" alt="${f.title}">
        <div>
          <div class="fav-title">${f.title}</div>
          <div class="fav-year">${f.release_year || ''}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removeFavourite(${f.tmdb_id})">Remove</button>
      </div>
    `).join('');
    if (favs.length === 0) {
      favList.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">No favourites yet. Search for films to add.</div>';
    }
  } catch {}
}

async function handleSaveSettings(e) {
  e.preventDefault();
  try {
    const data = await api('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: document.getElementById('settingsDisplayName').value.trim() || null,
        bio: document.getElementById('settingsBio').value.trim() || null,
        favourite_quote: document.getElementById('settingsQuote').value.trim() || null,
      }),
    });
    currentUser = { ...currentUser, ...data.user };
    showToast('Settings saved');
  } catch (err) {
    showToast(err.message);
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const current = document.getElementById('settingsCurrentPassword').value;
  const newPw = document.getElementById('settingsNewPassword').value;
  const confirm = document.getElementById('settingsConfirmPassword').value;

  if (newPw !== confirm) {
    showToast('Passwords do not match');
    return;
  }
  if (newPw.length < 8) {
    showToast('Password must be at least 8 characters');
    return;
  }

  showToast('Password change coming soon');
}

async function removeFavourite(tmdbId) {
  try {
    await api(`/api/favourites/${tmdbId}`, { method: 'DELETE' });
    showToast('Removed from favourites');
    loadSettings();
  } catch (err) {
    showToast(err.message);
  }
}

/* Followers / Following */
async function loadFollowers(username) {
  showPage('followers');
  document.getElementById('followersTitle').textContent = `@${username}'s followers`;
  const list = document.getElementById('followersList');

  try {
    const data = await api(`/api/users/${username}/followers`);
    const followers = data.followers || [];
    list.innerHTML = followers.map(f => `
      <div class="follow-item">
        <img src="${f.avatar_url || ''}" alt="" onerror="this.src=''">
        <div class="follow-item-info">
          <a class="follow-item-username" href="/u/${f.username}" onclick="return navigateClick(event, '/u/${f.username}')">@${f.username}</a>
          <div class="follow-item-name">${f.display_name || ''}</div>
          <div class="follow-item-count">${f.film_count || 0} films watched</div>
        </div>
        ${currentUser && f.username !== currentUser.username ? `
          <button class="btn ${f.is_following ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="toggleFollow('${f.username}', ${f.is_following})">
            ${f.is_following ? 'Following ✓' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<div class="empty-state"><p>Could not load followers.</p></div>';
  }
}

async function loadFollowing(username) {
  showPage('following');
  document.getElementById('followingTitle').textContent = `@${username} follows`;
  const list = document.getElementById('followingList');

  try {
    const data = await api(`/api/users/${username}/following`);
    const following = data.following || [];
    list.innerHTML = following.map(f => `
      <div class="follow-item">
        <img src="${f.avatar_url || ''}" alt="" onerror="this.src=''">
        <div class="follow-item-info">
          <a class="follow-item-username" href="/u/${f.username}" onclick="return navigateClick(event, '/u/${f.username}')">@${f.username}</a>
          <div class="follow-item-name">${f.display_name || ''}</div>
          <div class="follow-item-count">${f.film_count || 0} films watched</div>
        </div>
        ${currentUser && f.username !== currentUser.username ? `
          <button class="btn ${f.is_following ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="toggleFollow('${f.username}', ${f.is_following})">
            ${f.is_following ? 'Following ✓' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<div class="empty-state"><p>Could not load following list.</p></div>';
  }
}

/* Navigation Helpers */
function navigateClick(e, path) {
  e.preventDefault();
  navigate(path);
  return false;
}

window.addEventListener('popstate', () => {
  navigate(window.location.pathname);
});

function navigate(path) {
  window.history.pushState({}, '', path);

  if (!currentUser) {
    if (path === '/login') { showPage('login'); return; }
    if (path === '/register') { showPage('register'); return; }
    showPage('landing');
    return;
  }

  const profileMatch = path.match(/^\/u\/([^/]+)(?:\/(films|stats|followers|following))?$/);
  if (profileMatch) {
    const username = profileMatch[1];
    const tab = profileMatch[2] || 'films';
    if (tab === 'followers') loadFollowers(username);
    else if (tab === 'following') loadFollowing(username);
    else loadProfile(username, tab);
    return;
  }

  if (path === '/settings') {
    showPage('settings');
    loadSettings();
    return;
  }

  if (path === '/') {
    feedCursor = 0;
    feedHasMore = true;
    showPage('feed');
    loadFeed();
    return;
  }
}

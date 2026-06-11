/* ─────────────────────────────────────────────────────────────────────────────
   auth.js — LocalStorage token tracker + dynamic navigation
───────────────────────────────────────────────────────────────────────────── */

// ── Token helpers ─────────────────────────────────────────────────────────────
export function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

// ── Redirect helpers ──────────────────────────────────────────────────────────
export function requireAuth(redirectTo = '/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export function redirectIfAuth(redirectTo = '/index.html') {
  if (isLoggedIn()) {
    window.location.href = redirectTo;
    return true;
  }
  return false;
}

// ── Build the navigation bar ──────────────────────────────────────────────────
export function buildNav(activePage = '') {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const user = getUser();
  const logged = isLoggedIn();

  const pages = [
    { href: '/index.html',   label: 'Feed',   icon: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`, page: 'feed' },
  ];

  const linksHtml = pages
    .map(
      (p) =>
        `<a href="${p.href}" class="nav-link ${activePage === p.page ? 'active' : ''}">${p.icon}<span>${p.label}</span></a>`
    )
    .join('');

  const rightHtml = logged
    ? `<a href="/profile.html?u=${user?.username}" class="nav-link" style="gap:8px;">
         <div class="avatar avatar-sm nav-avatar" style="background:${user?.avatarColor || '#6366F1'}">${user?.initials || '?'}</div>
         <span class="nav-username">${user?.username || ''}</span>
       </a>
       <button class="nav-btn outline" id="logout-btn">Logout</button>`
    : `<a href="/login.html" class="nav-link ${activePage === 'login' ? 'active' : ''}"><span>Sign In</span></a>
       <a href="/register.html" class="nav-btn">Join Now</a>`;

  nav.innerHTML = `
    <div class="navbar-inner">
      <a href="/index.html" class="nav-brand">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="color:#6366F1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
        </svg>
        DevStream
      </a>
      <div class="nav-links">
        ${linksHtml}
        ${rightHtml}
      </div>
    </div>`;

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearAuth();
    window.location.href = '/login.html';
  });
}

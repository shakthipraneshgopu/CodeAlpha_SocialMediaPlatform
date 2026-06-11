/* ─────────────────────────────────────────────────────────────────────────────
   profile.js — Display a user's profile, stats, and their posts
───────────────────────────────────────────────────────────────────────────── */

import { authAPI, postsAPI, showToast, timeAgo, escapeHtml } from './api.js';
import { buildNav, isLoggedIn, getUser } from './auth.js';

buildNav();

const params    = new URLSearchParams(window.location.search);
const username  = params.get('u');
const profileEl = document.getElementById('profile-area');
const postsEl   = document.getElementById('user-posts');

if (!username) {
  // No username in URL → redirect to own profile or home
  const me = getUser();
  if (me) window.location.href = `/profile.html?u=${me.username}`;
  else window.location.href = '/index.html';
}

async function loadProfile() {
  profileEl.innerHTML = `<div class="flex-center" style="padding:40px"><div class="spinner"></div></div>`;
  postsEl.innerHTML   = '';

  try {
    const [user, posts] = await Promise.all([
      authAPI.getProfile(username),
      (async () => {
        // we need the user id first; handled by catch below if needed
        try {
          const u = await authAPI.getProfile(username);
          return postsAPI.getByUser(u.id);
        } catch { return []; }
      })(),
    ]);

    renderProfile(user, posts);
  } catch (err) {
    profileEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">👤</div>
      <div class="empty-title">User not found</div>
      <div class="empty-sub">@${escapeHtml(username)} doesn't exist.</div>
    </div>`;
  }
}

async function renderProfile(user, posts) {
  const me = getUser();
  const isMe = me && me.id === user.id;

  profileEl.innerHTML = `
    <div class="profile-header">
      <div class="profile-top">
        <div class="avatar avatar-xl" style="background:${user.avatarColor}">${escapeHtml(user.initials)}</div>
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(user.name)}</div>
          <div class="profile-username">@${escapeHtml(user.username)}</div>
          ${user.bio ? `<p class="profile-bio mt-8">${escapeHtml(user.bio)}</p>` : '<p class="profile-bio mt-8" style="color:var(--text-3);font-style:italic">No bio yet.</p>'}
          <div class="profile-stats mt-12">
            <div class="stat">
              <span class="stat-num">${posts.length}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat">
              <span class="stat-num">${posts.reduce((a, p) => a + p.likes.length, 0)}</span>
              <span class="stat-label">Likes received</span>
            </div>
            <div class="stat">
              <span class="stat-num">${new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <span class="stat-label">Joined</span>
            </div>
          </div>
        </div>
      </div>
      ${isMe ? `
        <div id="edit-area" class="mt-16" style="border-top:1px solid var(--border);padding-top:16px">
          <button class="btn btn-primary btn-sm" id="edit-toggle-btn">✏️ Edit Profile</button>
          <div id="edit-form" class="hidden" style="margin-top:14px;display:flex;flex-direction:column;gap:10px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Display Name</label>
              <input class="form-input" id="edit-name" value="${escapeHtml(user.name)}" placeholder="Your name">
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Bio</label>
              <input class="form-input" id="edit-bio" value="${escapeHtml(user.bio || '')}" placeholder="Tell people about yourself…">
            </div>
            <button class="btn btn-primary btn-sm w-full" id="save-profile-btn">Save Changes</button>
          </div>
        </div>` : ''}
    </div>`;

  // Edit profile toggle
  document.getElementById('edit-toggle-btn')?.addEventListener('click', () => {
    document.getElementById('edit-form').classList.toggle('hidden');
  });

  document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const updated = await authAPI.updateProfile({
        name: document.getElementById('edit-name').value,
        bio:  document.getElementById('edit-bio').value,
      });
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: updated.name, bio: updated.bio, initials: updated.initials }));
      showToast('Profile updated!', 'success');
      loadProfile();
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  // Render posts
  if (posts.length === 0) {
    postsEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-title">No posts yet</div>
      <div class="empty-sub">${isMe ? 'Share your first post on the feed!' : `${escapeHtml(user.name)} hasn't posted yet.`}</div>
    </div>`;
    return;
  }

  postsEl.innerHTML = `<div class="section-heading">Posts</div>` + posts.map(buildMiniCard).join('');
  postsEl.querySelectorAll('.like-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      if (!isLoggedIn()) { showToast('Log in to like posts', 'info'); return; }
      const id = e.currentTarget.dataset.id;
      try {
        const res = await postsAPI.toggleLike(id);
        btn.classList.toggle('liked', res.liked);
        btn.querySelector('svg').setAttribute('fill', res.liked ? 'currentColor' : 'none');
        btn.querySelector('.like-count').textContent = res.likes.length;
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

function buildMiniCard(post) {
  const me = getUser();
  const isLiked = me && post.likes.includes(me.id);
  return `
  <article class="post-card" data-id="${post.id}">
    <p class="post-content">${escapeHtml(post.content)}</p>
    <div class="post-actions" style="justify-content:space-between">
      <div style="display:flex;gap:4px">
        <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${post.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          <span class="like-count">${post.likes.length}</span>
        </button>
        <a href="/post.html?id=${post.id}" class="post-action-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <span>${post.comments.length}</span>
        </a>
      </div>
      <span class="post-time">${timeAgo(post.createdAt)}</span>
    </div>
  </article>`;
}

loadProfile();

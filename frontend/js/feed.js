/* ─────────────────────────────────────────────────────────────────────────────
   feed.js — Global timeline: compose posts, display feed, handle likes
───────────────────────────────────────────────────────────────────────────── */

import { postsAPI, showToast, timeAgo, escapeHtml } from './api.js';
import { buildNav, isLoggedIn, getUser } from './auth.js';

const MAX_CHARS = 500;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const feedEl        = document.getElementById('feed');
const composerEl    = document.getElementById('composer');
const textareaEl    = document.getElementById('post-textarea');
const charCountEl   = document.getElementById('char-count');
const postBtnEl     = document.getElementById('post-btn');
const loginBannerEl = document.getElementById('login-banner');

// ── Init ──────────────────────────────────────────────────────────────────────
buildNav('feed');

if (isLoggedIn()) {
  const user = getUser();
  const avatarEl = document.getElementById('composer-avatar');
  if (avatarEl) {
    avatarEl.style.background = user?.avatarColor || '#6366F1';
    avatarEl.textContent = user?.initials || '?';
  }
  composerEl?.classList.remove('hidden');
  loginBannerEl?.classList.add('hidden');
} else {
  composerEl?.classList.add('hidden');
  loginBannerEl?.classList.remove('hidden');
}

// ── Char counter ──────────────────────────────────────────────────────────────
textareaEl?.addEventListener('input', () => {
  const len = textareaEl.value.length;
  const rem = MAX_CHARS - len;
  charCountEl.textContent = `${len}/${MAX_CHARS}`;
  charCountEl.className = 'char-count' + (rem < 50 ? ' warn' : '') + (rem < 0 ? ' error' : '');
  postBtnEl.disabled = len === 0 || len > MAX_CHARS;
});

// ── Submit post ───────────────────────────────────────────────────────────────
postBtnEl?.addEventListener('click', async () => {
  const content = textareaEl.value.trim();
  if (!content) return;

  postBtnEl.disabled = true;
  postBtnEl.innerHTML = `<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>`;

  try {
    const newPost = await postsAPI.create({ content });
    textareaEl.value = '';
    charCountEl.textContent = `0/${MAX_CHARS}`;
    charCountEl.className = 'char-count';

    // Prepend to feed
    const card = buildPostCard(newPost);
    feedEl.insertAdjacentHTML('afterbegin', card);
    bindPostCard(feedEl.querySelector('.post-card'));
    document.getElementById('empty-feed')?.remove();

    showToast('Post shared!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    postBtnEl.disabled = false;
    postBtnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Share`;
  }
});

// ── Load feed ─────────────────────────────────────────────────────────────────
async function loadFeed() {
  feedEl.innerHTML = buildSkeletons(3);
  try {
    const posts = await postsAPI.getAll();
    if (posts.length === 0) {
      feedEl.innerHTML = `<div id="empty-feed" class="empty-state">
        <div class="empty-icon">🌱</div>
        <div class="empty-title">No posts yet</div>
        <div class="empty-sub">Be the first to share something!</div>
      </div>`;
      return;
    }
    feedEl.innerHTML = posts.map(buildPostCard).join('');
    feedEl.querySelectorAll('.post-card').forEach(bindPostCard);
  } catch (err) {
    feedEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Could not load feed</div><div class="empty-sub">${err.message}</div></div>`;
  }
}

loadFeed();

// ── Build a post card HTML string ─────────────────────────────────────────────
function buildPostCard(post) {
  const me = getUser();
  const isLiked = me && post.likes.includes(me.id);
  const isOwner = me && post.userId === me.id;

  return `
  <article class="post-card" data-id="${post.id}">
    <div class="post-header">
      <div class="post-author">
        <a href="/profile.html?u=${escapeHtml(post.author.username)}">
          <div class="avatar avatar-md" style="background:${post.author.avatarColor}">${escapeHtml(post.author.initials)}</div>
        </a>
        <div class="post-author-info">
          <a href="/profile.html?u=${escapeHtml(post.author.username)}" class="post-author-name">${escapeHtml(post.author.name)}</a>
          <span class="post-author-username">@${escapeHtml(post.author.username)}</span>
        </div>
      </div>
      <span class="post-time">${timeAgo(post.createdAt)}</span>
    </div>
    <p class="post-content">${escapeHtml(post.content)}</p>
    <div class="post-actions">
      <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${post.id}" ${!isLoggedIn() ? 'title="Log in to like"' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        <span class="like-count">${post.likes.length}</span>
      </button>
      <a href="/post.html?id=${post.id}" class="post-action-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <span>${post.comments.length}</span>
      </a>
      ${isOwner ? `<button class="delete-btn" data-id="${post.id}" title="Delete post">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>` : ''}
    </div>
  </article>`;
}

// ── Bind interactive events on a card ─────────────────────────────────────────
function bindPostCard(card) {
  // Like
  card.querySelector('.like-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) { showToast('Log in to like posts', 'info'); return; }
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    try {
      const res = await postsAPI.toggleLike(id);
      btn.classList.toggle('liked', res.liked);
      btn.querySelector('svg').setAttribute('fill', res.liked ? 'currentColor' : 'none');
      btn.querySelector('.like-count').textContent = res.likes.length;
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Delete
  card.querySelector('.delete-btn')?.addEventListener('click', async (e) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const id = e.currentTarget.dataset.id;
    try {
      await postsAPI.delete(id);
      card.remove();
      showToast('Post deleted.', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });
}

// ── Skeleton loader HTML ──────────────────────────────────────────────────────
function buildSkeletons(n) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div class="skeleton skeleton-circle" style="width:42px;height:42px;flex-shrink:0"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-line" style="width:40%"></div>
          <div class="skeleton skeleton-line" style="width:25%;height:10px"></div>
        </div>
      </div>
      <div class="skeleton skeleton-line" style="width:100%"></div>
      <div class="skeleton skeleton-line" style="width:80%"></div>
      <div class="skeleton skeleton-line" style="width:55%;margin-bottom:0"></div>
    </div>`).join('');
}

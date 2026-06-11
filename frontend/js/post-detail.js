/* ─────────────────────────────────────────────────────────────────────────────
   post-detail.js — Full post view + comments thread
───────────────────────────────────────────────────────────────────────────── */

import { postsAPI, commentsAPI, showToast, timeAgo, escapeHtml } from './api.js';
import { buildNav, isLoggedIn, getUser } from './auth.js';

buildNav();

const params  = new URLSearchParams(window.location.search);
const postId  = params.get('id');
const postEl  = document.getElementById('post-detail');
const commsEl = document.getElementById('comments-area');

if (!postId) {
  window.location.href = '/index.html';
}

async function loadPost() {
  postEl.innerHTML = `<div class="flex-center" style="padding:40px"><div class="spinner"></div></div>`;
  commsEl.innerHTML = '';

  try {
    const post = await postsAPI.getById(postId);
    renderPost(post);
    renderComments(post.comments);
  } catch (err) {
    postEl.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <div class="empty-title">Post not found</div>
      <div class="empty-sub">${err.message}</div>
    </div>`;
  }
}

function renderPost(post) {
  const me = getUser();
  const isLiked = me && post.likes.includes(me.id);
  const isOwner = me && post.userId === me.id;

  postEl.innerHTML = `
    <div class="post-card" style="border-radius:var(--radius);margin-bottom:8px">
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
      <p class="post-content" style="font-size:1rem">${escapeHtml(post.content)}</p>
      <div class="post-actions">
        <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" id="main-like-btn" data-id="${post.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          <span id="like-count">${post.likes.length}</span> Likes
        </button>
        <span class="post-action-btn" style="cursor:default;pointer-events:none">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <span id="comment-count">${post.comments.length}</span> Comments
        </span>
        ${isOwner ? `<button class="delete-btn" id="delete-post-btn" title="Delete post">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg> Delete Post
        </button>` : ''}
      </div>
    </div>`;

  // Like
  document.getElementById('main-like-btn')?.addEventListener('click', async () => {
    if (!isLoggedIn()) { showToast('Log in to like posts', 'info'); return; }
    try {
      const res = await postsAPI.toggleLike(postId);
      const btn = document.getElementById('main-like-btn');
      btn.classList.toggle('liked', res.liked);
      btn.querySelector('svg').setAttribute('fill', res.liked ? 'currentColor' : 'none');
      document.getElementById('like-count').textContent = res.likes.length;
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Delete post
  document.getElementById('delete-post-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      await postsAPI.delete(postId);
      showToast('Post deleted.', 'success');
      setTimeout(() => window.location.href = '/index.html', 800);
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function renderComments(comments) {
  const me = getUser();

  const listHtml = comments.length === 0
    ? `<div class="empty-state" style="padding:28px">
         <div class="empty-icon">💬</div>
         <div class="empty-title">No comments yet</div>
         <div class="empty-sub">Start the conversation!</div>
       </div>`
    : `<div class="comment-list" id="comment-list">
        ${comments.map((c) => buildCommentHtml(c, me)).join('')}
       </div>`;

  const inputHtml = isLoggedIn()
    ? `<div class="comment-input-row mt-16">
         <div class="avatar avatar-sm" style="background:${me?.avatarColor || '#6366F1'};flex-shrink:0">${me?.initials || '?'}</div>
         <input class="comment-input" id="comment-input" placeholder="Write a comment…" maxlength="300">
         <button class="btn-icon btn-primary" id="send-comment-btn" disabled>
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
         </button>
       </div>`
    : `<p class="mt-16" style="text-align:center;font-size:.875rem;color:var(--text-3)">
         <a href="/login.html" style="color:var(--primary);font-weight:600">Log in</a> to leave a comment.
       </p>`;

  commsEl.innerHTML = `
    <div class="comments-section card" style="padding:20px">
      <div class="comments-title">Comments · <span id="comment-count-2">${comments.length}</span></div>
      ${listHtml}
      ${inputHtml}
    </div>`;

  bindCommentInput();
  bindCommentDeletes();
}

function buildCommentHtml(c, me) {
  const isOwner = me && (me.id === c.userId || me.id === c.userId);
  return `
    <div class="comment-item" data-comment-id="${c.id}">
      <a href="/profile.html?u=${escapeHtml(c.author.username)}">
        <div class="avatar avatar-sm" style="background:${c.author.avatarColor}">${escapeHtml(c.author.initials)}</div>
      </a>
      <div class="comment-bubble" style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <a href="/profile.html?u=${escapeHtml(c.author.username)}" class="comment-author">${escapeHtml(c.author.name)}</a>
          ${isOwner ? `<button class="delete-btn comment-del-btn" data-cid="${c.id}" title="Delete comment" style="margin-left:auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>` : ''}
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
        <span class="comment-time">${timeAgo(c.createdAt)}</span>
      </div>
    </div>`;
}

function bindCommentInput() {
  const input = document.getElementById('comment-input');
  const btn   = document.getElementById('send-comment-btn');
  if (!input || !btn) return;

  input.addEventListener('input', () => { btn.disabled = input.value.trim().length === 0; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btn.click(); } });

  btn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) return;
    btn.disabled = true;
    try {
      const comment = await commentsAPI.add(postId, { text });
      input.value = '';

      // Add to DOM
      const me = getUser();
      const newHtml = buildCommentHtml(comment, me);
      let list = document.getElementById('comment-list');
      if (!list) {
        // Replace empty state
        commsEl.querySelector('.empty-state')?.remove();
        const wrapper = document.createElement('div');
        wrapper.id = 'comment-list'; wrapper.className = 'comment-list';
        commsEl.querySelector('.comments-section').insertBefore(wrapper, commsEl.querySelector('.comment-input-row') || null);
        list = wrapper;
      }
      list.insertAdjacentHTML('beforeend', newHtml);
      bindCommentDeletes();

      // Update counter
      const counter = document.getElementById('comment-count-2');
      if (counter) counter.textContent = parseInt(counter.textContent) + 1;
      document.getElementById('comment-count') && (document.getElementById('comment-count').textContent = parseInt(document.getElementById('comment-count').textContent) + 1);

      showToast('Comment added!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function bindCommentDeletes() {
  commsEl.querySelectorAll('.comment-del-btn').forEach((btn) => {
    // Avoid double-binding
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', async () => {
      const cid = btn.dataset.cid;
      if (!confirm('Delete this comment?')) return;
      try {
        await commentsAPI.delete(postId, cid);
        btn.closest('.comment-item').remove();
        const counter = document.getElementById('comment-count-2');
        if (counter) counter.textContent = Math.max(0, parseInt(counter.textContent) - 1);
        showToast('Comment deleted.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });
}

loadPost();

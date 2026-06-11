/* ─────────────────────────────────────────────────────────────────────────────
   api.js — Centralised fetch wrapper + toast notifications
───────────────────────────────────────────────────────────────────────────── */

const BASE_URL = '/api';

// ── Toast Notification System ────────────────────────────────────────────────
let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info') {
  const container = ensureToastContainer();

  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// ── Core Fetch Helper ────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Error ${res.status}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  getMe:    ()     => request('/auth/me'),
  getProfile: (username) => request(`/auth/profile/${username}`),
  updateProfile: (body)  => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
};

// ── Posts API ────────────────────────────────────────────────────────────────
export const postsAPI = {
  getAll:       ()       => request('/posts'),
  getById:      (id)     => request(`/posts/${id}`),
  getByUser:    (userId) => request(`/posts/user/${userId}`),
  create:       (body)   => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
  toggleLike:   (id)     => request(`/posts/${id}/like`, { method: 'POST' }),
  delete:       (id)     => request(`/posts/${id}`, { method: 'DELETE' }),
};

// ── Comments API ─────────────────────────────────────────────────────────────
export const commentsAPI = {
  add:    (postId, body)            => request(`/comments/${postId}`, { method: 'POST', body: JSON.stringify(body) }),
  delete: (postId, commentId)       => request(`/comments/${postId}/${commentId}`, { method: 'DELETE' }),
};

// ── Utility: relative time ───────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Utility: escape HTML ─────────────────────────────────────────────────────
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

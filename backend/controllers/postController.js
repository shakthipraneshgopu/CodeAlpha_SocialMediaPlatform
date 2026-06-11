const { v4: uuidv4 } = require('uuid');
const { readData, writeData, POSTS_FILE, USERS_FILE } = require('../config/db');

// ── Helper: attach author info to posts ────────────────────────────────────
const enrichPost = (post, users) => {
  const author = users.find((u) => u.id === post.userId);
  return {
    ...post,
    author: author
      ? { id: author.id, username: author.username, name: author.name, initials: author.initials, avatarColor: author.avatarColor }
      : { id: post.userId, username: 'deleted_user', name: 'Deleted User', initials: '?', avatarColor: '#9CA3AF' },
  };
};

// GET /api/posts  (public - global feed, newest first)
const getAllPosts = (req, res) => {
  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);
  const enriched = posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((p) => enrichPost(p, users));
  res.json(enriched);
};

// GET /api/posts/:id  (public - single post)
const getPostById = (req, res) => {
  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);
  const post = posts.find((p) => p.id === req.params.id);

  if (!post) return res.status(404).json({ message: 'Post not found.' });

  // Enrich comments with author info too
  const enrichedComments = post.comments.map((c) => {
    const author = users.find((u) => u.id === c.userId);
    return {
      ...c,
      author: author
        ? { id: author.id, username: author.username, name: author.name, initials: author.initials, avatarColor: author.avatarColor }
        : { id: c.userId, username: 'deleted_user', name: 'Deleted User', initials: '?', avatarColor: '#9CA3AF' },
    };
  });

  res.json(enrichPost({ ...post, comments: enrichedComments }, users));
};

// GET /api/posts/user/:userId  (public - posts by a specific user)
const getPostsByUser = (req, res) => {
  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);
  const userPosts = posts
    .filter((p) => p.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((p) => enrichPost(p, users));
  res.json(userPosts);
};

// POST /api/posts  (protected)
const createPost = (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Post content cannot be empty.' });
  }
  if (content.trim().length > 500) {
    return res.status(400).json({ message: 'Post content cannot exceed 500 characters.' });
  }

  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);

  const newPost = {
    id: uuidv4(),
    userId: req.user.id,
    content: content.trim(),
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(newPost);
  writeData(POSTS_FILE, posts);

  res.status(201).json(enrichPost(newPost, users));
};

// POST /api/posts/:id/like  (protected - toggle like)
const toggleLike = (req, res) => {
  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);
  const idx = posts.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: 'Post not found.' });

  const likedIdx = posts[idx].likes.indexOf(req.user.id);

  if (likedIdx === -1) {
    posts[idx].likes.push(req.user.id);
  } else {
    posts[idx].likes.splice(likedIdx, 1);
  }

  writeData(POSTS_FILE, posts);
  res.json({ likes: posts[idx].likes, liked: likedIdx === -1 });
};

// DELETE /api/posts/:id  (protected - only post owner)
const deletePost = (req, res) => {
  const posts = readData(POSTS_FILE);
  const idx = posts.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: 'Post not found.' });
  if (posts[idx].userId !== req.user.id) {
    return res.status(403).json({ message: 'You can only delete your own posts.' });
  }

  posts.splice(idx, 1);
  writeData(POSTS_FILE, posts);
  res.json({ message: 'Post deleted.' });
};

module.exports = { getAllPosts, getPostById, getPostsByUser, createPost, toggleLike, deletePost };

const { v4: uuidv4 } = require('uuid');
const { readData, writeData, POSTS_FILE, USERS_FILE } = require('../config/db');

// POST /api/comments/:postId  (protected)
const addComment = (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'Comment cannot be empty.' });
  }
  if (text.trim().length > 300) {
    return res.status(400).json({ message: 'Comment cannot exceed 300 characters.' });
  }

  const posts = readData(POSTS_FILE);
  const users = readData(USERS_FILE);
  const idx = posts.findIndex((p) => p.id === req.params.postId);

  if (idx === -1) return res.status(404).json({ message: 'Post not found.' });

  const newComment = {
    id: uuidv4(),
    userId: req.user.id,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  posts[idx].comments.push(newComment);
  writeData(POSTS_FILE, posts);

  // Return comment enriched with author info
  const author = users.find((u) => u.id === req.user.id);
  const enrichedComment = {
    ...newComment,
    author: author
      ? { id: author.id, username: author.username, name: author.name, initials: author.initials, avatarColor: author.avatarColor }
      : { id: req.user.id, username: req.user.username, name: req.user.name, initials: '?', avatarColor: '#9CA3AF' },
  };

  res.status(201).json(enrichedComment);
};

// DELETE /api/comments/:postId/:commentId  (protected - comment owner or post owner)
const deleteComment = (req, res) => {
  const posts = readData(POSTS_FILE);
  const postIdx = posts.findIndex((p) => p.id === req.params.postId);

  if (postIdx === -1) return res.status(404).json({ message: 'Post not found.' });

  const commentIdx = posts[postIdx].comments.findIndex((c) => c.id === req.params.commentId);

  if (commentIdx === -1) return res.status(404).json({ message: 'Comment not found.' });

  const comment = posts[postIdx].comments[commentIdx];
  const isCommentOwner = comment.userId === req.user.id;
  const isPostOwner = posts[postIdx].userId === req.user.id;

  if (!isCommentOwner && !isPostOwner) {
    return res.status(403).json({ message: 'You can only delete your own comments.' });
  }

  posts[postIdx].comments.splice(commentIdx, 1);
  writeData(POSTS_FILE, posts);
  res.json({ message: 'Comment deleted.' });
};

module.exports = { addComment, deleteComment };

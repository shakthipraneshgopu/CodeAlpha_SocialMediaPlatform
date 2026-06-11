const express = require('express');
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  getPostsByUser,
  createPost,
  toggleLike,
  deletePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

router.get('/', getAllPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.delete('/:id', protect, deletePost);

module.exports = router;

const express = require('express');
const router = express.Router();
const { addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.post('/:postId', protect, addComment);
router.delete('/:postId/:commentId', protect, deleteComment);

module.exports = router;

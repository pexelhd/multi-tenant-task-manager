const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :taskId
const verifyToken = require('../middleware/auth');
const loadDbUser = require('../middleware/loadDbUser');
const requireRole = require('../middleware/rbac');
const commentController = require('../controllers/commentController');

router.use(verifyToken, loadDbUser);

router.get('/',    requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), commentController.getComments);
router.post('/',   requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), commentController.createComment);
router.delete('/:commentId', requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), commentController.deleteComment);

module.exports = router;

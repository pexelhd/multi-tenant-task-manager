const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const aiChatController = require('../controllers/aiChatController');

// Any authenticated user (any role) can use the chat
router.post('/', verifyToken, aiChatController.chat);

module.exports = router;

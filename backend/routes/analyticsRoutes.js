const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const loadDbUser = require('../middleware/loadDbUser');
const analyticsController = require('../controllers/analyticsController');

router.get('/', verifyToken, loadDbUser, analyticsController.getAnalytics);

module.exports = router;

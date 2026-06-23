const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const dbController = require('../controllers/dbController');

router.get('/summary', verifyToken, dbController.getSummary);

module.exports = router;

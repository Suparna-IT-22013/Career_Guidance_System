const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware, adminController.getStats);
router.get('/users', authMiddleware, adminController.getAllUsers);
router.get('/recent-users', authMiddleware, adminController.getRecentUsers);
router.get('/top-careers', authMiddleware, adminController.getTopCareerSearches);

module.exports = router;
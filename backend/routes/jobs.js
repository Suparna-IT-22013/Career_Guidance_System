const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const authMiddleware = require('../middleware/auth');

router.get('/all', authMiddleware, jobController.getAllJobs);
router.get('/:id', authMiddleware, jobController.getJobById);
router.post('/save', authMiddleware, jobController.saveJob);
router.post('/apply', authMiddleware, jobController.applyJob);
router.get('/user/applications', authMiddleware, jobController.getUserApplications);

module.exports = router;
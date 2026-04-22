const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const authMiddleware = require('../middleware/auth');

router.post('/assessment', authMiddleware, careerController.submitAssessment);
router.get('/recommendations/:assessmentId', authMiddleware, careerController.getRecommendations);
router.get('/progress', authMiddleware, careerController.getProgress);
router.post('/progress', authMiddleware, careerController.addProgress);
router.put('/progress/:id', authMiddleware, careerController.updateProgress);
router.get('/assessment-history', authMiddleware, careerController.getAssessmentHistory);

module.exports = router;
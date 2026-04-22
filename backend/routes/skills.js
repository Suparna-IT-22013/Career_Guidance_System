const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/auth');

router.get('/user', authMiddleware, skillController.getUserSkills);
router.post('/add', authMiddleware, skillController.addSkill);
router.put('/update/:id', authMiddleware, skillController.updateSkill);
router.get('/gap/:jobId', authMiddleware, skillController.getSkillGap);
router.get('/career-gap/:careerPath', authMiddleware, skillController.getCareerSkillGap);
router.delete('/delete-all', authMiddleware, skillController.deleteAllUserSkills);

module.exports = router;
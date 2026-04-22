const db = require('../config/db');

// Career path matching algorithm
const careerMatching = {
    'Software Developer': {
        skills: ['programming', 'problem-solving', 'coding', 'javascript', 'python'],
        interests: ['technology', 'computers', 'coding', 'software'],
        education: ['bachelors', 'masters']
    },
    'Data Scientist': {
        skills: ['analytics', 'statistics', 'python', 'machine-learning', 'mathematics'],
        interests: ['data', 'analytics', 'research', 'statistics'],
        education: ['bachelors', 'masters', 'phd']
    },
    'Web Designer': {
        skills: ['design', 'html', 'css', 'creativity', 'ui-ux'],
        interests: ['design', 'art', 'creativity', 'web'],
        education: ['diploma', 'bachelors']
    },
    'Digital Marketing Specialist': {
        skills: ['marketing', 'seo', 'social-media', 'content-creation', 'analytics'],
        interests: ['marketing', 'social-media', 'communication', 'business'],
        education: ['diploma', 'bachelors']
    },
    'Project Manager': {
        skills: ['leadership', 'communication', 'organization', 'planning'],
        interests: ['management', 'leadership', 'business', 'coordination'],
        education: ['bachelors', 'masters', 'mba']
    },
    'Cybersecurity Analyst': {
        skills: ['security', 'networking', 'problem-solving', 'ethical-hacking'],
        interests: ['security', 'technology', 'protection', 'investigation'],
        education: ['bachelors', 'masters']
    },
    'Graphic Designer': {
        skills: ['design', 'creativity', 'adobe', 'illustration', 'branding'],
        interests: ['art', 'design', 'creativity', 'visual'],
        education: ['diploma', 'bachelors']
    },
    'Business Analyst': {
        skills: ['analysis', 'communication', 'business', 'problem-solving'],
        interests: ['business', 'analytics', 'strategy', 'consulting'],
        education: ['bachelors', 'masters', 'mba']
    }
};

function calculateMatch(userProfile, careerPath) {
    const career = careerMatching[careerPath];
    if (!career) return 0;

    let score = 0;
    let totalWeightage = 0;

    // Skills matching (40% weightage)
    const userSkills = userProfile.skills.toLowerCase().split(',').map(s => s.trim());
    const matchedSkills = userSkills.filter(skill => 
        career.skills.some(careerSkill => skill.includes(careerSkill) || careerSkill.includes(skill))
    );
    score += (matchedSkills.length / career.skills.length) * 40;
    totalWeightage += 40;

    // Interests matching (30% weightage)
    const userInterests = userProfile.interests.toLowerCase().split(',').map(s => s.trim());
    const matchedInterests = userInterests.filter(interest => 
        career.interests.some(careerInterest => interest.includes(careerInterest) || careerInterest.includes(interest))
    );
    score += (matchedInterests.length / career.interests.length) * 30;
    totalWeightage += 30;

    // Education matching (20% weightage)
    if (career.education.includes(userProfile.education_level.toLowerCase())) {
        score += 20;
    }
    totalWeightage += 20;

    // Experience matching (10% weightage)
    if (userProfile.work_experience >= 0) {
        score += 10;
    }
    totalWeightage += 10;

    return Math.round((score / totalWeightage) * 100);
}

exports.submitAssessment = async (req, res) => {
    try {
        const { interests, skills, education_level, work_experience, preferred_industry } = req.body;
        const userId = req.userId;

        // Validate input
        if (!interests || !skills || !education_level) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // Insert assessment
        const [result] = await db.query(
            `INSERT INTO assessments (user_id, interests, skills, education_level, work_experience, preferred_industry) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, interests, skills, education_level, work_experience || 0, preferred_industry || '']
        );

        const assessmentId = result.insertId;

        // Calculate recommendations
        const userProfile = { interests, skills, education_level, work_experience: work_experience || 0 };
        const recommendations = [];

        for (const careerPath in careerMatching) {
            const matchPercentage = calculateMatch(userProfile, careerPath);
            
            if (matchPercentage >= 30) { // Only include careers with 30%+ match
                const career = careerMatching[careerPath];
                recommendations.push({
                    career_path: careerPath,
                    match_percentage: matchPercentage,
                    description: `A career in ${careerPath} that aligns with your skills and interests.`,
                    required_skills: career.skills.join(', ')
                });
            }
        }

        // Sort by match percentage
        recommendations.sort((a, b) => b.match_percentage - a.match_percentage);

        // Insert recommendations
        for (const rec of recommendations.slice(0, 5)) { // Top 5 recommendations
            await db.query(
                `INSERT INTO recommendations (assessment_id, career_path, match_percentage, description, required_skills) 
                 VALUES (?, ?, ?, ?, ?)`,
                [assessmentId, rec.career_path, rec.match_percentage, rec.description, rec.required_skills]
            );
        }

        res.status(201).json({
            message: 'Assessment submitted successfully',
            assessmentId,
            recommendations
        });
    } catch (error) {
        console.error('Submit assessment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        const [recommendations] = await db.query(
            'SELECT * FROM recommendations WHERE assessment_id = ? ORDER BY match_percentage DESC',
            [assessmentId]
        );

        res.json({ recommendations });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProgress = async (req, res) => {
    try {
        const userId = req.userId;

        const [progress] = await db.query(
            'SELECT * FROM progress WHERE user_id = ? ORDER BY started_at DESC',
            [userId]
        );

        res.json({ progress });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addProgress = async (req, res) => {
    try {
        const { course_name, status, completion_percentage } = req.body;
        const userId = req.userId;

        const [result] = await db.query(
            'INSERT INTO progress (user_id, course_name, status, completion_percentage) VALUES (?, ?, ?, ?)',
            [userId, course_name, status || 'In Progress', completion_percentage || 0]
        );

        res.status(201).json({
            message: 'Progress added successfully',
            progressId: result.insertId
        });
    } catch (error) {
        console.error('Add progress error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, completion_percentage } = req.body;
        const userId = req.userId;

        await db.query(
            'UPDATE progress SET status = ?, completion_percentage = ? WHERE id = ? AND user_id = ?',
            [status, completion_percentage, id, userId]
        );

        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getAssessmentHistory = async (req, res) => {
    try {
        const userId = req.userId;

        // Get all assessments for this user
        const [assessments] = await db.query(
            `SELECT a.*, 
                    (SELECT COUNT(*) FROM recommendations WHERE assessment_id = a.id) as recommendation_count
             FROM assessments a
             WHERE a.user_id = ?
             ORDER BY a.created_at DESC`,
            [userId]
        );

        // For each assessment, get top 3 recommendations
        const assessmentsWithRecommendations = await Promise.all(
            assessments.map(async (assessment) => {
                const [recommendations] = await db.query(
                    `SELECT * FROM recommendations 
                     WHERE assessment_id = ? 
                     ORDER BY match_percentage DESC 
                     LIMIT 3`,
                    [assessment.id]
                );
                
                return {
                    ...assessment,
                    top_recommendations: recommendations
                };
            })
        );

        res.json({ assessments: assessmentsWithRecommendations });
    } catch (error) {
        console.error('Get assessment history error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
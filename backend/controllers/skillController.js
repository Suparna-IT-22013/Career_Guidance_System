const db = require('../config/db');

exports.getUserSkills = async (req, res) => {
    try {
        const userId = req.userId;
        const [skills] = await db.query('SELECT * FROM skills WHERE user_id = ?', [userId]);
        res.json({ skills });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addSkill = async (req, res) => {
    try {
        const { skill_name, skill_level } = req.body;
        const userId = req.userId;

        await db.query(
            'INSERT INTO skills (user_id, skill_name, skill_level) VALUES (?, ?, ?)',
            [userId, skill_name, skill_level]
        );

        res.json({ message: 'Skill added successfully' });
    } catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const { skill_level } = req.body;
        const userId = req.userId;

        await db.query(
            'UPDATE skills SET skill_level = ? WHERE id = ? AND user_id = ?',
            [skill_level, id, userId]
        );

        res.json({ message: 'Skill updated successfully' });
    } catch (error) {
        console.error('Update skill error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteAllUserSkills = async (req, res) => {
    try {
        const userId = req.userId;
        await db.query('DELETE FROM skills WHERE user_id = ?', [userId]);
        res.json({ message: 'All skills deleted successfully' });
    } catch (error) {
        console.error('Delete skills error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSkillGap = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.userId;

        // Get job required skills
        const [jobs] = await db.query('SELECT job_title, required_skills FROM jobs WHERE id = ?', [jobId]);
        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const job = jobs[0];
        const requiredSkills = job.required_skills.split(',').map(s => s.trim());

        // Get user skills
        const [userSkills] = await db.query('SELECT skill_name, skill_level FROM skills WHERE user_id = ?', [userId]);

        // Analyze each required skill
        const skillsAnalysis = requiredSkills.map(reqSkill => {
            // Try to find matching user skill
            const userSkill = userSkills.find(us => 
                us.skill_name.toLowerCase().includes(reqSkill.toLowerCase()) ||
                reqSkill.toLowerCase().includes(us.skill_name.toLowerCase())
            );

            if (userSkill) {
                // User has this skill
                let status = 'Critical';
                let category = 'needs_improvement';
                
                if (userSkill.skill_level >= 70) {
                    status = 'Strong';
                    category = 'you_have';
                } else if (userSkill.skill_level >= 40) {
                    status = 'Good';
                    category = 'needs_improvement';
                } else {
                    status = 'Weak';
                    category = 'critical';
                }

                return {
                    skill_name: reqSkill,
                    user_level: userSkill.skill_level,
                    required_level: 70, // Assume 70% is good for the job
                    gap: Math.max(0, 70 - userSkill.skill_level),
                    status: status,
                    category: category
                };
            } else {
                // User doesn't have this skill
                return {
                    skill_name: reqSkill,
                    user_level: 0,
                    required_level: 70,
                    gap: 70,
                    status: 'Missing',
                    category: 'critical'
                };
            }
        });

        // Categorize skills
        const skillsYouHave = skillsAnalysis.filter(s => s.category === 'you_have');
        const skillsToImprove = skillsAnalysis.filter(s => s.category === 'needs_improvement');
        const criticalSkills = skillsAnalysis.filter(s => s.category === 'critical');

        res.json({
            jobTitle: job.job_title,
            skillsYouHave: skillsYouHave,
            skillsToImprove: skillsToImprove,
            criticalSkills: criticalSkills,
            totalRequired: requiredSkills.length,
            totalGaps: skillsToImprove.length + criticalSkills.length
        });
    } catch (error) {
        console.error('Get skill gap error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get skill gap for a career path (from recommendations)
exports.getCareerSkillGap = async (req, res) => {
    try {
        const { careerPath } = req.params;
        const userId = req.userId;

        // Define required skills for each career path
        const careerRequirements = {
            'Software Developer': ['Python', 'JavaScript', 'Java', 'Git/GitHub', 'REST API', 'SQL/MySQL', 'Problem Solving'],
            'Data Scientist': ['Python', 'Machine Learning', 'Data Analysis', 'Pandas/NumPy', 'SQL/MySQL', 'TensorFlow', 'Problem Solving'],
            'Web Designer': ['HTML/CSS', 'UI/UX Design', 'Figma/Adobe XD', 'JavaScript', 'React', 'Problem Solving', 'Communication'],
            'Digital Marketing': ['Communication', 'Problem Solving', 'Data Analysis', 'Leadership', 'Teamwork'],
            'Project Manager': ['Project Management', 'Leadership', 'Communication', 'Problem Solving', 'Teamwork'],
            'Cybersecurity Analyst': ['Network Security', 'Ethical Hacking', 'Penetration Testing', 'Firewall/IDS/IPS', 'Linux/Unix', 'TCP/IP'],
            'Graphic Designer': ['UI/UX Design', 'Figma/Adobe XD', 'Communication', 'Problem Solving'],
            'Business Analyst': ['Data Analysis', 'Communication', 'Problem Solving', 'Project Management', 'SQL/MySQL']
        };

        const requiredSkills = careerRequirements[careerPath] || [];

        if (requiredSkills.length === 0) {
            return res.status(404).json({ message: 'Career path not found' });
        }

        // Get user skills
        const [userSkills] = await db.query('SELECT skill_name, skill_level FROM skills WHERE user_id = ?', [userId]);

        // Analyze each required skill
        const skillsAnalysis = requiredSkills.map(reqSkill => {
            const userSkill = userSkills.find(us => 
                us.skill_name.toLowerCase().includes(reqSkill.toLowerCase()) ||
                reqSkill.toLowerCase().includes(us.skill_name.toLowerCase())
            );

            if (userSkill) {
                let status = 'Critical';
                let category = 'needs_improvement';
                
                if (userSkill.skill_level >= 70) {
                    status = 'Strong';
                    category = 'you_have';
                } else if (userSkill.skill_level >= 40) {
                    status = 'Good';
                    category = 'needs_improvement';
                } else {
                    status = 'Weak';
                    category = 'critical';
                }

                return {
                    skill_name: reqSkill,
                    user_level: userSkill.skill_level,
                    required_level: 70,
                    gap: Math.max(0, 70 - userSkill.skill_level),
                    status: status,
                    category: category
                };
            } else {
                return {
                    skill_name: reqSkill,
                    user_level: 0,
                    required_level: 70,
                    gap: 70,
                    status: 'Missing',
                    category: 'critical'
                };
            }
        });

        const skillsYouHave = skillsAnalysis.filter(s => s.category === 'you_have');
        const skillsToImprove = skillsAnalysis.filter(s => s.category === 'needs_improvement');
        const criticalSkills = skillsAnalysis.filter(s => s.category === 'critical');

        res.json({
            careerPath: careerPath,
            skillsYouHave: skillsYouHave,
            skillsToImprove: skillsToImprove,
            criticalSkills: criticalSkills,
            totalRequired: requiredSkills.length,
            totalGaps: skillsToImprove.length + criticalSkills.length,
            readinessPercentage: Math.round((skillsYouHave.length / requiredSkills.length) * 100)
        });
    } catch (error) {
        console.error('Get career skill gap error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
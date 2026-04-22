const db = require('../config/db');

exports.getAllJobs = async (req, res) => {
    try {
        const { search, type, location } = req.query;
        const userId = req.userId;

        // STEP 1: Check if user has ANY skills at all
        const [userSkills] = await db.query(
            'SELECT skill_name, skill_level FROM skills WHERE user_id = ?', 
            [userId]
        );

        console.log('User ID:', userId);
        console.log('User Skills Found:', userSkills.length);

        // Build job query
        let query = 'SELECT * FROM jobs WHERE status = "active"';
        const params = [];

        if (search) {
            query += ' AND (job_title LIKE ? OR company_name LIKE ? OR required_skills LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (type) {
            query += ' AND job_type = ?';
            params.push(type);
        }

        if (location) {
            query += ' AND location LIKE ?';
            params.push(`%${location}%`);
        }

        query += ' ORDER BY posted_date DESC';

        const [jobs] = await db.query(query, params);

        // STEP 2: If NO skills found, return ALL jobs with 0% match
        if (!userSkills || userSkills.length === 0) {
            console.log('NO SKILLS - Returning 0% for all jobs');
            
            const jobsWithNoMatch = jobs.map(job => ({
                id: job.id,
                company_name: job.company_name,
                job_title: job.job_title,
                location: job.location,
                job_type: job.job_type,
                salary_range: job.salary_range,
                required_skills: job.required_skills,
                description: job.description,
                posted_date: job.posted_date,
                status: job.status,
                match_percentage: 0  // FORCE 0%
            }));

            return res.json({
                jobs: jobsWithNoMatch,
                userHasSkills: false
            });
        }

        // STEP 3: User HAS skills - calculate actual matches
        console.log('SKILLS FOUND - Calculating real matches');
        
        const userSkillNames = userSkills.map(s => s.skill_name.toLowerCase());

        const jobsWithMatch = jobs.map(job => {
            const requiredSkills = job.required_skills.split(',').map(s => s.trim().toLowerCase());
            
            const matchedSkills = requiredSkills.filter(reqSkill => 
                userSkillNames.some(userSkill => 
                    userSkill.toLowerCase().includes(reqSkill) || 
                    reqSkill.includes(userSkill.toLowerCase())
                )
            );
            
            const matchPercentage = requiredSkills.length > 0 
                ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
                : 0;

            return {
                id: job.id,
                company_name: job.company_name,
                job_title: job.job_title,
                location: job.location,
                job_type: job.job_type,
                salary_range: job.salary_range,
                required_skills: job.required_skills,
                description: job.description,
                posted_date: job.posted_date,
                status: job.status,
                match_percentage: matchPercentage,
                matched_skills_count: matchedSkills.length,
                total_required_skills: requiredSkills.length
            };
        });

        // Sort by match percentage
        jobsWithMatch.sort((a, b) => b.match_percentage - a.match_percentage);

        return res.json({
            jobs: jobsWithMatch,
            userHasSkills: true
        });

    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [id]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({ job: jobs[0] });
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.saveJob = async (req, res) => {
    try {
        const { job_id } = req.body;
        const userId = req.userId;

        const [existing] = await db.query(
            'SELECT * FROM job_applications WHERE user_id = ? AND job_id = ? AND status = "saved"',
            [userId, job_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Job already saved' });
        }

        const [applied] = await db.query(
            'SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?',
            [userId, job_id]
        );

        if (applied.length > 0) {
            return res.status(400).json({ message: 'You have already applied to this job' });
        }

        await db.query(
            'INSERT INTO job_applications (user_id, job_id, status) VALUES (?, ?, "saved")',
            [userId, job_id]
        );

        res.json({ message: 'Job saved successfully' });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.applyJob = async (req, res) => {
    try {
        const { job_id } = req.body;
        const userId = req.userId;

        const [existing] = await db.query(
            'SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?',
            [userId, job_id]
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE job_applications SET status = "applied", applied_date = NOW() WHERE user_id = ? AND job_id = ?',
                [userId, job_id]
            );
        } else {
            await db.query(
                'INSERT INTO job_applications (user_id, job_id, status, applied_date) VALUES (?, ?, "applied", NOW())',
                [userId, job_id]
            );
        }

        res.json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Apply job error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserApplications = async (req, res) => {
    try {
        const userId = req.userId;

        const [applications] = await db.query(
            `SELECT ja.*, j.* FROM job_applications ja
             JOIN jobs j ON ja.job_id = j.id
             WHERE ja.user_id = ?
             ORDER BY ja.applied_date DESC`,
            [userId]
        );

        res.json({ applications });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
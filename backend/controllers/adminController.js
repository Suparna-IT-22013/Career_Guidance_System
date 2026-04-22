const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // Check if user is admin
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.userId]);
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get total users
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        
        // Get total assessments
        const [assessmentCount] = await db.query('SELECT COUNT(*) as count FROM assessments');
        
        // Get active jobs
        const [jobCount] = await db.query('SELECT COUNT(*) as count FROM jobs WHERE status = "active"');
        
        // Flagged users (dummy for now)
        const flagged = 7;

        res.json({
            totalUsers: userCount[0].count,
            totalAssessments: assessmentCount[0].count,
            activeJobs: jobCount[0].count,
            flagged
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [allUsers] = await db.query(
            'SELECT id, username, email, first_name, last_name, created_at, role FROM users ORDER BY created_at DESC'
        );
        res.json({ users: allUsers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getRecentUsers = async (req, res) => {
    try {
        const [recentUsers] = await db.query(
            `SELECT id, username, first_name, last_name, education_level, created_at 
             FROM users 
             ORDER BY created_at DESC 
             LIMIT 10`
        );
        res.json({ users: recentUsers });
    } catch (error) {
        console.error('Get recent users error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getTopCareerSearches = async (req, res) => {
    try {
        const [careers] = await db.query(
            `SELECT career_path, COUNT(*) as count 
             FROM recommendations 
             GROUP BY career_path 
             ORDER BY count DESC 
             LIMIT 5`
        );

        const total = careers.reduce((sum, c) => sum + c.count, 0);
        const careersWithPercentage = careers.map(c => ({
            career: c.career_path,
            percentage: Math.round((c.count / total) * 100)
        }));

        res.json({ careers: careersWithPercentage });
    } catch (error) {
        console.error('Get top careers error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
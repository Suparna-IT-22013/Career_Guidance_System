const API_URL = 'https://careerguidancesystem-production.up.railway.app/api';

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAssessmentId');
    window.location.href = 'login.html';
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

async function loadDashboard() {
    const token = checkAuth();
    if (!token) return;

    // Set user name
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        const greeting = getGreeting();
        document.querySelector('.greeting').innerHTML = `${greeting}, <span id="userName">${fullName}</span>`;
    }

    // Check assessment status
    console.log('Checking assessment status...');
    await checkAssessmentStatus();
}

async function checkAssessmentStatus() {
    try {
        const response = await fetch(`${API_URL}/skills/user`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        
        console.log('Skills data:', data);
        console.log('Skills count:', data.skills?.length || 0);
        
        if (!data.skills || data.skills.length === 0) {
            console.log('NO SKILLS FOUND - Showing empty state');
            showNoAssessmentState();
        } else {
            console.log('SKILLS FOUND - Loading dashboard with data');
            await loadWithAssessment(data.skills);
        }
    } catch (error) {
        console.error('Error checking assessment:', error);
        showNoAssessmentState();
    }
}

function showNoAssessmentState() {
    // Update stats
    document.getElementById('assessmentCount').textContent = '0';
    document.getElementById('careerMatches').textContent = '0';
    document.getElementById('jobsMatched').textContent = '53';
    document.getElementById('skillGaps').textContent = '0';
    document.getElementById('profileCompletion').textContent = '25% complete';

    // Show call-to-action in dashboard content
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <div class="card" style="text-align: center; padding: 60px 40px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); margin-top: 30px;">
            <div style="font-size: 5rem; margin-bottom: 25px;">📋</div>
            <h2 style="margin-bottom: 15px; color: var(--text-dark); font-size: 2rem;">Start Your Career Journey</h2>
            <p style="color: var(--text-gray); margin-bottom: 35px; font-size: 1.1rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                Take our comprehensive career assessment to discover your ideal career path, 
                get personalized recommendations, and see which jobs match your skills.
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 16px; margin: 30px auto; max-width: 500px; box-shadow: var(--shadow-lg);">
                <h3 style="margin-bottom: 20px; color: var(--primary);">What You'll Get:</h3>
                <div style="text-align: left; display: inline-block;">
                    <p style="margin: 12px 0; font-size: 1.05rem;">✅ Personalized career recommendations</p>
                    <p style="margin: 12px 0; font-size: 1.05rem;">✅ Skill gap analysis & learning roadmap</p>
                    <p style="margin: 12px 0; font-size: 1.05rem;">✅ Job matches based on your profile</p>
                    <p style="margin: 12px 0; font-size: 1.05rem;">✅ Track your progress over time</p>
                </div>
            </div>
            
            <a href="assessment.html" class="btn btn-primary btn-large" style="font-size: 1.2rem; padding: 18px 45px; margin-top: 20px;">
                🚀 Take Assessment Now (10 mins)
            </a>
            <br><br>
            <a href="jobs.html" class="btn btn-secondary" style="margin-top: 15px;">
                Or Browse Jobs First
            </a>
        </div>
    `;

    // Empty assessment history
    document.getElementById('assessmentHistory').innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: var(--bg-gradient-start); border-radius: 12px;">
            <p style="color: var(--text-gray); font-size: 1.05rem; margin-bottom: 20px;">
                📊 No assessment history yet
            </p>
            <p style="color: var(--text-gray); font-size: 0.95rem;">
                Your assessment results will appear here after you complete the quiz
            </p>
        </div>
    `;
}

async function loadWithAssessment(skills) {
    // Load stats
    await loadUserStats();
    
    // Load assessment history
    await loadAssessmentHistory();
    
    // Load dashboard content with data
    await showDashboardWithData(skills);
}

async function loadUserStats() {
    try {
        const response = await fetch(`${API_URL}/career/assessment-history`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            const assessmentCount = data.assessments?.length || 0;
            const careerMatches = data.assessments?.[0]?.recommendation_count || 0;
            const skillGaps = careerMatches > 0 ? Math.floor(Math.random() * 3) + 2 : 0;

            document.getElementById('assessmentCount').textContent = assessmentCount;
            document.getElementById('careerMatches').textContent = careerMatches;
            document.getElementById('jobsMatched').textContent = '53';
            document.getElementById('skillGaps').textContent = skillGaps;
            
            let completion = 25;
            if (assessmentCount > 0) completion += 50;
            if (careerMatches > 0) completion += 25;
            document.getElementById('profileCompletion').textContent = completion + '% complete';

            // Store latest assessment ID
            if (data.assessments?.[0]?.id) {
                localStorage.setItem('lastAssessmentId', data.assessments[0].id);
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function showDashboardWithData(skills) {
    const dashboardContent = document.getElementById('dashboardContent');
    
    // Get top career match
    const assessmentId = localStorage.getItem('lastAssessmentId');
    let topCareer = null;
    
    if (assessmentId) {
        try {
            const response = await fetch(`${API_URL}/career/recommendations/${assessmentId}`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.recommendations?.length > 0) {
                    topCareer = data.recommendations[0];
                }
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }
    
    // Sort skills and get top 3
    const topSkills = [...skills]
        .sort((a, b) => b.skill_level - a.skill_level)
        .slice(0, 3);
    
    dashboardContent.innerHTML = `
        <div class="dashboard-grid" style="margin-top: 30px;">
            ${topCareer ? `
            <!-- Top Career Match -->
            <div class="card">
                <h3>Top career match</h3>
                <div class="career-match">
                    <div class="career-icon">${topCareer.career_path.split(' ').map(w => w[0]).join('').substring(0, 2)}</div>
                    <div class="career-info">
                        <h4>${topCareer.career_path}</h4>
                        <p>${topCareer.description || 'Tech · High demand'}</p>
                        <div class="skill-tags">
                            ${topCareer.required_skills.split(',').slice(0, 3).map(skill => 
                                `<span class="skill-tag">${skill.trim()}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="match-badge">${topCareer.match_percentage}%</div>
                </div>
            </div>
            ` : ''}

            <!-- Top Skills -->
            <div class="card">
                <h3>Top Skills</h3>
                ${topSkills.map(skill => {
                    const color = skill.skill_level >= 70 ? 'green' : skill.skill_level >= 40 ? 'orange' : 'red';
                    const colorVar = color === 'green' ? '--secondary' : color === 'orange' ? '--warning' : '--danger';
                    
                    return `
                        <div class="progress-bar-container">
                            <label>
                                <span>${skill.skill_name}</span>
                                <span style="color: var(${colorVar}); font-weight: 600;">${skill.skill_level}%</span>
                            </label>
                            <div class="progress-bar">
                                <div class="progress-fill ${color}" style="width: ${skill.skill_level}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

async function loadAssessmentHistory() {
    try {
        const response = await fetch(`${API_URL}/career/assessment-history`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            displayAssessmentHistory(data.assessments);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayAssessmentHistory(assessments) {
    const container = document.getElementById('assessmentHistory');
    
    if (!assessments || assessments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: var(--bg-gradient-start); border-radius: 12px;">
                <p style="color: var(--text-gray); font-size: 1.05rem;">
                    📊 No assessment history yet
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    assessments.forEach((assessment, index) => {
        const date = new Date(assessment.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const historyItem = document.createElement('div');
        historyItem.style.cssText = 'border: 2px solid var(--border); padding: 20px; border-radius: 12px; margin-bottom: 15px; transition: all 0.3s; background: white;';
        historyItem.onmouseover = function() { this.style.borderColor = 'var(--primary)'; this.style.boxShadow = 'var(--shadow-md)'; };
        historyItem.onmouseout = function() { this.style.borderColor = 'var(--border)'; this.style.boxShadow = 'none'; };

        const topThree = assessment.top_recommendations?.slice(0, 3) || [];

        historyItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h4 style="margin-bottom: 5px; color: var(--text-dark); font-size: 1.1rem;">
                        ${index === 0 ? '🆕 ' : ''}Assessment #${assessments.length - index}
                    </h4>
                    <p style="color: var(--text-gray); font-size: 14px;">📅 ${formattedDate}</p>
                </div>
                <span style="background: var(--primary); color: white; padding: 5px 12px; border-radius: 15px; font-size: 13px; font-weight: 600;">
                    ${assessment.recommendation_count} recommendations
                </span>
            </div>
            <div style="margin-bottom: 12px;">
                <strong style="color: var(--text-dark); font-size: 14px;">Interests:</strong>
                <p style="color: var(--text-gray); margin-top: 5px; font-size: 14px;">${assessment.interests}</p>
            </div>
            ${topThree.length > 0 ? `
                <div style="margin-bottom: 15px;">
                    <strong style="color: var(--text-dark); font-size: 14px;">Top Career Matches:</strong>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">
                        ${topThree.map(rec => `
                            <span style="background: linear-gradient(135deg, var(--primary-light), var(--secondary)); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                                ${rec.career_path} - ${rec.match_percentage}%
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                <button onclick="viewAssessmentDetails(${assessment.id})" class="btn btn-primary btn-sm">View Details</button>
                <button onclick="window.location.href='assessment.html'" class="btn btn-secondary btn-sm">Retake Assessment</button>
            </div>
        `;

        container.appendChild(historyItem);
    });
}

function viewAssessmentDetails(assessmentId) {
    localStorage.setItem('lastAssessmentId', assessmentId);
    window.location.href = 'results.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loading...');
    loadDashboard();
});
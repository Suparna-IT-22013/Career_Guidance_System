const API_URL = 'http://localhost:5000/api';

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

checkAuth();

// Check if user has taken assessment
async function checkAssessmentExists() {
    const assessmentId = localStorage.getItem('lastAssessmentId');
    
    if (!assessmentId) {
        showNoAssessmentMessage();
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/skills/user`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        
        if (!data.skills || data.skills.length === 0) {
            showNoAssessmentMessage();
            return false;
        }

        return true;
    } catch (error) {
        showNoAssessmentMessage();
        return false;
    }
}

// Show message when no assessment exists
function showNoAssessmentMessage() {
    document.querySelector('.skill-gap-container').innerHTML = `
        <div style="text-align: center; padding: 80px 40px; background: white; border-radius: 16px; box-shadow: var(--shadow-lg);">
            <div style="font-size: 5rem; margin-bottom: 25px;">📊</div>
            <h2 style="font-size: 2rem; margin-bottom: 15px; color: var(--text-dark);">No Assessment Found</h2>
            <p style="color: var(--text-gray); margin-bottom: 35px; font-size: 1.1rem;">
                You need to complete a career assessment before viewing skill gap analysis.
            </p>
            <a href="assessment.html" class="btn btn-primary btn-large">Take Assessment Now</a>
            <br><br>
            <a href="dashboard.html" class="btn btn-secondary" style="margin-top: 15px;">Back to Dashboard</a>
        </div>
    `;
}

// Show career/job selection page
async function showSelectionPage() {
    const hasAssessment = await checkAssessmentExists();
    if (!hasAssessment) return;

    // Get user's top career recommendations
    const assessmentId = localStorage.getItem('lastAssessmentId');
    let topCareers = [];

    try {
        const response = await fetch(`${API_URL}/career/recommendations/${assessmentId}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            topCareers = data.recommendations?.slice(0, 5) || [];
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }

    const container = document.querySelector('.skill-gap-container');
    container.innerHTML = `
        <div class="gap-header" style="text-align: center;">
            <h2>Choose a Career Path or Job</h2>
            <p style="color: var(--text-gray); margin-top: 10px;">
                Select a career or job to see which skills you need to improve
            </p>
        </div>

        ${topCareers.length > 0 ? `
            <div class="card" style="margin-bottom: 30px;">
                <h3>🎯 Your Top Career Matches</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px;">Based on your assessment results</p>
                <div id="careerOptions"></div>
            </div>
        ` : ''}

        <div class="card">
            <h3>💼 Or Choose from Popular Careers</h3>
            <div id="popularCareers" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 20px;"></div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="jobs.html" class="btn btn-secondary">Or Browse Jobs</a>
        </div>
    `;

    // Display top career matches
    if (topCareers.length > 0) {
        const careerOptions = document.getElementById('careerOptions');
        topCareers.forEach(career => {
            const option = document.createElement('div');
            option.style.cssText = 'padding: 20px; border: 2px solid var(--border); border-radius: 12px; margin-bottom: 15px; cursor: pointer; transition: all 0.3s;';
            option.onmouseover = function() { this.style.borderColor = 'var(--primary)'; this.style.transform = 'translateX(5px)'; };
            option.onmouseout = function() { this.style.borderColor = 'var(--border)'; this.style.transform = 'translateX(0)'; };
            option.onclick = () => analyzeCareerGap(career.career_path);
            
            option.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1;">
                        <h4 style="margin-bottom: 5px; color: var(--text-dark);">${career.career_path}</h4>
                        <p style="color: var(--text-gray); font-size: 14px;">${career.description}</p>
                    </div>
                    <div style="background: linear-gradient(135deg, var(--accent), var(--success)); color: white; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 18px;">
                        ${career.match_percentage}% match
                    </div>
                </div>
            `;
            careerOptions.appendChild(option);
        });
    }

    // Display popular careers
    const popularCareers = [
        { name: 'Software Developer', icon: '💻' },
        { name: 'Data Scientist', icon: '📊' },
        { name: 'Web Designer', icon: '🎨' },
        { name: 'Digital Marketing', icon: '📱' },
        { name: 'Project Manager', icon: '📋' },
        { name: 'Cybersecurity Analyst', icon: '🔒' },
        { name: 'Graphic Designer', icon: '🖌️' },
        { name: 'Business Analyst', icon: '📈' }
    ];

    const popularContainer = document.getElementById('popularCareers');
    popularCareers.forEach(career => {
        const card = document.createElement('div');
        card.style.cssText = 'padding: 25px; background: white; border: 2px solid var(--border); border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.3s;';
        card.onmouseover = function() { 
            this.style.borderColor = 'var(--primary)'; 
            this.style.transform = 'translateY(-5px)'; 
            this.style.boxShadow = 'var(--shadow-lg)';
        };
        card.onmouseout = function() { 
            this.style.borderColor = 'var(--border)'; 
            this.style.transform = 'translateY(0)'; 
            this.style.boxShadow = 'none';
        };
        card.onclick = () => analyzeCareerGap(career.name);
        
        card.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 10px;">${career.icon}</div>
            <h4 style="color: var(--text-dark);">${career.name}</h4>
        `;
        popularContainer.appendChild(card);
    });
}

// Analyze skill gap for a specific career
async function analyzeCareerGap(careerPath) {
    try {
        const response = await fetch(`${API_URL}/skills/career-gap/${encodeURIComponent(careerPath)}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            displayCareerSkillGap(data);
        } else {
            alert(data.message || 'Error analyzing skill gap');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error connecting to server');
    }
}

// Display career-specific skill gap
function displayCareerSkillGap(data) {
    const container = document.querySelector('.skill-gap-container');
    
    const readinessColor = data.readinessPercentage >= 70 ? 'var(--success)' : 
                           data.readinessPercentage >= 40 ? 'var(--warning)' : 'var(--danger)';

    container.innerHTML = `
        <!-- Header -->
        <div class="gap-header">
            <h2>Skill Gap Analysis</h2>
            <h3 style="color: var(--primary); margin: 10px 0;">${data.careerPath}</h3>
            
            <div style="margin: 20px 0;">
                <div style="background: ${readinessColor}; color: white; padding: 15px 30px; border-radius: 30px; display: inline-block; font-weight: 700; font-size: 1.5rem; box-shadow: var(--shadow-lg);">
                    ${data.readinessPercentage}% Career Ready
                </div>
            </div>
            
            <p style="color: var(--text-gray); margin-top: 15px;">
                You have <strong>${data.skillsYouHave.length}</strong> of <strong>${data.totalRequired}</strong> required skills
            </p>
            
            ${data.totalGaps > 0 ? `
                <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 15px 25px; border-radius: 12px; margin-top: 20px; border-left: 5px solid var(--warning);">
                    <strong style="color: #92400e;">⚠️ ${data.totalGaps} skills need attention</strong>
                </div>
            ` : `
                <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); padding: 15px 25px; border-radius: 12px; margin-top: 20px; border-left: 5px solid var(--success);">
                    <strong style="color: #065f46;">✅ You have all required skills!</strong>
                </div>
            `}
        </div>

        <!-- Skills You Have -->
        ${data.skillsYouHave.length > 0 ? `
            <div class="skills-section" style="border-left: 5px solid var(--success);">
                <h3>✅ Skills You Have (70%+)</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px;">These are your strong skills for this career</p>
                <div id="skillsYouHave"></div>
            </div>
        ` : ''}

        <!-- Skills To Improve -->
        ${data.skillsToImprove.length > 0 ? `
            <div class="skills-section" style="border-left: 5px solid var(--warning);">
                <h3>📈 Skills To Improve (40-69%)</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px;">You have these skills but need to strengthen them</p>
                <div id="skillsToImprove"></div>
            </div>
        ` : ''}

        <!-- Critical Skills -->
        ${data.criticalSkills.length > 0 ? `
            <div class="skills-section" style="border-left: 5px solid var(--danger);">
                <h3>🚨 Critical Skills (Below 40% or Missing)</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px;">Focus on learning these skills to qualify for this career</p>
                <div id="criticalSkills"></div>
            </div>
        ` : ''}

        <!-- Learning Resources -->
        ${data.totalGaps > 0 ? `
            <div class="resources-section">
                <h3>📚 Recommended Learning Path</h3>
                <p style="color: var(--text-gray); margin-bottom: 20px;">
                    Here are courses to help you bridge the skill gaps
                </p>
                <div id="resources"></div>
            </div>
        ` : ''}

        <!-- Action Buttons -->
        <div style="text-align: center; margin-top: 40px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button onclick="showSelectionPage()" class="btn btn-secondary">Choose Different Career</button>
            <a href="jobs.html" class="btn btn-primary">Browse ${data.careerPath} Jobs</a>
            <a href="assessment.html" class="btn btn-success">Update My Skills</a>
        </div>
    `;

    // Populate skills you have
    if (data.skillsYouHave.length > 0) {
        const container1 = document.getElementById('skillsYouHave');
        data.skillsYouHave.forEach(skill => {
            container1.appendChild(createSkillGapItem(skill));
        });
    }

    // Populate skills to improve
    if (data.skillsToImprove.length > 0) {
        const container2 = document.getElementById('skillsToImprove');
        data.skillsToImprove.forEach(skill => {
            container2.appendChild(createSkillGapItem(skill));
        });
    }

    // Populate critical skills
    if (data.criticalSkills.length > 0) {
        const container3 = document.getElementById('criticalSkills');
        data.criticalSkills.forEach(skill => {
            container3.appendChild(createSkillGapItem(skill));
        });
    }

    // Generate learning resources
    if (data.totalGaps > 0) {
        generateLearningResources([...data.skillsToImprove, ...data.criticalSkills]);
    }
}

// Create skill gap item
function createSkillGapItem(skill) {
    const div = document.createElement('div');
    div.className = 'skill-item';
    
    let barClass = 'critical';
    let statusClass = 'critical';
    
    if (skill.status === 'Strong') {
        barClass = 'strong';
        statusClass = 'strong';
    } else if (skill.status === 'Good') {
        barClass = 'good';
        statusClass = 'good';
    } else if (skill.status === 'Weak') {
        barClass = 'critical';
        statusClass = 'improve';
    }
    
    div.innerHTML = `
        <span class="skill-item-name">${skill.skill_name}</span>
        <div class="skill-item-level">
            <div style="flex: 1; min-width: 200px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px;">
                    <span style="color: var(--text-gray);">Your level: ${skill.user_level}%</span>
                    <span style="color: var(--text-gray);">Required: ${skill.required_level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-bar-fill ${barClass}" style="width: ${skill.user_level}%"></div>
                </div>
            </div>
            ${skill.gap > 0 ? `
                <span style="background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 14px; white-space: nowrap;">
                    Gap: ${skill.gap}%
                </span>
            ` : ''}
            <span class="skill-status ${statusClass}">${skill.status}</span>
        </div>
    `;
    
    return div;
}

// Generate learning resources
function generateLearningResources(weakSkills) {
    const resourcesContainer = document.getElementById('resources');
    if (!resourcesContainer) return;

    const resourcesMap = {
        'Python': { title: 'Python Complete Bootcamp', platform: 'Udemy', duration: '22 hrs', price: 'BDT 1,499', url: '#' },
        'JavaScript': { title: 'JavaScript - The Complete Guide', platform: 'Udemy', duration: '52 hrs', price: 'BDT 1,699', url: '#' },
        'Java': { title: 'Java Programming Masterclass', platform: 'Udemy', duration: '80 hrs', price: 'BDT 1,899', url: '#' },
        'React': { title: 'React - The Complete Guide', platform: 'Udemy', duration: '48 hrs', price: 'BDT 1,599', url: '#' },
        'Node.js': { title: 'Node.js Complete Guide', platform: 'Udemy', duration: '39 hrs', price: 'BDT 1,299', url: '#' },
        'Machine Learning': { title: 'Machine Learning Specialization', platform: 'Coursera', duration: '3 months', price: 'Free', url: '#' },
        'Data Analysis': { title: 'Data Analysis with Python', platform: 'Coursera', duration: '35 hrs', price: 'Free', url: '#' },
        'Docker': { title: 'Docker Mastery', platform: 'Udemy', duration: '19 hrs', price: 'BDT 999', url: '#' },
        'AWS': { title: 'AWS Certified Solutions Architect', platform: 'A Cloud Guru', duration: '28 hrs', price: 'BDT 2,999', url: '#' },
        'SQL/MySQL': { title: 'The Complete SQL Bootcamp', platform: 'Udemy', duration: '9 hrs', price: 'BDT 799', url: '#' },
        'UI/UX Design': { title: 'UI/UX Design Specialization', platform: 'Coursera', duration: '6 months', price: 'Free', url: '#' },
        'Git/GitHub': { title: 'Git & GitHub Masterclass', platform: 'YouTube', duration: '5 hrs', price: 'Free', url: '#' },
        'Network Security': { title: 'CompTIA Security+', platform: 'Udemy', duration: '30 hrs', price: 'BDT 1,999', url: '#' },
        'Problem Solving': { title: 'Data Structures & Algorithms', platform: 'Udemy', duration: '55 hrs', price: 'BDT 1,799', url: '#' },
        'Communication': { title: 'Effective Communication Skills', platform: 'Coursera', duration: '15 hrs', price: 'Free', url: '#' }
    };

    // Show resources for top 5 weak skills
    const topWeakSkills = weakSkills.slice(0, 5);
    
    topWeakSkills.forEach(skill => {
        const resource = resourcesMap[skill.skill_name] || {
            title: `Learn ${skill.skill_name}`,
            platform: 'Online',
            duration: '10-20 hrs',
            price: 'Varies',
            url: '#'
        };

        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';
        resourceItem.innerHTML = `
            <div style="flex: 1;">
                <h4 style="margin-bottom: 5px;">${resource.title}</h4>
                <p style="color: var(--text-gray); font-size: 14px;">
                    <strong>${skill.skill_name}</strong> · ${resource.platform} · ${resource.duration} · ${resource.price}
                </p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.open('${resource.url}', '_blank')">
                View Course
            </button>
        `;
        resourcesContainer.appendChild(resourceItem);
    });
}

// Initialize - Check URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('jobId');
    const career = urlParams.get('career');

    if (career) {
        analyzeCareerGap(decodeURIComponent(career));
    } else if (jobId) {
        // TODO: Analyze for specific job
        showSelectionPage();
    } else {
        showSelectionPage();
    }
});
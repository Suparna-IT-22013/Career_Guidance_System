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

checkAuth();

let allJobs = [];
let filteredJobs = [];
let userHasSkills = false;

async function loadJobs() {
    try {
        console.log('Loading jobs...');
        const response = await fetch(`${API_URL}/jobs/all`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();
        console.log('Jobs Response:', data);
        console.log('User Has Skills:', data.userHasSkills);

        if (response.ok) {
            allJobs = data.jobs;
            filteredJobs = allJobs;
            userHasSkills = data.userHasSkills;

            console.log('Total Jobs:', allJobs.length);
            console.log('First Job Match %:', allJobs[0]?.match_percentage);

            // Show banner if no skills
            if (!userHasSkills) {
                console.log('SHOWING NO SKILLS BANNER');
                showNoSkillsBanner();
            } else {
                console.log('USER HAS SKILLS - Showing match percentages');
            }

            displayJobs(filteredJobs);
        } else {
            document.getElementById('loadingJobs').innerHTML = '<p>Error loading jobs</p>';
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('loadingJobs').innerHTML = '<p>Error connecting to server</p>';
    }
}

function showNoSkillsBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = 'background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center; border-left: 5px solid #f59e0b; box-shadow: var(--shadow-lg);';
    banner.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 15px;">⚠️</div>
        <h3 style="margin-bottom: 10px; color: #92400e; font-size: 1.3rem;">Assessment Required for Job Matching</h3>
        <p style="color: #78350f; margin-bottom: 20px; font-size: 1.05rem;">
            Complete your career assessment to see personalized job match percentages and skill analysis.
            <br><strong>Currently showing 0% match for all jobs.</strong>
        </p>
        <a href="assessment.html" class="btn btn-primary btn-large">Take Assessment Now</a>
    `;
    
    const jobBoard = document.querySelector('.job-board');
    const firstChild = jobBoard.firstChild;
    jobBoard.insertBefore(banner, firstChild);
}

function displayJobs(jobs) {
    const container = document.getElementById('jobsList');
    const loadingState = document.getElementById('loadingJobs');
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }

    if (!jobs || jobs.length === 0) {
        container.innerHTML = '<div class="card"><p style="text-align: center; padding: 40px; color: var(--text-gray);">No jobs found matching your criteria</p></div>';
        document.getElementById('jobCount').textContent = '0';
        return;
    }

    document.getElementById('jobCount').textContent = jobs.length;
    container.innerHTML = '';

    jobs.forEach((job, index) => {
        const jobCard = createJobCard(job);
        jobCard.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(jobCard);
    });
}

function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';

    // CRITICAL: Use the match_percentage from backend directly
    const matchPercentage = parseInt(job.match_percentage) || 0;
    
    console.log(`Job: ${job.job_title}, Match: ${matchPercentage}%, UserHasSkills: ${userHasSkills}`);

    const matchColor = getMatchColor(matchPercentage);
    const companyInitial = job.company_name.charAt(0).toUpperCase();

    const postedDate = new Date(job.posted_date);
    const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
    const postedText = daysAgo === 0 ? 'Posted today' : daysAgo === 1 ? 'Posted 1 day ago' : `Posted ${daysAgo} days ago`;

    // Match display
    let matchDisplay;
    let matchBadgeStyle;

    if (!userHasSkills) {
        // NO SKILLS - Show 0% with message
        matchDisplay = `<div style="text-align: center; font-size: 11px; line-height: 1.3;">
            <div style="font-size: 18px; font-weight: 700;">0%</div>
            <div style="opacity: 0.9; font-size: 10px;">No assessment</div>
        </div>`;
        matchBadgeStyle = 'background: #94a3b8; color: white;';
    } else if (matchPercentage === 0) {
        // HAS SKILLS but 0% match
        matchDisplay = `<div style="text-align: center;">
            <div style="font-size: 18px; font-weight: 700;">0%</div>
            <div style="opacity: 0.8; font-size: 11px;">No match</div>
        </div>`;
        matchBadgeStyle = 'background: #ef4444; color: white;';
    } else {
        // HAS SKILLS with actual match
        matchDisplay = `${matchPercentage}%`;
        matchBadgeStyle = `background: ${matchColor}; color: white;`;
    }

    card.innerHTML = `
        <div class="job-card-header" style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 20px;">
            <div style="display: flex; gap: 15px; flex: 1; min-width: 250px;">
                <div class="company-logo" style="background: ${!userHasSkills ? '#94a3b8' : matchColor};">
                    ${companyInitial}
                </div>
                <div class="job-info" style="flex: 1;">
                    <h3 style="margin-bottom: 8px; font-size: 1.3rem;">${job.job_title}</h3>
                    <p class="company-name" style="color: var(--text-gray); margin-bottom: 10px;">
                        ${job.company_name} · ${job.location} · ${job.job_type}
                    </p>
                    <div class="skill-tags" style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${job.required_skills.split(',').slice(0, 4).map(skill => 
                            `<span class="skill-tag" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 5px 12px; border-radius: 15px; font-size: 13px;">${skill.trim()}</span>`
                        ).join('')}
                        ${job.required_skills.split(',').length > 4 ? 
                            `<span class="skill-tag" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 5px 12px; border-radius: 15px; font-size: 13px;">+${job.required_skills.split(',').length - 4} more</span>` 
                            : ''
                        }
                    </div>
                </div>
            </div>
            <div class="match-percentage" style="${matchBadgeStyle} padding: 12px 20px; border-radius: 25px; font-weight: 700; box-shadow: var(--shadow-md); flex-shrink: 0; min-width: 80px; text-align: center;">
                ${matchDisplay}
            </div>
        </div>
        
        <div class="job-card-body" style="margin-bottom: 20px;">
            <p style="color: var(--text-gray); line-height: 1.6;">${job.description}</p>
        </div>
        
        <div class="job-card-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 2px solid var(--border); flex-wrap: wrap; gap: 15px;">
            <div>
                <strong style="color: var(--text-dark); font-size: 1.1rem;">${job.salary_range}</strong>
                <span style="color: var(--text-gray); margin: 0 10px;">·</span>
                <span class="posted-date" style="color: var(--text-gray);">${postedText}</span>
            </div>
            <div class="job-actions" style="display: flex; gap: 10px;">
                <button class="btn btn-secondary btn-sm" onclick="saveJob(${job.id})">💾 Save</button>
                <button class="btn btn-primary btn-sm" onclick="applyJob(${job.id})">📤 Apply</button>
                ${userHasSkills && matchPercentage > 0 ? 
                    `<button class="btn btn-sm" style="background: var(--warning); color: white;" onclick="viewSkillGap(${job.id})">📊 Gap</button>` 
                    : ''
                }
            </div>
        </div>
    `;

    return card;
}

function getMatchColor(percentage) {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#6366f1';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
}

function searchJobs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredJobs = allJobs;
    } else {
        filteredJobs = allJobs.filter(job => 
            job.job_title.toLowerCase().includes(searchTerm) ||
            job.company_name.toLowerCase().includes(searchTerm) ||
            job.required_skills.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayJobs(filteredJobs);
}

function filterByType(type) {
    document.querySelectorAll('.filter-tag[data-type]').forEach(tag => {
        tag.classList.remove('active');
    });
    event.target.classList.add('active');

    if (type === 'all') {
        filteredJobs = allJobs;
    } else {
        filteredJobs = allJobs.filter(job => job.job_type === type);
    }
    
    displayJobs(filteredJobs);
}

function sortJobs(sortBy) {
    let sorted = [...filteredJobs];
    
    if (sortBy === 'match') {
        sorted.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
    } else if (sortBy === 'salary') {
        sorted.sort((a, b) => {
            const aNum = parseInt(a.salary_range.match(/\d+/)?.[0] || 0);
            const bNum = parseInt(b.salary_range.match(/\d+/)?.[0] || 0);
            return bNum - aNum;
        });
    } else if (sortBy === 'date') {
        sorted.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
    }
    
    displayJobs(sorted);
}

async function saveJob(jobId) {
    try {
        const response = await fetch(`${API_URL}/jobs/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ job_id: jobId })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Job saved successfully!');
        } else {
            alert(data.message || 'Failed to save job');
        }
    } catch (error) {
        alert('Error saving job');
        console.error('Error:', error);
    }
}

async function applyJob(jobId) {
    if (!userHasSkills) {
        const confirm = window.confirm('You haven\'t taken the assessment yet. Take it now to see your skills match?');
        if (confirm) {
            window.location.href = 'assessment.html';
            return;
        }
    }

    try {
        const response = await fetch(`${API_URL}/jobs/apply`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ job_id: jobId })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Application submitted successfully!');
        } else {
            alert(data.message || 'Failed to apply');
        }
    } catch (error) {
        alert('Error applying to job');
        console.error('Error:', error);
    }
}

function viewSkillGap(jobId) {
    window.location.href = `skillgap.html?jobId=${jobId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadJobs();
});

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchJobs();
    }
});
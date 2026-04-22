const API_URL = 'https://careerguidancesystem-production.up.railway.app/api';

// Check authentication
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

// Get match color based on percentage
function getMatchColor(percentage) {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#6366f1'; // Blue
    if (percentage >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
}

// Get badge class based on percentage
function getBadgeClass(percentage) {
    if (percentage >= 80) return 'badge-success';
    if (percentage >= 60) return 'badge-primary';
    return 'badge-warning';
}

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
        return;
    }

    recommendations.forEach((rec, index) => {
        const color = getMatchColor(rec.match_percentage);
        const badgeClass = getBadgeClass(rec.match_percentage);
        
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        card.style.borderLeftColor = color;
        
        card.innerHTML = `
            <div class="recommendation-header">
                <div>
                    <h3>${index + 1}. ${rec.career_path}</h3>
                    <div class="job-meta">
                        <span class="badge ${badgeClass}">High salary</span>
                        <span class="badge badge-primary">Remote</span>
                        <span class="badge ${badgeClass}">Best match</span>
                    </div>
                </div>
                <div class="match-circle" style="border-color: ${color}; color: ${color};">
                    ${rec.match_percentage}%
                </div>
            </div>
            
            <p>${rec.description}</p>
            
            <div style="margin-top: 15px;">
                <strong style="color: var(--primary);">Required Skills:</strong>
                <div class="skill-tags" style="margin-top: 10px;">
                    ${rec.required_skills.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="exploreCareer('${rec.career_path}')">Explore</button>
            </div>
        `;
        
        container.appendChild(card);
    });

    // Show results
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'block';
    document.getElementById('actionButtons').style.display = 'block';
}

// Load recommendations
async function loadRecommendations() {
    const assessmentId = localStorage.getItem('lastAssessmentId');
    
    if (!assessmentId) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('noResults').style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/career/recommendations/${assessmentId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            displayRecommendations(data.recommendations);
        } else {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('noResults').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        document.getElementById('loadingState').style.display = 'none';
        alert('Error loading recommendations');
    }
}

// Explore career (redirect to job board with filter)
function exploreCareer(careerPath) {
    localStorage.setItem('jobSearchQuery', careerPath);
    window.location.href = 'jobs.html';
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadRecommendations);
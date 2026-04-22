const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return null;
    }
    return token;
}

// Get headers with auth token
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAssessmentId');
    window.location.href = '../index.html';
}

// Check auth on page load
checkAuth();

// Submit Assessment Form
document.getElementById('assessmentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get selected interests
    const interestsCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
    const interests = Array.from(interestsCheckboxes).map(cb => cb.value).join(', ');

    // Get selected skills
    const skillsCheckboxes = document.querySelectorAll('input[name="skills"]:checked');
    const skills = Array.from(skillsCheckboxes).map(cb => cb.value).join(', ');

    // Get other fields
    const educationLevel = document.getElementById('educationLevel').value;
    const workExperience = document.getElementById('workExperience').value;
    const preferredIndustry = document.getElementById('preferredIndustry').value;

    // Validate
    if (!interests || !skills || !educationLevel) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/career/assessment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                interests,
                skills,
                education_level: educationLevel,
                work_experience: parseInt(workExperience),
                preferred_industry: preferredIndustry
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store assessment ID
            localStorage.setItem('lastAssessmentId', data.assessmentId);
            
            alert('Assessment submitted successfully!');
            
            // Redirect to results page
            window.location.href = 'results.html';
        } else {
            alert(data.message || 'Failed to submit assessment');
        }
    } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
    }
});

// Load Recommendations
async function loadRecommendations(assessmentId) {
    try {
        const response = await fetch(`${API_URL}/career/recommendations/${assessmentId}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.recommendations.length > 0) {
            displayRecommendations(data.recommendations);
        } else {
            document.getElementById('recommendationsList').innerHTML = `
                <div class="card">
                    <p>No recommendations found. Please take an assessment.</p>
                    <a href="assessment.html" class="btn btn-primary">Take Assessment</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        document.getElementById('recommendationsList').innerHTML = `
            <div class="card">
                <p>Error loading recommendations. Please try again.</p>
            </div>
        `;
    }
}

// Display Recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';

    recommendations.forEach((rec, index) => {
        const recCard = document.createElement('div');
        recCard.className = 'recommendation-card';
        recCard.innerHTML = `
            <div class="recommendation-header">
                <h3>${index + 1}. ${rec.career_path}</h3>
                <span class="match-badge">${rec.match_percentage}% Match</span>
            </div>
            <p>${rec.description}</p>
            <div class="skills-required">
                <strong>Required Skills:</strong> ${rec.required_skills}
            </div>
        `;
        container.appendChild(recCard);
    });
}
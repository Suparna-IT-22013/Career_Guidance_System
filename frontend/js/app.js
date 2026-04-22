const API_URL = 'https://careerguidancesystem-production.up.railway.app/api';

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

// Load user data on dashboard
window.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('username').textContent = user.username;
    }

    loadProgress();
});

// Load Progress
async function loadProgress() {
    try {
        const response = await fetch(`${API_URL}/career/progress`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.progress.length > 0) {
            displayProgress(data.progress);
        } else {
            document.getElementById('progressList').innerHTML = '<p>No courses added yet. Start tracking your progress!</p>';
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Display Progress
function displayProgress(progressList) {
    const container = document.getElementById('progressList');
    container.innerHTML = '';

    progressList.forEach(item => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <h4>${item.course_name}</h4>
            <p>Status: <strong>${item.status}</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${item.completion_percentage}%"></div>
            </div>
            <p style="margin-top: 5px; font-size: 14px; color: #666;">${item.completion_percentage}% Complete</p>
        `;
        container.appendChild(progressItem);
    });
}

// Show Add Progress Modal
function showAddProgressModal() {
    document.getElementById('progressModal').style.display = 'block';
}

// Close Progress Modal
function closeProgressModal() {
    document.getElementById('progressModal').style.display = 'none';
    document.getElementById('addProgressForm').reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('progressModal');
    if (event.target == modal) {
        closeProgressModal();
    }
}

// Add Progress Form Submit
document.getElementById('addProgressForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const courseName = document.getElementById('courseName').value;
    const status = document.getElementById('courseStatus').value;
    const completion = document.getElementById('courseCompletion').value;

    try {
        const response = await fetch(`${API_URL}/career/progress`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                course_name: courseName,
                status: status,
                completion_percentage: parseInt(completion)
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Course added successfully!');
            closeProgressModal();
            loadProgress(); // Reload progress list
        } else {
            alert(data.message || 'Failed to add course');
        }
    } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
    }
});
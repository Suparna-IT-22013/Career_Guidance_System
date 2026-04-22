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

// Check if user is admin
function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        alert('Access denied. Admin only.');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

checkAuth();
checkAdminAccess();

// Load admin stats
async function loadAdminStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('totalUsers').textContent = data.totalUsers;
            document.getElementById('totalAssessments').textContent = data.totalAssessments;
            document.getElementById('activeJobs').textContent = data.activeJobs;
            document.getElementById('flaggedUsers').textContent = data.flagged;
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Load recent users
async function loadRecentUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/recent-users`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.users.length > 0) {
            displayRecentUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading recent users:', error);
    }
}

// Display recent users
function displayRecentUsers(users) {
    const container = document.getElementById('recentUsers');
    container.innerHTML = '';

    const statusTypes = ['active', 'pending', 'flagged'];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    users.slice(0, 4).forEach((user, index) => {
        const initials = getInitials(user.first_name, user.last_name, user.username);
        const status = statusTypes[index % 3];
        const color = colors[index % colors.length];
        const role = user.education_level || 'User';

        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-avatar" style="background: ${color};">${initials}</div>
            <div class="user-info">
                <h4>${user.first_name || user.username} ${user.last_name || ''}</h4>
                <p>${role}</p>
            </div>
            <span class="user-status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        `;
        container.appendChild(userItem);
    });
}

// Get user initials
function getInitials(firstName, lastName, username) {
    if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    } else if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
    } else {
        return username.substring(0, 2).toUpperCase();
    }
}

// Load top career searches
async function loadTopCareers() {
    try {
        const response = await fetch(`${API_URL}/admin/top-careers`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.careers.length > 0) {
            displayTopCareers(data.careers);
        }
    } catch (error) {
        console.error('Error loading top careers:', error);
    }
}

// Display top careers
function displayTopCareers(careers) {
    const container = document.getElementById('topCareers');
    container.innerHTML = '';

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    careers.forEach((career, index) => {
        const color = colors[index % colors.length];
        const item = document.createElement('div');
        item.className = 'career-search-item';
        item.innerHTML = `
            <span style="font-weight: 500;">${career.career}</span>
            <div class="career-search-bar">
                <div class="career-search-bar-fill" style="width: ${career.percentage}%; background: ${color};"></div>
            </div>
            <span style="font-weight: 600; color: ${color};">${career.percentage}%</span>
        `;
        container.appendChild(item);
    });
}

// Load all users
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            displayAllUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading all users:', error);
    }
}

// Display all users in table
function displayAllUsers(users) {
    const tbody = document.getElementById('allUsersTable');
    tbody.innerHTML = '';

    users.forEach(user => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        const joinDate = new Date(user.created_at).toLocaleDateString();
        const role = user.role || 'user';
        const status = 'Active'; // You can add actual status from DB

        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border)';
        row.innerHTML = `
            <td style="padding: 12px;">${fullName}</td>
            <td style="padding: 12px;">${user.email}</td>
            <td style="padding: 12px;"><span class="badge badge-primary">${role}</span></td>
            <td style="padding: 12px;">${joinDate}</td>
            <td style="padding: 12px;"><span class="user-status active">${status}</span></td>
            <td style="padding: 12px;">
                <button class="btn btn-sm" style="padding: 5px 12px; font-size: 13px;" onclick="viewUser(${user.id})">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View user details
function viewUser(userId) {
    alert(`View user details for ID: ${userId}\n(This would open a modal or redirect to user details page)`);
}

// Show add job modal
function showAddJobModal() {
    alert('Add New Job Modal\n(This would open a form to add new job posting)');
}

// Export data
function exportData() {
    alert('Export All Data\n(This would generate and download a CSV/Excel file)');
}

// View analytics
function viewAnalytics() {
    alert('View Analytics\n(This would redirect to a detailed analytics page)');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAdminStats();
    loadRecentUsers();
    loadTopCareers();
    loadAllUsers();
});
const API_URL = 'https://careerguidancesystem-production.up.railway.app/api';
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => messageDiv.innerHTML = '', 5000);
}

// Admin Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Check if user is admin
            if (data.user.role !== 'admin') {
                showMessage('Access denied. Admin credentials required.', 'error');
                return;
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage('Admin login successful!', 'success');
            setTimeout(() => window.location.href = 'admin.html', 1000);
        } else {
            showMessage(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
        console.error('Error:', error);
    }
});
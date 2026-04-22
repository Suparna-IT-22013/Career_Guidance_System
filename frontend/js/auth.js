const API_URL = 'http://localhost:5000/api';

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => messageDiv.innerHTML = '', 5000);
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage('Login successful!', 'success');
           setTimeout(() => window.location.href = 'dashboard.html', 1000);
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
});

// Register
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const educationLevel = document.getElementById('educationLevel').value;
    const password = document.getElementById('registerPassword').value;
    const username = email.split('@')[0];

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, first_name: firstName, last_name: lastName, education_level: educationLevel })
        });

        const data = await response.json();
        if (response.ok) {
            showMessage('Account created! Please login.', 'success');
            document.getElementById('registerForm').reset();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
});
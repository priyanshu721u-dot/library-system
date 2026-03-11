// tooggle pass
document.getElementById('togglePassword').addEventListener('click', function() {
    const password = document.getElementById('password');
    const icon = this;
    if (password.type === 'password') {
        password.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        password.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// error
function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    errorText.textContent = message;
    errorMsg.style.display = 'flex';
}

function hideError() {
    document.getElementById('error-msg').style.display = 'none';
}

//login
document.getElementById('loginBtn').addEventListener('click', async () => {
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    // Loading state
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Logging in...';

    
     try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        showError(data.message || 'Login failed. Please try again.');
        return;
    }

    // Save token and user info
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role
    }));

    // Redirect based on role
    if (data.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
    } else {
        window.location.href = 'student/dashboard.html';
    }

} catch (error) {
    showError('Cannot connect to server. Please try again.');
} finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
}
});

// ===== LOGIN ON ENTER KEY =====
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});
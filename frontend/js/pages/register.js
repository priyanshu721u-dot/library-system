// toggle pass
document.getElementById('togglePassword').addEventListener('click', function () {
    const password = document.getElementById('password');
    if (password.type === 'password') {
        password.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        password.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function () {
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword.type === 'password') {
        confirmPassword.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        confirmPassword.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
    }
});

// Message
function showError(message) {
    const errorMsg = document.getElementById('error-msg');
    document.getElementById('error-text').textContent = message;
    errorMsg.style.display = 'flex';
    document.getElementById('success-msg').style.display = 'none';
}

function showSuccess(message) {
    const successMsg = document.getElementById('success-msg');
    document.getElementById('success-text').textContent = message;
    successMsg.style.display = 'flex';
    document.getElementById('error-msg').style.display = 'none';
}

function hideMessages() {
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('success-msg').style.display = 'none';
}

// register
document.getElementById('registerBtn').addEventListener('click', async () => {
    hideMessages();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields.');
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
    }

    // Loading state
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Creating account...';

    try {
        const response = await fetch('https://readon-api.onrender.com/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.message || 'Registration failed. Please try again.');
            return;
        }

        showSuccess('Account created successfully! Redirecting to login...');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        showError('Cannot connect to server. Please try again.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
    }
});

// ===== REGISTER ON ENTER KEY 
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('registerBtn').click();
    }
});
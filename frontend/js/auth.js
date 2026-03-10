
function getToken() {
    return localStorage.getItem('token');
}

//  cuurnt user
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// ===== CHECK IF LOGGED IN =====
function isLoggedIn() {
    return !!getToken();
}

//  PROTECT PAGE - call this on every protected page 
function requireAuth(requiredRole = null) {
    if (!isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }

    const user = getUser();

    if (requiredRole && user.role !== requiredRole) {
        // Wrong role - redirect to their correct dashboard
        if (user.role === 'admin') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = '../student/dashboard.html';
        }
        return;
    }
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
}

// ===== API CALL HELPER =====
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = getToken();

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:5001${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
        // Token expired or invalid
        logout();
        return;
    }

    return { ok: response.ok, data, status: response.status };
}
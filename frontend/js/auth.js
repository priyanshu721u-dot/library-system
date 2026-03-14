
function getToken() {
    return localStorage.getItem('token');
}

//  cuurnt user
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
function loadSidebarAvatar() {
    const user = getUser();
    if (!user) return;
    const saved = localStorage.getItem(`avatar_${user._id}`);
    const sidebarAvatar = document.getElementById('userAvatar');
    if (saved && sidebarAvatar) {
        sidebarAvatar.innerHTML = `<img src="${saved}" style="width:100%; height:100%;
            object-fit:cover; border-radius:50%;">`;
    }
}

function loadAvatar() {
    const user = getUser();
    if (!user) return;
    const saved = localStorage.getItem(`avatar_${user._id}`);
    const avatarEl = document.getElementById('profileAvatar');
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (!avatarEl) return;

    if (saved) {
        avatarEl.innerHTML = `<img src="${saved}" style="width:100%; height:100%;
            object-fit:cover; border-radius:50%;">`;
        if (removeBtn) removeBtn.style.display = 'inline-block';
    }
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
    
    const BASE_URL = 'https://readon-api.onrender.com';
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.status === 401) {
        // Token expired or invalid
        logout();
        return;
    }

    return { ok: response.ok, data, status: response.status };
}
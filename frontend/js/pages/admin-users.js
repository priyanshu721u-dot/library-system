// Check auth
requireAuth('admin');

const user = getUser();
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();

// Sidebar toggle
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
});

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

let allUsers = [];
let currentFilter = 'all';
let currentSearch = '';

// Load users
async function loadUsers() {
    try {
        const res = await apiCall('/api/users/all');
        if (!res.ok) return;
        allUsers = res.data;
        renderUsers();
    } catch (e) {}
}

// Render users
function renderUsers() {
    let filtered = allUsers;

    if (currentFilter === 'active') {
        filtered = filtered.filter(u => !u.isBlocked);
    } else if (currentFilter === 'blocked') {
        filtered = filtered.filter(u => u.isBlocked);
    }

    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        filtered = filtered.filter(u =>
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }

    document.getElementById('userCount').textContent = `${filtered.length} users`;

    if (filtered.length === 0) {
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-gray);">
                    No users found
                </td>
            </tr>`;
        return;
    }

    document.getElementById('usersTableBody').innerHTML = filtered.map(u => `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:0.8rem;">
                    <div style="width:36px; height:36px; background:var(--primary-blue); border-radius:50%;
                        display:flex; align-items:center; justify-content:center; color:white;
                        font-size:0.9rem; font-weight:700; flex-shrink:0;">
                        ${u.username.charAt(0).toUpperCase()}
                    </div>
                    <div style="font-weight:600;">${u.username}</div>
                </div>
            </td>
            <td style="color:var(--text-gray); font-size:0.88rem;">${u.email}</td>
            <td>${formatDate(u.createdAt)}</td>
            <td style="font-weight:600;">${u.totalBorrows || 0}</td>
            <td>
                <span style="color:${u.penalties > 0 ? '#dc2626' : 'var(--text-gray)'}; font-weight:700;">
                    ₹${u.penalties || 0}
                </span>
            </td>
            <td>
                ${u.isBlocked
                    ? `<span class="status-badge status-rejected">Blocked</span>`
                    : `<span class="status-badge status-returned">Active</span>`
                }
            </td>
            <td>
                ${u.isBlocked
                    ? `<button class="btn-approve" onclick="unblockUser('${u._id}', '${u.username}')">
                           <i class="fas fa-unlock"></i> Unblock
                       </button>`
                    : `<button class="btn-reject" onclick="blockUser('${u._id}', '${u.username}')">
                           <i class="fas fa-ban"></i> Block
                       </button>`
                }
            </td>
        </tr>
    `).join('');
}

// Block user
async function blockUser(userId, username) {
    if (!confirm(`Block ${username}? They will not be able to login.`)) return;
    try {
        const res = await apiCall(`/api/users/block/${userId}`, 'PUT');
        if (res.ok) {
            showToast(`${username} has been blocked.`);
            loadUsers();
        } else {
            showToast(res.data.message || 'Failed to block user', 'error');
        }
    } catch (e) {
        showToast('Failed to block user', 'error');
    }
}

// Unblock user
async function unblockUser(userId, username) {
    try {
        const res = await apiCall(`/api/users/unblock/${userId}`, 'PUT');
        if (res.ok) {
            showToast(`${username} has been unblocked.`);
            loadUsers();
        } else {
            showToast(res.data.message || 'Failed to unblock user', 'error');
        }
    } catch (e) {
        showToast('Failed to unblock user', 'error');
    }
}

// Filter pills
document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        renderUsers();
    });
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    renderUsers();
});

// Init
loadUsers();
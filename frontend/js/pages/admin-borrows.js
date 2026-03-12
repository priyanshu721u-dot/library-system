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

let allBorrows = [];
let currentFilter = 'all';
let currentSearch = '';

function updateStats() {
    document.getElementById('statTotal').textContent = allBorrows.length;
    document.getElementById('statPending').textContent = allBorrows.filter(b => b.status === 'pending').length;
    document.getElementById('statActive').textContent = allBorrows.filter(b => b.status === 'approved').length;
    document.getElementById('statReturn').textContent = allBorrows.filter(b => b.status === 'return_requested').length;
}
// Load borrows
async function loadBorrows() {
    try {
        const res = await apiCall('/api/borrows/all');
        
        if (!res.ok) return;
        allBorrows = res.data;
        updateStats();
        renderTable();
    } catch (e) {
        console.log('error:', e);
    }
}

// Render table
function renderTable() {
    let filtered = allBorrows;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(b => b.status === currentFilter);
    }

   if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(b =>
        b.book && b.student &&
        (b.student.username.toLowerCase().includes(q) ||
        b.book.title.toLowerCase().includes(q))
    );
}

    const safeBorrows = filtered.filter(b => b.book && b.book.title && b.student && b.student.username);
    document.getElementById('borrowCount').textContent = `${safeBorrows.length} records`;

   if (safeBorrows.length === 0) {
        document.getElementById('borrowsTableBody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-gray);">
                    No records found
                </td>
            </tr>`;
        return;
    }
    document.getElementById('borrowsTableBody').innerHTML = safeBorrows.map(b => `
        <tr>
            <td>
                <div style="font-weight:600;">${b.student.username}</div>
                <div style="font-size:0.8rem; color:var(--text-gray);">${b.student.email || ''}</div>
            </td>
            <td>
                <div style="font-weight:600;">${b.book.title}</div>
                <div style="font-size:0.8rem; color:var(--text-gray);">${b.book.author}</div>
            </td>
            <td>${formatDate(b.borrowDate)}</td>
            <td>${formatDate(b.dueDate)}</td>
            <td>
                ${b.penalty > 0
            ? `<span style="color:#dc2626; font-weight:700;">₹${b.penalty}</span>`
            : `<span style="color:var(--text-gray);">₹0</span>`}
            </td>
            <td><span class="status-badge status-${b.status}">${formatStatus(b.status)}</span></td>
            <td>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    ${getActionButtons(b)}
                    <button class="btn-approve" style="background:#f1f5f9; color:var(--text-gray);"
                        onclick="viewDetail('${b._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format status label
function formatStatus(status) {
    const labels = {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        returned: 'Returned',
        overdue: 'Overdue',
        return_requested: 'Return Request'
    };
    return labels[status] || status;
}

// Get action buttons based on status
function getActionButtons(b) {
    if (b.status === 'pending') {
        return `
            <button class="btn-approve" onclick="approveBorrow('${b._id}')">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" onclick="rejectBorrow('${b._id}')">
                <i class="fas fa-times"></i> Reject
            </button>`;
    }
    if (b.status === 'return_requested') {
        return `
            <button class="btn-return-approve" onclick="approveReturn('${b._id}')">
                <i class="fas fa-undo"></i> Approve Return
            </button>`;
    }
    return '';
}

// Approve borrow
async function approveBorrow(borrowId) {
    try {
        const res = await apiCall(`/api/borrows/approve/${borrowId}`, 'PUT');
        if (res.ok) {
            showToast('Borrow approved!');
            loadBorrows();
        } else {
            showToast(res.data.message || 'Failed to approve', 'error');
        }
    } catch (e) {
        showToast('Failed to approve', 'error');
    }
}

// Reject borrow
async function rejectBorrow(borrowId) {
    const note = prompt('Reason for rejection (optional):');
    if (note === null) return;
    try {
        const res = await apiCall(`/api/borrows/reject/${borrowId}`, 'PUT', {
            adminNote: note || ''
        });
        if (res.ok) {
            showToast('Borrow rejected.');
            loadBorrows();
        } else {
            showToast(res.data.message || 'Failed to reject', 'error');
        }
    } catch (e) {
        showToast('Failed to reject', 'error');
    }
}

// Approve return
async function approveReturn(borrowId) {
    try {
        const res = await apiCall(`/api/borrows/approve-return/${borrowId}`, 'PUT');
        if (res.ok) {
            showToast('Return approved!');
            loadBorrows();
        } else {
            showToast(res.data.message || 'Failed to approve return', 'error');
        }
    } catch (e) {
        showToast('Failed to approve return', 'error');
    }
}

// View detail modal
function viewDetail(borrowId) {
    const b = allBorrows.find(x => x._id === borrowId);
    if (!b) return;

    document.getElementById('detailModalBody').innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Student</span>
            <span class="detail-value">${b.student.username}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">${b.student.email || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Book</span>
            <span class="detail-value">${b.book.title}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Author</span>
            <span class="detail-value">${b.book.author}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">ISBN</span>
            <span class="detail-value">${b.book.ISBN || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Borrow Date</span>
            <span class="detail-value">${formatDate(b.borrowDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Due Date</span>
            <span class="detail-value">${formatDate(b.dueDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Return Date</span>
            <span class="detail-value">${formatDate(b.returnDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Penalty</span>
            <span class="detail-value" style="color:#dc2626;">₹${b.penalty || 0}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">
                <span class="status-badge status-${b.status}">${formatStatus(b.status)}</span>
            </span>
        </div>
        ${b.adminNote ? `
        <div class="detail-row">
            <span class="detail-label">Admin Note</span>
            <span class="detail-value">${b.adminNote}</span>
        </div>` : ''}
        <div class="detail-actions">
            ${getActionButtons(b)}
        </div>
    `;

    document.getElementById('detailModalOverlay').style.display = 'flex';
}

// Close modal
document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailModalOverlay').style.display = 'none';
});

document.getElementById('detailModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailModalOverlay')) {
        document.getElementById('detailModalOverlay').style.display = 'none';
    }
});

// Filter pills
document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter;
        renderTable();
    });
});

// Search
document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    renderTable();
});

// Init
loadBorrows();
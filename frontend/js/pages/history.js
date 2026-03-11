// Check auth
requireAuth('student');

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

// Status badge
function getStatusBadge(status) {
    const map = {
        approved: { label: 'Borrowed', icon: 'fa-book' },
        returned: { label: 'Returned', icon: 'fa-check' },
        overdue: { label: 'Overdue', icon: 'fa-exclamation' },
        pending: { label: 'Pending', icon: 'fa-clock' },
        rejected: { label: 'Rejected', icon: 'fa-times' },
        return_requested: { label: 'Return Requested', icon: 'fa-undo' }
    };
    const s = map[status] || { label: status, icon: 'fa-circle' };
    return `<span class="status-badge status-${status}">
        <i class="fas ${s.icon}"></i> ${s.label}
    </span>`;
}

// Penalty badge
function getPenaltyBadge(penalty) {
    if (!penalty || penalty === 0) {
        return `<span class="penalty-badge penalty-zero"><i class="fas fa-check"></i> ₹0.00</span>`;
    }
    return `<span class="penalty-badge penalty-amount"><i class="fas fa-fire"></i> ₹${penalty.toFixed(2)}</span>`;
}

// Due date color
function getDueClass(dueDateStr) {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'color:#dc2626;';
    if (diff <= 3) return 'color:#ea580c;';
    return 'color:#16a34a;';
}

// All borrows data
let allBorrows = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 5;

// Load all borrows
async function loadBorrows() {
    try {
        const res = await apiCall('/api/borrows/my');
        if (!res.ok) return;
        allBorrows = res.data;
        renderCurrentlyBorrowed();
        renderRecentActivity();
        renderRecords();
    } catch (e) {
        document.getElementById('borrowingRecords').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load records</p>
            </div>`;
    }
}

// Currently borrowed
function renderCurrentlyBorrowed() {
    const active = allBorrows.filter(b => b.status === 'approved');
    const container = document.getElementById('currentlyBorrowed');

    if (active.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No books currently borrowed</p>
            </div>`;
        return;
    }

    container.innerHTML = active.map(b => `
        <div class="current-borrow-item">
            <div class="current-book-cover">
                ${b.book.coverImage
                    ? `<img src="${b.book.coverImage}" alt="${b.book.title}">`
                    : `<i class="fas fa-book"></i>`}
            </div>
            <div class="current-book-info">
                <div class="current-book-title">${b.book.title}</div>
                <div class="current-book-author">by ${b.book.author}</div>
                <div class="current-book-isbn">ISBN: ${b.book.ISBN}</div>
            </div>
            <div class="current-book-due">
                <div class="due-label">Due Date</div>
                <div class="due-date" style="${getDueClass(b.dueDate)}">${formatDate(b.dueDate)}</div>
            </div>
            <button class="btn-return" onclick="requestReturn('${b._id}')">
                <i class="fas fa-undo"></i> Return
            </button>
        </div>
    `).join('');
}

// Recent activity
function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    const recent = allBorrows.slice(0, 4);

    if (recent.length === 0) return;

    const activityMap = {
        approved: { icon: 'fa-book', color: 'blue', title: 'Book Borrowed' },
        returned: { icon: 'fa-check', color: 'green', title: 'Book Returned' },
        rejected: { icon: 'fa-times', color: 'red', title: 'Request Rejected' },
        overdue: { icon: 'fa-exclamation', color: 'red', title: 'Book Overdue' },
        pending: { icon: 'fa-clock', color: 'orange', title: 'Request Pending' },
        return_requested: { icon: 'fa-undo', color: 'orange', title: 'Return Requested' }
    };

    container.innerHTML = recent.map(b => {
        const a = activityMap[b.status] || activityMap.pending;
        return `
            <div class="activity-item">
                <div class="activity-icon ${a.color}">
                    <i class="fas ${a.icon}"></i>
                </div>
                <div class="activity-info">
                    <div class="activity-title">${a.title}</div>
                    <div class="activity-desc">${b.book.title}</div>
                </div>
                <div class="activity-time">${formatDate(b.updatedAt)}</div>
            </div>
        `;
    }).join('');
}

// Render records with filter and pagination
function renderRecords() {
    let filtered = allBorrows;

    if (currentFilter !== 'all') {
        filtered = allBorrows.filter(b => b.status === currentFilter);
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    const container = document.getElementById('borrowingRecords');

    if (paginated.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-list"></i>
                <p>No records found</p>
            </div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    container.innerHTML = paginated.map(b => `
        <div class="borrow-record-item">
            <div class="record-book-cover">
                ${b.book.coverImage
                    ? `<img src="${b.book.coverImage}" alt="${b.book.title}">`
                    : `<i class="fas fa-book"></i>`}
            </div>
            <div class="record-book-info">
                <div class="record-book-title">${b.book.title}</div>
                <div class="record-book-author">by ${b.book.author}</div>
                <div class="record-book-isbn">ISBN: ${b.book.ISBN}</div>
            </div>
            <div class="record-dates">
                <div class="record-date-item">
                    <div class="record-date-label">Borrowed</div>
                    <div class="record-date-value">${formatDate(b.borrowDate)}</div>
                </div>
                <div class="record-date-item">
                    <div class="record-date-label">Due Date</div>
                    <div class="record-date-value">${formatDate(b.dueDate)}</div>
                </div>
                ${b.returnDate ? `
                <div class="record-date-item">
                    <div class="record-date-label">Returned</div>
                    <div class="record-date-value">${formatDate(b.returnDate)}</div>
                </div>` : ''}
            </div>
            <div class="record-status">
                ${getStatusBadge(b.status)}
                ${getPenaltyBadge(b.penalty)}
            </div>
            <div class="record-actions">
                <button class="btn-view-details" onclick="viewDetails('${b._id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${b.status === 'approved' ? `
                <button class="btn-return" onclick="requestReturn('${b._id}')">
                    <i class="fas fa-undo"></i> Return
                </button>` : ''}
            </div>
        </div>
    `).join('');

    renderPagination(totalPages);
}

// Pagination
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `
        <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>`;

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderRecords();
}

// Filter pills
document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.status;
        currentPage = 1;
        renderRecords();
    });
});

// View details modal
function viewDetails(borrowId) {
    const borrow = allBorrows.find(b => b._id === borrowId);
    if (!borrow) return;

    document.getElementById('detailsContent').innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Book Title</span>
            <span class="detail-value">${borrow.book.title}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Author</span>
            <span class="detail-value">${borrow.book.author}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">ISBN</span>
            <span class="detail-value">${borrow.book.ISBN}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Borrow Date</span>
            <span class="detail-value">${formatDate(borrow.borrowDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Due Date</span>
            <span class="detail-value">${formatDate(borrow.dueDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Return Date</span>
            <span class="detail-value">${formatDate(borrow.returnDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">${getStatusBadge(borrow.status)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Penalty</span>
            <span class="detail-value">${getPenaltyBadge(borrow.penalty)}</span>
        </div>
        ${borrow.adminNote ? `
        <div class="detail-row">
            <span class="detail-label">Admin Note</span>
            <span class="detail-value">${borrow.adminNote}</span>
        </div>` : ''}
    `;

    document.getElementById('detailsModal').style.display = 'flex';
}

document.getElementById('closeDetails').addEventListener('click', () => {
    document.getElementById('detailsModal').style.display = 'none';
});

document.getElementById('detailsModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('detailsModal')) {
        document.getElementById('detailsModal').style.display = 'none';
    }
});

// Request return
async function requestReturn(borrowId) {
    if (!confirm('Are you sure you want to return this book?')) return;

    try {
        const res = await apiCall(`/api/borrows/return/${borrowId}`, 'PUT');
        if (res.ok) {
            showToast('Return request submitted successfully!');
            loadBorrows();
        } else {
            showToast(res.data.message || 'Failed to request return', 'error');
        }
    } catch (e) {
        showToast('Failed to request return', 'error');
    }
}

// Export to CSV
document.getElementById('exportBtn').addEventListener('click', () => {
    if (allBorrows.length === 0) {
        showToast('No records to export', 'error');
        return;
    }

    const headers = ['Book Title', 'Author', 'ISBN', 'Borrow Date', 'Due Date', 'Return Date', 'Status', 'Penalty'];
    const rows = allBorrows.map(b => [
        b.book.title,
        b.book.author,
        b.book.ISBN,
        formatDate(b.borrowDate),
        formatDate(b.dueDate),
        formatDate(b.returnDate),
        b.status,
        b.penalty || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'borrowing-history.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!');
});

// Init
loadBorrows();
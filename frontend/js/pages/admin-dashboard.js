// Check auth
requireAuth('admin');

const user = getUser();
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
loadAvatar();
loadSidebarAvatar();
// Greeting
function setGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';
    document.getElementById('greetingText').textContent = greeting + '!';
    document.getElementById('bannerGreeting').textContent = greeting + ', ' + user.username + '!';
}
setGreeting();

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

// Quick card hover - show expand panels
const optBlog = document.getElementById('opt-blog');
const optBook = document.getElementById('opt-book');
const expandBlog = document.getElementById('expand-blog');
const expandBook = document.getElementById('expand-book');
const quickRight = document.getElementById('quickRight');

function showPanel(panel) {
    expandBlog.classList.remove('active');
    expandBook.classList.remove('active');
    panel.classList.add('active');
}

optBlog.addEventListener('mouseenter', () => showPanel(expandBlog));
optBook.addEventListener('mouseenter', () => showPanel(expandBook));

// Default show blog panel on hover
document.getElementById('quickCard').addEventListener('mouseenter', () => {
    showPanel(expandBlog);
});

// Open modals on click
optBlog.addEventListener('click', () => openModal('blog-modal'));
optBook.addEventListener('click', () => openModal('book-modal'));

function openModal(modalId) {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.querySelectorAll('.modal-box').forEach(m => m.style.display = 'none');
    document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', closeModals);

// Quick add blog
document.getElementById('qAddBlogBtn').addEventListener('click', async () => {
    const title = document.getElementById('qBlogTitle').value.trim();
    const content = document.getElementById('qBlogContent').value.trim();
    const coverImage = document.getElementById('qBlogCover').value.trim();

    if (!title || !content) {
        showToast('Please fill in title and content', 'error');
        return;
    }

    const btn = document.getElementById('qAddBlogBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Publishing...';

    try {
        const res = await apiCall('/api/blogs', 'POST', {
            title, content, coverImage: coverImage || ''
        });

        if (res.ok) {
            showToast('Blog published successfully!');
            closeModals();
            ['qBlogTitle', 'qBlogContent', 'qBlogCover']
                .forEach(id => document.getElementById(id).value = '');
        } else {
            showToast(res.data.message || 'Failed to publish blog', 'error');
        }
    } catch (e) {
        showToast('Failed to publish blog', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Blog';
    }
});

// Quick add book
document.getElementById('qAddBookBtn').addEventListener('click', async () => {
    const title = document.getElementById('qBookTitle').value.trim();
    const author = document.getElementById('qBookAuthor').value.trim();
    const ISBN = document.getElementById('qBookISBN').value.trim();
    const category = document.getElementById('qBookCategory').value.trim();
    const totalCopies = document.getElementById('qBookCopies').value.trim();
    const totalPages = document.getElementById('qBookPages').value.trim();
    const coverImage = document.getElementById('qBookCover').value.trim();

    if (!title || !author || !ISBN || !category || !totalCopies) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    if (!coverImage) {
        showToast('Please add a cover image', 'error');
        return;
    }

    const btn = document.getElementById('qAddBookBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Adding...';

    try {
        const res = await apiCall('/api/books', 'POST', {
            title, author, ISBN, category,
            totalCopies: parseInt(totalCopies),
            availableCopies: parseInt(totalCopies),
            totalPages: parseInt(totalPages) || 0,
            coverImage: coverImage || ''
        });

        if (res.ok) {
            showToast('Book added successfully!');
            closeModals();
            ['qBookTitle', 'qBookAuthor', 'qBookISBN', 'qBookCategory',
                'qBookCopies', 'qBookPages', 'qBookCover']
                .forEach(id => document.getElementById(id).value = '');
            loadStats();
        } else {
            showToast(res.data.message || 'Failed to add book', 'error');
        }
    } catch (e) {
        showToast('Failed to add book', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Book';
    }
});

function previewBookCover(input, previewDivId, urlInputId) {
    const file = input.files[0];
    if (!file) return;

    // Compress image using canvas
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Resize to max 200x280
            const maxW = 200, maxH = 280;
            let w = img.width, h = img.height;
            if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            // Compress to JPEG at 70% quality
            const compressed = canvas.toDataURL('image/jpeg', 0.7);

            const previewDiv = document.getElementById(previewDivId);
            const previewImg = previewDiv.querySelector('img');
            previewImg.src = compressed;
            previewDiv.style.display = 'block';
            document.getElementById(urlInputId).value = compressed;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}


// Load stats
async function loadStats() {
    try {
        const res = await apiCall('/api/stats/admin');
        if (!res.ok) return;
        const s = res.data;
        document.getElementById('statStudents').textContent = s.totalStudents || 0;
        document.getElementById('statBooks').textContent = s.totalBooks || 0;
        document.getElementById('statBorrowed').textContent = s.activeBorrows || 0;
        document.getElementById('statOverdue').textContent = s.returnRequests || 0;
    } catch (e) { }
}

// Load pending borrows
async function loadPendingBorrows() {
    try {
        const res = await apiCall('/api/borrows/all');
        if (!res.ok) return;

        const pending = res.data.filter(b => b.status === 'borrowed' || b.status === 'pending' || b.status === 'return_requested').slice(0, 5);
        const container = document.getElementById('pendingBorrows');

        if (pending.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding:1.5rem 0;">
                    <i class="fas fa-check-circle"></i>
                    <p>No pending approvals</p>
                </div>`;
            return;
        }

        container.innerHTML = pending.map(b => `
    <div class="pending-item">
        <div class="pending-info">
            <div class="pending-book">${b.book.title}</div>
            <div class="pending-student">by ${b.student.username}</div>
            <span class="status-badge status-${b.status}" style="margin-top:4px; display:inline-flex;">
                ${b.status === 'return_requested' ? 'Return Request' : 'Borrow Request'}
            </span>
        </div>
        <div class="pending-actions">
            ${b.status === 'return_requested'
                ? `<button class="btn-return-approve" onclick="approveReturn('${b._id}')">
                       <i class="fas fa-undo"></i> Return
                   </button>`
                : `<button class="btn-approve" onclick="approveBorrow('${b._id}')">
                       <i class="fas fa-check"></i>
                   </button>
                   <button class="btn-reject" onclick="rejectBorrow('${b._id}')">
                       <i class="fas fa-times"></i>
                   </button>`
            }
        </div>
    </div>
`).join('');
    } catch (e) { }
}
async function approveReturn(borrowId) {
    try {
        const res = await apiCall(`/api/borrows/approve-return/${borrowId}`, 'PUT');
        if (res.ok) {
            showToast('Return approved!');
            loadPendingBorrows();
            loadStats();
        } else {
            showToast(res.data.message || 'Failed to approve return', 'error');
        }
    } catch (e) {
        showToast('Failed to approve return', 'error');
    }
}
// Approve borrow
async function approveBorrow(borrowId) {
    try {
        const res = await apiCall(`/api/borrows/approve/${borrowId}`, 'PUT');
        if (res.ok) {
            showToast('Borrow approved!');
            loadPendingBorrows();
            loadStats();
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
    try {
        const res = await apiCall(`/api/borrows/reject/${borrowId}`, 'PUT', {
            adminNote: note || ''
        });
        if (res.ok) {
            showToast('Borrow rejected.');
            loadPendingBorrows();
            loadStats();
        } else {
            showToast(res.data.message || 'Failed to reject', 'error');
        }
    } catch (e) {
        showToast('Failed to reject', 'error');
    }
}

// Load fines
async function loadFines() {
    try {
        const res = await apiCall('/api/borrows/all');
        if (!res.ok) return;

        const overdue = res.data.filter(b => b.status === 'overdue' || b.penalty > 0);
        const tbody = document.getElementById('finesTableBody');

        if (overdue.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2rem; color:var(--text-gray);">
                        No fines or penalties
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = overdue.map(b => `
            <tr>
                <td>${b.student.username}</td>
                <td>${b.book.title}</td>
                <td>${formatDate(b.dueDate)}</td>
                <td><span style="color:#dc2626; font-weight:700;">₹${b.penalty || 0}</span></td>
                <td><span class="status-badge status-${b.status}">${b.status}</span></td>
            </tr>
        `).join('');
    } catch (e) { }
}

// Load top readers
async function loadTopReaders() {
    try {
        const res = await apiCall('/api/stats/leaderboard');
        if (!res.ok) return;

        const container = document.getElementById('topReadersList');

        if (!res.data || res.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No data available</p>
                </div>`;
            return;
        }

        const rankClass = i => ['rank-1', 'rank-2', 'rank-3'][i] || 'rank-other';

        container.innerHTML = res.data.slice(0, 5).map((reader, i) => `
            <div class="top-reader-item">
                <div class="reader-rank ${rankClass(i)}">${i + 1}</div>
                <div class="reader-avatar">${reader.username.charAt(0).toUpperCase()}</div>
                <div class="reader-info">
                    <div class="reader-name">${reader.username}</div>
                    <div class="reader-hours">${Math.round(reader.totalReadingHours) || 0} hours read</div>
                </div>
                <div class="reader-badge">#${i + 1}</div>
            </div>
        `).join('');
    } catch (e) { }
}

// Borrowing trends chart
async function loadBorrowingTrendsChart() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const borrowed = new Array(12).fill(0);
    const returned = new Array(12).fill(0);
    const overdue = new Array(12).fill(0);

    try {
        const res = await apiCall('/api/borrows/all');
        if (res.ok) {
            res.data.forEach(b => {
                const month = new Date(b.borrowDate).getMonth();
                borrowed[month]++;
                if (b.status === 'returned') returned[month]++;
                if (b.status === 'overdue') overdue[month]++;
            });
        }
    } catch (e) { }

    new ApexCharts(document.getElementById('borrowingTrendsChart'), {
        series: [
            { name: 'Borrowed', data: borrowed },
            { name: 'Returned', data: returned },
            { name: 'Overdue', data: overdue }
        ],
        chart: { type: 'line', height: 280, toolbar: { show: false } },
        colors: ['#2563EB', '#16a34a', '#dc2626'],
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: months },
        legend: { position: 'top' },
        grid: { borderColor: '#f1f5f9' }
    }).render();
}

// Init
loadStats();
loadPendingBorrows();
loadFines();
loadTopReaders();
loadBorrowingTrendsChart();
// Check auth
requireAuth('student');

// Get user info
const user = getUser();

// Set user info in sidebar
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();

// Set greeting
function setGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';
    document.getElementById('greetingText').textContent = greeting + '!';
    document.getElementById('bannerGreeting').textContent = greeting + ', ' + user.username + '!';
}
setGreeting();

// Sidebar toggle for mobile
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
});

// Format date
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// Due date color
function getDueClass(dueDateStr) {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'due-overdue';
    if (diff <= 3) return 'due-soon';
    return 'due-normal';
}

function getDueLabel(dueDateStr) {
    const today = new Date();
    const due = new Date(dueDateStr);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Due Tomorrow';
    return 'Due: ' + formatDate(dueDateStr);
}

// Load notifications
async function loadNotifications() {
    try {
        const res = await apiCall('/api/notifications/unread-count');
        if (res.ok && res.data.count > 0) {
            const badge = document.getElementById('notifBadge');
            badge.textContent = res.data.count;
            badge.style.display = 'flex';
        }
    } catch (e) {}
}

// Load stats
async function loadStats() {
    try {
        const res = await apiCall('/api/stats/student');
        if (!res.ok) return;
        const s = res.data;
        document.getElementById('statTotalBorrows').textContent = s.totalBorrows || 0;
        document.getElementById('statActiveBorrows').textContent = s.activeBorrows || 0;
        document.getElementById('statHours').textContent = s.totalReadingHours || 0;
        document.getElementById('statPending').textContent = s.pendingBorrows || 0;
    } catch (e) {}
}

// Load currently borrowed books
async function loadBorrowedBooks() {
    try {
        const res = await apiCall('/api/borrows/my');
        if (!res.ok) return;

        const active = res.data.filter(b => b.status === 'approved');

        if (active.length === 0) return;

        const html = active.slice(0, 3).map(b => `
            <div class="borrowed-book-item">
                <div class="borrowed-book-cover">
                    ${b.book.coverImage
                        ? `<img src="${b.book.coverImage}" alt="${b.book.title}">`
                        : `<i class="fas fa-book"></i>`}
                </div>
                <div class="borrowed-book-info">
                    <div class="borrowed-book-title">${b.book.title}</div>
                    <div class="borrowed-book-author">${b.book.author}</div>
                </div>
                <span class="borrowed-book-due ${getDueClass(b.dueDate)}">
                    ${getDueLabel(b.dueDate)}
                </span>
            </div>
        `).join('');

        document.getElementById('borrowedBooksList').innerHTML = html;
    } catch (e) {}
}

// Load recent activity from borrows
async function loadRecentActivity() {
    try {
        const res = await apiCall('/api/borrows/my');
        if (!res.ok) return;

        if (res.data.length === 0) return;

        const activityMap = {
            approved: { icon: 'fa-book', color: 'blue', title: 'Book Borrowed' },
            returned: { icon: 'fa-check', color: 'green', title: 'Book Returned' },
            rejected: { icon: 'fa-times', color: 'red', title: 'Request Rejected' },
            overdue: { icon: 'fa-exclamation', color: 'red', title: 'Book Overdue' },
            pending: { icon: 'fa-clock', color: 'orange', title: 'Request Pending' }
        };

        const html = res.data.slice(0, 5).map(b => {
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

        document.getElementById('recentActivity').innerHTML = html;
    } catch (e) {}
}

// Load reading progress
async function loadReadingProgress() {
    try {
        const res = await apiCall('/api/reading/my');
        if (!res.ok) return;

        if (res.data.length === 0) return;

        // Group by book and get latest session per book
        const bookMap = {};
        res.data.forEach(session => {
            const bookId = session.book._id;
            if (!bookMap[bookId]) {
                bookMap[bookId] = session;
            }
        });

        const sessions = Object.values(bookMap).slice(0, 4);

        const html = sessions.map(s => {
            const percent = s.book.totalPages
                ? Math.min(Math.round((s.currentPage / s.book.totalPages) * 100), 100)
                : 0;
            return `
                <div class="progress-item">
                    <div class="progress-book-info">
                        <div class="progress-book-title">${s.book.title}</div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-fill" style="width:${percent}%"></div>
                        </div>
                    </div>
                    <div class="progress-percent">${percent}%</div>
                </div>
            `;
        }).join('');

        document.getElementById('progressList').innerHTML = html;
    } catch (e) {}
}

// Weekly reading chart
async function loadWeeklyChart() {
    try {
        const res = await apiCall('/api/reading/my');
        if (!res.ok) return;

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        res.data.forEach(session => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= oneWeekAgo) {
                const dayIndex = sessionDate.getDay();
                weeklyData[dayIndex] += Math.round(session.duration / 60);
            }
        });

        const options = {
            series: [{ name: 'Reading Hours', data: weeklyData }],
            chart: { type: 'bar', height: 250, toolbar: { show: false } },
            colors: ['#2563EB'],
            plotOptions: {
                bar: { borderRadius: 8, columnWidth: '50%' }
            },
            dataLabels: { enabled: false },
            xaxis: { categories: days },
            yaxis: { title: { text: 'Hours' } },
            grid: { borderColor: '#f1f5f9' }
        };

        new ApexCharts(document.getElementById('weeklyChart'), options).render();
    } catch (e) {
        // Render empty chart
        const options = {
            series: [{ name: 'Reading Hours', data: [0, 0, 0, 0, 0, 0, 0] }],
            chart: { type: 'bar', height: 250, toolbar: { show: false } },
            colors: ['#2563EB'],
            plotOptions: { bar: { borderRadius: 8, columnWidth: '50%' } },
            dataLabels: { enabled: false },
            xaxis: { categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
            grid: { borderColor: '#f1f5f9' }
        };
        new ApexCharts(document.getElementById('weeklyChart'), options).render();
    }
}

// Reading goal donut chart
async function loadGoalChart() {
    try {
        const res = await apiCall('/api/goals/my');
        if (!res.ok || res.data.length === 0) {
            renderEmptyGoalChart();
            return;
        }

        const goal = res.data[0];
        const progressRes = await apiCall(`/api/goals/${goal._id}/progress`);
        if (!progressRes.ok) return;

        const progress = progressRes.data;
        const percent = Math.min(Math.round((progress.currentHours / goal.targetHours) * 100), 100);

        const options = {
            series: [percent],
            chart: { type: 'radialBar', height: 250 },
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%' },
                    dataLabels: {
                        name: { show: true, label: 'Progress' },
                        value: {
                            fontSize: '2rem',
                            fontWeight: 800,
                            formatter: val => val + '%'
                        }
                    }
                }
            },
            colors: ['#F97316'],
            labels: ['Progress']
        };

        new ApexCharts(document.getElementById('goalChart'), options).render();

        document.getElementById('goalInfo').innerHTML = `
            <div class="goal-stats">
                <div class="goal-stat">
                    <h4>${progress.currentHours || 0}h</h4>
                    <p>Completed</p>
                </div>
                <div class="goal-stat">
                    <h4>${goal.targetHours}h</h4>
                    <p>Target</p>
                </div>
            </div>
        `;
        document.getElementById('setGoalBtn').textContent = 'Update Goal';

    } catch (e) {
        renderEmptyGoalChart();
    }
}

function renderEmptyGoalChart() {
    const options = {
        series: [0],
        chart: { type: 'radialBar', height: 250 },
        plotOptions: {
            radialBar: {
                hollow: { size: '60%' },
                dataLabels: {
                    name: { show: true },
                    value: {
                        fontSize: '2rem',
                        fontWeight: 800,
                        formatter: val => val + '%'
                    }
                }
            }
        },
        colors: ['#F97316'],
        labels: ['Progress']
    };
    new ApexCharts(document.getElementById('goalChart'), options).render();
}

// Init all
loadNotifications();
loadStats();
loadBorrowedBooks();
loadRecentActivity();
loadReadingProgress();
loadWeeklyChart();
loadGoalChart();
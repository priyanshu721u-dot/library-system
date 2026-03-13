// Check auth
requireAuth('student');

// Get user info
const user = getUser();

// Set user info in sidebar
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
// Call immediately at top
loadAvatar();
loadSidebarAvatar();
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


function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
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
        if (res.ok && res.data.unreadCount > 0) {
            const badge = document.getElementById('notifBadge');
            badge.textContent = res.data.unreadCount;
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
        document.getElementById('statHours').textContent = Math.round(s.totalReadingHours) || 0;
        document.getElementById('statPending').textContent = s.pendingBorrows || 0;
    } catch (e) { }
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
    } catch (e) { }
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
    } catch (e) { }
}


const celebratedBooks = new Set();
let goalCelebrated = false;
// Load reading progress
async function loadReadingProgress() {
    try {
        const res = await apiCall('/api/reading/my');
        if (!res.ok || res.data.length === 0) {
            document.getElementById('progressList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No reading progress logged yet</p>
                </div>`;
            return;
        }

        const bookMap = {};
        res.data.forEach(session => {
            const bookId = session.book._id;
            if (!bookMap[bookId] || session.currentPage > bookMap[bookId].currentPage) {
                bookMap[bookId] = session;
            }
        });

        const sessions = Object.values(bookMap).slice(0, 4);

        // Check for newly completed books
        sessions.forEach(s => {
            if (s.book.totalPages && s.currentPage >= s.book.totalPages) {
                if (!celebratedBooks.has(s.book._id)) {
                    celebratedBooks.add(s.book._id);
                    showCelebration(s.book.title);
                }
            }
        });

        document.getElementById('progressList').innerHTML = sessions.map(s => {
            const hasTotal = s.book.totalPages && s.book.totalPages > 0;
            const rawPercent = hasTotal
                ? Math.round((s.currentPage / s.book.totalPages) * 100)
                : null;
            const displayPercent = rawPercent !== null ? Math.min(rawPercent, 100) : null;
            const isCompleted = rawPercent !== null && rawPercent >= 100;

            return `
                <div class="progress-item">
                    <div class="progress-book-info">
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
                            <div class="progress-book-title">${s.book.title}</div>
                            ${isCompleted ? `<span style="font-size:0.7rem; background:#f0fdf4;
                                color:#16a34a; padding:2px 8px; border-radius:20px; font-weight:700;">
                                ✓ Done</span>` : ''}
                        </div>
                        <div class="progress-bar-wrapper">
                            <div class="progress-bar-fill" style="width:${displayPercent || 0}%;
                                background:${isCompleted
                    ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                    : 'linear-gradient(135deg,#2563eb,#3b82f6)'};"></div>
                        </div>
                    </div>
                    <div style="text-align:right; min-width:90px;">
                        ${hasTotal
                    ? `<div class="progress-percent" style="color:${isCompleted ? '#16a34a' : 'var(--primary-blue)'}">
                                ${displayPercent}%</div>
                               <div style="font-size:0.75rem; color:var(--text-gray); margin-top:2px;">
                                ${s.currentPage} / ${s.book.totalPages} pg</div>`
                    : `<div style="font-size:0.85rem; font-weight:700; color:var(--primary-blue);">
                                ${s.currentPage} pg</div>
                               <div style="font-size:0.75rem; color:var(--text-gray); margin-top:2px;">
                                pages read</div>`}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) { }
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



let goalChartInstance = null;

async function loadGoal() {
    try {
        const res = await apiCall('/api/goals/my');

        if (!res.ok || res.data.length === 0) {
            document.getElementById('goalChart').innerHTML = '';
            document.getElementById('goalInfo').innerHTML = `
                <p style="color:var(--text-gray); font-size:0.9rem;">No reading goal set</p>`;
            document.getElementById('setGoalBtn').textContent = 'Set Goal';
            goalCelebrated = false;
            return;
        }

        const goal = res.data[0];
        const progressRes = await apiCall(`/api/goals/${goal._id}/progress`);
        if (!progressRes.ok) return;

        const p = progressRes.data;
        const currentHours = Math.round(p.progressHours);
        const currentBooks = p.currentBooks || 0;
        const hoursPercent = p.progressPercentage || 0;
        const booksPercent = p.booksPercentage || 0;
        const overallPercent = hoursPercent;

        // Show celebration only once
        if (p.isCompleted && !goalCelebrated) {
            goalCelebrated = true;
            showCelebration('🏆 Reading Goal Achieved!', true);
        }

        if (goalChartInstance) {
            goalChartInstance.destroy();
            goalChartInstance = null;
        }

        goalChartInstance = new ApexCharts(document.getElementById('goalChart'), {
            series: [overallPercent, 100 - overallPercent],
            chart: { type: 'donut', height: 220, toolbar: { show: false } },
            colors: ['#ff4d00', '#e2e8f0'],
            fill: {
                type: ['gradient', 'solid'],
                gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    gradientToColors: ['#ff5722'],
                    stops: [0, 100]
                }
            },
            labels: ['Completed', 'Remaining'],
            dataLabels: { enabled: false },
            legend: { show: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Progress',
                                fontSize: '13px',
                                fontFamily: 'Inter',
                                color: '#64748b',
                                formatter: () => overallPercent + '%'
                            }
                        }
                    }
                }
            },
            stroke: { width: 0 }
        });
        goalChartInstance.render();

        const deadline = goal.endDate
            ? new Date(goal.endDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            })
            : 'No deadline set';

        // Update set goal button text
        document.getElementById('setGoalBtn').textContent = 'Update Goal';

        document.getElementById('goalInfo').innerHTML = `
            <div style="margin-bottom:0.8rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                    <span style="font-size:0.85rem; font-weight:600; color:var(--text-dark);">
                        Reading Hours
                    </span>
                    <span style="font-size:0.85rem; font-weight:700; color:var(--orange);">
                        ${hoursPercent}%
                    </span>
                </div>
                <div style="height:7px; background:#e2e8f0; border-radius:50px; overflow:hidden;">
                    <div style="height:100%; width:${hoursPercent}%;
                        background:linear-gradient(135deg, #ff9800, #ff5722);
                        border-radius:50px; transition:width 0.5s ease;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:0.3rem;">
                    <span style="font-size:0.78rem; color:var(--text-gray);">${currentHours}h done</span>
                    <span style="font-size:0.78rem; color:var(--text-gray);">${goal.targetHours}h target</span>
                </div>
            </div>
           
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
                <div style="font-size:0.8rem; color:var(--text-gray);">
                    <i class="fas fa-calendar"></i> Deadline: ${deadline}
                </div>
                <button onclick="resetGoal('${goal._id}')" style="font-size:0.78rem; color:#dc2626;
                    background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif;
                    font-weight:600; padding:0;">
                    <i class="fas fa-redo"></i> Reset
                </button>
            </div>
        `;

    } catch (e) { }
}

async function resetGoal(goalId) {
    if (!confirm('Reset this goal? This will delete it so you can start fresh.')) return;
    try {
        // Delete all goals
        const allGoals = await apiCall('/api/goals/my');
        if (allGoals.ok) {
            await Promise.all(allGoals.data.map(g => apiCall(`/api/goals/${g._id}`, 'DELETE')));
        }

        goalCelebrated = false;
        if (goalChartInstance) {
            goalChartInstance.destroy();
            goalChartInstance = null;
        }
        document.getElementById('goalChart').innerHTML = '';
        document.getElementById('goalInfo').innerHTML = `
            <p style="color:var(--text-gray); font-size:0.9rem;">No reading goal set</p>`;
        document.getElementById('setGoalBtn').textContent = 'Set Goal';
        showToast('Goal reset successfully!');
    } catch (e) {
        showToast('Failed to reset goal', 'error');
    }
}

// Open set goal modal
document.getElementById('setGoalBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('setGoalOverlay').style.display = 'flex';
});

// Open log session modal
document.getElementById('openLogSessionBtn').addEventListener('click', async () => {
    document.getElementById('logSessionOverlay').style.display = 'flex';
    try {
        const res = await apiCall('/api/borrows/my');
        if (!res.ok) return;
        const active = res.data.filter(b => b.status === 'approved');
        const select = document.getElementById('sessionBook');
        select.innerHTML = '<option value="">Select a book...</option>';
        active.forEach(b => {
            select.innerHTML += `<option value="${b.book._id}">${b.book.title}</option>`;
        });
    } catch (e) { }
});

// Close modals
document.getElementById('closeLogSession').addEventListener('click', () => {
    document.getElementById('logSessionOverlay').style.display = 'none';
});
document.getElementById('cancelLogSession').addEventListener('click', () => {
    document.getElementById('logSessionOverlay').style.display = 'none';
});
document.getElementById('closeSetGoal').addEventListener('click', () => {
    document.getElementById('setGoalOverlay').style.display = 'none';
});
document.getElementById('cancelSetGoal').addEventListener('click', () => {
    document.getElementById('setGoalOverlay').style.display = 'none';
});

// Save reading session
document.getElementById('saveLogSession').addEventListener('click', async () => {
    const bookId = document.getElementById('sessionBook').value;
    const pagesRead = parseInt(document.getElementById('sessionPages').value);
    const duration = parseInt(document.getElementById('sessionDuration').value);


    if (!bookId || !pagesRead || !duration) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const btn = document.getElementById('saveLogSession');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Saving...';

    try {
        const res = await apiCall('/api/reading/log', 'POST', {
            bookId, pagesRead, duration,
        });

        if (res.ok) {
            showToast('Reading session logged!');
            document.getElementById('logSessionOverlay').style.display = 'none';
            ['sessionPages', 'sessionDuration']
                .forEach(id => document.getElementById(id).value = '');
            document.getElementById('sessionBook').value = '';

            // Check if book is now complete
            const currentPage = parseInt(document.getElementById('sessionCurrentPage')?.value) || 0;
            const selectedOption = document.getElementById('sessionBook').options[
                document.getElementById('sessionBook').selectedIndex
            ];

            // Get fresh reading data to check completion
            const readingRes = await apiCall('/api/reading/my');
            if (readingRes.ok) {
                const bookMap = {};
                readingRes.data.forEach(session => {
                    const bookId = session.book._id;
                    if (!bookMap[bookId] || session.currentPage > bookMap[bookId].currentPage) {
                        bookMap[bookId] = session;
                    }
                });

                Object.values(bookMap).forEach(session => {
                    if (session.book.totalPages) {
                        const percent = Math.round((session.currentPage / session.book.totalPages) * 100);
                        if (percent >= 100 && !celebratedBooks.has(session.book._id)) {
                            celebratedBooks.add(session.book._id);
                            showCelebration(session.book.title);
                        }
                    }
                });
            }

            loadStats();
            loadGoal();
            loadReadingProgress();
            loadWeeklyChart();
        } else {
            showToast(res.data.message || 'Failed to log session', 'error');
        }
    } catch (e) {
        showToast('Failed to log session', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Log Session</span><i class="fas fa-save"></i>';
    }
});

// Save goal
document.getElementById('saveGoalBtn').addEventListener('click', async () => {
    const targetBooks = parseInt(document.getElementById('goalBooks').value) || 0;
    const targetHours = parseInt(document.getElementById('goalHours').value) || 0;
    const deadline = document.getElementById('goalDeadline').value;

    if (!deadline) {
        showToast('Please set a deadline', 'error');
        return;
    }

    if (!targetBooks && !targetHours) {
        showToast('Please set at least one target', 'error');
        return;
    }

    const btn = document.getElementById('saveGoalBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Saving...';

    try {
        const res = await apiCall('/api/goals', 'POST', {
            targetBooks, targetHours, endDate: deadline
        });

        if (res.ok) {
            showToast('Goal set successfully!');
            document.getElementById('setGoalOverlay').style.display = 'none';
            ['goalBooks', 'goalHours', 'goalDeadline']
                .forEach(id => document.getElementById(id).value = '');
            loadGoal();
        } else {
            showToast(res.data.message || 'Failed to set goal', 'error');
        }
    } catch (e) {
        showToast('Failed to set goal', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Set Goal</span><i class="fas fa-bullseye"></i>';
    }
});
// Celebration popup
function showCelebration(title, isGoal = false) {
    document.getElementById('celebrationBookTitle').textContent = title;
    document.getElementById('celebrationEmoji').textContent = isGoal ? '🏆' : '🎉';
    document.getElementById('celebrationMessage').textContent = isGoal
        ? 'You crushed your reading goal! You\'re a reading champion! 🌟'
        : 'Amazing! You\'ve finished reading this book. Keep it up! ';
    const popup = document.getElementById('celebrationPopup');
    popup.style.display = 'flex';
    launchSparkles();
}

function closeCelebration() {
    document.getElementById('celebrationPopup').style.display = 'none';
}

function launchSparkles() {
    const container = document.getElementById('sparkles');
    container.innerHTML = '';
    const colors = ['#ff9800', '#ff5722', '#2563eb', '#16a34a', '#f59e0b', '#ec4899'];
    for (let i = 0; i < 30; i++) {
        const spark = document.createElement('div');
        spark.style.cssText = `
            position: absolute;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: sparkle ${Math.random() * 1 + 0.5}s ease forwards;
            opacity: 0;
        `;
        container.appendChild(spark);
    }
}

// Init all
// Pre-populate celebrated books on load
apiCall('/api/reading/my').then(res => {
    if (!res.ok) return;
    const bookMap = {};
    res.data.forEach(session => {
        const bookId = session.book._id;
        if (!bookMap[bookId] || session.currentPage > bookMap[bookId].currentPage) {
            bookMap[bookId] = session;
        }
    });
    Object.values(bookMap).forEach(session => {
        if (session.book.totalPages) {
            const percent = Math.round((session.currentPage / session.book.totalPages) * 100);
            if (percent >= 100) celebratedBooks.add(session.book._id);
        }
    });
});


// Notification modal
document.getElementById('notifIcon').addEventListener('click', async (e) => {
    e.preventDefault();
    document.getElementById('notifOverlay').style.display = 'flex';
    await loadNotifications_modal();
});

document.getElementById('closeNotif').addEventListener('click', () => {
    document.getElementById('notifOverlay').style.display = 'none';
});

document.getElementById('notifOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('notifOverlay'))
        document.getElementById('notifOverlay').style.display = 'none';
});

const notifIconMap = {
    borrow_approved: { icon: 'fa-check', cls: 'approved' },
    borrow_rejected: { icon: 'fa-times', cls: 'rejected' },
    borrow_pending: { icon: 'fa-clock', cls: 'pending' },
    book_available: { icon: 'fa-book', cls: 'default' },
    return_approved: { icon: 'fa-undo', cls: 'approved' },
    overdue: { icon: 'fa-exclamation', cls: 'rejected' }
};

async function loadNotifications_modal() {
    try {
        const res = await apiCall('/api/notifications');
        if (!res.ok) return;

        const list = document.getElementById('notifList');

        if (res.data.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding:2rem;">
                    <i class="fas fa-bell"></i>
                    <p>No notifications yet</p>
                </div>`;
            return;
        }

        list.innerHTML = res.data.map(n => {
            const map = notifIconMap[n.type] || { icon: 'fa-bell', cls: 'default' };
            const time = new Date(n.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            return `
                <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n._id}', this)">
                    <div class="notif-icon ${map.cls}">
                        <i class="fas ${map.icon}"></i>
                    </div>
                    <div class="notif-content">
                        <div class="notif-message">${n.message}</div>
                        <div class="notif-time">${time}</div>
                    </div>
                    ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
                </div>
            `;
        }).join('');

        // Mark all as read after opening
        await apiCall('/api/notifications/mark-all-read', 'PUT');
        document.getElementById('notifBadge').style.display = 'none';

    } catch (e) {}
}

async function markRead(id, el) {
    try {
        await apiCall(`/api/notifications/${id}/read`, 'PUT');
        el.classList.remove('unread');
        el.querySelector('.notif-unread-dot')?.remove();
    } catch (e) {}
}

loadNotifications();
loadStats();
loadBorrowedBooks();
loadRecentActivity();
loadReadingProgress();
loadWeeklyChart();
loadGoal()


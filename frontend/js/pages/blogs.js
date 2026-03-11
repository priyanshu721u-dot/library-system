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
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// Current blog id for comments
let currentBlogId = null;

// Load blogs
async function loadBlogs() {
    try {
        const res = await apiCall('/api/blogs');
        if (!res.ok) return;

        const blogs = res.data;
        document.getElementById('blogCount').textContent = `${blogs.length} posts`;

        if (blogs.length === 0) {
            document.getElementById('blogsGrid').innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-newspaper"></i>
                    <p>No blog posts yet</p>
                </div>`;
            return;
        }

        document.getElementById('blogsGrid').innerHTML = blogs.map(blog => `
            <div class="blog-card" onclick="openBlog('${blog._id}')">
                <div class="blog-card-cover">
                    ${blog.coverImage
                        ? `<img src="${blog.coverImage}" alt="${blog.title}">`
                        : `<i class="fas fa-newspaper"></i>`}
                </div>
                <div class="blog-card-body">
                    <div class="blog-card-title">${blog.title}</div>
                    <div class="blog-card-excerpt">${blog.content}</div>
                    <div class="blog-card-footer">
                        <div class="blog-card-author">
                            <div class="blog-author-avatar">
                                ${blog.author.username.charAt(0).toUpperCase()}
                            </div>
                            ${blog.author.username}
                        </div>
                        <div class="blog-card-date">
                            <i class="fas fa-calendar"></i> ${formatDate(blog.createdAt)}
                        </div>
                    </div>
                    <div class="blog-card-read-more" style="margin-top:0.8rem;">
                        Read More <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (e) {
        document.getElementById('blogsGrid').innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load blogs</p>
            </div>`;
    }
}

// Open blog modal
async function openBlog(blogId) {
    currentBlogId = blogId;

    try {
        const res = await apiCall('/api/blogs');
        if (!res.ok) return;

        const blog = res.data.find(b => b._id === blogId);
        if (!blog) return;

        document.getElementById('modalBlogTitle').textContent = blog.title;
        document.getElementById('modalBlogMeta').innerHTML = `
            <span><i class="fas fa-user"></i> ${blog.author.username}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(blog.createdAt)}</span>
        `;
        document.getElementById('modalBlogContent').textContent = blog.content;

        document.getElementById('blogModal').style.display = 'flex';

        loadComments(blogId);

    } catch (e) {}
}

// Load comments
async function loadComments(blogId) {
    try {
        const res = await apiCall(`/api/comments/${blogId}`);
        const commentsList = document.getElementById('commentsList');

        if (!res.ok || res.data.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state" style="padding:1rem 0;">
                    <p style="color:var(--text-gray); font-size:0.85rem;">No comments yet. Be the first to comment!</p>
                </div>`;
            return;
        }

        commentsList.innerHTML = res.data.map(comment => `
            <div class="comment-item">
                <div class="comment-avatar">
                    ${comment.user.username.charAt(0).toUpperCase()}
                </div>
                <div class="comment-body">
                    <div class="comment-author">${comment.user.username}</div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-date">${formatDate(comment.createdAt)}</div>
                </div>
            </div>
        `).join('');

    } catch (e) {}
}

// Submit comment
document.getElementById('submitComment').addEventListener('click', async () => {
    const content = document.getElementById('commentInput').value.trim();

    if (!content) {
        showToast('Please write a comment first', 'error');
        return;
    }

    if (!currentBlogId) return;

    try {
        const res = await apiCall(`/api/comments/${currentBlogId}`, 'POST', { content });

        if (res.ok) {
            document.getElementById('commentInput').value = '';
            showToast('Comment posted!');
            loadComments(currentBlogId);
        } else {
            showToast(res.data.message || 'Failed to post comment', 'error');
        }
    } catch (e) {
        showToast('Failed to post comment', 'error');
    }
});

// Enter key for comment
document.getElementById('commentInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('submitComment').click();
    }
});

// Close modal
document.getElementById('closeBlogModal').addEventListener('click', () => {
    document.getElementById('blogModal').style.display = 'none';
    currentBlogId = null;
});

document.getElementById('blogModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('blogModal')) {
        document.getElementById('blogModal').style.display = 'none';
        currentBlogId = null;
    }
});

// Init
loadBlogs();
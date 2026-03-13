// Check auth
requireAuth('admin');

const user = getUser();
document.getElementById('userName').textContent = user.username;
document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
loadAvatar();
loadSidebarAvatar();

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

let allBlogs = [];
let editingBlogId = null;

// Load blogs
async function loadBlogs() {
    try {
        const res = await apiCall('/api/blogs');
        if (!res.ok) return;
        allBlogs = res.data;
        renderBlogs();
    } catch (e) { }
}

// Render blogs
function renderBlogs() {
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = allBlogs;
    if (search) {
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(search) ||
            b.author.username.toLowerCase().includes(search)
        );
    }

    document.getElementById('blogCount').textContent = `${filtered.length} posts`;

    if (filtered.length === 0) {
        document.getElementById('blogsTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-gray);">
                    No blogs found
                </td>
            </tr>`;
        return;
    }

    document.getElementById('blogsTableBody').innerHTML = filtered.map(blog => `
        <tr>
            <td>
                ${blog.coverImage
            ? `<img src="${blog.coverImage}" class="book-cover-thumb" alt="cover"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="book-cover-thumb" style="display:none;">
                           <i class="fas fa-newspaper"></i>
                       </div>`
            : `<div class="book-cover-thumb">
                           <i class="fas fa-newspaper"></i>
                       </div>`
        }
            </td>
            <td>
                <div style="font-weight:600; max-width:220px;">${blog.title}</div>
                <div style="font-size:0.8rem; color:var(--text-gray); margin-top:2px;
                    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    ${blog.content}
                </div>
            </td>
            <td>${blog.author.username}</td>
            <td>${formatDate(blog.createdAt)}</td>
            <td>
                <button class="btn-approve" style="background:#f5f3ff; color:#7c3aed;"
                    onclick="viewComments('${blog._id}')">
                    <i class="fas fa-comments"></i> View
                </button>
            </td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-approve" onclick="openEditModal('${blog._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-reject" onclick="openDeleteModal('${blog._id}', '${blog.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Open add modal
document.getElementById('openAddModal').addEventListener('click', () => {
    editingBlogId = null;
    document.getElementById('blogModalTitle').innerHTML = '<i class="fas fa-pen"></i> New Blog Post';
    document.getElementById('saveBlogBtn').innerHTML = '<span>Publish Post</span><i class="fas fa-paper-plane"></i>';
    clearBlogForm();
    document.getElementById('blogModalOverlay').style.display = 'flex';
});

// Open edit modal
function openEditModal(blogId) {
    const blog = allBlogs.find(b => b._id === blogId);
    if (!blog) return;

    editingBlogId = blogId;
    document.getElementById('blogModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Blog Post';
    document.getElementById('saveBlogBtn').innerHTML = '<span>Save Changes</span><i class="fas fa-save"></i>';

    document.getElementById('blogTitle').value = blog.title || '';
    document.getElementById('blogContent').value = blog.content || '';
    document.getElementById('blogCoverImage').value = blog.coverImage || '';

    document.getElementById('blogModalOverlay').style.display = 'flex';
}
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
// Clear form
function clearBlogForm() {
    ['blogTitle', 'blogContent', 'blogCoverImage']
        .forEach(id => document.getElementById(id).value = '');
}

// Save blog
document.getElementById('saveBlogBtn').addEventListener('click', async () => {
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const coverImage = document.getElementById('blogCoverImage').value.trim();

    if (!title || !content) {
        showToast('Please fill in title and content', 'error');
        return;
    }

    const btn = document.getElementById('saveBlogBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Saving...';

    try {
        let res;
        if (editingBlogId) {
            res = await apiCall(`/api/blogs/${editingBlogId}`, 'PUT', {
                title, content, coverImage: coverImage || ''
            });
        } else {
            res = await apiCall('/api/blogs', 'POST', {
                title, content, coverImage: coverImage || ''
            });
        }

        if (res.ok) {
            showToast(editingBlogId ? 'Blog updated!' : 'Blog published!');
            closeBlogModal();
            loadBlogs();
        } else {
            showToast(res.data.message || 'Failed to save blog', 'error');
        }
    } catch (e) {
        showToast('Failed to save blog', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = editingBlogId
            ? '<span>Save Changes</span><i class="fas fa-save"></i>'
            : '<span>Publish Post</span><i class="fas fa-paper-plane"></i>';
    }
});

// View comments
async function viewComments(blogId) {
    try {
        const res = await apiCall(`/api/comments/${blogId}`);
        const body = document.getElementById('commentsModalBody');

        if (!res.ok || res.data.length === 0) {
            body.innerHTML = `
                <div style="text-align:center; padding:2rem; color:var(--text-gray);">
                    <i class="fas fa-comments" style="font-size:2rem; margin-bottom:0.8rem; display:block;"></i>
                    No comments yet
                </div>`;
        } else {
            body.innerHTML = res.data.map(comment => `
            <div style="display:flex; gap:0.8rem; padding:0.8rem 0; border-bottom:1px solid #f1f5f9; align-items:flex-start;">
            <div style="width:34px; height:34px; background:var(--primary-blue); border-radius:50%;
            display:flex; align-items:center; justify-content:center; color:white;
            font-size:0.8rem; font-weight:700; flex-shrink:0;">
            ${comment.user.username.charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;">
            <div style="font-size:0.85rem; font-weight:600; color:var(--text-dark);">
                ${comment.user.username}
            </div>
            <div style="font-size:0.85rem; color:var(--text-gray); margin-top:2px;">
                ${comment.content}
            </div>
            <div style="font-size:0.75rem; color:var(--text-gray); margin-top:4px;">
                ${formatDate(comment.createdAt)}
            </div>
        </div>
        <button onclick="deleteComment('${comment._id}', '${blogId}')"
            style="background:#fef2f2; color:#dc2626; border:none; border-radius:8px;
            padding:0.4rem 0.7rem; cursor:pointer; font-size:0.8rem; flex-shrink:0;
            transition:all 0.3s ease;"
            onmouseover="this.style.background='#dc2626'; this.style.color='white';"
            onmouseout="this.style.background='#fef2f2'; this.style.color='#dc2626';">
            <i class="fas fa-trash"></i>
        </button>
    </div>
`).join('');
        }

        document.getElementById('commentsModalOverlay').style.display = 'flex';
    } catch (e) {
        showToast('Failed to load comments', 'error');
    }
}
async function deleteComment(commentId, blogId) {
    try {
        const res = await apiCall(`/api/comments/${commentId}`, 'DELETE');
        if (res.ok) {
            showToast('Comment deleted!');
            viewComments(blogId);
        } else {
            showToast(res.data.message || 'Failed to delete comment', 'error');
        }
    } catch (e) {
        showToast('Failed to delete comment', 'error');
    }
}

// Delete modal
let deletingBlogId = null;

function openDeleteModal(blogId, blogTitle) {
    deletingBlogId = blogId;
    document.getElementById('deleteBlogName').textContent = blogTitle;
    document.getElementById('deleteModalOverlay').style.display = 'flex';
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deletingBlogId) return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="border-top-color:#dc2626;"></div> Deleting...';

    try {
        const res = await apiCall(`/api/blogs/${deletingBlogId}`, 'DELETE');
        if (res.ok) {
            showToast('Blog deleted!');
            closeDeleteModal();
            loadBlogs();
        } else {
            showToast(res.data.message || 'Failed to delete', 'error');
        }
    } catch (e) {
        showToast('Failed to delete', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deletingBlogId = null;
    }
});

// Close modals
function closeBlogModal() {
    document.getElementById('blogModalOverlay').style.display = 'none';
    editingBlogId = null;
    clearBlogForm();
}

function closeDeleteModal() {
    document.getElementById('deleteModalOverlay').style.display = 'none';
    deletingBlogId = null;
}

document.getElementById('closeBlogModal').addEventListener('click', closeBlogModal);
document.getElementById('cancelBlogModal').addEventListener('click', closeBlogModal);
document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('closeCommentsModal').addEventListener('click', () => {
    document.getElementById('commentsModalOverlay').style.display = 'none';
});

document.getElementById('blogModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('blogModalOverlay')) closeBlogModal();
});

document.getElementById('deleteModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModalOverlay')) closeDeleteModal();
});

document.getElementById('commentsModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('commentsModalOverlay')) {
        document.getElementById('commentsModalOverlay').style.display = 'none';
    }
});

// Search
document.getElementById('searchInput').addEventListener('input', renderBlogs);

// Init
loadBlogs();
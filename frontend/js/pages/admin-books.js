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

let allBooks = [];
let editingBookId = null;

// Load books
async function loadBooks() {
    try {
        const res = await apiCall('/api/books');
        if (!res.ok) return;
        allBooks = res.data;
        renderBooks();
    } catch (e) { }
}

// Render books
function renderBooks() {
    const search = document.getElementById('searchInput').value.toLowerCase();

    let filtered = allBooks;
    if (search) {
        filtered = filtered.filter(b =>
            b.title.toLowerCase().includes(search) ||
            b.author.toLowerCase().includes(search) ||
            (b.ISBN && b.ISBN.toLowerCase().includes(search))
        );
    }

    document.getElementById('bookCount').textContent = `${filtered.length} books`;

    if (filtered.length === 0) {
        document.getElementById('booksTableBody').innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-gray);">
                    No books found
                </td>
            </tr>`;
        return;
    }

    document.getElementById('booksTableBody').innerHTML = filtered.map(book => `
        <tr>
            <td>
               ${book.coverImage && !book.coverImage.includes('placeholder.com')
            ? `<img src="${book.coverImage}" class="book-cover-thumb" alt="cover"
        style="object-fit:cover;"
        onerror="this.parentElement.innerHTML='<div class=\\'book-cover-thumb book-cover-fallback\\'>${book.title.charAt(0)}</div>'">`
            : `<div class="book-cover-thumb book-cover-fallback">${book.title.charAt(0)}</div>`
        }
            </td>
            <td>
                <div style="font-weight:600; max-width:180px;">${book.title}</div>
            </td>
            <td>${book.author}</td>
            <td style="font-size:0.85rem; color:var(--text-gray);">${book.ISBN || 'N/A'}</td>
            <td>
                <span style="background:#eff6ff; color:var(--primary-blue); padding:0.3rem 0.7rem;
                    border-radius:50px; font-size:0.78rem; font-weight:600;">
                    ${book.category || 'N/A'}
                </span>
            </td>
            <td style="font-weight:600;">${book.totalCopies || 0}</td>
            <td>
                <span style="font-weight:700; color:${book.availableCopies > 0 ? '#16a34a' : '#dc2626'};">
                    ${book.availableCopies || 0}
                </span>
            </td>
            <td>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn-approve" onclick="openEditModal('${book._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-reject" onclick="openDeleteModal('${book._id}', '${book.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getBookCover(book) {
    if (book.coverImage && !book.coverImage.includes('placeholder.com')) {
        return `<img src="${book.coverImage}" alt="${book.title}" 
            style="width:100%; height:100%; object-fit:cover; border-radius:inherit;"
            onerror="this.parentElement.innerHTML='<div class=\\'book-cover-fallback\\'>${book.title.charAt(0)}</div>'">`;
    }
    return `<div class="book-cover-fallback">${book.title.charAt(0)}</div>`;
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
// Open add modal
document.getElementById('openAddModal').addEventListener('click', () => {
    editingBookId = null;
    document.getElementById('bookModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Book';
    document.getElementById('saveBookBtn').innerHTML = '<span>Add Book</span><i class="fas fa-plus"></i>';
    clearBookForm();
    document.getElementById('bookModalOverlay').style.display = 'flex';
});

// Open edit modal
function openEditModal(bookId) {
    const book = allBooks.find(b => b._id === bookId);

    if (!book) return;

    editingBookId = bookId;
    document.getElementById('bookModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Book';
    document.getElementById('saveBookBtn').innerHTML = '<span>Save Changes</span><i class="fas fa-save"></i>';

    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookISBN').value = book.ISBN || '';
    document.getElementById('bookCategory').value = book.category || '';
    document.getElementById('bookTotalCopies').value = book.totalCopies || '';
    document.getElementById('bookTotalPages').value = book.totalPages || '';

    document.getElementById('bookCoverImage').value = book.coverImage || '';

    document.getElementById('bookModalOverlay').style.display = 'flex';
}

// Clear form
function clearBookForm() {
    ['bookTitle', 'bookAuthor', 'bookISBN', 'bookCategory',
        'bookTotalCopies', 'bookTotalPages', 'bookCoverImage']
        .forEach(id => document.getElementById(id).value = '');
}

// Save book (add or edit)
document.getElementById('saveBookBtn').addEventListener('click', async () => {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const ISBN = document.getElementById('bookISBN').value.trim();
    const category = document.getElementById('bookCategory').value.trim();
    const totalCopies = parseInt(document.getElementById('bookTotalCopies').value);
    const totalPages = parseInt(document.getElementById('bookTotalPages').value) || 0;

    const coverImage = document.getElementById('bookCoverImage').value.trim();

    if (!title || !author || !ISBN || !category || !totalCopies) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    if (!coverImage) {
        showToast('Please add a cover image', 'error');
        return;
    }

    const btn = document.getElementById('saveBookBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Saving...';

    try {
        let res;
        if (editingBookId) {
            res = await apiCall(`/api/books/${editingBookId}`, 'PUT', {
                title, author, ISBN, category,
                totalCopies, totalPages, coverImage
            });
        } else {
            res = await apiCall('/api/books', 'POST', {
                title, author, ISBN, category,
                totalCopies,
                availableCopies: totalCopies,
                totalPages, coverImage
            });
        }

        if (res.ok) {
            showToast(editingBookId ? 'Book updated!' : 'Book added!');
            closeBookModal();
            loadBooks();
        } else {
            showToast(res.data.message || 'Failed to save book', 'error');
        }
    } catch (e) {
        showToast('Failed to save book', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = editingBookId
            ? '<span>Save Changes</span><i class="fas fa-save"></i>'
            : '<span>Add Book</span><i class="fas fa-plus"></i>';
    }
});

// Delete modal
let deletingBookId = null;

function openDeleteModal(bookId, bookTitle) {

    deletingBookId = bookId;
    document.getElementById('deleteBookName').textContent = bookTitle;
    document.getElementById('deleteModalOverlay').style.display = 'flex';
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deletingBookId) return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="border-top-color:#dc2626;"></div> Deleting...';

    try {
        const res = await apiCall(`/api/books/${deletingBookId}`, 'DELETE');
        if (res.ok) {
            showToast('Book deleted!');
            closeDeleteModal();
            loadBooks();
        } else {
            showToast(res.data.message || 'Failed to delete', 'error');
        }
    } catch (e) {
        showToast('Failed to delete', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deletingBookId = null;
    }
});

// Close modals
function closeBookModal() {
    document.getElementById('bookModalOverlay').style.display = 'none';
    editingBookId = null;
    clearBookForm();
}

function closeDeleteModal() {
    document.getElementById('deleteModalOverlay').style.display = 'none';
    deletingBookId = null;
}

document.getElementById('closeBookModal').addEventListener('click', closeBookModal);
document.getElementById('cancelBookModal').addEventListener('click', closeBookModal);
document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDeleteModal').addEventListener('click', closeDeleteModal);

document.getElementById('bookModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('bookModalOverlay')) closeBookModal();
});

document.getElementById('deleteModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModalOverlay')) closeDeleteModal();
});

// Search
document.getElementById('searchInput').addEventListener('input', renderBooks);

// Init
loadBooks();
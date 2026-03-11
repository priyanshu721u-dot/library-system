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

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Cart
let cart = [];

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (cart.length > 0) {
        badge.textContent = cart.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function addToCart(book) {
    if (cart.find(b => b._id === book._id)) {
        showToast('Book already in cart', 'error');
        return;
    }
    if (cart.length >= 3) {
        showToast('You can only borrow 3 books at once', 'error');
        return;
    }
    if (book.availableCopies === 0) {
        showToast('This book is out of stock', 'error');
        return;
    }
    cart.push(book);
    updateCartBadge();
    showToast(`"${book.title}" added to cart`);
}

function removeFromCart(bookId) {
    cart = cart.filter(b => b._id !== bookId);
    updateCartBadge();
    renderCartModal();
}

function renderCartModal() {
    const cartList = document.getElementById('cartList');
    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>`;
        return;
    }
    cartList.innerHTML = cart.map(book => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${book.title}</div>
                <div class="cart-item-author">${book.author}</div>
            </div>
            <button class="cart-remove-btn" onclick="removeFromCart('${book._id}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `).join('');
}

// Cart modal
document.getElementById('cartIcon').addEventListener('click', (e) => {
    e.preventDefault();
    renderCartModal();
    document.getElementById('cartModal').style.display = 'flex';
});

document.getElementById('closeCart').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'none';
});

// Borrow all books in cart
document.getElementById('borrowAllBtn').addEventListener('click', async () => {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }

    const btn = document.getElementById('borrowAllBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Requesting...';

    let successCount = 0;
    let failCount = 0;

    for (const book of cart) {
        try {
            const res = await apiCall(`/api/borrows/borrow/${book._id}`, 'POST');
            if (res.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (e) {
            failCount++;
        }
    }

    cart = [];
    updateCartBadge();
    document.getElementById('cartModal').style.display = 'none';

    if (successCount > 0) {
        showToast(`${successCount} book(s) requested successfully!`);
    }
    if (failCount > 0) {
        showToast(`${failCount} book(s) failed to request`, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check"></i> Request All Books';
});

// Wishlist
async function toggleWishlist(book, btn) {
    try {
        const res = await apiCall(`/api/wishlist/${book._id}`, 'POST');
        if (res.ok) {
            showToast(`"${book.title}" added to wishlist`);
            btn.style.color = '#ef4444';
        } else {
            // Try delete
            const delRes = await apiCall(`/api/wishlist/${book._id}`, 'DELETE');
            if (delRes.ok) {
                showToast(`"${book.title}" removed from wishlist`);
                btn.style.color = '';
            }
        }
    } catch (e) {
        showToast('Failed to update wishlist', 'error');
    }
}

// Wishlist modal
document.getElementById('wishlistIcon').addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await apiCall('/api/wishlist/my');
    const wishlistList = document.getElementById('wishlistList');

    if (!res.ok || res.data.length === 0) {
        wishlistList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>Your wishlist is empty</p>
            </div>`;
    } else {
        wishlistList.innerHTML = res.data.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.book.title}</div>
                    <div class="cart-item-author">${item.book.author}</div>
                </div>
                <span class="availability-badge ${item.book.availableCopies > 0 ? 'badge-available' : 'badge-out'}">
                    ${item.book.availableCopies > 0 ? 'Available' : 'Out of Stock'}
                </span>
            </div>
        `).join('');
    }

    document.getElementById('wishlistModal').style.display = 'flex';
});

document.getElementById('closeWishlist').addEventListener('click', () => {
    document.getElementById('wishlistModal').style.display = 'none';
});

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
    });
});

// Availability badge
function getAvailabilityBadge(book) {
    if (book.availableCopies === 0) {
        return '<span class="availability-badge badge-out">Out of Stock</span>';
    } else if (book.availableCopies <= 2) {
        return '<span class="availability-badge badge-few">Few Left</span>';
    }
    return '<span class="availability-badge badge-available">Available</span>';
}

// Render books grid
function renderBooks(books) {
    const grid = document.getElementById('booksGrid');
    document.getElementById('bookCount').textContent = `${books.length} books`;

    if (books.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-book"></i>
                <p>No books found</p>
            </div>`;
        return;
    }

    grid.innerHTML = books.map(book => `
        <div class="book-card">
            <div class="book-cover">
                ${book.isNew ? '<span class="badge-new">NEW</span>' : ''}
                ${book.coverImage
                    ? `<img src="${book.coverImage}" alt="${book.title}">`
                    : `<i class="fas fa-book"></i>`}
                <div class="book-actions">
                    <button class="book-action-btn cart" onclick="addToCart(${JSON.stringify(book).replace(/"/g, '&quot;')})" title="Add to Cart">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                    <button class="book-action-btn wishlist" onclick="toggleWishlist(${JSON.stringify(book).replace(/"/g, '&quot;')}, this)" title="Add to Wishlist">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
            <div class="book-meta">
                <span class="book-category">${book.category}</span>
                ${getAvailabilityBadge(book)}
            </div>
        </div>
    `).join('');
}

// Render trending books
function renderTrending(books) {
    const trending = books.filter(b => b.isTrending).slice(0, 8);
    const list = document.getElementById('trendingList');

    if (trending.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-fire"></i>
                <p>No trending books</p>
            </div>`;
        return;
    }

    list.innerHTML = trending.map(book => `
        <div class="trending-book-card">
            <div class="trending-book-cover">
                ${book.coverImage
                    ? `<img src="${book.coverImage}" alt="${book.title}">`
                    : `<i class="fas fa-book"></i>`}
            </div>
            <div class="trending-book-title">${book.title}</div>
            <div class="trending-book-author">${book.author}</div>
        </div>
    `).join('');
}

// All books data
let allBooks = [];

// Load books
async function loadBooks() {
    try {
        const res = await apiCall('/api/books');
        if (!res.ok) return;

        allBooks = res.data;
        renderBooks(allBooks);
        renderTrending(allBooks);
    } catch (e) {
        document.getElementById('booksGrid').innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load books</p>
            </div>`;
    }
}

// Search
document.getElementById('searchInput').addEventListener('input', filterBooks);

// Category filter
// Custom dropdown
let selectedCategory = '';

document.getElementById('categoryDropdown').addEventListener('click', (e) => {
    document.getElementById('categoryDropdown').classList.toggle('open');
});

document.querySelectorAll('.custom-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedCategory = option.dataset.value;
        document.getElementById('categorySelected').textContent = option.textContent;
        document.querySelectorAll('.custom-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        document.getElementById('categoryDropdown').classList.remove('open');
        filterBooks();
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#categoryDropdown')) {
        document.getElementById('categoryDropdown').classList.remove('open');
    }
});
// Sort buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterBooks();
    });
});

function filterBooks() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const sort = document.querySelector('.filter-btn.active').dataset.sort;

    let filtered = allBooks.filter(book => {
        const matchSearch = !search ||
            book.title.toLowerCase().includes(search) ||
            book.author.toLowerCase().includes(search) ||
            book.ISBN.toLowerCase().includes(search);
        const matchCategory = !selectedCategory || book.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    if (sort === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'available') {
        filtered.sort((a, b) => b.availableCopies - a.availableCopies);
    } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    renderBooks(filtered);
}

// Init
loadBooks();
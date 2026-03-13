const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
let adminToken = '';
let studentToken = '';
let studentId = '';
let bookId = '';
let borrowId = '';
let blogId = '';
let goalId = '';

// Colors for terminal output
const green = (msg) => console.log(`\x1b[32m✓ ${msg}\x1b[0m`);
const red = (msg) => console.log(`\x1b[31m✗ ${msg}\x1b[0m`);
const blue = (msg) => console.log(`\x1b[34m\n--- ${msg} ---\x1b[0m`);

async function test(name, fn) {
    try {
        await fn();
        green(name);
    } catch (e) {
        red(`${name}: ${e.response?.data?.message || e.message}`);
    }
}

function api(token) {
    return axios.create({
        baseURL: BASE_URL,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
}

async function runTests() {
    console.log('\x1b[36m================================\x1b[0m');
    console.log('\x1b[36m   ReadON Automated Test Suite  \x1b[0m');
    console.log('\x1b[36m================================\x1b[0m');

    // ---- AUTH ----
    blue('AUTH TESTS');

    await test('Admin login', async () => {
        const res = await api().post('/auth/login', {
            email: 'admin@test.com',
            password: '123456'
        });
        adminToken = res.data.token;
        if (!adminToken) throw new Error('No token returned');
    });

    await test('Register student', async () => {
        const res = await api().post('/auth/register', {
            username: 'newTest',
            email: 'absoluteTesting@test.com',
            password: 'TakingtesT',
            role: 'student'
        });
        studentToken = res.data.token;
        studentId = res.data._id;
        if (!studentToken) throw new Error('No token returned');
    });

    await test('Student login', async () => {
        const res = await api().post('/auth/login', {
            email: 'tesstunt@test.com',
            password: 'test6123'
        });
        studentToken = res.data.token;
        if (!studentToken) throw new Error('No token returned');
    });

    await test('Get student profile', async () => {
        const res = await api(studentToken).get('/profile');
        if (!res.data.username) throw new Error('No profile data');
    });

    // ---- BOOKS ----
    blue('BOOK TESTS');

    await test('Admin adds book', async () => {
        const res = await api(adminToken).post('/books', {
            title: 'Test Book',
            author: 'Test Author',
            ISBN: '1234567890',
            category: 'Fiction',
            totalCopies: 3,
            availableCopies: 3,
            totalPages: 200,
            coverImage: 'https://via.placeholder.com/150'
        });
        bookId = res.data._id;
        if (!bookId) throw new Error('No book ID returned');
    });

    await test('Get all books', async () => {
        const res = await api(studentToken).get('/books');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Admin edits book', async () => {
        await api(adminToken).put(`/books/${bookId}`, {
            title: 'Test Book Updated'
        });
    });

    // ---- BORROWS ----
    blue('BORROW TESTS');

    await test('Student requests borrow', async () => {
        const res = await api(studentToken).post(`/borrows/borrow/${bookId}`);
        borrowId = res.data._id;
        if (!borrowId) throw new Error('No borrow ID returned');
    });

    await test('Admin sees all borrows', async () => {
        const res = await api(adminToken).get('/borrows/all');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Student sees own borrows', async () => {
        const res = await api(studentToken).get('/borrows/my');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Admin approves borrow', async () => {
        await api(adminToken).put(`/borrows/approve/${borrowId}`);
    });

    // ---- READING ----
    blue('READING TESTS');

    await test('Student logs reading session', async () => {
        await api(studentToken).post('/reading/log', {
            bookId,
            pagesRead: 50,
            duration: 60
        });
    });

    await test('Student gets reading sessions', async () => {
        const res = await api(studentToken).get('/reading/my');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    // ---- GOALS ----
    blue('GOAL TESTS');

    await test('Student sets reading goal', async () => {
        const res = await api(studentToken).post('/goals', {
            targetHours: 10,
            targetBooks: 2,
            endDate: '2026-12-31'
        });
        goalId = res.data._id;
        if (!goalId) throw new Error('No goal ID returned');
    });

    await test('Student gets goals', async () => {
        const res = await api(studentToken).get('/goals/my');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Student checks goal progress', async () => {
        const res = await api(studentToken).get(`/goals/${goalId}/progress`);
        if (res.data.progressHours === undefined) throw new Error('No progress data');
    });

    // ---- WISHLIST ----
    blue('WISHLIST TESTS');

    await test('Student adds to wishlist', async () => {
        await api(studentToken).post(`/wishlist/${bookId}`);
    });

    await test('Student gets wishlist', async () => {
        const res = await api(studentToken).get('/wishlist/my');
        if (!res.data.wishlist) throw new Error('No wishlist data');
    });

    await test('Student removes from wishlist', async () => {
        await api(studentToken).delete(`/wishlist/${bookId}`);
    });

    // ---- BLOGS ----
    blue('BLOG TESTS');

    await test('Admin creates blog', async () => {
        const res = await api(adminToken).post('/blogs', {
            title: 'Test Blog',
            content: 'Test blog content here.',
            coverImage: ''
        });
        blogId = res.data._id;
        if (!blogId) throw new Error('No blog ID returned');
    });

    await test('Get all blogs', async () => {
        const res = await api(studentToken).get('/blogs');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Student adds comment', async () => {
        await api(studentToken).post(`/comments/${blogId}`, {
            content: 'Great blog!'
        });
    });

    await test('Get blog comments', async () => {
        const res = await api(studentToken).get(`/comments/${blogId}`);
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    // ---- STATS ----
    blue('STATS TESTS');

    await test('Student stats', async () => {
        const res = await api(studentToken).get('/stats/student');
        if (res.data.totalBorrows === undefined) throw new Error('No stats data');
    });

    await test('Admin stats', async () => {
        const res = await api(adminToken).get('/stats/admin');
        if (res.data.totalStudents === undefined) throw new Error('No stats data');
    });

    await test('Leaderboard', async () => {
        const res = await api(studentToken).get('/stats/leaderboard');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    // ---- RETURN ----
    blue('RETURN TESTS');

    await test('Student requests return', async () => {
        await api(studentToken).put(`/borrows/return/${borrowId}`);
    });

    await test('Admin approves return', async () => {
        await api(adminToken).put(`/borrows/approve-return/${borrowId}`);
    });

    // ---- USERS ----
    blue('USER TESTS');

    await test('Admin gets all users', async () => {
        const res = await api(adminToken).get('/users/all');
        if (!Array.isArray(res.data)) throw new Error('Not an array');
    });

    await test('Admin blocks student', async () => {
        await api(adminToken).put(`/users/block/${studentId}`);
    });

    await test('Admin unblocks student', async () => {
        await api(adminToken).put(`/users/unblock/${studentId}`);
    });

    // ---- CLEANUP ----
    blue('CLEANUP');

    await test('Admin deletes test blog', async () => {
        await api(adminToken).delete(`/blogs/${blogId}`);
    });

    await test('Admin deletes test book', async () => {
        await api(adminToken).delete(`/books/${bookId}`);
    });

    await test('Delete test goal', async () => {
        await api(studentToken).delete(`/goals/${goalId}`);
    });

    console.log('\n\x1b[36m================================\x1b[0m');
    console.log('\x1b[36m         Tests Complete!         \x1b[0m');
    console.log('\x1b[36m================================\x1b[0m\n');
}

runTests();
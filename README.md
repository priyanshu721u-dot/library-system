# ReadON - Library Management System

A full-stack library management system built with Node.js, Express, MongoDB, and plain HTML/CSS/JS.

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Frontend | HTML, CSS, JavaScript |
| Auth | JWT (JSON Web Tokens) |
| Charts | ApexCharts |
| Icons | Font Awesome 6.4.0 |
| Fonts | Google Fonts - Inter |

---

## Project Structure

```
library-system/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── borrowController.js
│   │   ├── blogController.js
│   │   ├── commentController.js
│   │   ├── profileController.js
│   │   ├── readingController.js
│   │   ├── readingGoalController.js
│   │   ├── statsController.js
│   │   ├── userController.js
│   │   └── wishlistController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Book.js
│   │   ├── Borrow.js
│   │   ├── Blog.js
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   ├── ReadingGoal.js
│   │   ├── ReadingSessions.js
│   │   ├── User.js
│   │   └── Wishlist.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── borrowRoutes.js
│   │   ├── blogRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── readingRoutes.js
│   │   ├── readingGoalRoutes.js
│   │   ├── statsRoutes.js
│   │   ├── userRoutes.js
│   │   └── wishlistRoutes.js
│   ├── index.js
│   ├── test.js
│   └── package.json
└── frontend/
    ├── assets/
    │   ├── ReadON.png
    │   ├── Icon.png
    │   └── hero-book.png
    ├── css/
    │   ├── main.css
    │   ├── sidebar.css
    │   ├── dashboard.css
    │   ├── auth.css
    │   ├── catalog.css
    │   ├── history.css
    │   ├── profile.css
    │   ├── blogs.css
    │   └── admin.css
    ├── js/
    │   ├── auth.js
    │   ├── api.js
    │   └── pages/
    │       ├── index.js
    │       ├── login.js
    │       ├── register.js
    │       ├── student-dashboard.js
    │       ├── catalog.js
    │       ├── history.js
    │       ├── profile.js
    │       ├── blogs.js
    │       ├── admin-dashboard.js
    │       ├── admin-borrows.js
    │       ├── admin-books.js
    │       ├── admin-blogs.js
    │       ├── admin-users.js
    │       └── admin-profile.js
    ├── student/
    │   ├── dashboard.html
    │   ├── catalog.html
    │   ├── history.html
    │   ├── profile.html
    │   └── blogs.html
    ├── admin/
    │   ├── dashboard.html
    │   ├── borrows.html
    │   ├── books.html
    │   ├── blogs.html
    │   ├── users.html
    │   └── profile.html
    ├── index.html
    ├── about.html
    ├── login.html
    └── register.html
```

---

##  Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- VS Code with Live Server extension

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/library-system.git
cd library-system
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/library-system
JWT_SECRET=your_jwt_secret_key
```

### 4. Start the backend server

```bash
cd backend
npm start
```

Server runs on `http://localhost:5001`

### 5. Start the frontend

Open `frontend/index.html` with VS Code Live Server.  
Frontend runs on `http://127.0.0.1:5501`

---

## 👤 Default Admin Account

After setup, create an admin account by registering with role `admin` directly via the API or MongoDB Compass:

```json
{
  "username": "admin",
  "email": "admin@readon.com",
  "password": "admin123",
  "role": "admin"
}
```

---

## 🔑 API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |

### Books
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/books` | Get all books |
| POST | `/api/books` | Add book (admin) |
| PUT | `/api/books/:id` | Edit book (admin) |
| DELETE | `/api/books/:id` | Delete book (admin) |

### Borrows
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/borrows/my` | Student's borrows |
| GET | `/api/borrows/all` | All borrows (admin) |
| POST | `/api/borrows/borrow/:bookId` | Request borrow |
| PUT | `/api/borrows/approve/:id` | Approve borrow (admin) |
| PUT | `/api/borrows/reject/:id` | Reject borrow (admin) |
| PUT | `/api/borrows/return/:id` | Request return |
| PUT | `/api/borrows/approve-return/:id` | Approve return (admin) |

### Reading
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/reading/log` | Log reading session |
| GET | `/api/reading/my` | Get my sessions |
| GET | `/api/reading/progress/:bookId` | Get book progress |

### Goals
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/goals` | Set reading goal |
| GET | `/api/goals/my` | Get my goals |
| GET | `/api/goals/:goalId/progress` | Check goal progress |
| DELETE | `/api/goals/:goalId` | Delete goal |

### Blogs & Comments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/blogs` | Get all blogs |
| POST | `/api/blogs` | Create blog (admin) |
| PUT | `/api/blogs/:id` | Edit blog (admin) |
| DELETE | `/api/blogs/:id` | Delete blog (admin) |
| GET | `/api/comments/:blogId` | Get comments |
| POST | `/api/comments/:blogId` | Add comment |
| DELETE | `/api/comments/:id` | Delete comment |

### Stats
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/stats/student` | Student stats |
| GET | `/api/stats/admin` | Admin stats |
| GET | `/api/stats/leaderboard` | Reading leaderboard |

### Profile & Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile/update` | Update profile |
| PUT | `/api/profile/change-password` | Change password |
| GET | `/api/users/all` | All users (admin) |
| PUT | `/api/users/block/:id` | Block user (admin) |
| PUT | `/api/users/unblock/:id` | Unblock user (admin) |

---

## ✨ Features

### Student
- Browse and search book catalog
- Borrow books (up to 3 at a time)
- Track borrowing history
- Log reading sessions
- Track reading progress per book
- Set and track reading goals with donut chart
- Weekly reading hours chart
- Wishlist management
- Read and comment on library blogs
- View notifications
- Leaderboard ranking
- Profile management with avatar upload

### Admin
- Dashboard with stats and charts
- Manage books (add, edit, delete with image upload)
- Manage borrow requests (approve/reject)
- Manage return requests
- Manage users (block/unblock)
- Write and manage blog posts
- View fines and penalties
- Top readers leaderboard

---

## 🧪 Running Tests

```bash
cd backend
node test.js
```

This runs 33 automated API tests covering all major features.

---

## 🌿 Git Branches

| Branch | Purpose |
|--------|---------|
| `master` | Production stable |
| `dev` | Development |
| `test` | Testing |

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.x",
  "mongoose": "^7.x.x",
  "jsonwebtoken": "^9.x.x",
  "bcryptjs": "^2.x.x",
  "cors": "^2.x.x",
  "dotenv": "^16.x.x",
  "axios": "^1.x.x"
}
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5001) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |

---

## 📝 License

MIT License — free to use and modify.

---

Built with ❤️ using Node.js + MongoDB + Vanilla JS

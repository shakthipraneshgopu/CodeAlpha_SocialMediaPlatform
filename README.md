# 🌐 DevStream — Social Media Platform
### CodeAlpha Full Stack Internship · Task 2

A full-stack mini social media platform built with **Node.js / Express** backend and a **pure HTML/CSS/JS** frontend. Zero external database required — data is stored in auto-seeded local JSON files.

---

## ✨ Features

| Feature | Status |
|---|---|
| User Registration & Login (JWT auth) | ✅ |
| Auto-seeded dummy users, posts & comments | ✅ |
| Global post feed (newest first) | ✅ |
| Create & delete posts | ✅ |
| Like / Unlike posts (toggle) | ✅ |
| Comment on posts & delete comments | ✅ |
| User profile pages with stats | ✅ |
| Edit your own profile | ✅ |
| Responsive design (mobile-friendly) | ✅ |
| Toast notifications | ✅ |
| Loading skeletons | ✅ |

---

## 🗂️ Project Structure

```
CodeAlpha_SocialMediaPlatform/
│
├── backend/
│   ├── config/db.js              # JSON file database + auto-seeding
│   ├── middleware/auth.js        # JWT verification middleware
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Profile
│   │   ├── postController.js     # Create, Get, Like, Delete posts
│   │   └── commentController.js  # Add & Delete comments
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   └── commentRoutes.js
│   ├── data/                     # Auto-created JSON storage (gitignore in prod)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── css/style.css             # Full responsive stylesheet
│   ├── js/
│   │   ├── api.js                # Fetch wrapper + toast system
│   │   ├── auth.js               # Token manager + dynamic nav
│   │   ├── feed.js               # Timeline logic
│   │   ├── profile.js            # Profile page logic
│   │   └── post-detail.js        # Post + comments logic
│   ├── index.html                # Main feed
│   ├── profile.html              # User profile
│   ├── post.html                 # Single post + comments
│   ├── login.html                # Sign-in
│   └── register.html             # Sign-up
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ installed ([nodejs.org](https://nodejs.org))
- npm (comes with Node.js)

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/CodeAlpha_SocialMediaPlatform.git
cd CodeAlpha_SocialMediaPlatform

# 2. Install backend dependencies
cd backend
npm install

# 3. Create your environment file
cp .env.example .env
# (Optional) Edit .env to change the JWT secret

# 4. Start the server
npm start
# Or for development with auto-reload:
npm run dev
```

### 5. Open the app
Navigate to **http://localhost:5000** in your browser.

The database auto-seeds on first run. No extra setup needed!

---

## 🔑 Demo Credentials

| Username | Password |
|---|---|
| `alex_tech` | `password123` |
| `sarah_dev` | `password123` |
| `mike_codes` | `password123` |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login → returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/auth/profile/:username` | — | Get any user profile |
| PUT | `/api/auth/profile` | ✅ | Update your profile |

### Posts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | — | Get all posts (feed) |
| GET | `/api/posts/:id` | — | Get single post |
| GET | `/api/posts/user/:userId` | — | Get a user's posts |
| POST | `/api/posts` | ✅ | Create a post |
| POST | `/api/posts/:id/like` | ✅ | Toggle like |
| DELETE | `/api/posts/:id` | ✅ | Delete your post |

### Comments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/comments/:postId` | ✅ | Add a comment |
| DELETE | `/api/comments/:postId/:commentId` | ✅ | Delete a comment |

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express.js, JSON file storage, bcryptjs, jsonwebtoken, uuid  
**Frontend:** HTML5, CSS3 (custom, no frameworks), Vanilla JS (ES Modules)  
**Auth:** JWT (7-day expiry), bcrypt password hashing (salt rounds: 10)

---

## 📸 Screenshots

<img width="1918" height="905" alt="image" src="https://github.com/user-attachments/assets/0ce38192-73c5-4966-8801-7c099ce5d169" />

<img width="1917" height="902" alt="Screenshot 2026-06-12 013859" src="https://github.com/user-attachments/assets/e4b90387-2d4a-4e01-b619-b35616e1afb2" />


<img width="1917" height="902" alt="Screenshot 2026-06-12 014212" src="https://github.com/user-attachments/assets/18b55aeb-4785-4365-9aca-0b13db03765a" />


---

## 📄 License

Built for CodeAlpha Internship Program. For educational purposes.

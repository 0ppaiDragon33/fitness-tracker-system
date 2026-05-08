# 💪 FitTrack — Fitness Tracking System

A full-stack web application for tracking workouts, exercises, and fitness progress — built with Angular 17 + Node.js + Express + TypeScript, powered by Firebase.

---

## 🌐 Live Links

- **Frontend URL**: https://fittrack-app-1c7ea.web.app
- **Backend API URL**: https://fittrack-api-o2xq.onrender.com
- **API Docs (Swagger)**: https://fittrack-api-o2xq.onrender.com/api/docs

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| File Storage | Firebase Storage / Cloudinary |
| API Docs | Swagger / OpenAPI |
| Frontend Hosting | Firebase Hosting |
| Backend Hosting | Render.com |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- Firebase project (console.firebase.google.com)
- npm v9+

### 1. Firebase Setup
1. Create Firebase project named `fittrack-app`
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database** → test mode
4. Enable **Storage** → test mode
5. **Project Settings → Service Accounts** → Generate private key → use values in `.env`
6. **Project Settings → General** → Add Web App → copy config to `environment.ts`

### 2. Clone the Repository
```bash
git clone https://github.com/0ppaiDragon33/fitness-tracker-system.git
cd fitness-tracker-system
```

### 3. Run the Backend
```bash
cd server
npm install
cp ../.env.example .env
# Fill in your Firebase and Cloudinary credentials in .env
npm run dev
```

### 4. Run the Frontend
```bash
cd client
npm install
# Update src/environments/environment.ts with your Firebase config
ng serve
```

The frontend will run on `http://localhost:4200` and the backend on `http://localhost:3000`.

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user — create Firestore profile after Firebase Auth signup |
| POST | `/api/auth/login` | Login, return user profile |
| GET | `/api/auth/me` | Get current authenticated user |
| GET | `/api/workouts` | Get workouts with filter and pagination |
| POST | `/api/workouts` | Log a new workout |
| GET | `/api/workouts/:id` | Get single workout by ID |
| PUT | `/api/workouts/:id` | Update a workout |
| DELETE | `/api/workouts/:id` | Delete a workout |
| GET | `/api/workouts/user/my` | Get all my workouts (no pagination) |
| GET | `/api/exercises` | Browse exercise library — filter by muscleGroup, difficulty, search |
| POST | `/api/exercises` | Create custom exercise (admin only) |
| PUT | `/api/exercises/:id` | Update exercise (admin only) |
| DELETE | `/api/exercises/:id` | Delete exercise (admin only) |
| GET | `/api/progress` | Get user progress stats |
| GET | `/api/progress/chart` | Chart data for last 30 days |
| POST | `/api/progress/body` | Log body measurement |
| GET | `/api/progress/body` | Get body measurement history |
| GET | `/api/admin/stats` | Admin dashboard stats |
| GET | `/api/admin/users` | Get all users (admin only) |
| PATCH | `/api/admin/users/:id/role` | Update user role (admin only) |
| DELETE | `/api/admin/users/:id` | Delete a user (admin only) |
| GET | `/api/admin/workouts` | Get all workouts (admin only) |

---

## ✅ Features Implemented

- **User Registration & Login** — Firebase Authentication with Email/Password
- **Role-based Access Control** — Admin and User roles enforced via Firestore and backend middleware
- **Log Workouts** — Record workout name, type, duration, calories burned, and exercises with sets/reps/weight
- **Exercise Library** — Browse and search 50+ built-in exercises; admins can create custom exercises
- **Progress Tracking** — Charts displaying workouts per week, calories burned, and personal records
- **Body Measurements** — Log and track weight, BMI, and body fat percentage over time
- **Search, Filter & Pagination** — Filter workouts by type, date range, and muscle group with pagination support
- **File Upload** — Upload workout photos via Cloudinary
- **Admin Dashboard** — Manage users, view all workouts, and monitor platform statistics
- **JWT Authentication** — Firebase ID token verification on all protected routes
- **Input Validation & Sanitization** — Backend validation middleware on all endpoints
- **Error Handling & Logging** — Global error middleware and Morgan request logging
- **CORS & Security** — Helmet.js, rate limiting, and CORS configured for production
- **Swagger / OpenAPI Docs** — Full API documentation available at `/api/docs`
- **Fully Integrated** — Angular frontend ↔ Express backend ↔ Firebase Firestore

---

## 📸 Screenshots

See the `/screenshots` folder for UI screenshots and API testing results.

---

## 📁 Repository Structure

```
fitness-tracker-system/
├── client/               → Angular 17 Application
├── server/               → Node.js + Express + TypeScript API
├── screenshots/          → UI screenshots and API testing
├── README.md             → Main project guide
├── .env.example          → Environment variable template
├── firebase.json         → Firebase Hosting config
├── firestore.rules       → Firestore security rules
└── .gitignore
```

---

## 👥 Group Members

| Name | Role |
|---|---|
| Karl Joshua Vargas | Backend Developer |
| Queenie Parcia | Frontend Developer |
| Donna Mae Batacandolo | UI/UX + Documentation |
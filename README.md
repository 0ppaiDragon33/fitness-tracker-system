# 💪 FitTrack — Fitness Tracking System

A full-stack web application for tracking workouts, exercises, and fitness progress — built with Angular 17 + Node.js + Express + TypeScript, powered by Firebase.

---

## 🌐 Live Links

- **Frontend URL**: `https://fittrack-app.web.app` *(update after deploy)*
- **Backend API URL**: `https://fittrack-api.onrender.com` *(update after deploy)*

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Authentication | Firebase Authentication |
| File Storage | Cloudinary |
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

### 2. Backend
```bash
cd server
npm install
cp ../.env.example .env
# Fill in Firebase credentials
npm run dev
```

### 3. Frontend
```bash
cd client
npm install
# Update src/environments/environment.ts with your Firebase config
ng serve
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, return profile |
| GET | `/api/auth/me` | Current user |
| GET | `/api/workouts` | Get workouts (filter, paginate) |
| POST | `/api/workouts` | Log a new workout |
| GET | `/api/workouts/:id` | Get single workout |
| PUT | `/api/workouts/:id` | Update workout |
| DELETE | `/api/workouts/:id` | Delete workout |
| GET | `/api/workouts/user/my` | My workouts |
| GET | `/api/exercises` | Browse exercises (search, filter) |
| POST | `/api/exercises` | Create custom exercise (admin) |
| PUT | `/api/exercises/:id` | Update exercise (admin) |
| DELETE | `/api/exercises/:id` | Delete exercise (admin) |
| GET | `/api/progress` | Get user progress stats |
| GET | `/api/progress/chart` | Chart data (last 30 days) |
| POST | `/api/progress/body` | Log body measurement |
| GET | `/api/progress/body` | Get body measurement history |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| PATCH | `/api/admin/users/:id/role` | Update user role |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/workouts` | All workouts |

---

## ✅ Features Implemented

- **User Registration & Login** via Firebase Authentication
- **Role-based Access** — Admin and User roles (Firestore + middleware)
- **Log Workouts** — name, type, duration, calories, exercises with sets/reps/weight
- **Exercise Library** — browse and search 50+ built-in exercises; admins add custom ones
- **Progress Tracking** — charts for workouts per week, calories burned, PRs
- **Body Measurements** — log weight, BMI, body fat over time
- **Search, Filter & Pagination** — by workout type, date range, muscle group
- **Image Upload** — workout/profile photo via Firebase Storage
- **Admin Dashboard** — manage users, view all workouts, platform stats
- **Fully integrated** Angular ↔ Express ↔ Firebase

---

## 📸 Screenshots

See `/screenshots` folder for UI and API testing screenshots.

---

## 📁 Repository Structure

```
fitness-tracker/
├── client/          → Angular Application
├── server/          → Node.js + Express API
├── screenshots/     → UI and API testing screenshots
├── README.md        → MAIN PROJECT GUIDE
├── firestore.rules  → Firestore security rules
├── storage.rules    → Firebase Storage rules
├── firebase.json    → Firebase Hosting config
└── .env.example     → Environment variable template
```

---

## 👥 Group Members

| Name | Role |
|---|---|
| Karl Joshua Vargas | Backend Developer |
| Queenie Parcia | Frontend Developer  |
| Donna Mae Batacandolo | UI/UX + Documentation |

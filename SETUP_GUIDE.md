# 🚀 FitTrack — Setup Guide

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. **Add project** → name it `fittrack-app`
3. **Authentication** → Get started → Enable **Email/Password**
4. **Firestore Database** → Create database → Start in **test mode** → pick your region
5. **Storage** → Get started → Start in **test mode**

---

## Step 2: Get Firebase Web Config (for Angular frontend)

1. **Project Settings** (⚙️) → **Your apps** → **Add app** → Web
2. Register app as `fittrack-client`
3. Copy the `firebaseConfig` object
4. Paste into both:
   - `client/src/environments/environment.ts`
   - `client/src/environments/environment.prod.ts`

---

## Step 3: Get Service Account Key (for Express backend)

1. **Project Settings** → **Service accounts** → **Generate new private key**
2. Download the JSON file — **DO NOT commit it to GitHub**
3. Copy values into `server/.env`:

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
CLIENT_URL=http://localhost:4200
```

---

## Step 4: Run Locally

Open **two terminals**:

### Terminal 1 — Backend
```bash
cd server
npm install
npm run dev
```
✅ API running at: http://localhost:3000
📚 Swagger docs: http://localhost:3000/api/docs

### Terminal 2 — Frontend
```bash
cd client
npm install
ng serve
```
✅ App running at: http://localhost:4200

> If `ng` command not found, run: `npm install -g @angular/cli`

---

## Step 5: Seed Exercise Library (admin only)

After creating your admin account:
1. Go to http://localhost:4200/exercises
2. You'll see a **"Seed Built-in Exercises"** button (visible to admins)
3. Click it once — populates 30 built-in exercises into Firestore

---

## Step 6: Create First Admin User

1. Register a normal account at http://localhost:4200/register
2. Go to **Firebase Console** → Firestore → `users` collection
3. Find your document → Edit `role` field: `"user"` → `"admin"`
4. Log out and back in → Admin menu appears

---

## Step 7: Deploy Backend → Render.com

1. Push your repo to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. **Root Directory**: `server`
5. **Build Command**: `npm install && npm run build`
6. **Start Command**: `npm start`
7. Add all environment variables from `server/.env`
8. Deploy → Copy your live backend URL

---

## Step 8: Deploy Frontend → Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# In project root
firebase init hosting
# → Public dir: client/dist/fitness-tracker-client/browser
# → Single-page app: YES
# → Don't overwrite index.html: NO

# Build Angular
cd client
ng build --configuration production
cd ..

# Deploy
firebase deploy --only hosting
```

---

## Step 9: Update Live URLs

1. Update `client/src/environments/environment.prod.ts`:
   ```ts
   apiUrl: 'https://your-fittrack-api.onrender.com/api'
   ```
2. Update `server/.env` on Render:
   ```
   CLIENT_URL=https://your-fittrack-app.web.app
   ```
3. Rebuild and redeploy both

---

## ✅ Pre-Submission Checklist

- [ ] Frontend live URL works
- [ ] Backend API live URL works
- [ ] Register and Login work
- [ ] Log, edit, delete workouts work
- [ ] Image upload on workout works
- [ ] Exercise library loads (after seeding)
- [ ] Progress page shows stats and charts
- [ ] Body measurement logging works
- [ ] Filter and pagination work on workout list
- [ ] Admin dashboard accessible
- [ ] Admin can manage users and view all workouts
- [ ] Swagger docs at `/api/docs`
- [ ] README updated with live URLs
- [ ] Screenshots saved in `/screenshots/`
- [ ] `serviceAccountKey.json` is **NOT** in GitHub
- [ ] `.env` is in `.gitignore`

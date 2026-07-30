# Getting a Ready-to-Download APK — Your Steps (~10 minutes, no coding)

I've prepared everything (the build automation and hosting config). You just need to click
through account creation and connect the pieces — no terminal, no Flutter, no code.

---

## Part A — Host the backend on Render (~5 min)

1. Go to https://render.com and sign up (free — GitHub login is fastest)
2. Go to https://www.mongodb.com/cloud/atlas/register and create a **free** MongoDB Atlas cluster
   (takes ~3 min; when done, click "Connect" → "Drivers" → copy the connection string,
   it looks like `mongodb+srv://user:password@cluster.../delivery_management`)
3. Create a new GitHub repo (https://github.com/new), name it e.g. `delivery-backend`,
   and upload the contents of the `delivery-backend` folder I gave you earlier
   (GitHub's web UI lets you drag-and-drop files — no git commands needed:
   click "Add file" → "Upload files" on the repo page)
4. Back in Render: **New +** → **Blueprint** → connect that GitHub repo.
   Render will detect the `render.yaml` file I included and set most things up automatically.
5. When it asks for the `MONGO_URI` environment variable, paste the connection string from step 2
   (replace `<password>` in it with your actual Atlas password)
6. Click **Deploy**. After a few minutes you'll get a live URL like `https://delivery-backend-xxxx.onrender.com`
7. Send me that URL — I'll update both apps to point at it (or you can edit
   `lib/config/api_config.dart` yourself: change `baseUrl` to `https://your-url.onrender.com/api`)

> Free Render services sleep after inactivity and take ~30–60 seconds to wake up on the
> first request — fine for testing, just don't be alarmed by a slow first login attempt.

---

## Part B — Get the APK from GitHub Actions (~3 min, fully automatic after upload)

1. Create another GitHub repo, e.g. `delivery-driver-app`
2. Upload the entire `delivery_driver_app` folder (the one I gave you, which now includes
   a `.github/workflows/build-apk.yml` file) using the same drag-and-drop upload method
3. Go to the repo's **Actions** tab — a build should already be running automatically
   (triggered by the upload). It takes about 3–5 minutes.
4. When it finishes (green checkmark), click into the completed run → scroll to
   **Artifacts** → download **driver-app-debug-apk**
5. That's a `.zip` containing `app-debug.apk` — unzip it, transfer the APK to an Android
   phone (email it to yourself, or use a USB cable / Google Drive), and tap to install
   (Android will warn about "unknown sources" — that's expected for an unsigned test build,
   allow it)

Repeat Part B with a second repo for `delivery_customer_app` to get that APK too.

---

## What I need from you once both are ready

Just confirm the backend URL you deployed to, and I'll double check both apps are pointed
at it correctly before you start testing.

## If anything in Part A or B doesn't match what you see on screen

Render and GitHub's UIs change occasionally — if a button or screen looks different from
what I described, tell me what you're seeing and I'll adjust the instructions.

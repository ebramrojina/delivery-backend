const admin = require('firebase-admin');

// The service account JSON is stored as a single environment variable
// (FIREBASE_SERVICE_ACCOUNT) in Render's dashboard — never committed to git.
let initialized = false;

function initFirebase() {
  if (initialized) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT is not set — push notifications are disabled.'
    );
    return;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('Firebase Admin initialized — push notifications enabled.');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin:', err.message);
  }
}

function isFirebaseReady() {
  return initialized;
}

module.exports = { admin, initFirebase, isFirebaseReady };

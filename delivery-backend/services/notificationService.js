const { admin, isFirebaseReady } = require('../config/firebase');
const User = require('../models/User');

/**
 * Notification text, in both languages, keyed by a short message id.
 * Add new notification types here as new keys.
 */
const MESSAGES = {
  new_order: {
    en: { title: 'New order', body: 'A new order was created and needs a driver assigned.' },
    ar: { title: 'أوردر جديد', body: 'وصل أوردر جديد ومحتاج تعيين سواق له.' },
  },
  order_assigned: {
    en: { title: 'New delivery assigned', body: 'You have been assigned a new order. Open the app to view it.' },
    ar: { title: 'اتعيّن لك أوردر جديد', body: 'اتعيّن لك أوردر جديد. افتح التطبيق عشان تشوفه.' },
  },
};

function textFor(messageId, locale) {
  const entry = MESSAGES[messageId];
  if (!entry) return null;
  return entry[locale] || entry.en;
}

/**
 * Sends a push notification to a single user by their saved FCM token,
 * written in that user's saved app language. Fails silently (logs only)
 * so a notification problem never breaks the order flow itself.
 */
async function sendNotificationToUser(userId, messageId, data = {}) {
  if (!isFirebaseReady()) return;
  if (!userId) return;

  try {
    const user = await User.findById(userId).select('fcmToken locale');
    if (!user || !user.fcmToken) return;

    const text = textFor(messageId, user.locale);
    if (!text) return;

    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title: text.title, body: text.body },
      data,
    });
  } catch (err) {
    console.error(`Failed to send notification to user ${userId}:`, err.message);
  }
}

/**
 * Sends a push notification to every user with a given role (e.g. all
 * admins), writing each one in that user's own saved app language.
 */
async function sendNotificationToRole(role, messageId, data = {}) {
  if (!isFirebaseReady()) return;

  try {
    const users = await User.find({ role, fcmToken: { $exists: true, $ne: null } }).select('fcmToken locale');
    if (users.length === 0) return;

    const messages = users
      .map((u) => {
        const text = textFor(messageId, u.locale);
        if (!text) return null;
        return {
          token: u.fcmToken,
          notification: { title: text.title, body: text.body },
          data,
        };
      })
      .filter(Boolean);

    if (messages.length === 0) return;

    // sendEachForMulticast requires identical notification text for all
    // tokens, but ours can differ per user's language, so send individually.
    await Promise.all(messages.map((m) => admin.messaging().send(m).catch((err) => {
      console.error('Failed to send notification to a user:', err.message);
    })));
  } catch (err) {
    console.error(`Failed to send notification to role ${role}:`, err.message);
  }
}

module.exports = { sendNotificationToUser, sendNotificationToRole };

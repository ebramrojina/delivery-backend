const { admin, isFirebaseReady } = require('../config/firebase');
const User = require('../models/User');

/**
 * Sends a push notification to a single user by their saved FCM token.
 * Fails silently (logs only) so a notification problem never breaks
 * the order flow itself.
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  if (!isFirebaseReady()) return;
  if (!userId) return;

  try {
    const user = await User.findById(userId).select('fcmToken');
    if (!user || !user.fcmToken) return;

    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error(`Failed to send notification to user ${userId}:`, err.message);
  }
}

/**
 * Sends a push notification to every user with a given role (e.g. all admins).
 */
async function sendNotificationToRole(role, title, body, data = {}) {
  if (!isFirebaseReady()) return;

  try {
    const users = await User.find({ role, fcmToken: { $exists: true, $ne: null } }).select('fcmToken');
    const tokens = users.map((u) => u.fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error(`Failed to send notification to role ${role}:`, err.message);
  }
}

module.exports = { sendNotificationToUser, sendNotificationToRole };

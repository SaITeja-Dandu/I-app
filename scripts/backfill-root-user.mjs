import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Backfill a single user's root doc from existing profile/settings
// Usage: node scripts/backfill-root-user.mjs <userId>
async function backfill(userId) {
  const appId = 'interview-navigator';
  const profilePath = `artifacts/${appId}/users/${userId}/profile/settings`;
  const profileSnap = await db.doc(profilePath).get();
  if (!profileSnap.exists) {
    console.error('Profile settings doc not found for user:', userId);
    return;
  }
  const data = profileSnap.data();
  const rootPath = `artifacts/${appId}/users/${userId}`;
  const rootData = {
    userType: data.userType || 'interviewer',
    role: data.role || '',
    email: data.email || '',
    isInterviewer: !!data.interviewerProfile,
    isActive: data.interviewerProfile ? data.interviewerProfile.isActive !== false : false,
    updatedAt: new Date(),
    createdAt: data.createdAt || new Date(),
  };
  await db.doc(rootPath).set(rootData, { merge: true });
  console.log('Root user doc backfilled for', userId, rootData);
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Pass a userId. Example: node scripts/backfill-root-user.mjs <uid>');
    process.exit(1);
  }
  await backfill(userId);
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

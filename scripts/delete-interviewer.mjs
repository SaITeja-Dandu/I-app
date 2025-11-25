import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function deleteInterviewer(userId) {
  const appId = 'interview-navigator';
  
  try {
    // Delete root user doc
    const rootPath = `artifacts/${appId}/users/${userId}`;
    await db.doc(rootPath).delete();
    console.log('✓ Deleted root user doc:', rootPath);

    // Delete nested profile doc
    const profilePath = `artifacts/${appId}/users/${userId}/profile/settings`;
    await db.doc(profilePath).delete();
    console.log('✓ Deleted profile settings doc:', profilePath);

    // Delete from Firebase Auth
    await auth.deleteUser(userId);
    console.log('✓ Deleted auth user:', userId);

    console.log('✅ Interviewer deleted successfully');
  } catch (error) {
    console.error('❌ Delete failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/delete-interviewer.mjs <userId>');
    process.exit(1);
  }
  await deleteInterviewer(userId);
}

main();

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// List all Firebase Auth users
async function listUsers() {
  try {
    const userList = await auth.listUsers(10);
    console.log(`Found ${userList.users.length} users in Firebase Auth:\n`);
    
    for (const user of userList.users) {
      console.log(`  📧 ${user.email} (${user.uid})`);
      
      // Check their Firestore profile
      const appId = 'interview-navigator';
      const profilePath = `artifacts/${appId}/users/${user.uid}/profile/settings`;
      const profileSnap = await db.doc(profilePath).get();
      
      if (profileSnap.exists) {
        const data = profileSnap.data();
        console.log(`    ✓ Has profile: userType=${data.userType}, hasInterviewerProfile=${!!data.interviewerProfile}`);
      } else {
        console.log(`    ✗ No profile doc found`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsers();

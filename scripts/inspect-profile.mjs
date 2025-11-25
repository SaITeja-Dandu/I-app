import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const appId = 'interview-navigator';
  const userId = 'vsBgI08T4xTLzSUtsoO1g7dgogj2';
  const profilePath = `artifacts/${appId}/users/${userId}/profile/settings`;
  
  const profileSnap = await db.doc(profilePath).get();
  if (profileSnap.exists) {
    const data = profileSnap.data();
    console.log('Profile doc data:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('Profile doc not found');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

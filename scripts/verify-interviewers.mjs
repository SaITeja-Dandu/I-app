import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  const ROOT_PATH = 'artifacts/interview-navigator/users';
  const rootRef = db.collection(ROOT_PATH);
  const rootQuery = rootRef.where('userType', '==', 'interviewer');
  const rootSnap = await rootQuery.get();
  console.log(`Root interviewer documents: ${rootSnap.size}`);
  for (const doc of rootSnap.docs) {
    console.log(' root:', doc.id, doc.data());
    // Nested profile/settings
    const profileRef = db.doc(`${ROOT_PATH}/${doc.id}/profile/settings`);
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      const data = profileSnap.data();
      console.log('  profile.interviewerProfile exists?', !!data.interviewerProfile);
      if (data.interviewerProfile) {
        console.log('  interviewerProfile.isActive:', data.interviewerProfile.isActive);
        console.log('  interviewerProfile.skills:', data.interviewerProfile.skills);
      }
    } else {
      console.log('  NO nested profile/settings doc');
    }
  }

  if (rootSnap.size === 0) {
    console.log('No root interviewer docs found. Running collectionGroup fallback...');
    try {
      const profileGroup = db.collectionGroup('profile');
      const groupSnap = await profileGroup.where('userType', '==', 'interviewer').get();
      console.log(`CollectionGroup(profile) interviewer docs: ${groupSnap.size}`);
      for (const doc of groupSnap.docs) {
        console.log(' group:', doc.id, doc.ref.path);
        const data = doc.data();
        console.log('  has interviewerProfile?', !!data.interviewerProfile);
      }
      if (groupSnap.size > 0) {
        console.log('⚠️ Legacy interviewer profiles detected without root user docs. Resave each profile to generate root doc.');
      }
    } catch (err) {
      console.warn('Fallback collectionGroup query failed (likely no legacy docs yet or index issue):', err.message);
    }
  }

  console.log('Verification complete.');
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});

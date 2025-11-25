import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./secrets/service-account.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'iapp-83aa8'
});

const db = admin.firestore();

(async () => {
  try {
    // Get the current user's ID from auth
    const auth = admin.auth();
    const listResult = await auth.listUsers(100);
    
    if (listResult.users.length === 0) {
      console.log('❌ No users in Firebase Auth');
      process.exit(0);
    }

    // Check last user (likely the one you're testing with)
    const testUser = listResult.users[listResult.users.length - 1];
    console.log(`\n👤 Checking availability for user: ${testUser.uid}`);
    console.log(`   Email: ${testUser.email}`);

    // Check availability collection
    const availabilityRef = db.collection('availability');
    const availabilitySnap = await availabilityRef.where('interviewerId', '==', testUser.uid).get();
    
    if (availabilitySnap.empty) {
      console.log(`\n❌ NO availability slots saved for this user`);
    } else {
      console.log(`\n✅ Found ${availabilitySnap.size} availability slots:`);
      availabilitySnap.forEach(doc => {
        const data = doc.data();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        console.log(`   ${dayNames[data.dayOfWeek]} ${data.startTime} - ${data.endTime}`);
      });
    }

    // Check artifact user profile
    console.log(`\n📋 Checking artifact user profile:`);
    const artifactProfileRef = db.doc(`artifacts/interview-navigator/users/${testUser.uid}/profile/settings`);
    const artifactProfileSnap = await artifactProfileRef.get();
    
    if (artifactProfileSnap.exists) {
      const data = artifactProfileSnap.data();
      console.log(`   ✅ Profile exists`);
      console.log(`   - userType: ${data.userType}`);
      console.log(`   - Has interviewerProfile: ${!!data.interviewerProfile}`);
      if (data.interviewerProfile) {
        console.log(`   - isActive: ${data.interviewerProfile.isActive}`);
      }
    } else {
      console.log(`   ❌ No profile document found`);
    }

    // Check root user doc
    console.log(`\n📍 Checking root user document:`);
    const rootUserRef = db.doc(`artifacts/interview-navigator/users/${testUser.uid}`);
    const rootUserSnap = await rootUserRef.get();
    
    if (rootUserSnap.exists) {
      const data = rootUserSnap.data();
      console.log(`   ✅ Root doc exists`);
      console.log(`   - userType: ${data.userType}`);
      console.log(`   - isInterviewer: ${data.isInterviewer}`);
      console.log(`   - isActive: ${data.isActive}`);
    } else {
      console.log(`   ❌ Root doc does not exist`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

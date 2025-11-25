import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../secrets/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Usage: node scripts/seed-interviewer.mjs <email> <password>
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/seed-interviewer.mjs <email> <password>');
    process.exit(1);
  }

  // Create Firebase Auth user (or reuse if exists)
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
    console.log('User already exists, reusing:', userRecord.uid);
  } catch (e) {
    userRecord = await admin.auth().createUser({ email, password, emailVerified: true, disabled: false });
    console.log('Created new auth user:', userRecord.uid);
  }

  const userId = userRecord.uid;
  const appId = 'interview-navigator';

  const rootPath = `artifacts/${appId}/users/${userId}`;
  const profileSettingsPath = `${rootPath}/profile/settings`;

  const now = new Date();

  // Minimal interviewerProfile + top-level fields
  const interviewerProfile = {
    yearsOfExperience: 5,
    specializations: ['Backend', 'System Design'],
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis'],
    bio: 'Seasoned backend engineer focused on scalable APIs and distributed systems.',
    availability: [
      { dayOfWeek: 1, startTime: '10:00', endTime: '12:00', timezone: 'Asia/Kolkata' },
      { dayOfWeek: 3, startTime: '15:00', endTime: '17:00', timezone: 'Asia/Kolkata' }
    ],
    rating: 4.8,
    totalInterviews: 42,
    verified: true,
  };

  const profileDoc = {
    id: userId,
    uid: userId,
    userType: 'interviewer',
    role: 'Senior Backend Engineer',
    skills: interviewerProfile.skills,
    email,
    createdAt: now,
    updatedAt: now,
    interviewerProfile,
  };

  // Write nested settings doc
  await db.doc(profileSettingsPath).set(profileDoc, { merge: true });

  // Write root doc (subset)
  const rootDoc = {
    userType: 'interviewer',
    role: 'Senior Backend Engineer',
    email,
    isInterviewer: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.doc(rootPath).set(rootDoc, { merge: true });

  console.log('Seeded interviewer successfully:', { userId, email });
  console.log('Login with these credentials in the app to verify listing.');
}

main().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

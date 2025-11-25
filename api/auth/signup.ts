import getFirebaseAdmin from '../firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password, name, phoneNumber } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const admin = getFirebaseAdmin();

    // Create the user in Firebase Auth
    let createdUser;
    try {
      createdUser = await admin.auth().createUser({ email, password });
    } catch (err: any) {
      // If user already exists, return meaningful error
      if (err.code === 'auth/email-already-exists') {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }
      throw err;
    }

    // Save user profile to Firestore with name and phone number if provided
    try {
      const db = admin.firestore();
      const appId = process.env.VITE_APP_ID || 'interview-navigator-app';
      
      const userProfileData: any = {
        uid: createdUser.uid,
        email: email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      if (name) {
        userProfileData.name = name;
      }
      if (phoneNumber) {
        userProfileData.phoneNumber = phoneNumber;
      }
      
      // Save to root document
      await db.doc(`artifacts/${appId}/users/${createdUser.uid}`).set(userProfileData, { merge: true });
      
      // Save to nested profile document
      await db.doc(`artifacts/${appId}/users/${createdUser.uid}/profile/settings`).set(userProfileData, { merge: true });
      
      console.log(`[Signup] Profile created for user ${createdUser.uid} with name: ${name}, phone: ${phoneNumber}`);
    } catch (firestoreErr: any) {
      console.error(`[Signup] Failed to save profile to Firestore: ${firestoreErr.message}`);
      // Continue anyway - auth user was created successfully
    }

    // Create a custom token that client can use to sign in
    const token = await admin.auth().createCustomToken(createdUser.uid);

    res.status(200).json({ token, uid: createdUser.uid });
  } catch (err: any) {
    console.error('signup error', err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}

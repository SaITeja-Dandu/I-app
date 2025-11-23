import getFirebaseAdmin from '../firebaseAdmin';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, password } = req.body || {};
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

    // Create a custom token that client can use to sign in
    const token = await admin.auth().createCustomToken(createdUser.uid);

    res.status(200).json({ token, uid: createdUser.uid });
  } catch (err: any) {
    console.error('signup error', err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}

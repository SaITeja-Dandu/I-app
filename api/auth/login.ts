import getFirebaseAdmin from '../firebaseAdmin.js';

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

    const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server not configured (missing FIREBASE_API_KEY)' });
      return;
    }

    // Verify email/password using Firebase Identity Toolkit REST API
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const verifyResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const verifyData = await verifyResp.json();
    if (!verifyResp.ok) {
      const message = verifyData?.error?.message || 'Invalid credentials';
      res.status(401).json({ error: message });
      return;
    }

    const uid = verifyData.localId;
    const admin = getFirebaseAdmin();

    // Create a custom token for the client to sign in with
    const token = await admin.auth().createCustomToken(uid);

    res.status(200).json({ token, uid });
  } catch (err: any) {
    console.error('login error', err);
    res.status(500).json({ error: err?.message || 'Server error' });
  }
}

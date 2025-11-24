import admin from 'firebase-admin';

/**
 * Helper to initialize Firebase Admin SDK in serverless environment.
 * Expects `FIREBASE_SERVICE_ACCOUNT` env var to contain base64-encoded service account JSON.
 */
export function getFirebaseAdmin(): typeof admin {
  if (!admin.apps.length) {
    // Get Firebase Admin SDK key from environment
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountKey) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable. Please add it to Vercel Environment Variables.');
    }

    let cred: any;
    try {
      // Decode base64 string
      const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      cred = JSON.parse(decoded);
      
      // Validate the credential has required fields
      if (!cred.project_id || !cred.private_key || !cred.client_email) {
        throw new Error('Service account is missing required fields (project_id, private_key, client_email)');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Firebase Admin SDK initialization error:', msg);
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${msg}`);
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(cred),
        projectId: cred.project_id,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Firebase app initialization error:', msg);
      throw new Error(`Failed to initialize Firebase app: ${msg}`);
    }
  }

  return admin;
}

export default getFirebaseAdmin;

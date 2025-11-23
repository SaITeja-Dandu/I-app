import admin from 'firebase-admin';

/**
 * Helper to initialize Firebase Admin SDK in serverless environment.
 * Expects `FIREBASE_SERVICE_ACCOUNT` env var to contain the service account JSON string.
 */
export function getFirebaseAdmin(): typeof admin {
  if (!admin.apps.length) {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!svc) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    }

    let cred: any;
    try {
      cred = JSON.parse(svc);
    } catch (err) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON');
    }

    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
  }

  return admin;
}

export default getFirebaseAdmin;

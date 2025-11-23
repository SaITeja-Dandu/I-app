import express from 'express';
import admin from 'firebase-admin';
import process from 'process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());

// Load .env from repo root so backend processes see FIREBASE_API_KEY
try {
  const envUrl = new URL('../.env', import.meta.url);
  if (fs.existsSync(envUrl)) {
    const contents = fs.readFileSync(envUrl, 'utf8');
    const parsed = dotenv.parse(contents);
    for (const k of Object.keys(parsed)) {
      if (process.env[k] === undefined) process.env[k] = parsed[k];
    }
    console.log(`Loaded env from ${envUrl}`);
  } else {
    const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
    const envPath = path.join(repoRoot, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`Loaded env from ${envPath}`);
    } else {
      console.log('No .env found at', envUrl, 'or', envPath);
    }
  }
} catch (e) {
  console.warn('Failed loading .env:', e?.message || e);
}

// Handle malformed JSON bodies gracefully (body-parser SyntaxError)
app.use((err, req, res, next) => {
  if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('Invalid JSON body received from', req.ip);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return next(err);
});

// Keep track of how admin was initialized for debugging
let adminLoadedFrom = null;

// Initialize Firebase Admin
function initAdmin() {
  if (!admin.apps.length) {
    let svc = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    let loadedFrom = null;

    // Fallback: load from ./secrets/service-account.json if present (convenience for local dev)
    if (!svc) {
      try {
        const fallbackPath = new URL('../secrets/service-account.json', import.meta.url);
        if (fs.existsSync(fallbackPath)) {
          svc = fs.readFileSync(fallbackPath, { encoding: 'utf8' });
          loadedFrom = 'secrets';
          console.log('Loaded service account from ./secrets/service-account.json');
        }
      } catch (e) {
        // ignore
      }
    } else {
      loadedFrom = 'env';
    }

    if (!svc) {
      console.error('Missing FIREBASE_SERVICE_ACCOUNT env var and no secrets file found');
      // do not throw; endpoints will return errors
      return;
    }

    let cred;
    try {
      cred = JSON.parse(svc);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', err);
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
    adminLoadedFrom = loadedFrom;
    console.log(`Firebase Admin initialized (loaded from=${loadedFrom})`);
  }
}

initAdmin();

// Debug: show whether API keys are present (masked)
function maskKey(k) {
  if (!k) return null;
  if (k.length <= 8) return `${k.slice(0,2)}****${k.slice(-2)}`;
  return `${k.slice(0,4)}...${k.slice(-4)}`;
}

console.log('FIREBASE_API_KEY present:', !!process.env.FIREBASE_API_KEY, 'value:', maskKey(process.env.FIREBASE_API_KEY));
console.log('VITE_FIREBASE_API_KEY present:', !!process.env.VITE_FIREBASE_API_KEY, 'value:', maskKey(process.env.VITE_FIREBASE_API_KEY));

app.get('/api/_status', (req, res) => {
  res.json({ adminInitialized: admin.apps.length > 0, loadedFrom: adminLoadedFrom });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not configured' });

    const user = await admin.auth().createUser({ email, password });
    const token = await admin.auth().createCustomToken(user.uid);
    return res.json({ token, uid: user.uid });
  } catch (err) {
    console.error('signup error', err);
    const code = err?.code || err?.message || 'SERVER_ERROR';
    if (code === 'auth/email-already-exists') return res.status(409).json({ error: 'Email already in use' });
    return res.status(500).json({ error: String(err) });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    // Resolve Firebase API key from env or from common .env files in repo root (convenience for local dev)
    let apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      // Look for .env, .env.local, .env.development in repo root
      try {
        const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
        const envFiles = ['.env', '.env.local', '.env.development'];
        for (const f of envFiles) {
          const p = path.join(repoRoot, f);
          if (fs.existsSync(p)) {
            const contents = fs.readFileSync(p, 'utf8');
            const match = contents.match(/VITE_FIREBASE_API_KEY\s*=\s*(.+)/) || contents.match(/FIREBASE_API_KEY\s*=\s*(.+)/);
            if (match) {
              apiKey = match[1].trim().replace(/^\"|\"$/g, '');
              console.log(`Loaded FIREBASE API key from ${f}`);
              break;
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!apiKey) return res.status(500).json({ error: 'Missing FIREBASE_API_KEY' });

    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const verifyResp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await verifyResp.json();
    if (!verifyResp.ok) {
      const message = data?.error?.message || 'Invalid credentials';
      return res.status(401).json({ error: message });
    }

    const uid = data.localId;
    if (!admin.apps.length) return res.status(500).json({ error: 'Firebase Admin not configured' });

    const token = await admin.auth().createCustomToken(uid);
    return res.json({ token, uid });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Dev API server listening at http://localhost:${port}`);
});

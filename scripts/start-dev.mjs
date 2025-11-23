#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load service account if present
const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const secretsPath = path.join(repoRoot, 'secrets', 'service-account.json');
if (fs.existsSync(secretsPath)) {
  try {
    const svc = fs.readFileSync(secretsPath, { encoding: 'utf8' });
    process.env.FIREBASE_SERVICE_ACCOUNT = svc;
    console.log('Loaded FIREBASE_SERVICE_ACCOUNT from secrets/service-account.json');
  } catch (err) {
    console.warn('Failed to load service-account.json:', err.message);
  }
}

// Ensure VITE API key is picked from process.env if provided in .env or elsewhere
if (!process.env.VITE_FIREBASE_API_KEY && process.env.FIREBASE_API_KEY) {
  process.env.VITE_FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
}

// Convenience: load VITE_FIREBASE_API_KEY / FIREBASE_API_KEY from .env files in repo root
try {
  const envFiles = ['.env.local', '.env', '.env.development'];
  for (const f of envFiles) {
    const p = path.join(repoRoot, f);
    if (fs.existsSync(p)) {
      const contents = fs.readFileSync(p, 'utf8');
      const m1 = contents.match(/VITE_FIREBASE_API_KEY\s*=\s*(.+)/);
      const m2 = contents.match(/FIREBASE_API_KEY\s*=\s*(.+)/);
      if (m1 && !process.env.VITE_FIREBASE_API_KEY) {
        process.env.VITE_FIREBASE_API_KEY = m1[1].trim().replace(/^\"|\"$/g, '');
        console.log(`Loaded VITE_FIREBASE_API_KEY from ${f}`);
      }
      if (m2 && !process.env.FIREBASE_API_KEY) {
        process.env.FIREBASE_API_KEY = m2[1].trim().replace(/^\"|\"$/g, '');
        console.log(`Loaded FIREBASE_API_KEY from ${f}`);
      }
      // break after first match so order of files respects priority
      if (process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY) break;
    }
  }
} catch (e) {
  // ignore
}

function spawnProcess(cmd, args, name) {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true, env: process.env });
  p.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${name} exited with signal ${signal}`);
    } else {
      console.log(`${name} exited with code ${code}`);
    }
    // If one process exits, kill the whole group
    process.exit(code ?? 0);
  });
  return p;
}

console.log('Starting dev API server and Vite...');

const apiProcess = spawnProcess('node', ['server/dev-server.mjs'], 'dev:api');
const viteProcess = spawnProcess('npx', ['vite'], 'vite');

// Forward SIGINT/SIGTERM
['SIGINT', 'SIGTERM'].forEach((sig) => {
  process.on(sig, () => {
    try { apiProcess.kill(); } catch (e) {}
    try { viteProcess.kill(); } catch (e) {}
    process.exit();
  });
});

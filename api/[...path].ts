// Vercel serverless handler for API routes
// This file catches all /api/* routes and returns a message
// Actual API endpoints are handled by individual files in /api/auth/ etc.

export default function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'https://intervuu.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Default API response
  res.status(404).json({ error: 'API endpoint not found' });
}

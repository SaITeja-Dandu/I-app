# Intervuu Backend API

Production-ready Express/Node.js backend for the Intervuu platform with validation, authentication, and payment processing.

## Features

- ✅ **Authentication**: Firebase Auth token verification
- ✅ **Validation**: Zod schema validation for all endpoints
- ✅ **Payment Processing**: Stripe payment intents, confirmations, refunds, payouts
- ✅ **Booking Management**: Time slot validation, conflict detection, booking lifecycle
- ✅ **User Management**: Profile validation, interviewer verification
- ✅ **Security**: Helmet, CORS, rate limiting, error handling
- ✅ **Logging**: Pino structured logging

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4.x
- **Language**: TypeScript 5.x
- **Database**: Firebase Firestore (Admin SDK)
- **Payments**: Stripe API
- **Validation**: Zod
- **Logging**: Pino

## Project Structure

```
backend/
├── src/
│   ├── config/           # Firebase, Stripe configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API route definitions
│   ├── validators/       # Zod schemas
│   └── server.ts         # Express app setup
├── .env.example          # Environment variables template
├── package.json
└── tsconfig.json
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase Admin SDK private key
- `FIREBASE_CLIENT_EMAIL`: Firebase Admin SDK email
- `STRIPE_SECRET_KEY`: Stripe secret key (test or live)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `DAILY_API_KEY`: Daily.co API key for video meetings

### 3. Run Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Bookings
- `POST /api/bookings/validate` - Validate time slot availability
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:bookingId/status` - Update booking status
- `GET /api/bookings/:bookingId` - Get booking details

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/earnings` - Get interviewer earnings
- `POST /api/payments/payout` - Request payout
- `GET /api/payments/transaction/:transactionId` - Get transaction

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `POST /api/users/:userId/validate-interviewer` - Validate interviewer profile

### Availability
- `POST /api/availability/validate` - Validate availability slots
- `POST /api/availability/check-conflicts` - Check slot conflicts

## Authentication

All endpoints (except `/health`) require Firebase Auth token:

```
Authorization: Bearer <firebase_id_token>
```

Get token from Firebase client SDK:
```typescript
const token = await user.getIdToken();
```

## Validation

Request validation uses Zod schemas. Invalid requests return:

```json
{
  "success": false,
  "error": "Validation error: body.amount: Expected number, received string"
}
```

## Error Handling

Standardized error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (time slot unavailable)
- `500` - Internal Server Error

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: 429 Too Many Requests

## Payment Flow

1. **Create Intent**: `POST /api/payments/create-intent`
   - Validates booking
   - Creates Stripe payment intent
   - Returns client secret

2. **Confirm Payment**: `POST /api/payments/confirm`
   - Confirms payment with payment method
   - Updates booking status to `confirmed`
   - Marks payment as `completed`

3. **Refund**: `POST /api/payments/refund`
   - Processes Stripe refund
   - Updates booking status to `cancelled`
   - Marks payment as `refunded`

4. **Earnings**: `GET /api/payments/earnings`
   - Calculates total, pending, paid earnings
   - 15% platform fee deducted automatically

5. **Payout**: `POST /api/payments/payout`
   - Minimum: $50
   - Validates sufficient pending earnings
   - Creates payout record

## Security

- **Helmet**: Security headers
- **CORS**: Configurable allowed origins
- **Rate Limiting**: DDoS protection
- **Auth**: Firebase token verification
- **Validation**: Input sanitization
- **Error Handling**: No sensitive data in responses

## Logging

Pino structured logging with levels:
- `info`: Normal operations
- `warn`: Warnings
- `error`: Errors with stack traces
- `debug`: Development debugging

Example:
```typescript
logger.info({ bookingId, userId }, 'Booking created');
logger.error({ error, context }, 'Payment failed');
```

## Testing

```bash
npm test
```

## Deployment

### Environment
- Set `NODE_ENV=production`
- Use production Stripe keys
- Configure allowed origins
- Enable HTTPS

### Recommended Platforms
- **Heroku**: Easy deployment with buildpacks
- **Railway**: Zero-config deployment
- **AWS EC2/ECS**: Full control
- **Google Cloud Run**: Serverless containers
- **Vercel**: Serverless functions

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/server.js"]
```

## Monitoring

Recommended tools:
- **Sentry**: Error tracking
- **DataDog**: APM and logs
- **Stripe Dashboard**: Payment monitoring
- **Firebase Console**: Database monitoring

## License

MIT

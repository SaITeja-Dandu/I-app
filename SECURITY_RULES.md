# Firebase Security Rules Documentation

Comprehensive security rules for Firestore and Storage in the Interview Marketplace platform.

## Overview

The security rules implement a role-based access control system with two user types:
- **Candidates**: Book interviews, submit reviews, practice interviews
- **Interviewers**: Manage availability, accept bookings, receive payments

## Security Principles

1. **Authentication Required**: All operations require valid Firebase Auth token
2. **Owner-Based Access**: Users can only modify their own data
3. **Role-Based Permissions**: Different capabilities for candidates vs interviewers
4. **Immutable Audit Trail**: Payment and transaction data cannot be deleted
5. **Time-Based Restrictions**: Some operations have time windows (e.g., review deletion)
6. **Data Validation**: Field types, ranges, and required fields enforced
7. **Public Read for Discovery**: Interviewer profiles and reviews are publicly readable

## Firestore Collections

### 1. Users (`/users/{userId}`)

**Read Access**:
- ✅ Own profile: Full access
- ✅ Interviewer profiles: Public read for discovery
- ❌ Other candidate profiles: No access

**Write Access**:
- ✅ Create: During signup only, with valid userType
- ✅ Update: Own profile, cannot change uid/id/userType/createdAt
- ❌ Delete: Not allowed (use Firebase Auth)

**Validation**:
- `userType` must be 'candidate' or 'interviewer'
- `uid` and `id` must match authenticated user
- `createdAt` set on creation, immutable
- `updatedAt` must be current time

### 2. Bookings (`/bookings/{bookingId}`)

**Read Access**:
- ✅ Both candidate and interviewer can read

**Write Access**:
- ✅ Create: Candidates only, status must be 'pending'
- ✅ Update: Status changes based on role:
  - Candidate: Can cancel pending/confirmed
  - Interviewer: Can confirm/reject pending, mark completed/no-show
- ❌ Delete: Not allowed (preserve history)

**Validation**:
- Required fields: candidateId, interviewerId, scheduledDateTime, durationMinutes, etc.
- Cannot modify core details (IDs, datetime, duration)
- Status transitions enforced

**Status Flow**:
```
pending → confirmed (interviewer)
pending → cancelled (candidate/interviewer)
confirmed → cancelled (candidate)
confirmed → completed (interviewer)
confirmed → no-show (interviewer)
```

### 3. Availability (`/availability/{availabilityId}`)

**Read Access**:
- ✅ All authenticated users (for browsing)

**Write Access**:
- ✅ Create/Update/Delete: Only by owner interviewer

**Validation**:
- `dayOfWeek` must be 0-6 (Sunday-Saturday)
- `startTime` and `endTime` in HH:mm format
- `isActive` must be boolean
- Owner cannot change on update

### 4. Reviews (`/reviews/{reviewId}`)

**Read Access**:
- ✅ All authenticated users (public reviews)

**Write Access**:
- ✅ Create: Candidates only, for completed bookings, one per booking
- ❌ Update: Not allowed (prevent manipulation)
- ✅ Delete: Author only, within 24 hours

**Validation**:
- Rating must be 1-5
- Booking must exist and be completed
- Candidate must be booking participant

### 5. Notifications (`/notifications/{notificationId}`)

**Read Access**:
- ✅ Recipient only

**Write Access**:
- ❌ Create: Backend only
- ✅ Update: Recipient can mark as read
- ✅ Delete: Recipient only

**Validation**:
- Can only update 'read' and 'readAt' fields
- Cannot change recipient

### 6. Payment Transactions (`/payment_transactions/{transactionId}`)

**Read Access**:
- ✅ Both candidate and interviewer participants

**Write Access**:
- ❌ Create/Update/Delete: Backend only (audit trail)

### 7. Payouts (`/payouts/{payoutId}`)

**Read Access**:
- ✅ Payout recipient (interviewer) only

**Write Access**:
- ❌ Create/Update/Delete: Backend only (audit trail)

### 8. Interview Sessions (`/interview_sessions/{sessionId}`)

**Read Access**:
- ✅ Session owner only

**Write Access**:
- ✅ Create/Update/Delete: Owner only
- Must be 'practice' type for client creation

### 9. Interviewer Ratings (`/interviewer_ratings/{interviewerId}`)

**Read Access**:
- ✅ All authenticated users (public)

**Write Access**:
- ❌ Backend only (aggregation)

### 10. Video Meetings (`/video_meetings/{meetingId}`)

**Read Access**:
- ✅ Both meeting participants

**Write Access**:
- ❌ Create: Backend only
- ✅ Update: Participants can update join status
- ❌ Delete: Not allowed (audit trail)

## Storage Rules

### File Structure

```
storage/
├── users/{userId}/
│   ├── profile/{fileName}      # Profile pictures (5MB max)
│   └── resumes/{fileName}      # Resume files (10MB max)
├── interviews/{bookingId}/
│   ├── recordings/{fileName}   # Video recordings (500MB max)
│   └── notes/{fileName}        # Interview notes (10MB max)
└── practice/{userId}/
    └── sessions/{sessionId}/
        └── {fileName}          # Practice recordings (500MB max)
```

### 1. Profile Pictures (`/users/{userId}/profile/*`)

**Read Access**:
- ✅ Public (anyone can view)

**Write/Delete Access**:
- ✅ Owner only

**Validation**:
- Must be image file (image/*)
- Max size: 5MB

### 2. Resumes (`/users/{userId}/resumes/*`)

**Read Access**:
- ✅ Owner only
- ✅ Interviewers via signed URLs (backend)

**Write/Delete Access**:
- ✅ Owner only

**Validation**:
- Must be PDF, DOC, DOCX, or TXT
- Max size: 10MB

### 3. Interview Recordings (`/interviews/{bookingId}/recordings/*`)

**Read Access**:
- ✅ Both booking participants

**Write/Delete Access**:
- ✅ Both booking participants

**Validation**:
- Must be video file (video/*)
- Max size: 500MB
- Booking verification via Firestore lookup

### 4. Interview Notes (`/interviews/{bookingId}/notes/*`)

**Read Access**:
- ✅ Both booking participants

**Write Access**:
- ✅ Both booking participants

**Delete Access**:
- ✅ File uploader only

**Validation**:
- Must be PDF, DOC, DOCX, or TXT
- Max size: 10MB

### 5. Practice Recordings (`/practice/{userId}/sessions/{sessionId}/*`)

**Read/Write/Delete Access**:
- ✅ Owner only

**Validation**:
- Must be video file
- Max size: 500MB

## Deployment

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Deploy Both

```bash
firebase deploy --only firestore:rules,storage
```

### Test Rules Locally

```bash
firebase emulators:start --only firestore,storage
```

## Testing

### Firestore Rules Testing

```typescript
// Example: Test user can read own profile
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

// Should succeed
await assertSucceeds(
  db.collection('users').doc('user123').get()
);

// Should fail
await assertFails(
  db.collection('users').doc('otherUser').get()
);
```

### Storage Rules Testing

```typescript
// Example: Test user can upload profile picture
await assertSucceeds(
  storage.ref('users/user123/profile/avatar.jpg').put(imageFile)
);

// Should fail - wrong user
await assertFails(
  storage.ref('users/otherUser/profile/avatar.jpg').put(imageFile)
);
```

## Common Scenarios

### Scenario 1: Candidate Books Interview

1. ✅ Candidate creates booking in `/bookings`
   - Status: 'pending'
   - Validates: candidateId matches auth.uid

2. ✅ Backend creates notification for interviewer
   - In `/notifications`

3. ✅ Interviewer confirms booking
   - Updates status to 'confirmed'
   - Validates: interviewerId matches auth.uid

### Scenario 2: Payment Processing

1. ✅ Candidate initiates payment via backend API
   - Backend validates booking

2. ✅ Backend creates transaction in `/payment_transactions`
   - Client can only read, not write

3. ✅ Backend updates booking with payment info
   - Sets paymentStatus, amounts, etc.

### Scenario 3: Review Submission

1. ✅ Candidate completes interview
   - Interviewer marks booking as 'completed'

2. ✅ Candidate submits review
   - Validates: booking is completed
   - Validates: candidate is booking participant
   - Creates document in `/reviews`

3. ✅ Backend updates rating aggregation
   - Updates `/interviewer_ratings/{interviewerId}`

### Scenario 4: File Upload

1. ✅ User uploads profile picture
   - Path: `/users/{userId}/profile/avatar.jpg`
   - Validates: owner, image type, size < 5MB

2. ✅ Candidate uploads resume
   - Path: `/users/{userId}/resumes/resume.pdf`
   - Validates: owner, PDF type, size < 10MB

## Security Best Practices

1. **Never Trust Client Input**: All critical operations validated server-side
2. **Audit Trail**: Payment and transaction data immutable
3. **Rate Limiting**: Implemented at backend level
4. **Signed URLs**: For sensitive file access (resumes)
5. **Time-Based Restrictions**: Review deletion limited to 24 hours
6. **Field Validation**: Types, ranges, required fields enforced
7. **No Cascade Deletes**: Preserve data integrity

## Monitoring

Monitor rule violations in Firebase Console:
- **Firestore**: Check for denied reads/writes
- **Storage**: Check for rejected uploads
- **Auth**: Monitor authentication failures

## Troubleshooting

### "permission-denied" Errors

1. **Check Authentication**: User logged in?
2. **Check User Type**: Candidate vs Interviewer?
3. **Check Ownership**: Accessing own data?
4. **Check Status**: Booking in correct state?
5. **Check Timestamps**: Using server timestamp?

### Common Mistakes

❌ **Wrong**: Client sets `createdAt: new Date()`
✅ **Right**: Use `createdAt: request.time` in rules

❌ **Wrong**: Client tries to create payment transaction
✅ **Right**: Backend API creates transactions

❌ **Wrong**: Updating immutable fields (uid, userType)
✅ **Right**: Only update allowed fields

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Guide](https://firebase.google.com/docs/storage/security)
- [Rules Unit Testing](https://firebase.google.com/docs/rules/unit-tests)

"use strict";
/**
 * @file tests/security-rules.test.ts
 * @description Security rules unit tests using Firebase Rules Unit Testing
 *
 * Run tests:
 *   npm install --save-dev @firebase/rules-unit-testing jest
 *   npm test
 */
Object.defineProperty(exports, "__esModule", { value: true });
const rules_unit_testing_1 = require("@firebase/rules-unit-testing");
const firestore_1 = require("firebase/firestore");
// Suppress logs
(0, firestore_1.setLogLevel)('error');
const PROJECT_ID = 'intervuu-test';
let testEnv;
beforeAll(async () => {
    testEnv = await (0, rules_unit_testing_1.initializeTestEnvironment)({
        projectId: PROJECT_ID,
        firestore: {
            rules: require('fs').readFileSync('firestore.rules', 'utf8'),
            host: 'localhost',
            port: 8080,
        },
        storage: {
            rules: require('fs').readFileSync('storage.rules', 'utf8'),
            host: 'localhost',
            port: 9199,
        },
    });
});
afterAll(async () => {
    await testEnv.cleanup();
});
beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
});
// ============================================
// User Collection Tests
// ============================================
describe('Users Collection', () => {
    const userId = 'user123';
    const otherUserId = 'user456';
    test('User can read their own profile', async () => {
        const context = testEnv.authenticatedContext(userId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc(userId).set({
                uid: userId,
                id: userId,
                userType: 'candidate',
                email: 'test@example.com',
                createdAt: new Date(),
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('users').doc(userId).get());
    });
    test('User cannot read another candidate profile', async () => {
        const context = testEnv.authenticatedContext(userId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc(otherUserId).set({
                uid: otherUserId,
                id: otherUserId,
                userType: 'candidate',
                email: 'other@example.com',
                createdAt: new Date(),
            });
        });
        await (0, rules_unit_testing_1.assertFails)(context.firestore().collection('users').doc(otherUserId).get());
    });
    test('User can read interviewer profiles', async () => {
        const context = testEnv.authenticatedContext(userId);
        const interviewerId = 'interviewer123';
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc(interviewerId).set({
                uid: interviewerId,
                id: interviewerId,
                userType: 'interviewer',
                email: 'interviewer@example.com',
                createdAt: new Date(),
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('users').doc(interviewerId).get());
    });
    test('User can create their own profile', async () => {
        const context = testEnv.authenticatedContext(userId);
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('users').doc(userId).set({
            uid: userId,
            id: userId,
            userType: 'candidate',
            email: 'test@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    });
    test('User cannot create profile for someone else', async () => {
        const context = testEnv.authenticatedContext(userId);
        await (0, rules_unit_testing_1.assertFails)(context.firestore().collection('users').doc(otherUserId).set({
            uid: otherUserId,
            id: otherUserId,
            userType: 'candidate',
            email: 'other@example.com',
            createdAt: new Date(),
        }));
    });
});
// ============================================
// Bookings Collection Tests
// ============================================
describe('Bookings Collection', () => {
    const candidateId = 'candidate123';
    const interviewerId = 'interviewer123';
    const bookingId = 'booking123';
    test('Candidate can create booking', async () => {
        const context = testEnv.authenticatedContext(candidateId);
        // Setup candidate user
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc(candidateId).set({
                uid: candidateId,
                userType: 'candidate',
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('bookings').add({
            candidateId,
            candidateName: 'Test Candidate',
            candidateEmail: 'candidate@example.com',
            interviewerId,
            interviewerName: 'Test Interviewer',
            interviewerEmail: 'interviewer@example.com',
            type: 'live',
            scheduledDateTime: new Date(),
            durationMinutes: 45,
            timezone: 'UTC',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    });
    test('Candidate can read their booking', async () => {
        const context = testEnv.authenticatedContext(candidateId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('bookings').doc(bookingId).set({
                candidateId,
                interviewerId,
                status: 'pending',
                scheduledDateTime: new Date(),
                durationMinutes: 45,
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('bookings').doc(bookingId).get());
    });
    test('Interviewer can read their booking', async () => {
        const context = testEnv.authenticatedContext(interviewerId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('bookings').doc(bookingId).set({
                candidateId,
                interviewerId,
                status: 'pending',
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('bookings').doc(bookingId).get());
    });
    test('Third party cannot read booking', async () => {
        const context = testEnv.authenticatedContext('other123');
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('bookings').doc(bookingId).set({
                candidateId,
                interviewerId,
                status: 'pending',
            });
        });
        await (0, rules_unit_testing_1.assertFails)(context.firestore().collection('bookings').doc(bookingId).get());
    });
    test('Interviewer can confirm pending booking', async () => {
        const context = testEnv.authenticatedContext(interviewerId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('bookings').doc(bookingId).set({
                candidateId,
                interviewerId,
                status: 'pending',
                scheduledDateTime: new Date(),
                durationMinutes: 45,
                createdAt: new Date(),
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('bookings').doc(bookingId).update({
            status: 'confirmed',
            updatedAt: new Date(),
        }));
    });
});
// ============================================
// Reviews Collection Tests
// ============================================
describe('Reviews Collection', () => {
    const candidateId = 'candidate123';
    const interviewerId = 'interviewer123';
    const bookingId = 'booking123';
    test('Candidate can create review for completed booking', async () => {
        const context = testEnv.authenticatedContext(candidateId);
        // Setup completed booking and candidate
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('users').doc(candidateId).set({
                uid: candidateId,
                userType: 'candidate',
            });
            await context.firestore().collection('bookings').doc(bookingId).set({
                candidateId,
                interviewerId,
                status: 'completed',
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('reviews').add({
            bookingId,
            interviewerId,
            candidateId,
            rating: 5,
            comment: 'Great interview!',
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    });
    test('Anyone can read reviews', async () => {
        const context = testEnv.authenticatedContext('any123');
        const reviewId = 'review123';
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('reviews').doc(reviewId).set({
                bookingId,
                interviewerId,
                candidateId,
                rating: 5,
                comment: 'Great!',
            });
        });
        await (0, rules_unit_testing_1.assertSucceeds)(context.firestore().collection('reviews').doc(reviewId).get());
    });
    test('Reviews cannot be updated', async () => {
        const context = testEnv.authenticatedContext(candidateId);
        const reviewId = 'review123';
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('reviews').doc(reviewId).set({
                bookingId,
                interviewerId,
                candidateId,
                rating: 5,
                createdAt: new Date(),
            });
        });
        await (0, rules_unit_testing_1.assertFails)(context.firestore().collection('reviews').doc(reviewId).update({
            rating: 4,
        }));
    });
});
// ============================================
// Storage Tests
// ============================================
describe('Storage Rules', () => {
    const userId = 'user123';
    test('User can upload their profile picture', async () => {
        const context = testEnv.authenticatedContext(userId);
        const ref = context.storage().ref(`users/${userId}/profile/avatar.jpg`);
        await (0, rules_unit_testing_1.assertSucceeds)(ref.put(Buffer.from('fake-image-data'), {
            contentType: 'image/jpeg',
        }).then());
    });
    test('User cannot upload to another user folder', async () => {
        const context = testEnv.authenticatedContext(userId);
        const ref = context.storage().ref('users/other123/profile/avatar.jpg');
        await (0, rules_unit_testing_1.assertFails)(ref.put(Buffer.from('fake-image-data'), {
            contentType: 'image/jpeg',
        }).then());
    });
    test('Anyone can read profile pictures', async () => {
        const context = testEnv.unauthenticatedContext();
        // Upload file as authenticated user first
        await testEnv.withSecurityRulesDisabled(async (context) => {
            const ref = context.storage().ref(`users/${userId}/profile/avatar.jpg`);
            await ref.put(Buffer.from('fake'), { contentType: 'image/jpeg' });
        });
        const ref = context.storage().ref(`users/${userId}/profile/avatar.jpg`);
        await (0, rules_unit_testing_1.assertSucceeds)(ref.getDownloadURL());
    });
    test('User can only read their own resume', async () => {
        const context = testEnv.authenticatedContext(userId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            const ref = context.storage().ref(`users/${userId}/resumes/resume.pdf`);
            await ref.put(Buffer.from('fake'), { contentType: 'application/pdf' });
        });
        const ref = context.storage().ref(`users/${userId}/resumes/resume.pdf`);
        await (0, rules_unit_testing_1.assertSucceeds)(ref.getDownloadURL());
    });
});
console.log('🧪 Security rules tests ready to run');

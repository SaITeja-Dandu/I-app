#!/usr/bin/env node

/**
 * @file scripts/delete-all-users.mjs
 * @description Delete all users from Firestore and Firebase Auth
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, '../secrets/service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found at:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const appId = process.env.VITE_APP_ID || 'interview-navigator-app';

async function deleteAllUsers() {
  try {
    console.log('🔍 Starting to delete all users...\n');

    // Get all users from Firebase Auth
    const usersList = [];
    let pageToken;

    console.log('📋 Fetching all users from Firebase Auth...');
    do {
      const result = await auth.listUsers(1000, pageToken);
      usersList.push(...result.users);
      pageToken = result.pageToken;
      console.log(`   Found ${result.users.length} users in this batch`);
    } while (pageToken);

    console.log(`\n✅ Total users found: ${usersList.length}\n`);

    if (usersList.length === 0) {
      console.log('ℹ️  No users to delete. Database is already empty!');
      process.exit(0);
    }

    // Confirm before deletion
    console.log('⚠️  WARNING: You are about to delete all users from:');
    console.log(`   - Firebase Authentication`);
    console.log(`   - Firestore Database (artifacts/${appId}/users)`);
    console.log(`\n   This action CANNOT be undone!\n`);

    // For automation, we'll proceed without prompt
    console.log('🗑️  Proceeding with deletion...\n');

    let deletedAuth = 0;
    let deletedFirestore = 0;
    let errors = 0;

    // Delete from Firebase Auth and Firestore
    for (const user of usersList) {
      try {
        const uid = user.uid;
        const email = user.email || 'unknown';

        // Delete from Firebase Auth
        try {
          await auth.deleteUser(uid);
          deletedAuth++;
          console.log(`✅ Auth: Deleted user ${email} (${uid})`);
        } catch (authErr) {
          console.error(`❌ Auth: Failed to delete ${email}:`, authErr.message);
          errors++;
        }

        // Delete from Firestore
        try {
          const userRef = db.doc(`artifacts/${appId}/users/${uid}`);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            // Delete nested documents first
            const profileRef = userRef.collection('profile');
            const profileSnap = await profileRef.get();
            
            for (const doc of profileSnap.docs) {
              await doc.ref.delete();
            }

            // Then delete the root document
            await userRef.delete();
            deletedFirestore++;
            console.log(`✅ Firestore: Deleted profile for ${email} (${uid})`);
          }
        } catch (fsErr) {
          console.error(`❌ Firestore: Failed to delete ${email}:`, fsErr.message);
          errors++;
        }
      } catch (err) {
        console.error(`❌ Unexpected error for user:`, err.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Firebase Auth: ${deletedAuth} users deleted`);
    console.log(`✅ Firestore: ${deletedFirestore} profiles deleted`);
    if (errors > 0) {
      console.log(`❌ Errors encountered: ${errors}`);
    }
    console.log('='.repeat(60) + '\n');

    if (errors === 0) {
      console.log('🎉 All users successfully deleted!');
    } else {
      console.log('⚠️  Some errors occurred during deletion. Please check above.');
    }

    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllUsers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

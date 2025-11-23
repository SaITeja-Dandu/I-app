#!/bin/bash

echo "🔐 Deploying Firebase Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase."
    echo "Please run: firebase login"
    exit 1
fi

echo "✅ Authenticated with Firebase"
echo ""

# Show current project
echo "📋 Current Firebase project:"
firebase use

echo ""
echo "Choose deployment option:"
echo "  1) Deploy Firestore rules only"
echo "  2) Deploy Storage rules only"
echo "  3) Deploy both Firestore and Storage rules"
echo "  4) Deploy rules and indexes"
echo "  5) Start local emulators (for testing)"
read -p "Enter choice (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🚀 Deploying Firestore rules..."
    firebase deploy --only firestore:rules
    ;;
  2)
    echo ""
    echo "🚀 Deploying Storage rules..."
    firebase deploy --only storage
    ;;
  3)
    echo ""
    echo "🚀 Deploying Firestore and Storage rules..."
    firebase deploy --only firestore:rules,storage
    ;;
  4)
    echo ""
    echo "🚀 Deploying rules and indexes..."
    firebase deploy --only firestore,storage
    ;;
  5)
    echo ""
    echo "🧪 Starting Firebase emulators..."
    echo "Emulator UI: http://localhost:4000"
    echo "Firestore: http://localhost:8080"
    echo "Storage: http://localhost:9199"
    echo "Auth: http://localhost:9099"
    echo ""
    firebase emulators:start
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  - Test rules with Firebase emulators"
echo "  - Monitor rule violations in Firebase Console"
echo "  - Check Firestore/Storage usage metrics"
echo ""

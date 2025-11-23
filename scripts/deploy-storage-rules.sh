#!/bin/bash

# Firebase Storage Rules Deployment Script
# This script deploys security rules for Firebase Storage

echo "================================================"
echo "Firebase Storage Rules Deployment"
echo "================================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed."
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI is installed"
echo ""

# Check if user is logged in
firebase_user=$(firebase login:list 2>&1 | grep -o "[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]*\.[a-zA-Z]*" | head -n 1)

if [ -z "$firebase_user" ]; then
    echo "⚠️  You are not logged in to Firebase."
    echo "Logging in..."
    firebase login
else
    echo "✅ Logged in as: $firebase_user"
fi

echo ""
echo "================================================"
echo "Deploying Storage Rules"
echo "================================================"
echo ""

# Check if storage.rules file exists
if [ ! -f "storage.rules" ]; then
    echo "❌ Error: storage.rules file not found!"
    echo "Please ensure storage.rules exists in the project root."
    exit 1
fi

echo "📋 Storage rules file found: storage.rules"
echo ""

# Deploy storage rules
echo "🚀 Deploying storage rules..."
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✅ Storage Rules Deployed Successfully!"
    echo "================================================"
    echo ""
    echo "Security Rules Active:"
    echo "  ✓ Resumes: 5MB max, PDF/Word only, owner access only"
    echo "  ✓ Portfolios: 10MB max, PDF/Images only, owner access only"
    echo "  ✓ Profile Photos: 2MB max, Images only, public read/owner write"
    echo "  ✓ Certificates: 5MB max, PDF/Images only, owner access only"
    echo ""
    echo "🎉 Your Firebase Storage is now secured!"
else
    echo ""
    echo "================================================"
    echo "❌ Deployment Failed"
    echo "================================================"
    echo ""
    echo "Please check the error messages above and try again."
    exit 1
fi

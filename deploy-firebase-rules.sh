#!/bin/bash

# Firebase Security Rules Deployment Script
# This script deploys the Firestore security rules to your Firebase project

echo "🚀 Deploying Firebase Security Rules..."
echo "Project: wealthwatch-e8c32"

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

# Login to Firebase (you'll need to authenticate in your browser)
echo "🔐 Please authenticate with Firebase in your browser..."
firebase login

# Deploy Firestore rules
echo "📝 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Firebase security rules deployed successfully!"
echo ""
echo "🔒 Your Firestore database is now secured with the following rules:"
echo "   - Only authenticated users can access data"
echo "   - Users can only access their own data"
echo "   - Demo user has special access to demo data"
echo "   - Input validation for all data types"
echo "   - Global tickers collection is read-only"
echo ""
echo "⚠️  IMPORTANT: Test your application to ensure all functionality works correctly!"

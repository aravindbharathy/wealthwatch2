#!/bin/bash

echo "🔧 Updating Firebase Security Rules for Demo User Support..."
echo ""

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "📝 Deploying updated Firestore security rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Security rules updated successfully!"
echo ""
echo "🎉 Demo user should now work properly!"
echo "📱 Try refreshing your application to test the demo user functionality."

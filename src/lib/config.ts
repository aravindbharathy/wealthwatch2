// Configuration for the application
export const config = {
  // Firebase configuration
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBRFlZSwCYkP0PYaHfBmVDSzJCLBeveZ9c",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "wealthwatch-e8c32.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wealthwatch-e8c32",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "wealthwatch-e8c32.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "933918698096",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:933918698096:web:2fcaab09ce0627f4e9a2b5",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-K33PR5SRDE"
  },
  
  // Feature flags
  features: {
    enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true' || true,
    enableFirebase: process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true' || false,
  },
  
  // App settings
  app: {
    name: "Wealth Watch",
    version: "1.0.0",
    defaultCurrency: "USD",
  }
};

# Investment Tracker App

You are an expert in TypeScript, Next.js App Router, React, and Tailwind. Follow @Next.js docs for Data Fetching, Rendering, and Routing. 

Your job is to create a investment tracker application with the following features:
1. A side navigation panel with a dashboard page, assets page, debts page, and accounts page.
2. At the top right there is currency selector dropdown with default as USD and a user icon.
3. Leave all pages as placeholder pages for now.

Use the existing Firebase configuration and utility functions from the codebase. Implement the firebase database connection for using later. Replace any existing code in the codebase to transform it into a investment tracking application.

Firebase configuration below:
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRFlZSwCYkP0PYaHfBmVDSzJCLBeveZ9c",
  authDomain: "wealthwatch-e8c32.firebaseapp.com",
  projectId: "wealthwatch-e8c32",
  storageBucket: "wealthwatch-e8c32.firebasestorage.app",
  messagingSenderId: "933918698096",
  appId: "1:933918698096:web:2fcaab09ce0627f4e9a2b5",
  measurementId: "G-K33PR5SRDE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

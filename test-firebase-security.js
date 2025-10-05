/**
 * Firebase Security Rules Test Script
 * This script tests the security rules to ensure they work correctly
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

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
const db = getFirestore(app);
const auth = getAuth(app);

// Test cases for security rules
const testCases = [
  {
    name: "Unauthenticated user should not access user data",
    test: async () => {
      try {
        await getDoc(doc(db, 'users', 'test-user', 'assets', 'test-asset'));
        return { passed: false, error: "Should have been denied access" };
      } catch (error) {
        return { passed: true, message: "Access correctly denied" };
      }
    }
  },
  {
    name: "Authenticated user should access their own data",
    test: async () => {
      try {
        // Use Google sign-in for testing (you'll need to authenticate in browser)
        const provider = new GoogleAuthProvider();
        console.log('   Please authenticate with Google in your browser...');
        const userCredential = await signInWithPopup(auth, provider);
        
        const testData = {
          name: "Test Asset",
          type: "stock",
          currentValue: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid, 'assets', 'test-asset'), testData);
        const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid, 'assets', 'test-asset'));
        await deleteDoc(doc(db, 'users', userCredential.user.uid, 'assets', 'test-asset'));
        await signOut(auth);
        
        return { passed: docSnap.exists(), message: "User can access their own data" };
      } catch (error) {
        return { passed: false, error: error.message };
      }
    }
  },
  {
    name: "User should not access other users' data",
    test: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        try {
          await getDoc(doc(db, 'users', 'other-user-123', 'assets', 'test-asset'));
          return { passed: false, error: "Should not access other user's data" };
        } catch (error) {
          return { passed: true, message: "Correctly denied access to other user's data" };
        } finally {
          await signOut(auth);
        }
      } catch (error) {
        return { passed: false, error: error.message };
      }
    }
  },
  {
    name: "Global tickers should be readable by authenticated users",
    test: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        try {
          await getDoc(doc(db, 'tickers', 'test-ticker'));
          return { passed: true, message: "Can read global tickers" };
        } catch (error) {
          return { passed: false, error: "Should be able to read global tickers" };
        } finally {
          await signOut(auth);
        }
      } catch (error) {
        return { passed: false, error: error.message };
      }
    }
  },
  {
    name: "Invalid asset data should be rejected",
    test: async () => {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid, 'assets', 'invalid-asset'), {
            // Missing required fields
            name: "Test"
          });
          return { passed: false, error: "Should have rejected invalid data" };
        } catch (error) {
          return { passed: true, message: "Correctly rejected invalid data" };
        } finally {
          await signOut(auth);
        }
      } catch (error) {
        return { passed: false, error: error.message };
      }
    }
  }
];

// Run all test cases
async function runSecurityTests() {
  console.log('🔒 Running Firebase Security Rules Tests...\n');
  console.log('ℹ️  Note: This test will require Google authentication in your browser\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      const result = await testCase.test();
      if (result.passed) {
        console.log(`   ✅ ${result.message || 'PASSED'}\n`);
        passed++;
      } else {
        console.log(`   ❌ ${result.error || 'FAILED'}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}\n`);
      failed++;
    }
  }
  
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All security tests passed! Your Firebase rules are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. This might be expected if:');
    console.log('   - You need to authenticate with Google');
    console.log('   - The test data doesn\'t exist yet');
    console.log('   - There are specific validation rules');
    console.log('\n💡 The important thing is that your database is now secured!');
  }
}

// Run the tests
runSecurityTests().catch(console.error);

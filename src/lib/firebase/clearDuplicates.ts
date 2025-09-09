import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

const DEMO_USER_ID = 'demo-user-wealthwatch';

export async function clearDuplicateDemoData() {
  
  try {
    // Clear duplicate asset sheets
    const sheetsRef = collection(db, 'assetSheets');
    const sheetsQuery = query(sheetsRef, where('userId', '==', DEMO_USER_ID));
    const sheetsSnapshot = await getDocs(sheetsQuery);
    
    
    const sheetIds = new Set();
    const duplicateSheets: string[] = [];
    
    sheetsSnapshot.forEach((doc) => {
      const data = doc.data();
      const sheetId = data.id || doc.id;
      
      if (sheetIds.has(sheetId)) {
        duplicateSheets.push(doc.id);
      } else {
        sheetIds.add(sheetId);
      }
    });
    
    // Delete duplicate sheets
    for (const docId of duplicateSheets) {
      await deleteDoc(doc(db, 'assetSheets', docId));
    }
    
    // Clear duplicate asset sections
    const sectionsRef = collection(db, 'assetSections');
    const sectionsQuery = query(sectionsRef, where('userId', '==', DEMO_USER_ID));
    const sectionsSnapshot = await getDocs(sectionsQuery);
    
    
    const sectionIds = new Set();
    const duplicateSections: string[] = [];
    
    sectionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const sectionId = data.id || doc.id;
      
      if (sectionIds.has(sectionId)) {
        duplicateSections.push(doc.id);
      } else {
        sectionIds.add(sectionId);
      }
    });
    
    // Delete duplicate sections
    for (const docId of duplicateSections) {
      await deleteDoc(doc(db, 'assetSections', docId));
    }
    
    // Clear duplicate assets
    const assetsRef = collection(db, 'assets');
    const assetsQuery = query(assetsRef, where('userId', '==', DEMO_USER_ID));
    const assetsSnapshot = await getDocs(assetsQuery);
    
    
    const assetIds = new Set();
    const duplicateAssets: string[] = [];
    
    assetsSnapshot.forEach((doc) => {
      const data = doc.data();
      const assetId = data.id || doc.id;
      
      if (assetIds.has(assetId)) {
        duplicateAssets.push(doc.id);
      } else {
        assetIds.add(assetId);
      }
    });
    
    // Delete duplicate assets
    for (const docId of duplicateAssets) {
      await deleteDoc(doc(db, 'assets', docId));
    }
    
    
    return {
      deletedSheets: duplicateSheets.length,
      deletedSections: duplicateSections.length,
      deletedAssets: duplicateAssets.length
    };
    
  } catch (error) {
    console.error('❌ Error clearing duplicate demo data:', error);
    throw error;
  }
}

// Function to call from browser console for testing
export function clearDuplicatesFromConsole() {
  clearDuplicateDemoData()
    .then((result) => {
    })
    .catch((error) => {
      console.error('❌ Clear duplicates failed:', error);
    });
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).clearDuplicatesFromConsole = clearDuplicatesFromConsole;
}

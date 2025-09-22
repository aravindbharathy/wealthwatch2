// Demo User Utilities
import { 
  initializeDemoUser, 
  clearDemoData, 
  checkDemoDataExists,
  DEMO_USER_ID 
} from './demoUserSetup';

// Initialize demo user if needed
export const setupDemoUser = async (): Promise<void> => {
  try {
    const dataExists = await checkDemoDataExists();
    if (!dataExists) {
      await initializeDemoUser();
    }
  } catch (error) {
    console.error('❌ Demo user setup failed:', error);
    throw error;
  }
};

// Get demo user status
export const getDemoUserStatus = async (): Promise<{
  dataExists: boolean;
  userId: string;
}> => {
  try {
    const dataExists = await checkDemoDataExists();
    return {
      dataExists,
      userId: DEMO_USER_ID,
    };
  } catch (error) {
    console.error('❌ Failed to get demo user status:', error);
    throw error;
  }
};

// Make essential functions available globally for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).demoUserUtils = {
    setupDemoUser,
    getDemoUserStatus,
    clearDemoData: async () => {
      try {
        await clearDemoData();
      } catch (error) {
        console.error('❌ Failed to clear demo data:', error);
      }
    },
    signInAsDemo: async () => {
      try {
        await setupDemoUser();
        localStorage.setItem('demo-user-signed-in', 'true');
        window.location.reload();
      } catch (error) {
        console.error('❌ Failed to sign in as demo user:', error);
      }
    },
  };
}

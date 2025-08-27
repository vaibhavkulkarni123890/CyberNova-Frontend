// Alternative: Use Appwrite's built-in authentication
import { account } from '../config/appwrite';

export const appwriteAuth = {
  // Register using Appwrite's built-in auth
  register: async (email, password, name) => {
    try {
      console.log('📝 Using Appwrite built-in registration...');
      
      // Create user account
      const user = await account.create('unique()', email, password, name);
      console.log('✅ User created:', user);
      
      // Create session (login)
      const session = await account.createEmailSession(email, password);
      console.log('✅ Session created:', session);
      
      return {
        data: {
          token: session.$id, // Use session ID as token
          user: {
            id: user.$id,
            email: user.email,
            full_name: user.name,
            company: null
          }
        }
      };
    } catch (error) {
      console.error('❌ Appwrite registration error:', error);
      throw error;
    }
  },

  // Login using Appwrite's built-in auth
  login: async (email, password) => {
    try {
      console.log('🔑 Using Appwrite built-in login...');
      
      const session = await account.createEmailSession(email, password);
      console.log('✅ Session created:', session);
      
      // Get user info
      const user = await account.get();
      console.log('✅ User info:', user);
      
      return {
        data: {
          token: session.$id,
          user: {
            id: user.$id,
            email: user.email,
            full_name: user.name,
            company: null
          }
        }
      };
    } catch (error) {
      console.error('❌ Appwrite login error:', error);
      throw error;
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const user = await account.get();
      return {
        data: {
          id: user.$id,
          email: user.email,
          full_name: user.name,
          company: null,
          created_at: user.$createdAt
        }
      };
    } catch (error) {
      console.error('❌ Get user error:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await account.deleteSession('current');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }
};

// Add to window for testing
if (typeof window !== 'undefined') {
  window.appwriteAuth = appwriteAuth;
}
// Test Appwrite SDK functionality
import { account } from '../config/appwrite';

export const testAppwriteSDK = () => {
    console.log('🧪 Testing Appwrite SDK...');
    console.log('Account object:', account);
    console.log('Account methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(account)));
    
    // Check if createEmailSession exists
    if (typeof account.createEmailSession === 'function') {
        console.log('✅ createEmailSession method is available');
    } else {
        console.error('❌ createEmailSession method is NOT available');
        console.log('Available methods:', Object.getOwnPropertyNames(account));
    }
    
    // Check if create method exists
    if (typeof account.create === 'function') {
        console.log('✅ create method is available');
    } else {
        console.error('❌ create method is NOT available');
    }
    
    return {
        hasCreateEmailSession: typeof account.createEmailSession === 'function',
        hasCreate: typeof account.create === 'function',
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(account))
    };
};

// Add to window for testing
if (typeof window !== 'undefined') {
    window.testAppwriteSDK = testAppwriteSDK;
}
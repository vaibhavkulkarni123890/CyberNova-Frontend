import { Client, Account, Functions, Databases } from 'appwrite';

// Appwrite configuration
const client = new Client();

const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;

if (!APPWRITE_PROJECT_ID) {
    console.error('REACT_APP_APPWRITE_PROJECT_ID is not set in environment variables');
}

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Add CORS headers if needed
if (typeof window !== 'undefined') {
    // We're in a browser environment
    console.log('🌐 Configuring Appwrite client for browser environment');
    console.log('Endpoint:', APPWRITE_ENDPOINT);
    console.log('Project ID:', APPWRITE_PROJECT_ID);
}

// Initialize Appwrite services
export const account = new Account(client);
export const functions = new Functions(client);
export const databases = new Databases(client);

// Debug the account object
console.log('🔍 Appwrite account object:', account);
console.log('🔍 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(account)));
console.log('🔍 createEmailSession method:', typeof account.createEmailSession);

export { client };

// Helper function to check if we're using Appwrite
export const isAppwriteDeployment = () => {
    return process.env.REACT_APP_API_URL?.includes('appwrite.io') || false;
};

// Appwrite function execution helper using direct HTTP calls
export const executeFunction = async (functionId, requestData = {}) => {
    try {
        console.log('🚀 Starting Appwrite function execution (HTTP method)...');
        console.log('Function ID:', functionId);
        console.log('Request data:', requestData);
        
        // Format the request to match your Appwrite backend expectations
        const payload = {
            method: requestData.method || 'GET',
            path: requestData.path || '/',
            headers: requestData.headers || {},
            body: requestData.body ? JSON.stringify(requestData.body) : undefined
        };

        console.log('📦 Executing Appwrite function with payload:', payload);

        // Use direct fetch instead of Appwrite SDK to avoid CORS issues
        const response = await fetch(`${APPWRITE_ENDPOINT}/functions/${functionId}/executions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
                'X-Appwrite-Response-Format': '1.4.0'
            },
            body: JSON.stringify({
                data: JSON.stringify(payload),
                async: false
            })
        });

        console.log('📥 HTTP Response status:', response.status);
        console.log('📥 HTTP Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('📥 Appwrite execution result:', result);

        // Parse the response body if it exists
        if (result.responseBody) {
            try {
                const parsed = JSON.parse(result.responseBody);
                console.log('✅ Parsed response:', parsed);
                return parsed;
            } catch (e) {
                console.log('⚠️ Failed to parse response, returning raw:', result.responseBody);
                return result.responseBody;
            }
        }

        return result;
    } catch (error) {
        console.error('❌ Appwrite function execution error:', error);
        console.error('Error details:', error.message);
        
        // If it's a CORS or network error, provide helpful message
        if (error.message?.includes('Failed to fetch') || error.message?.includes('CORS')) {
            console.error('💡 This might be a CORS issue. Make sure localhost:3000 is added to Appwrite platforms.');
        }
        
        throw error;
    }
};
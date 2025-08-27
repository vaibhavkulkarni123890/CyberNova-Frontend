// Test Appwrite connection
export const testAppwriteConnection = async () => {
    const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;
    const FUNCTION_ID = process.env.REACT_APP_APPWRITE_FUNCTION_ID;

    console.log('🧪 Testing Appwrite connection...');
    console.log('Endpoint:', APPWRITE_ENDPOINT);
    console.log('Project ID:', APPWRITE_PROJECT_ID);
    console.log('Function ID:', FUNCTION_ID);

    try {
        // Test 1: Simple function execution
        const response = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
            },
            body: JSON.stringify({
                data: JSON.stringify({
                    method: 'GET',
                    path: '/api/dashboard/stats',
                    headers: {},
                    body: undefined
                }),
                async: false
            })
        });

        console.log('✅ Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Test successful:', result);
            return { success: true, result };
        } else {
            const error = await response.text();
            console.error('❌ Test failed:', error);
            return { success: false, error };
        }
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return { success: false, error: error.message };
    }
};

// Add this to window for easy testing in console
if (typeof window !== 'undefined') {
    window.testAppwrite = testAppwriteConnection;
}
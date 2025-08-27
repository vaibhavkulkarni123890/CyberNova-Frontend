// Direct Appwrite function call without SDK
export const callAppwriteFunction = async (functionId, payload) => {
    const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT;
    const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID;

    console.log('🚀 Direct Appwrite call...');
    console.log('Function ID:', functionId);
    console.log('Payload:', payload);

    try {
        // Method 1: Try with minimal headers
        const response = await fetch(`${APPWRITE_ENDPOINT}/functions/${functionId}/executions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': APPWRITE_PROJECT_ID,
            },
            body: JSON.stringify({
                data: JSON.stringify(payload)
            })
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', [...response.headers.entries()]);

        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);

        if (response.ok) {
            try {
                const result = JSON.parse(responseText);
                console.log('✅ Parsed result:', result);
                
                // Try to parse the responseBody if it exists
                if (result.responseBody) {
                    try {
                        const parsedBody = JSON.parse(result.responseBody);
                        return parsedBody;
                    } catch (e) {
                        return result.responseBody;
                    }
                }
                
                return result;
            } catch (e) {
                console.log('⚠️ Could not parse JSON, returning raw text');
                return responseText;
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
    } catch (error) {
        console.error('❌ Direct call failed:', error);
        throw error;
    }
};

// Test function for browser console
export const testDirectCall = async () => {
    const functionId = process.env.REACT_APP_APPWRITE_FUNCTION_ID;
    
    try {
        const result = await callAppwriteFunction(functionId, {
            method: 'POST',
            path: '/api/waitlist',
            headers: {},
            body: JSON.stringify({ email: 'test@example.com' })
        });
        
        console.log('✅ Test successful:', result);
        return result;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return error;
    }
};

// Add to window for testing
if (typeof window !== 'undefined') {
    window.testDirectCall = testDirectCall;
}
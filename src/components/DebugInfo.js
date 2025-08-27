import React from 'react';

const DebugInfo = () => {
  const envVars = {
    REACT_APP_APPWRITE_PROJECT_ID: process.env.REACT_APP_APPWRITE_PROJECT_ID,
    REACT_APP_APPWRITE_FUNCTION_ID: process.env.REACT_APP_APPWRITE_FUNCTION_ID,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    REACT_APP_APPWRITE_ENDPOINT: process.env.REACT_APP_APPWRITE_ENDPOINT,
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Debug Info</h4>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
    </div>
  );
};

export default DebugInfo;
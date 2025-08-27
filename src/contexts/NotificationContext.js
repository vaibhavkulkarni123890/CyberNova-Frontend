import React, { createContext, useContext, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
// import io from 'socket.io-client'; // Disabled for now

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8081';

  useEffect(() => {
    console.log('WebSocket enabled - connecting to backend');
    
    // Simulate some demo notifications
    setTimeout(() => {
      showNotification('Welcome to CyberNova AI Security Scanner!', 'info');
    }, 2000);

    // For now, we'll use simple notifications without WebSocket
    // The backend API calls will handle real-time updates
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const showNotification = (message, severity = 'info', duration = 6000) => {
    const id = Date.now() + Math.random(); // Ensure unique IDs
    const notification = {
      id,
      message,
      severity,
      duration,
      open: true,
    };
    
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      hideNotification(id);
    }, duration);
  };

  const hideNotification = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, open: false } : notif
      )
    );
  };

  const value = {
    showNotification,
    hideNotification,
    socket,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          autoHideDuration={notification.duration}
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => hideNotification(notification.id)} 
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};
import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Security,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const isLandingPage = location.pathname === '/';

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: isLandingPage ? 'rgba(255, 255, 255, 0.95)' : 'primary.main',
        backdropFilter: isLandingPage ? 'blur(10px)' : 'none',
        boxShadow: isLandingPage ? '0 2px 10px rgba(0,0,0,0.1)' : undefined,
      }}
    >
      <Toolbar>
        <Security 
          sx={{ 
            mr: 2, 
            color: isLandingPage ? 'primary.main' : 'white' 
          }} 
        />
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700,
            color: isLandingPage ? 'primary.main' : 'white',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          CyberGuard AI
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color={isLandingPage ? 'primary' : 'inherit'}
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
            >
              {user ? (
                [
                  <MenuItem key="dashboard" onClick={() => { navigate('/dashboard'); handleMobileMenuClose(); }}>
                    Dashboard
                  </MenuItem>,
                  <MenuItem key="logout" onClick={handleLogout}>
                    Logout
                  </MenuItem>
                ]
              ) : (
                [
                  <MenuItem key="login" onClick={() => { navigate('/login'); handleMobileMenuClose(); }}>
                    Login
                  </MenuItem>,
                  <MenuItem key="register" onClick={() => { navigate('/register'); handleMobileMenuClose(); }}>
                    Get Started
                  </MenuItem>
                ]
              )}
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Button
                  color={isLandingPage ? 'primary' : 'inherit'}
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <IconButton
                  size="large"
                  edge="end"
                  color={isLandingPage ? 'primary' : 'inherit'}
                  onClick={handleProfileMenuOpen}
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  color={isLandingPage ? 'primary' : 'inherit'}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  variant={isLandingPage ? 'contained' : 'outlined'}
                  color={isLandingPage ? 'primary' : 'inherit'}
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
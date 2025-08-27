import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import {
  Box, Container, Grid, Card, CardContent, Typography, Chip, Stack, Divider,
  IconButton, Tooltip, Button, Tabs, Tab, TextField, InputAdornment,
  LinearProgress, Snackbar, Alert, Drawer, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Badge, List, ListItem, ListItemText,
  useTheme, useMediaQuery, Collapse
} from '@mui/material'
import {
  Security, Warning, CheckCircle, Error as ErrorIcon, Refresh, TrendingUp, TrendingDown,
  Settings, Save, Logout, Notifications, Shield, Scanner, Computer, NetworkCheck, BugReport,
  Menu as MenuIcon, ExpandMore, ExpandLess
} from '@mui/icons-material'
import { nanoid } from 'nanoid';
import './styles1.css';

// Use Appwrite Function URL from environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cloud.appwrite.io/v1/functions/68ae7be50031a1980000/executions'

// Appwrite Function execution helper
const executeAppwriteFunction = async (data = {}) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': process.env.REACT_APP_APPWRITE_PROJECT_ID
      },
      body: JSON.stringify({
        data: JSON.stringify(data)
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return JSON.parse(result.responseBody || '{}')
  } catch (error) {
    console.error('Appwrite function execution error:', error)
    throw error
  }
}

const fmtDT = (x) => new Date(x).toLocaleString()

const sevColor = (s) => ({
  critical: '#ef5350',
  high: '#ff9800',
  medium: '#03a9f4',
  low: '#66bb6a',
}[String(s || '').toLowerCase()] || '#90a4ae')

export default function RealDashboard() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  
  const { user: authUser, logout, loading: authLoading } = useAuth()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [scanData, setScanData] = useState(null)
  const [scanStatus, setScanStatus] = useState('idle')
  const [notifications, setNotifications] = useState([])

  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ q: '', severity: 'all' })
  const [autoScan, setAutoScan] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [threatDetailsOpen, setThreatDetailsOpen] = useState(false)
  const [selectedThreat, setSelectedThreat] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCards, setExpandedCards] = useState({})
  const wsRef = useRef(null)

  // Check authentication on mount
  useEffect(() => {
    if (authLoading) return // Wait for auth to load
    
    if (!authUser) {
      console.log('No authenticated user, redirecting to login...')
      navigate('/login')
      return
    }

    // Set user from Appwrite auth
    setUser({
      id: authUser.$id,
      full_name: authUser.name,
      email: authUser.email,
      ...authUser
    })
  }, [authUser, authLoading, navigate])

  // Frontend deduplication function
  const deduplicateAlerts = (alertsArray) => {
    const uniqueAlerts = new Map()
    
    alertsArray.forEach(alert => {
      // Create a unique key based on threat type and core details
      let uniqueKey = ''
      
      if (alert.title?.includes('Suspicious Process:')) {
        // For processes, dedupe by process name
        const processName = alert.title.replace('Suspicious Process: ', '')
        uniqueKey = `process_${processName}_${alert.severity}`
      } else if (alert.title?.includes('Risky Port:')) {
        // For ports, dedupe by port number
        const portMatch = alert.title.match(/Port (\d+)/)
        const port = portMatch ? portMatch[1] : 'unknown'
        uniqueKey = `port_${port}_${alert.severity}`
      } else if (alert.title?.includes('Network Activity')) {
        // For network, dedupe by activity type
        uniqueKey = `network_${alert.severity}`
      } else {
        // Generic deduplication by title and severity
        uniqueKey = `${alert.title}_${alert.severity}`
      }
      
      // Keep the most recent alert for each unique key
      if (!uniqueAlerts.has(uniqueKey) || 
          new Date(alert.timestamp) > new Date(uniqueAlerts.get(uniqueKey).timestamp)) {
        uniqueAlerts.set(uniqueKey, alert)
      }
    })
    
    return Array.from(uniqueAlerts.values())
  }

  const fetchAll = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError('')

      // Fetch dashboard data from Appwrite function
      const dashboardData = await executeAppwriteFunction({
        action: 'getDashboardData',
        userId: user.id
      })

      // Set the data from backend
      setStats(dashboardData.stats || {
        totalThreats: 0,
        activeAlerts: 0,
        riskScore: 0,
        systemHealth: 100,
        lastScanTime: null
      })

      // Apply frontend deduplication to alerts
      const alerts = dashboardData.alerts || []
      const deduplicatedAlerts = deduplicateAlerts(alerts)
      setAlerts(deduplicatedAlerts)
      
      setScanData(dashboardData.scanData || null)
    } catch (e) {
      console.error('Dashboard data fetch error:', e)
      if (e.response?.status === 401) {
        // Handle authentication error
        await logout()
        navigate('/login')
      } else {
        setError('Unable to connect to security services. Please check your connection.')
        setStats({
          totalThreats: 0,
          activeAlerts: 0,
          riskScore: 0,
          systemHealth: 100,
          lastScanTime: new Date().toISOString()
        })
        setAlerts([])
      }
    } finally {
      setLoading(false)
    }
  }, [logout, navigate, user])

  const fetchThreatDetails = async (threatId) => {
    if (!user) return
    
    try {
      // Fetch threat details via Appwrite function
      const threatDetails = await executeAppwriteFunction({
        action: 'getThreatDetails',
        userId: user.id,
        threatId: threatId
      })
      
      setSelectedThreat(threatDetails)
      setThreatDetailsOpen(true)
    } catch (error) {
      console.error('Failed to fetch threat details:', error)
      setError('Failed to load threat details. Please try again.')
    }
  }

  const startManualScan = async () => {
    if (!user) return
    
    try {
      setScanStatus('scanning')

      // Start scan via Appwrite function
      const scanResult = await executeAppwriteFunction({
        action: 'startScan',
        userId: user.id,
        scanType: 'manual'
      })

      setScanStatus('completed')

      // Show success notification
      setNotifications(prev => [...prev, {
        id: nanoid(),
        message: `Security scan initiated successfully`,
        severity: 'info',
        timestamp: new Date()
      }])

      // Refresh data after scan completes
      setTimeout(() => {
        fetchAll()
      }, 3000)

    } catch (error) {
      console.error('Failed to start scan:', error)
      setScanStatus('error')
      setError('Failed to initiate security scan. Please try again.')
    }
  }

  const resetScanData = async () => {
    if (!user) return
    
    try {
      // Reset user scan data via Appwrite function
      await executeAppwriteFunction({
        action: 'resetScanData',
        userId: user.id
      })
      
      setNotifications(prev => [...prev, {
        id: nanoid(),
        message: 'Scan data reset successfully',
        severity: 'success',
        timestamp: new Date()
      }])

      // Refresh data
      fetchAll()

    } catch (error) {
      console.error('Failed to reset scan data:', error)
      setError('Failed to reset scan data. Please try again.')
    }
  }

  const toggleCardExpansion = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  useEffect(() => {
    if (user) {
      fetchAll()
      const intervalId = setInterval(fetchAll, 30000) // Refresh every 30 seconds
      return () => clearInterval(intervalId)
    }
  }, [user, fetchAll])

  // Real-time updates using Appwrite Realtime
  useEffect(() => {
    if (!autoScan || !user) return

    // Use Appwrite Realtime for real-time updates
    // This would connect to your Appwrite database for real-time threat updates
    const setupRealtimeConnection = async () => {
      try {
        setWsConnected(true)
        console.log('✅ Real-time monitoring enabled via Appwrite')
        
        // Set up periodic refresh for real-time feel
        const refreshInterval = setInterval(() => {
          fetchAll()
        }, 30000) // Refresh every 30 seconds

        return () => {
          clearInterval(refreshInterval)
          setWsConnected(false)
        }
      } catch (error) {
        console.error('Failed to setup real-time connection:', error)
        setWsConnected(false)
      }
    }

    const cleanup = setupRealtimeConnection()
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [autoScan, user, fetchAll])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filter.severity === 'all' || alert.severity === filter.severity
    const queryMatch = !filter.q ||
      alert.title.toLowerCase().includes(filter.q.toLowerCase()) ||
      alert.description.toLowerCase().includes(filter.q.toLowerCase())
    return severityMatch && queryMatch
  })

  // Don't render if auth is loading or user not loaded
  if (authLoading || !user) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        bgcolor: '#0b1020',
        p: { xs: 2, sm: 3 }
      }}>
        <LinearProgress sx={{ width: { xs: '100%', sm: 300 } }} />
      </Box>
    )
  }

  const StatCard = ({ label, value, icon, color, subtitle }) => (
    <Card sx={{ 
      bgcolor: 'background.paper', 
      borderRadius: { xs: 2, sm: 3 },
      height: '100%'
    }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack 
          direction={isSmallScreen ? "column" : "row"} 
          alignItems={isSmallScreen ? "flex-start" : "center"} 
          justifyContent="space-between"
          spacing={isSmallScreen ? 1 : 0}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {label}
            </Typography>
            <Typography 
              variant={isSmallScreen ? "h5" : "h4"} 
              fontWeight={700}
              sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            bgcolor: `${color}.50`, 
            p: { xs: 1, sm: 1.5 }, 
            borderRadius: 2,
            alignSelf: isSmallScreen ? "flex-end" : "center"
          }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: { xs: 24, sm: 36 } } 
            })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  // Mobile-optimized header
  const MobileHeader = () => (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Shield color="primary" sx={{ fontSize: { xs: 24, sm: 32 } }} />
        <Box>
          <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight={800}>
            CyberNova AI
          </Typography>
          {!isSmallScreen && (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Welcome back, {user.full_name}
            </Typography>
          )}
        </Box>
        {!isSmallScreen && (
          <Chip
            size="small"
            label={wsConnected ? 'LIVE' : 'OFF'}
            color={wsConnected ? 'success' : 'default'}
            icon={wsConnected ? <CheckCircle /> : <ErrorIcon />}
          />
        )}
      </Stack>
      
      {isMobile ? (
        <IconButton onClick={() => setMobileMenuOpen(true)} color="primary">
          <MenuIcon />
        </IconButton>
      ) : (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Start Manual Scan">
  <span>
    <IconButton
      onClick={startManualScan}
      color="primary"
      disabled={scanStatus === 'scanning'}
      size={isTablet ? "small" : "medium"}
    >
      <Scanner />
    </IconButton>
  </span>
</Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="primary" size={isTablet ? "small" : "medium"}>
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll} color="primary" size={isTablet ? "small" : "medium"}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton 
              onClick={() => setDrawerOpen(true)} 
              color="default" 
              size={isTablet ? "small" : "medium"}
            >
              <Settings />
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <IconButton 
              onClick={() => setProfileOpen(true)} 
              color="default" 
              size={isTablet ? "small" : "medium"}
            >
              <Avatar sx={{ 
                width: { xs: 28, sm: 32 }, 
                height: { xs: 28, sm: 32 }, 
                bgcolor: 'primary.main' 
              }}>
                {user.full_name.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  )

  // Responsive tabs
  const ResponsiveTabs = () => (
    <Tabs 
      value={tab} 
      onChange={(_, v) => setTab(v)} 
      sx={{ mb: 2 }}
      variant={isMobile ? "scrollable" : "standard"}
      scrollButtons={isMobile ? "auto" : false}
      allowScrollButtonsMobile={isMobile}
    >
      <Tab 
        label={isSmallScreen ? "Overview" : "System Overview"} 
        icon={<Computer sx={{ fontSize: { xs: 16, sm: 20 } }} />} 
        iconPosition={isSmallScreen ? "top" : "start"}
        sx={{ 
          minWidth: { xs: 80, sm: 120 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}
      />
      <Tab 
        label={isSmallScreen ? "Threats" : "Live Threats"} 
        icon={<Security sx={{ fontSize: { xs: 16, sm: 20 } }} />} 
        iconPosition={isSmallScreen ? "top" : "start"}
        sx={{ 
          minWidth: { xs: 80, sm: 120 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}
      />
      <Tab 
        label={isSmallScreen ? "Network" : "Network Activity"} 
        icon={<NetworkCheck sx={{ fontSize: { xs: 16, sm: 20 } }} />} 
        iconPosition={isSmallScreen ? "top" : "start"}
        sx={{ 
          minWidth: { xs: 80, sm: 120 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}
      />
      <Tab 
        label={isSmallScreen ? "Scans" : "Scan Results"} 
        icon={<BugReport sx={{ fontSize: { xs: 16, sm: 20 } }} />} 
        iconPosition={isSmallScreen ? "top" : "start"}
        sx={{ 
          minWidth: { xs: 80, sm: 120 },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}
      />
    </Tabs>
  )

  return (
    <div className="rd-dashboard">
      <Box sx={{ 
        pt: { xs: 2, sm: 4, md: 10 }, 
        pb: { xs: 2, sm: 4, md: 6 }, 
        bgcolor: '#0b1020', 
        minHeight: '100vh', 
        color: 'rgba(255,255,255,0.9)' 
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <MobileHeader />

          {loading && <LinearProgress sx={{ mb: 2 }} />}
          
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2, 
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              🛡️ <strong>CyberNova AI Security Dashboard:</strong> Real-time threat monitoring and analysis. 
              Our advanced AI continuously scans for security vulnerabilities and suspicious activities.
            </Typography>
          </Alert>

          {scanStatus === 'scanning' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Real system scan in progress... Analyzing processes, network connections, and ports.
              </Typography>
            </Alert>
          )}
          
          {!!error && (
            <Alert sx={{ mb: 2 }} severity="warning">
              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </Typography>
            </Alert>
          )}

          {/* Responsive Stats Grid */}
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard
                label="Total Threats"
                value={stats?.totalThreats ?? 0}
                icon={<Security color="primary" />}
                color="primary"
                subtitle="All time detections"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard
                label="Active Alerts"
                value={stats?.activeAlerts ?? 0}
                icon={<Warning color="error" />}
                color="error"
                subtitle="Requires attention"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard
                label="Risk Score"
                value={`${stats?.riskScore ?? 0}/100`}
                icon={(stats?.riskScore ?? 0) > 70 ? <TrendingUp color="error" /> : <TrendingDown color="success" />}
                color={(stats?.riskScore ?? 0) > 70 ? 'error' : 'success'}
                subtitle="Current risk level"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <StatCard
                label="System Health"
                value={`${stats?.systemHealth ?? 0}%`}
                icon={<CheckCircle color="success" />}
                color="success"
                subtitle={stats?.lastScanTime ? `Last scan: ${fmtDT(stats.lastScanTime)}` : 'No recent scans'}
              />
            </Grid>
          </Grid>

          <Card sx={{ borderRadius: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <ResponsiveTabs />
              <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

              {tab === 0 && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} lg={8}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 1, 
                        opacity: 0.7,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Recent Security Events
                    </Typography>
                    <Box sx={{ 
                      maxHeight: { xs: 300, sm: 400 }, 
                      overflow: 'auto', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: { xs: 1, sm: 2 }
                    }}>
                      {filteredAlerts.slice(0, 10).map((alert, i) => (
                        <Box 
                          key={alert.id || i} 
                          sx={{ 
                            p: { xs: 1.5, sm: 2 }, 
                            borderBottom: '1px solid rgba(255,255,255,0.06)' 
                          }}
                        >
                          <Stack 
                            direction={isSmallScreen ? "column" : "row"} 
                            spacing={isSmallScreen ? 1 : 2} 
                            alignItems={isSmallScreen ? "flex-start" : "center"}
                          >
                            <Chip
                              size="small"
                              label={alert.severity?.toUpperCase()}
                              sx={{
                                bgcolor: `${sevColor(alert.severity)}33`,
                                color: sevColor(alert.severity),
                                minWidth: { xs: 60, sm: 80 },
                                fontSize: { xs: '0.6rem', sm: '0.75rem' }
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {alert.title}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  opacity: 0.7,
                                  fontSize: { xs: '0.6rem', sm: '0.75rem' }
                                }}
                              >
                                {fmtDT(alert.timestamp)} • {alert.sourceIp} • Risk: {alert.riskScore}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={alert.isBlocked ? 'RESOLVED' : 'ACTIVE'}
                              color={alert.isBlocked ? 'success' : 'warning'}
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                            />
                          </Stack>
                        </Box>
                      ))}
                      {filteredAlerts.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            No security events found. Your system appears secure!
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} lg={4}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', mb: 2 }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack 
                          direction="row" 
                          alignItems="center" 
                          justifyContent="space-between"
                          sx={{ mb: 2 }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              opacity: 0.7,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            System Information
                          </Typography>
                          {expandedCards.systemInfo ? (
                            <IconButton 
                              size="small" 
                              onClick={() => toggleCardExpansion('systemInfo')}
                              sx={{ display: { xs: 'block', md: 'none' } }}
                            >
                              <ExpandLess />
                            </IconButton>
                          ) : (
                            <IconButton 
                              size="small" 
                              onClick={() => toggleCardExpansion('systemInfo')}
                              sx={{ display: { xs: 'block', md: 'none' } }}
                            >
                              <ExpandMore />
                            </IconButton>
                          )}
                        </Stack>
                        
                        <Collapse 
                          in={expandedCards.systemInfo || !isMobile} 
                          timeout="auto" 
                          unmountOnExit
                        >
                          {scanData?.system_info ? (
                            <Stack spacing={1}>
                              <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
                                gap: { xs: 0.5, sm: 1 },
                                alignItems: 'start'
                              }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    fontWeight: 600,
                                    color: 'primary.main'
                                  }}
                                >
                                  Hostname:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {scanData.system_info.hostname}
                                </Typography>
                                
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    fontWeight: 600,
                                    color: 'primary.main'
                                  }}
                                >
                                  Platform:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {scanData.system_info.platform}
                                </Typography>
                                
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    fontWeight: 600,
                                    color: 'primary.main'
                                  }}
                                >
                                  IP Address:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {scanData.system_info.ip_address}
                                </Typography>
                                
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    fontWeight: 600,
                                    color: 'primary.main'
                                  }}
                                >
                                  Architecture:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                    wordBreak: 'break-all'
                                  }}
                                >
                                  {scanData.system_info.architecture}
                                </Typography>
                                
                                {scanData.system_info.cpu_count && (
                                  <>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                        fontWeight: 600,
                                        color: 'primary.main'
                                      }}
                                    >
                                      CPU Cores:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' }
                                      }}
                                    >
                                      {scanData.system_info.cpu_count}
                                    </Typography>
                                  </>
                                )}
                                
                                {scanData.system_info.memory_total && (
                                  <>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                        fontWeight: 600,
                                        color: 'primary.main'
                                      }}
                                    >
                                      Memory:
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.875rem' }
                                      }}
                                    >
                                      {(scanData.system_info.memory_total / (1024**3)).toFixed(1)} GB
                                    </Typography>
                                  </>
                                )}
                              </Box>
                            </Stack>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                opacity: 0.6,
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                textAlign: 'center',
                                py: 2
                              }}
                            >
                              No system information available. Run a scan to get details.
                            </Typography>
                          )}
                        </Collapse>
                      </CardContent>
                    </Card>

                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack 
                          direction="row" 
                          alignItems="center" 
                          justifyContent="space-between"
                          sx={{ mb: 2 }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              opacity: 0.7,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Quick Actions
                          </Typography>
                          {expandedCards.quickActions ? (
                            <IconButton 
                              size="small" 
                              onClick={() => toggleCardExpansion('quickActions')}
                              sx={{ display: { xs: 'block', md: 'none' } }}
                            >
                              <ExpandLess />
                            </IconButton>
                          ) : (
                            <IconButton 
                              size="small" 
                              onClick={() => toggleCardExpansion('quickActions')}
                              sx={{ display: { xs: 'block', md: 'none' } }}
                            >
                              <ExpandMore />
                            </IconButton>
                          )}
                        </Stack>
                        
                        <Collapse 
                          in={expandedCards.quickActions || !isMobile} 
                          timeout="auto" 
                          unmountOnExit
                        >
                          <Stack spacing={2}>
                            <Button
                              variant="contained"
                              startIcon={<Scanner />}
                              onClick={startManualScan}
                              disabled={scanStatus === 'scanning'}
                              fullWidth
                              size={isSmallScreen ? "small" : "medium"}
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1.5 }
                              }}
                            >
                              {scanStatus === 'scanning' ? 'Scanning...' : 'Start Full Scan'}
                            </Button>
                            
                            <Button
                              variant="outlined"
                              onClick={resetScanData}
                              fullWidth
                              size={isSmallScreen ? "small" : "medium"}
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                py: { xs: 1, sm: 1.5 }
                              }}
                            >
                              Reset Scan Data
                            </Button>
                            
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={autoScan}
                                  onChange={(e) => setAutoScan(e.target.checked)}
                                  size={isSmallScreen ? "small" : "medium"}
                                />
                              }
                              label={
                                <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  Auto-scan (every 30s)
                                </Typography>
                              }
                              sx={{ 
                                m: 0,
                                '& .MuiFormControlLabel-label': {
                                  fontSize: { xs: '0.7rem', sm: '0.875rem' }
                                }
                              }}
                            />
                            
                            {wsConnected && (
                              <Chip
                                size="small"
                                label="Real-time Monitoring Active"
                                color="success"
                                icon={<CheckCircle />}
                                sx={{ 
                                  fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 32 }
                                }}
                              />
                            )}
                          </Stack>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {tab === 1 && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12}>
                    <Stack 
                      direction={isSmallScreen ? "column" : "row"} 
                      spacing={2} 
                      sx={{ mb: 2 }}
                    >
                      <TextField
                        size="small"
                        placeholder="Search threats..."
                        value={filter.q}
                        onChange={(e) => setFilter(prev => ({ ...prev, q: e.target.value }))}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">🔍</InputAdornment>
                        }}
                        sx={{ 
                          flex: 1,
                          '& .MuiInputBase-input': {
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }
                        }}
                      />
                      <TextField
                        select
                        size="small"
                        value={filter.severity}
                        onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                        SelectProps={{ native: true }}
                        sx={{ 
                          minWidth: { xs: '100%', sm: 150 },
                          '& .MuiInputBase-input': {
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }
                        }}
                      >
                        <option value="all">All Severities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </TextField>
                    </Stack>

                    {/* Mobile-optimized threat list */}
                    {isMobile ? (
                      <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                        {filteredAlerts.map((alert, i) => (
                          <Card 
                            key={alert.id || i}
                            sx={{ 
                              mb: 1, 
                              bgcolor: 'rgba(255,255,255,0.02)',
                              cursor: 'pointer'
                            }}
                            onClick={() => fetchThreatDetails(alert.id)}
                          >
                            <CardContent sx={{ p: 1.5 }}>
                              <Stack spacing={1}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Chip
                                    size="small"
                                    label={alert.severity?.toUpperCase()}
                                    sx={{
                                      bgcolor: `${sevColor(alert.severity)}33`,
                                      color: sevColor(alert.severity),
                                      fontSize: '0.6rem'
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    label={alert.isBlocked ? 'RESOLVED' : 'ACTIVE'}
                                    color={alert.isBlocked ? 'success' : 'warning'}
                                    variant="outlined"
                                    sx={{ fontSize: '0.6rem' }}
                                  />
                                </Stack>
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                                  {alert.title}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                  {fmtDT(alert.timestamp)} • Risk: {alert.riskScore}
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredAlerts.length === 0 && (
                          <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                            <Typography sx={{ fontSize: '0.8rem' }}>
                              No threats match your filters.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      /* Desktop table view */
                      <Box sx={{ 
                        maxHeight: 500, 
                        overflow: 'auto', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: 2 
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Time</th>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Threat Type</th>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Severity</th>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Source</th>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Risk Score</th>
                              <th style={{ textAlign: 'left', padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAlerts.map((alert, i) => (
                              <tr 
                                key={alert.id || i} 
                                style={{ 
                                  borderTop: '1px solid rgba(255,255,255,0.06)',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => {
                                  const tr = e.target.closest('tr');
                                  if (tr) tr.style.backgroundColor = 'transparent';
                                }}
                                onClick={() => fetchThreatDetails(alert.id)}
                              >
                                <td style={{ padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                  {fmtDT(alert.timestamp)}
                                </td>
                                <td style={{ padding: 12 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                      {alert.title}
                                    </Typography>
                                    {alert.resolution && (
                                      <Tooltip title="Click for resolution steps">
                                        <Chip size="small" label="Fix Available" color="info" variant="outlined" />
                                      </Tooltip>
                                    )}
                                  </Box>
                                </td>
                                <td style={{ padding: 12 }}>
                                  <Chip
                                    size="small"
                                    label={alert.severity?.toUpperCase()}
                                    sx={{
                                      bgcolor: `${sevColor(alert.severity)}33`,
                                      color: sevColor(alert.severity),
                                      fontSize: isTablet ? '0.6rem' : '0.75rem'
                                    }}
                                  />
                                </td>
                                <td style={{ padding: 12, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
                                  {alert.sourceIp}
                                </td>
                                <td style={{ 
                                  padding: 12, 
                                  fontWeight: 700,
                                  fontSize: isTablet ? '0.75rem' : '0.875rem'
                                }}>
                                  {alert.riskScore}
                                </td>
                                <td style={{ padding: 12 }}>
                                  <Chip
                                    size="small"
                                    label={alert.isBlocked ? 'RESOLVED' : 'ACTIVE'}
                                    color={alert.isBlocked ? 'success' : 'warning'}
                                    variant="outlined"
                                    sx={{ fontSize: isTablet ? '0.6rem' : '0.75rem' }}
                                  />
                                </td>
                              </tr>
                            ))}
                            {filteredAlerts.length === 0 && (
                              <tr>
                                <td colSpan={6} style={{ 
                                  padding: 16, 
                                  textAlign: 'center', 
                                  opacity: 0.6,
                                  fontSize: isTablet ? '0.75rem' : '0.875rem'
                                }}>
                                  No threats match your filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}

              {tab === 2 && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        opacity: 0.7,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      🌐 What Your Computer Is Doing Online
                    </Typography>
                    <Box sx={{ maxHeight: { xs: 400, sm: 600 }, overflow: 'auto' }}>
                      {scanData?.network_connections?.length > 0 ? (
                        scanData.network_connections.map((conn, i) => (
                          <Card key={i} sx={{
                            mb: 2,
                            bgcolor: conn.threat_level === 'critical' ? 'rgba(244,67,54,0.1)' : 'rgba(255,255,255,0.03)',
                            border: conn.threat_level === 'critical' ? '1px solid rgba(244,67,54,0.3)' : '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                              <Stack spacing={2}>
                                {/* Header */}
                                <Stack 
                                  direction={isSmallScreen ? "column" : "row"} 
                                  spacing={2} 
                                  alignItems={isSmallScreen ? "flex-start" : "center"}
                                >
                                  <Chip
                                    size="small"
                                    label={conn.threat_level?.toUpperCase()}
                                    color={conn.threat_level === 'critical' ? 'error' : 
                                           conn.threat_level === 'high' ? 'error' : 
                                           conn.threat_level === 'medium' ? 'warning' : 'success'}
                                    sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                                  />
                                  <Typography 
                                    variant={isSmallScreen ? "body1" : "h6"} 
                                    fontWeight={600}
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}
                                  >
                                    {conn.activity_name || conn.activity_description || `Connection to ${conn.hostname || conn.website}`}
                                  </Typography>
                                  {/* Expand/Collapse button for mobile */}
                                  {isMobile && (conn.threat_level === 'critical' || conn.threat_level === 'high') && (
                                    <IconButton
                                      onClick={() => toggleCardExpansion(`conn-${i}`)}
                                      size="small"
                                      sx={{ alignSelf: 'flex-end' }}
                                    >
                                      {expandedCards[`conn-${i}`] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                  )}
                                </Stack>

                                {/* Basic Connection Info */}
                                <Box sx={{ 
                                  p: { xs: 1.5, sm: 2 }, 
                                  bgcolor: 'rgba(255,255,255,0.05)', 
                                  borderRadius: 1 
                                }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>🌐 Website/Service:</strong> {conn.hostname} ({conn.remote_ip}:{conn.remote_port})
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>💻 Process:</strong> {conn.process_name} (PID: {conn.pid})
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>📊 Status:</strong> {conn.status} | <strong>🕒 Detected:</strong> {new Date(conn.timestamp).toLocaleTimeString()}
                                  </Typography>
                                  {conn.process_exe && (
                                    <Typography 
                                      variant="body2"
                                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                      <strong>🔍 Executable:</strong> {conn.process_exe}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Threat Analysis for Critical/High threats - Collapsible on mobile */}
                                {(conn.threat_level === 'critical' || conn.threat_level === 'high') && conn.description && (
                                  <Collapse in={!isMobile || expandedCards[`conn-${i}`]} timeout="auto" unmountOnExit>
                                    <Box>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'error.main', 
                                          fontWeight: 600, 
                                          fontSize: { xs: '0.9rem', sm: '1.1em' },
                                          mb: 2
                                        }}
                                      >
                                        🚨 CRITICAL THREAT DETECTED
                                      </Typography>

                                      <Box sx={{ 
                                        p: { xs: 1.5, sm: 2 }, 
                                        bgcolor: 'rgba(244,67,54,0.15)', 
                                        borderRadius: 1, 
                                        border: '1px solid rgba(244,67,54,0.4)',
                                        mb: 2
                                      }}>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mb: 2, 
                                            fontWeight: 600, 
                                            color: 'error.main',
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          📋 THREAT ANALYSIS:
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mb: 1,
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          <strong>What's happening:</strong> {conn.description}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mb: 1,
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          <strong>How it occurred:</strong> {conn.how_occurred}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mb: 1,
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          <strong>Why it's dangerous:</strong> {conn.why_dangerous}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            mb: 2, 
                                            color: 'error.main', 
                                            fontWeight: 600,
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          <strong>⚠️ Immediate impact:</strong> {conn.immediate_impact}
                                        </Typography>
                                      </Box>

                                      {/* Additional threat details sections with responsive styling */}
                                      {conn.threat_details && Object.keys(conn.threat_details).length > 0 && (
                                        <Box sx={{ 
                                          p: { xs: 1.5, sm: 2 }, 
                                          bgcolor: 'rgba(255,193,7,0.1)', 
                                          borderRadius: 1, 
                                          border: '1px solid rgba(255,193,7,0.3)' 
                                        }}>
                                          {/* Render threat details with responsive text sizing */}
                                          {conn.threat_details.data_being_stolen && (
                                            <Box sx={{ mb: 2 }}>
                                              <Typography 
                                                variant="body2" 
                                                fontWeight={600} 
                                                sx={{ 
                                                  mb: 1, 
                                                  color: 'error.main',
                                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                                }}
                                              >
                                                📊 DATA BEING STOLEN RIGHT NOW:
                                              </Typography>
                                              {conn.threat_details.data_being_stolen.map((item, idx) => (
                                                <Typography 
                                                  key={idx} 
                                                  variant="body2" 
                                                  sx={{ 
                                                    ml: 2, 
                                                    mb: 0.5, 
                                                    color: 'error.main',
                                                    fontSize: { xs: '0.7rem', sm: '0.8rem' }
                                                  }}
                                                >
                                                  • {item}
                                                </Typography>
                                              ))}
                                            </Box>
                                          )}
                                          
                                          {/* Other threat detail sections with similar responsive styling */}
                                          {/* Add similar responsive patterns for other sections as needed */}
                                        </Box>
                                      )}
                                    </Box>
                                  </Collapse>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            No network connections detected. Run a scan to monitor network activity.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Similar responsive treatment for malware processes section */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 2, 
                        opacity: 0.7,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      🔍 Malware & Process Threat Analysis
                    </Typography>
                    <Box sx={{ maxHeight: { xs: 400, sm: 600 }, overflow: 'auto' }}>
                      {scanData?.suspicious_processes?.length > 0 ? (
                        scanData.suspicious_processes.map((proc, i) => (
                          <Card key={i} sx={{
                            mb: 2,
                            bgcolor: proc.threat_level === 'critical' ? 'rgba(244,67,54,0.1)' : 'rgba(255,255,255,0.03)',
                            border: proc.threat_level === 'critical' ? '1px solid rgba(244,67,54,0.3)' : '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                              <Stack spacing={2}>
                                {/* Header with responsive layout */}
                                <Stack 
                                  direction={isSmallScreen ? "column" : "row"} 
                                  spacing={2} 
                                  alignItems={isSmallScreen ? "flex-start" : "center"}
                                >
                                  <Chip
                                    size="small"
                                    label={proc.threat_level?.toUpperCase()}
                                    color={proc.threat_level === 'critical' ? 'error' : 
                                           proc.threat_level === 'high' ? 'error' : 
                                           proc.threat_level === 'medium' ? 'warning' : 'success'}
                                    sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                                  />
                                  <Typography 
                                    variant={isSmallScreen ? "body1" : "h6"} 
                                    fontWeight={600}
                                    sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}
                                  >
                                    🚨 {proc.name} (PID: {proc.pid})
                                  </Typography>
                                  {/* Expand/Collapse for mobile critical threats */}
                                  {isMobile && (proc.threat_level === 'critical' || proc.threat_level === 'high') && (
                                    <IconButton
                                      onClick={() => toggleCardExpansion(`proc-${i}`)}
                                      size="small"
                                      sx={{ alignSelf: 'flex-end' }}
                                    >
                                      {expandedCards[`proc-${i}`] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                  )}
                                </Stack>

                                {/* Basic Process Info */}
                                <Box sx={{ 
                                  p: { xs: 1.5, sm: 2 }, 
                                  bgcolor: 'rgba(255,255,255,0.05)', 
                                  borderRadius: 1 
                                }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>⚡ Resource Usage:</strong> CPU: {proc.cpu_percent?.toFixed(1)}% • Memory: {proc.memory_percent?.toFixed(1)}%
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>📍 Location:</strong> {proc.exe_path}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      mb: 1,
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    <strong>👤 Running as:</strong> {proc.username} | <strong>🕒 Started:</strong> {proc.first_seen}
                                  </Typography>
                                  {proc.cmdline && (
                                    <Typography 
                                      variant="body2"
                                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                      <strong>⌨️ Command:</strong> {proc.cmdline}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Threat Analysis - Collapsible on mobile */}
                                {(proc.threat_level === 'critical' || proc.threat_level === 'high') && proc.description && (
                                  <Collapse in={!isMobile || expandedCards[`proc-${i}`]} timeout="auto" unmountOnExit>
                                    {/* Similar responsive pattern for process threats */}
                                    <Box>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          color: 'error.main', 
                                          fontWeight: 600, 
                                          fontSize: { xs: '0.9rem', sm: '1.1em' },
                                          mb: 2
                                        }}
                                      >
                                        🚨 MALWARE DETECTED
                                      </Typography>
                                      {/* Add remaining threat analysis content with responsive styling */}
                                    </Box>
                                  </Collapse>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            No malicious processes detected. Run a scan to check for threats.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              )}

              {tab === 3 && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} md={8}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 1, 
                        opacity: 0.7,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Security Recommendations
                    </Typography>
                    <Box sx={{ maxHeight: { xs: 300, sm: 400 }, overflow: 'auto' }}>
                      {scanData?.recommendations?.length > 0 ? (
                        <List sx={{ p: 0 }}>
                          {scanData.recommendations.map((rec, i) => (
                            <ListItem 
                              key={i} 
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.02)', 
                                mb: 1, 
                                borderRadius: 1,
                                p: { xs: 1, sm: 2 }
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Stack 
                                    direction={isSmallScreen ? "column" : "row"} 
                                    spacing={1} 
                                    alignItems={isSmallScreen ? "flex-start" : "center"}
                                  >
                                    <Chip
                                      size="small"
                                      label={rec.priority?.toUpperCase()}
                                      color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                                      sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
                                    />
                                    <Typography 
                                      variant="body2" 
                                      fontWeight={600}
                                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                    >
                                      {rec.title}
                                    </Typography>
                                  </Stack>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mb: 1,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      {rec.description}
                                    </Typography>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 500, 
                                        color: 'primary.main',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      Action: {rec.action}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                          <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            No recommendations available. Run a scan to get security insights.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mb: 1, 
                        opacity: 0.7,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      🔍 Risky Ports
                    </Typography>
                    <Box sx={{ 
                      maxHeight: { xs: 300, sm: 400 }, 
                      overflow: 'auto', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: { xs: 1, sm: 2 }
                    }}>
                      {scanData?.risky_ports?.length > 0 ? (
                        scanData.risky_ports.map((port, i) => (
                          <Box 
                            key={i} 
                            sx={{ 
                              p: { xs: 1.5, sm: 2 }, 
                              borderBottom: '1px solid rgba(255,255,255,0.06)'
                            }}
                            >
                              <Stack 
                                direction={isSmallScreen ? "column" : "row"} 
                                spacing={isSmallScreen ? 1 : 2} 
                                alignItems={isSmallScreen ? "flex-start" : "center"}
                              >
                                <Chip
                                  size="small"
                                  label={port.threat_level?.toUpperCase()}
                                  sx={{
                                    bgcolor: `${sevColor(port.threat_level)}33`,
                                    color: sevColor(port.threat_level),
                                    fontSize: { xs: '0.6rem', sm: '0.75rem' }
                                  }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={600}
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                  >
                                    Port {port.port} ({port.service})
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      opacity: 0.7,
                                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                                    }}
                                  >
                                    {port.reason}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))
                        ) : (
                          <Box sx={{ p: 3, textAlign: 'center', opacity: 0.6 }}>
                            <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              No risky ports detected.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Container>
  
          {/* Mobile Menu Drawer */}
          <Drawer 
            anchor="right" 
            open={mobileMenuOpen} 
            onClose={() => setMobileMenuOpen(false)}
            PaperProps={{
              sx: { 
                width: { xs: 280, sm: 320 },
                bgcolor: 'background.paper'
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {user.full_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {user.full_name}
                    </Typography>
                    <Chip
                      size="small"
                      label={wsConnected ? 'LIVE' : 'OFFLINE'}
                      color={wsConnected ? 'success' : 'default'}
                      icon={wsConnected ? <CheckCircle /> : <ErrorIcon />}
                    />
                  </Box>
                </Stack>
                
                <Button
                  variant="contained"
                  startIcon={<Scanner />}
                  onClick={() => {
                    startManualScan();
                    setMobileMenuOpen(false);
                  }}
                  disabled={scanStatus === 'scanning'}
                  fullWidth
                >
                  {scanStatus === 'scanning' ? 'Scanning...' : 'Start Scan'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Notifications />}
                  fullWidth
                  endIcon={notifications.length > 0 && (
                    <Badge badgeContent={notifications.length} color="error" />
                  )}
                >
                  Notifications
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => {
                    fetchAll();
                    setMobileMenuOpen(false);
                  }}
                  fullWidth
                >
                  Refresh Data
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => {
                    setDrawerOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  fullWidth
                >
                  Settings
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  color="error"
                  fullWidth
                >
                  Logout
                </Button>
              </Stack>
            </Box>
          </Drawer>
  
          {/* Profile Dialog */}
          <Dialog 
            open={profileOpen} 
            onClose={() => setProfileOpen(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
              sx: { 
                m: { xs: 1, sm: 2 },
                width: { xs: 'calc(100vw - 16px)', sm: 'auto' }
              }
            }}
          >
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {user.full_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {user.full_name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField 
                  label="Full Name" 
                  value={user.full_name} 
                  disabled 
                  fullWidth 
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField 
                  label="Email" 
                  value={user.email} 
                  disabled 
                  fullWidth 
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField 
                  label="Company" 
                  value={user.company || 'Not specified'} 
                  disabled 
                  fullWidth 
                  size={isSmallScreen ? "small" : "medium"}
                />
                <TextField
                  label="Member Since"
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled
                  fullWidth
                  size={isSmallScreen ? "small" : "medium"}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Button onClick={() => setProfileOpen(false)}>Close</Button>
              <Button 
                onClick={handleLogout} 
                color="error" 
                startIcon={<Logout />}
                size={isSmallScreen ? "small" : "medium"}
              >
                Logout
              </Button>
            </DialogActions>
          </Dialog>
  
          {/* Settings Drawer */}
          <Drawer 
            anchor="right" 
            open={drawerOpen} 
            onClose={() => setDrawerOpen(false)}
            PaperProps={{
              sx: { 
                width: { xs: 300, sm: 360 },
                bgcolor: 'background.paper'
              }
            }}
          >
            <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }} role="presentation">
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
  
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoScan} 
                    onChange={(e) => setAutoScan(e.target.checked)} 
                    size={isSmallScreen ? "small" : "medium"}
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Auto-scan every 20 seconds
                  </Typography>
                }
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  opacity: 0.7,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Automatically scan your system for threats every 20 seconds and receive real-time alerts.
              </Typography>
  
              <Divider sx={{ my: 2 }} />
              
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Data Management
              </Typography>
              

              
              <Button 
                startIcon={<Refresh />} 
                variant="outlined" 
                color="warning"
                onClick={resetScanData}
                fullWidth
                sx={{ mb: 2 }}
                size={isSmallScreen ? "small" : "medium"}
              >
                Reset All Scan Data
              </Button>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2, 
                  opacity: 0.7,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Clear all scan results and threat history to start fresh.
              </Typography>
  
              <Divider sx={{ my: 2 }} />
              <Button 
                startIcon={<Save />} 
                variant="contained" 
                onClick={() => setDrawerOpen(false)}
                size={isSmallScreen ? "small" : "medium"}
              >
                Save Settings
              </Button>
            </Box>
          </Drawer>
  
          {/* Notifications */}
          {notifications.map((notification) => (
            <Snackbar
              key={notification.id}
              open={true}
              autoHideDuration={6000}
              onClose={() => dismissNotification(notification.id)}
              anchorOrigin={{ 
                vertical: 'top', 
                horizontal: isSmallScreen ? 'center' : 'right' 
              }}
              sx={{ 
                mt: { xs: 8, sm: 0 },
                '& .MuiSnackbarContent-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            >
              <Alert
                severity={notification.severity}
                onClose={() => dismissNotification(notification.id)}
                variant="filled"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '& .MuiAlert-message': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              >
                {notification.message}
              </Alert>
            </Snackbar>
          ))}
  
          {/* Threat Details Dialog */}
          <Dialog 
            open={threatDetailsOpen} 
            onClose={() => setThreatDetailsOpen(false)} 
            maxWidth="md" 
            fullWidth
            fullScreen={isSmallScreen}
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                m: { xs: 0, sm: 2 },
                width: { xs: '100vw', sm: 'auto' },
                height: { xs: '100vh', sm: 'auto' }
              }
            }}
          >
            <DialogTitle sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: selectedThreat?.severity === 'critical' ? 'error.main' : 'warning.main',
                  color: 'white'
                }}>
                  <Warning sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h6"
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    {selectedThreat?.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {selectedThreat?.type} • Risk Score: {selectedThreat?.riskScore}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              {selectedThreat && (
                <Stack spacing={3} sx={{ mt: 1 }}>
                  {/* Threat Overview */}
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          mb: 2,
                          fontSize: { xs: '1rem', sm: '1.1rem' }
                        }}
                      >
                        Threat Overview
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Severity
                          </Typography>
                          <Chip
                            label={selectedThreat.severity?.toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: `${sevColor(selectedThreat.severity)}33`,
                              color: sevColor(selectedThreat.severity),
                              mt: 0.5,
                              fontSize: { xs: '0.6rem', sm: '0.75rem' }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Detected
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {fmtDT(selectedThreat.detectedAt)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
  
                  {/* Resolution Steps */}
                  {selectedThreat.resolution && (
                    <Card sx={{ 
                      bgcolor: 'rgba(33, 150, 243, 0.05)', 
                      border: '1px solid rgba(33, 150, 243, 0.2)' 
                    }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            mb: 2, 
                            color: 'info.main',
                            fontSize: { xs: '1rem', sm: '1.1rem' }
                          }}
                        >
                          🛠️ How to Resolve This Threat
                        </Typography>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography 
                            variant="subtitle2"
                            sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                          >
                            {selectedThreat.resolution.action}
                          </Typography>
                        </Alert>
  
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            mb: 1,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Resolution Steps:
                        </Typography>
                        <List dense>
                          {selectedThreat.resolution.steps?.map((step, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemText 
                                primary={step}
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
  
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            mt: 2, 
                            mb: 1,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          Prevention:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {selectedThreat.resolution.prevention}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
  
                  {/* Technical Details */}
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          mb: 2,
                          fontSize: { xs: '1rem', sm: '1.1rem' }
                        }}
                      >
                        Technical Details
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(selectedThreat.details || {}).map(([key, value]) => (
                          <Grid item xs={12} sm={6} key={key}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}
                            >
                              {String(value)}
                            </Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </DialogContent>
            <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Button 
                onClick={() => setThreatDetailsOpen(false)}
                size={isSmallScreen ? "small" : "medium"}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
  
          {/* Error Snackbar */}
          <Snackbar 
            open={!!error} 
            autoHideDuration={4000} 
            onClose={() => setError('')}
            anchorOrigin={{ 
              vertical: 'bottom', 
              horizontal: isSmallScreen ? 'center' : 'left' 
            }}
          >
            <Alert 
              severity="warning" 
              onClose={() => setError('')}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiAlert-message': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            >
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </Alert>
          </Snackbar>
  
        </Box>
      </div>
    )
  }
  

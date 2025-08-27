/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Box, Container, Grid, Card, CardContent, Typography, Chip, Stack, Divider,
  IconButton, Tooltip as MuiTooltip, Button, Tabs, Tab, TextField, InputAdornment,
  LinearProgress, Snackbar, Alert, Drawer, Switch, FormControlLabel, MenuItem, Select,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Badge
} from '@mui/material'
import {
  Security, Warning, CheckCircle, Error as ErrorIcon, Refresh, TrendingUp, TrendingDown,
  Download, Settings, BarChart, FilterList, CloudOff, PlayArrow, Pause, Save, QueryStats,
  Logout, Person, Notifications, Shield, Analytics, Report, AutoFixHigh
} from '@mui/icons-material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts'

const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_URL || 'http://localhost:8080'

// Authentication helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fmtDT = (x) => new Date(x).toLocaleString()
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v))
const sevColor = (s) => ({
  critical: '#ef5350',
  high: '#ff9800',
  medium: '#03a9f4',
  low: '#66bb6a',
}[String(s || '').toLowerCase()] || '#90a4ae')

const toCSV = (rows) => {
  if (!rows?.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  }
  return lines.join('\n')
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [trends, setTrends] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [notifications, setNotifications] = useState([])

  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ q: '', severity: 'all' })
  const [live, setLive] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [thresholds, setThresholds] = useState({ high: 70, critical: 90 })
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef(null)

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Verify token and get user info
    axios.get(`${API_GATEWAY_URL}/api/auth/me`, { headers: getAuthHeaders() })
      .then(response => {
        setUser(response.data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        navigate('/login')
      })
  }, [navigate])

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()

      const [
        st, al, tr, an
      ] = await Promise.all([
        axios.get(`${API_GATEWAY_URL}/api/dashboard/stats`, { headers }).then(r => r.data),
        axios.get(`${API_GATEWAY_URL}/api/dashboard/alerts`, { headers }).then(r => r.data),
        axios.get(`${API_GATEWAY_URL}/api/dashboard/trends`, { headers }).then(r => r.data).catch(() => []),
        axios.get(`${API_GATEWAY_URL}/api/threats/analytics`, { headers }).then(r => r.data).catch(() => null),
      ])

      setStats(st)
      setAlerts(al)
      setTrends(tr)
      setAnalytics(an)
      setError('')
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        setError('Failed to load dashboard data.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchAll()
    const intervalId = setInterval(() => { if (!wsConnected && live) fetchAll() }, 12000)
    return () => clearInterval(intervalId)
  }, [fetchAll, wsConnected, live])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!live || !user) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const wsUrl = `ws://localhost:8080/ws/threats`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        console.log('WebSocket connected')
      }

      ws.onclose = () => {
        setWsConnected(false)
        console.log('WebSocket disconnected')
      }

      ws.onerror = () => {
        setWsConnected(false)
        console.log('WebSocket error - falling back to polling')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'threat_detected' || data.type === 'threat_update') {
            // Add new threat to alerts
            const newAlert = {
              id: `ws_${Date.now()}`,
              title: data.data.threat_type,
              severity: data.data.severity,
              sourceIp: data.data.source_ip,
              riskScore: data.data.risk_score,
              timestamp: data.data.timestamp,
              isBlocked: false,
              description: `Real-time threat detected from ${data.data.source_ip}`
            }

            setAlerts(prev => [newAlert, ...prev].slice(0, 50))

            // Show notification
            setNotifications(prev => [...prev, {
              id: Date.now(),
              message: `${data.data.severity.toUpperCase()} threat detected: ${data.data.threat_type}`,
              severity: data.data.severity === 'critical' ? 'error' : 'warning',
              timestamp: new Date()
            }])
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err)
        }
      }

      return () => {
        ws.close()
        setWsConnected(false)
      }
    } catch (err) {
      setWsConnected(false)
      console.error('WebSocket connection failed:', err)
    }
  }, [live, user])

  const filteredAlerts = useMemo(() => {
    const q = filter.q.toLowerCase()
    return (alerts || []).filter(a => {
      const sevOk = (filter.severity === 'all') || (String(a.severity || '').toLowerCase() === filter.severity)
      const qOk = !q || JSON.stringify(a).toLowerCase().includes(q)
      return sevOk && qOk
    })
  }, [alerts, filter])

  const StatCard = ({ label, value, icon, color }) => (
    <Card sx={{ bgcolor: 'background.paper', borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h4" fontWeight={700}>{value}</Typography>
          </Box>
          <Box sx={{ bgcolor: `${color}.50`, p: 1.5, borderRadius: 2 }}>{icon}</Box>
        </Stack>
      </CardContent>
    </Card>
  )

  const TrendLines = ({ data }) => (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="threats" stroke="#1976d2" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="blocked" stroke="#43a047" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )

  const SeverityPie = ({ counts }) => {
    const pie = useMemo(() => {
      const keys = Object.keys(counts || {})
      if (!keys.length) return []
      return keys.map(k => ({ name: k, value: counts[k], color: sevColor(k) }))
    }, [counts])
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip />
          <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
            {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const LiveRiskGauge = ({ value = 0 }) => (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={[{ x: 0, y: 0 }, { x: 50, y: clamp(value) }, { x: 100, y: clamp(value) }]}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef5350" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ef5350" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="x" hide />
        <YAxis domain={[0, 100]} hide />
        <Area type="monotone" dataKey="y" stroke="#ef5350" fill="url(#rg)" />
      </AreaChart>
    </ResponsiveContainer>
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const exportAlerts = () => {
    const csv = toCSV(filteredAlerts)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cybernova-alerts-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Don't render if user not loaded
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0b1020' }}>
        <LinearProgress sx={{ width: 300 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ pt: 3, pb: 6, bgcolor: '#0b1020', minHeight: '100vh', color: 'rgba(255,255,255,0.9)' }}>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Shield color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={800}>CyberNova AI</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Welcome back, {user.full_name}
              </Typography>
            </Box>
            {live && (
              <Chip
                size="small"
                label={wsConnected ? 'LIVE' : 'POLLING'}
                color={wsConnected ? 'success' : 'default'}
                icon={wsConnected ? <CheckCircle /> : <CloudOff />}
              />
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <MuiTooltip title="Notifications">
              <IconButton color="primary">
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </MuiTooltip>
            <MuiTooltip title="Refresh">
              <IconButton onClick={fetchAll} color="primary"><Refresh /></IconButton>
            </MuiTooltip>
            <MuiTooltip title="Settings">
              <IconButton onClick={() => setDrawerOpen(true)} color="default"><Settings /></IconButton>
            </MuiTooltip>
            <MuiTooltip title="Profile">
              <IconButton onClick={() => setProfileOpen(true)} color="default">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user.full_name.charAt(0)}
                </Avatar>
              </IconButton>
            </MuiTooltip>
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {!!error && (
          <Alert sx={{ mb: 2 }} icon={<CloudOff />} severity="warning">{error}</Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Total Threats"
              value={stats?.totalThreats ?? 0}
              icon={<Security color="primary" sx={{ fontSize: 36 }} />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Active Alerts"
              value={stats?.activeAlerts ?? 0}
              icon={<Warning color="error" sx={{ fontSize: 36 }} />}
              color="error"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="Risk Score"
              value={`${stats?.riskScore ?? 0}/100`}
              icon={(stats?.riskScore ?? 0) > 70 ? <TrendingUp color="error" sx={{ fontSize: 36 }} /> : <TrendingDown color="success" sx={{ fontSize: 36 }} />}
              color={(stats?.riskScore ?? 0) > 70 ? 'error' : 'success'}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              label="System Health"
              value={`${stats?.systemHealth ?? 0}%`}
              icon={<CheckCircle color="success" sx={{ fontSize: 36 }} />}
              color="success"
            />
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Overview" icon={<BarChart sx={{ mr: 1 }} />} iconPosition="start" />
              <Tab label="Live Stream" icon={<QueryStats sx={{ mr: 1 }} />} iconPosition="start" />
              <Tab label="Analytics" icon={<Analytics sx={{ mr: 1 }} />} iconPosition="start" />
              <Tab label="Reports" icon={<Report sx={{ mr: 1 }} />} iconPosition="start" />
            </Tabs>
            <Divider sx={{ mb: 3 }} />

            {tab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Threat Trends (hourly)</Typography>
                  <TrendLines data={trends} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Live Risk Gauge</Typography>
                  <LiveRiskGauge value={Number(stats?.riskScore || 0)} />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Severity Mix (24h)</Typography>
                  <SeverityPie counts={analytics?.severity_distribution?.reduce((acc, item) => {
                    acc[item.severity] = item.count
                    return acc
                  }, {}) || { low: 45, medium: 30, high: 20, critical: 5 }} />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Recent Alerts</Typography>
                    <Stack direction="row" spacing={1}>
                      <TextField size="small" placeholder="Search alerts…" value={filter.q} onChange={e => setFilter(s => ({ ...s, q: e.target.value }))} InputProps={{ startAdornment: <InputAdornment position="start">🔎</InputAdornment> }} />
                      <Select size="small" value={filter.severity} onChange={e => setFilter(s => ({ ...s, severity: e.target.value }))}>
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="critical">Critical</MenuItem>
                      </Select>
                      <Button startIcon={<Download />} variant="outlined" onClick={exportAlerts}>Export CSV</Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ maxHeight: 360, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <th style={{ textAlign: 'left', padding: 12 }}>Time</th>
                          <th style={{ textAlign: 'left', padding: 12 }}>Type</th>
                          <th style={{ textAlign: 'left', padding: 12 }}>Severity</th>
                          <th style={{ textAlign: 'left', padding: 12 }}>Risk</th>
                          <th style={{ textAlign: 'left', padding: 12 }}>Source IP</th>
                          <th style={{ textAlign: 'left', padding: 12 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlerts.map((a, i) => (
                          <tr key={a.id || i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: 12 }}>{fmtDT(a.timestamp || a.detectedAt || a.created_at || Date.now())}</td>
                            <td style={{ padding: 12 }}>{a.title || a.eventType || a.threat_type || 'Threat'}</td>
                            <td style={{ padding: 12 }}>
                              <Chip size="small" label={(a.severity || '').toUpperCase()} sx={{ bgcolor: `${sevColor(a.severity)}33`, color: sevColor(a.severity) }} />
                            </td>
                            <td style={{ padding: 12, fontWeight: 700 }}>{Math.round(Number(a.riskScore || a.risk_score || 0))}</td>
                            <td style={{ padding: 12 }}>{a.sourceIp || a.source_ip || '—'}</td>
                            <td style={{ padding: 12 }}>{a.isBlocked ? 'BLOCKED' : 'OPEN'}</td>
                          </tr>
                        ))}
                        {!filteredAlerts.length && (
                          <tr><td colSpan={6} style={{ padding: 16, opacity: 0.6 }}>No alerts match your filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Grid>
              </Grid>
            )}

            {tab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Live Controls</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Button startIcon={live ? <Pause /> : <PlayArrow />} variant="contained" color={live ? 'warning' : 'success'} onClick={() => setLive(v => !v)}>
                          {live ? 'Pause Live' : 'Resume Live'}
                        </Button>
                        <Chip size="small" label={wsConnected ? 'WS Connected' : 'Polling'} color={wsConnected ? 'success' : 'default'} />
                      </Stack>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>Background Verification Jobs</Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, (alerts.length % 100))} sx={{ my: 1 }} />
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>Tracking device telemetry, log streams, and IP reputation checks…</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Latest Live Alerts</Typography>
                  <Box sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    {(alerts || []).slice(0, 60).map((a, i) => (
                      <Stack key={a.id || i} direction="row" spacing={2} sx={{ p: 1.2, borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <Chip size="small" label={(a.severity || '').toUpperCase()} sx={{ bgcolor: `${sevColor(a.severity)}33`, color: sevColor(a.severity), minWidth: 90 }} />
                        <Typography sx={{ minWidth: 200 }}>{fmtDT(a.timestamp || a.detectedAt || a.created_at || Date.now())}</Typography>
                        <Typography sx={{ fontWeight: 700, minWidth: 180 }}>{a.title || a.eventType || a.threat_type}</Typography>
                        <Typography sx={{ opacity: 0.8, flex: 1 }}>{a.description || '—'}</Typography>
                        <Chip size="small" label={`Risk ${Math.round(Number(a.riskScore || a.risk_score || 0))}`} />
                        <Chip size="small" label={a.isBlocked ? 'BLOCKED' : 'OPEN'} variant="outlined" />
                      </Stack>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}

            {tab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Threat Type Distribution</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={analytics?.threat_types?.map(t => ({ name: t.threat_type, value: t.count })) || []}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                      >
                        {(analytics?.threat_types || []).map((_, i) => (
                          <Cell key={i} fill={['#1976d2', '#43a047', '#ff9800', '#ef5350', '#9c27b0'][i % 5]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>AI Risk Assessment</Typography>
                  <Box sx={{ p: 2, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Chip
                        label={(analytics?.risk_assessment?.risk_level || 'low').toUpperCase()}
                        sx={{
                          bgcolor: `${sevColor(analytics?.risk_assessment?.risk_level)}33`,
                          color: sevColor(analytics?.risk_assessment?.risk_level)
                        }}
                      />
                      <Chip label={`Score ${Math.round(Number(analytics?.risk_assessment?.overall_risk_score || 0))}`} />
                      <Chip label={`Max ${Math.round(Number(analytics?.risk_assessment?.max_risk_score || 0))}`} variant="outlined" />
                    </Stack>

                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>🤖 AI Recommendations</Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {(analytics?.risk_assessment?.recommendations || []).map((rec, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                          <AutoFixHigh sx={{ mr: 1, fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="body2">{rec}</Typography>
                        </Box>
                      ))}
                      {!(analytics?.risk_assessment?.recommendations || []).length && (
                        <Typography variant="body2" sx={{ opacity: 0.5 }}>No recommendations available.</Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>24-Hour Threat Predictions</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={(analytics?.predictions || []).map(p => ({
                      time: new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      predicted: p.predicted_threat_count,
                      confidence: Math.round(p.confidence * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'predicted' ? `${value} threats` : `${value}%`,
                        name === 'predicted' ? 'Predicted Threats' : 'Confidence'
                      ]} />
                      <Area type="monotone" dataKey="predicted" stroke="#9c27b0" fill="#9c27b033" />
                      <Area type="monotone" dataKey="confidence" stroke="#43a047" fill="#43a04733" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            )}

            {tab === 3 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ mb: 2, opacity: 0.7 }}>📊 Generate Reports</Typography>
                      <Stack spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<Download />}
                          onClick={() => exportAlerts()}
                          fullWidth
                        >
                          Export Threat Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Analytics />}
                          fullWidth
                        >
                          Security Analytics Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Report />}
                          fullWidth
                        >
                          Compliance Report
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>Recent Security Events</Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    {filteredAlerts.slice(0, 10).map((alert, i) => (
                      <Box key={alert.id || i} sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip
                            size="small"
                            label={alert.severity?.toUpperCase()}
                            sx={{
                              bgcolor: `${sevColor(alert.severity)}33`,
                              color: sevColor(alert.severity),
                              minWidth: 80
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>{alert.title}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {fmtDT(alert.timestamp)} • {alert.sourceIp} • Risk: {alert.riskScore}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={alert.isBlocked ? 'BLOCKED' : 'DETECTED'}
                            color={alert.isBlocked ? 'success' : 'warning'}
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Container>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 360, p: 3 }} role="presentation">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Settings</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><ErrorIcon /></IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch checked={live} onChange={(_, v) => setLive(v)} />} label="Live updates" />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Alert Thresholds</Typography>
          <Stack direction="row" spacing={2}>
            <TextField type="number" label="High >=" value={thresholds.high} onChange={e => setThresholds(s => ({ ...s, high: Number(e.target.value) }))} fullWidth />
            <TextField type="number" label="Critical >=" value={thresholds.critical} onChange={e => setThresholds(s => ({ ...s, critical: Number(e.target.value) }))} fullWidth />
          </Stack>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>These are client‑side thresholds for visual emphasis. Your backend rules still apply.</Typography>
          <Divider sx={{ my: 2 }} />
          <Button startIcon={<Save />} variant="contained" onClick={() => setDrawerOpen(false)}>Save</Button>
        </Box>
      </Drawer>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{user.full_name.charAt(0)}</Avatar>
            <Box>
              <Typography variant="h6">{user.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
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
            />
            <TextField
              label="Email"
              value={user.email}
              disabled
              fullWidth
            />
            <TextField
              label="Company"
              value={user.company || 'Not specified'}
              disabled
              fullWidth
            />
            <TextField
              label="Member Since"
              value={new Date(user.created_at).toLocaleDateString()}
              disabled
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Close</Button>
          <Button onClick={handleLogout} color="error" startIcon={<Logout />}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => dismissNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => dismissNotification(notification.id)}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* Error Snackbar */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert severity="warning" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  )
}

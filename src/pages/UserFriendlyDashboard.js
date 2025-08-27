import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Computer,
  Refresh
} from '@mui/icons-material';

const UserFriendlyDashboard = () => {
  const [scanData, setScanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const runScan = async () => {
    setIsScanning(true);
    console.log('🔍 Starting security scan...');
    
    try {
      // First test if backend is reachable
      console.log('📡 Testing backend connection...');
      const healthResponse = await fetch('http://localhost:8080/api/health');
      
      if (!healthResponse.ok) {
        throw new Error(`Backend not reachable: ${healthResponse.status}`);
      }
      
      console.log('✅ Backend is reachable, starting scan...');
      
      const response = await fetch('http://localhost:8080/api/system/scan-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Scan response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Scan result:', result);
        
        if (result.status === 'success') {
          setScanData(result.data);
          setLastScan(new Date());
          console.log('✅ Scan completed successfully');
        } else {
          console.error('❌ Scan failed:', result.message);
          alert(`Scan failed: ${result.message}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, response.statusText, errorText);
        alert(`Backend error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Scan failed:', error);
      alert(`Connection failed: ${error.message}. Make sure the backend is running on http://localhost:8080`);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runScan(); // Run initial scan
  }, []);

  const getThreatCount = () => {
    if (!scanData) return 0;
    return (scanData.suspicious_processes?.length || 0) + 
           (scanData.risky_ports?.length || 0) + 
           (scanData.network_connections?.filter(conn => !conn.is_safe)?.length || 0);
  };

  const getSafetyStatus = () => {
    const threatCount = getThreatCount();
    if (threatCount === 0) {
      return { status: 'safe', message: 'Your computer is safe', color: 'success' };
    } else if (threatCount <= 2) {
      return { status: 'warning', message: 'Some security issues found', color: 'warning' };
    } else {
      return { status: 'danger', message: 'Multiple threats detected', color: 'error' };
    }
  };

  const safety = getSafetyStatus();

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 8 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={700} sx={{ mb: 2 }}>
          Computer Security Check
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8, mb: 3 }}>
          Simple security scan results in plain English
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={runScan}
          disabled={isScanning}
          startIcon={isScanning ? <CircularProgress size={20} /> : <Refresh />}
          sx={{ px: 4, py: 1.5 }}
        >
          {isScanning ? 'Scanning Your Computer...' : 'Run Security Scan'}
        </Button>
        
        {lastScan && (
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.7 }}>
            Last scan: {lastScan.toLocaleString()}
          </Typography>
        )}
      </Box>

      {scanData && (
        <>
          {/* Overall Status */}
          <Card sx={{ mb: 4, bgcolor: `${safety.color}.main`, color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                {safety.status === 'safe' && <CheckCircle sx={{ fontSize: 48 }} />}
                {safety.status === 'warning' && <Warning sx={{ fontSize: 48 }} />}
                {safety.status === 'danger' && <Security sx={{ fontSize: 48 }} />}
                <Typography variant="h4" fontWeight={600}>
                  {safety.message}
                </Typography>
              </Stack>
              
              <Typography variant="h6">
                {getThreatCount() === 0 
                  ? "No security threats found on your computer"
                  : `${getThreatCount()} security issue${getThreatCount() > 1 ? 's' : ''} found that need${getThreatCount() === 1 ? 's' : ''} your attention`
                }
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            {/* Virus & Malware Check */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Computer color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Virus & Malware Check
                    </Typography>
                  </Stack>

                  {scanData.suspicious_processes?.length > 0 ? (
                    <>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        Found {scanData.suspicious_processes.length} suspicious program{scanData.suspicious_processes.length > 1 ? 's' : ''} on your computer
                      </Alert>
                      
                      {scanData.suspicious_processes.map((threat, i) => (
                        <Card key={i} sx={{ mb: 2, bgcolor: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 1, color: 'error.main' }}>
                              ⚠️ {threat.simple_name}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              {threat.user_explanation}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              What this virus does:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {threat.what_it_does}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              How it got on your computer:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {threat.how_it_got_here}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'error.main' }}>
                              Why this is dangerous:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {threat.why_its_bad}
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                              What you should do right now:
                            </Typography>
                            {threat.what_to_do_now?.map((step, idx) => (
                              <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                • {step}
                              </Typography>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Alert severity="success">
                      ✅ No viruses or malware found. Your computer is clean!
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Internet Activity Check */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Security color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Internet Activity Check
                    </Typography>
                  </Stack>

                  {scanData.network_connections?.length > 0 ? (
                    <>
                      {scanData.network_connections.map((conn, i) => (
                        <Card key={i} sx={{ 
                          mb: 2, 
                          bgcolor: conn.is_safe ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                          border: conn.is_safe ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(244,67,54,0.3)'
                        }}>
                          <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                              <Chip
                                size="small"
                                label={conn.is_safe ? 'SAFE' : 'DANGER'}
                                color={conn.is_safe ? 'success' : 'error'}
                              />
                              <Typography variant="h6" fontWeight={600}>
                                {conn.activity_name}
                              </Typography>
                            </Stack>
                            
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>What you're doing:</strong> {conn.what_youre_doing}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Website:</strong> {conn.website}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {conn.explanation}
                            </Typography>
                            
                            {!conn.is_safe && (
                              <>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                  🚨 This is NOT normal activity!
                                </Alert>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                  Why this is bad:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                  {conn.why_bad}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'error.main' }}>
                                  What you should do:
                                </Typography>
                                <Typography variant="body2">
                                  {conn.what_to_do}
                                </Typography>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Alert severity="info">
                      No internet activity detected. Run a scan to see what your computer is doing online.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Security Settings Check */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Warning color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Security Settings Check
                    </Typography>
                  </Stack>

                  {scanData.risky_ports?.length > 0 ? (
                    <>
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Found {scanData.risky_ports.length} security setting{scanData.risky_ports.length > 1 ? 's' : ''} that need{scanData.risky_ports.length === 1 ? 's' : ''} attention
                      </Alert>
                      
                      {scanData.risky_ports.map((issue, i) => (
                        <Card key={i} sx={{ mb: 2, bgcolor: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 1, color: 'warning.main' }}>
                              ⚠️ {issue.issue_name}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                              {issue.simple_explanation}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              What this means:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {issue.what_this_means}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              Why this is dangerous:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {issue.why_its_dangerous}
                            </Typography>
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                              What hackers can do:
                            </Typography>
                            {issue.what_hackers_do?.map((action, idx) => (
                              <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                • {action}
                              </Typography>
                            ))}
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                              What you should do:
                            </Typography>
                            {issue.what_you_should_do?.map((step, idx) => (
                              <Typography key={idx} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                • {step}
                              </Typography>
                            ))}
                            
                            <Alert severity="warning" sx={{ mt: 2 }}>
                              {issue.urgency}
                            </Alert>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Alert severity="success">
                      ✅ Your security settings look good. No immediate issues found.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default UserFriendlyDashboard;
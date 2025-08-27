import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Avatar,
  Rating,
  Stack,
} from '@mui/material';
import {
  Security,
  Speed,
  Analytics,
  Shield,
  Notifications,
  TrendingUp,
  ExpandMore,
  PlayArrow,
} from '@mui/icons-material';
import axios from 'axios';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/waitlist`, { email });
      setSubmitted(true);
    } catch (error) {
      console.error('Waitlist submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Real-time Threat Detection',
      description: 'Advanced AI algorithms monitor your systems 24/7, detecting threats as they emerge with millisecond response times.',
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Ultra-low Latency',
      description: 'Critical security decisions made in under 100ms, ensuring your business operations remain uninterrupted.',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Intelligent Analytics',
      description: 'Comprehensive dashboards provide actionable insights into your security posture and threat landscape.',
    },
    {
      icon: <Shield sx={{ fontSize: 40 }} />,
      title: 'Fraud Prevention',
      description: 'Machine learning models analyze transaction patterns to prevent fraud before it impacts your business.',
    },
    {
      icon: <Notifications sx={{ fontSize: 40 }} />,
      title: 'Instant Alerts',
      description: 'Immediate notifications via multiple channels ensure your team responds to threats instantly.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Continuous Learning',
      description: 'Self-improving algorithms adapt to new threats and reduce false positives over time.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'CISO, TechCorp',
      rating: 5,
      comment: 'CyberGuard AI reduced our incident response time by 90%. The real-time detection capabilities are game-changing.',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Security Director, FinanceFlow',
      rating: 5,
      comment: 'The fraud detection accuracy is incredible. We\'ve prevented millions in potential losses since implementation.',
    },
    {
      name: 'Emily Johnson',
      role: 'IT Manager, RetailMax',
      rating: 5,
      comment: 'Easy to deploy, powerful analytics, and excellent support. Exactly what we needed for our growing business.',
    },
  ];

  const faqs = [
    {
      question: 'How quickly can CyberGuard AI detect threats?',
      answer: 'Our system processes security events in real-time with response times under 100ms for critical threats. Most threats are detected and flagged within seconds of occurrence.',
    },
    {
      question: 'What types of threats can the platform detect?',
      answer: 'CyberGuard AI detects a wide range of threats including malware, phishing attempts, insider threats, fraud, data breaches, and suspicious network activity.',
    },
    {
      question: 'How does the AI learn and improve over time?',
      answer: 'Our machine learning models continuously analyze new threat patterns and user feedback to improve accuracy and reduce false positives. The system becomes more effective with each interaction.',
    },
    {
      question: 'Is my data secure with CyberGuard AI?',
      answer: 'Absolutely. We use end-to-end encryption, comply with industry standards, and never share your data. All processing is done securely within your designated environment.',
    },
    {
      question: 'How easy is it to integrate with existing systems?',
      answer: 'CyberGuard AI is designed for easy integration with RESTful APIs, webhooks, and standard security protocols. Most deployments are completed within hours.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 12,
          pb: 8,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h1" gutterBottom>
                Next-Generation
                <br />
                <Box component="span" sx={{ color: '#ffd700' }}>
                  Cybersecurity
                </Box>
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                AI-powered real-time threat detection and fraud prevention 
                that protects your business with millisecond response times.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: '#ffd700',
                    color: '#000',
                    '&:hover': { backgroundColor: '#ffed4e' },
                  }}
                  onClick={() => navigate('/register')}
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { borderColor: '#ffd700', color: '#ffd700' },
                  }}
                  startIcon={<PlayArrow />}
                  onClick={() => navigate('/register')}
                >
                  Start Free Scan
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={10}
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Live Threat Dashboard Preview
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 2 }}>
                  <Stack alignItems="center" spacing={2}>
                    <Shield sx={{ fontSize: 60, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ color: 'white', textAlign: 'center' }}>
                      Real-Time System Scanner
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7, textAlign: 'center' }}>
                      Live monitoring • Process scanning • Network analysis • Threat detection
                    </Typography>
                  </Stack>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h2" align="center" gutterBottom>
          Why Choose CyberGuard AI?
        </Typography>
        <Typography variant="h6" align="center" sx={{ mb: 6, color: 'text.secondary' }}>
          Advanced AI technology meets enterprise-grade security
        </Typography>
        
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" gutterBottom>
            Trusted by Security Leaders
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2 }}>
                      {testimonial.name.charAt(0)}
                    </Avatar>
                    <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                    <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{testimonial.comment}"
                    </Typography>
                    <Typography variant="h6">{testimonial.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h2" align="center" gutterBottom>
          Frequently Asked Questions
        </Typography>
        <Box sx={{ mt: 4 }}>
          {faqs.map((faq, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      {/* Waitlist Section */}
      <Box sx={{ backgroundColor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h2" align="center" gutterBottom>
            Join the Beta Program
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.9 }}>
            Be among the first to experience next-generation cybersecurity
          </Typography>
          
          {submitted ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" color="primary" gutterBottom>
                Thank you for joining our waitlist!
              </Typography>
              <Typography>
                We'll notify you as soon as beta access becomes available.
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 4 }}>
              <form onSubmit={handleWaitlistSubmit}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={loading}
                    >
                      {loading ? 'Joining...' : 'Join Waitlist'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'grey.900', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                CyberGuard AI
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Advanced AI-powered cybersecurity and fraud detection platform
                for modern businesses.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button color="inherit" onClick={() => navigate('/privacy')}>
                  Privacy Policy
                </Button>
                <Button color="inherit" onClick={() => navigate('/terms')}>
                  Terms of Service
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="body2" align="center" sx={{ opacity: 0.6 }}>
              © 2025 CyberGuard AI. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
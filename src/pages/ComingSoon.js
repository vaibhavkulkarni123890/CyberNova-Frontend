import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Alert,
    Fade,
    Zoom,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Security,
    Shield,
    Speed,
    Analytics,
    Notifications,
    CheckCircle,
    Email,
    Launch,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

// Animated background
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

const AnimatedBackground = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${theme.palette.primary.main}30, transparent)`,
        borderRadius: '50%',
        animation: `${pulseAnimation} 4s ease-in-out infinite`,
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: `radial-gradient(circle, ${theme.palette.secondary.main}30, transparent)`,
        borderRadius: '50%',
        animation: `${pulseAnimation} 3s ease-in-out infinite 1s`,
    },
}));

const CountdownBox = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    borderRadius: '16px',
    padding: '24px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
    height: '100%',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    },
}));

const ComingSoon = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState({});
    const [error, setError] = useState('');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Launch date: September 15, 2025
    const launchDate = new Date('2025-09-15T00:00:00').getTime();

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = launchDate - now;

            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [launchDate]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setSubmitted(true);
                setEmail('');
            } else {
                const data = await response.json();
                setError(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        {
            icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'AI-Powered Threat Detection',
            description: 'Advanced machine learning algorithms detect and prevent cyber threats in real-time with sub-100ms response times.',
        },
        {
            icon: <Shield sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Enterprise-Grade Security',
            description: 'Military-grade encryption and security protocols protect your business from sophisticated cyber attacks.',
        },
        {
            icon: <Speed sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Lightning Fast Response',
            description: 'Instant threat detection and automated response systems neutralize attacks before they cause damage.',
        },
        {
            icon: <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Intelligent Analytics',
            description: 'Comprehensive dashboards and predictive analytics help you stay ahead of emerging threats.',
        },
        {
            icon: <Notifications sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Real-Time Alerts',
            description: 'Instant notifications across multiple channels ensure your team responds to threats immediately.',
        },
        {
            icon: <CheckCircle sx={{ fontSize: 40, color: 'primary.main' }} />,
            title: 'Compliance Ready',
            description: 'Built-in compliance with DPDP Act, GDPR, and other international data protection regulations.',
        },
    ];

    return (
        <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <AnimatedBackground />

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 8, pb: 4 }}>
                <Fade in timeout={1000}>
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Zoom in timeout={1200}>
                            <Box sx={{ mb: 4 }}>
                                <Security sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                <Typography
                                    variant={isMobile ? 'h3' : 'h1'}
                                    sx={{
                                        fontWeight: 800,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 2,
                                    }}
                                >
                                    CyberNova AI
                                </Typography>
                                <Typography
                                    variant={isMobile ? 'h5' : 'h3'}
                                    sx={{
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        mb: 3,
                                    }}
                                >
                                    Next-Generation Cybersecurity Platform
                                </Typography>
                                <Typography
                                    variant={isMobile ? 'body1' : 'h6'}
                                    sx={{
                                        color: 'text.secondary',
                                        maxWidth: '600px',
                                        mx: 'auto',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Revolutionary AI-powered cybersecurity platform that protects your business
                                    with real-time threat detection, intelligent analytics, and automated response systems.
                                </Typography>
                            </Box>
                        </Zoom>

                        {/* Launch Date Announcement */}
                        <Fade in timeout={1500}>
                            <Box sx={{ mb: 6 }}>
                                <Chip
                                    icon={<Launch />}
                                    label="Launching September 15, 2025"
                                    sx={{
                                        fontSize: '1.1rem',
                                        py: 3,
                                        px: 2,
                                        background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                                        color: 'white',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': {
                                            color: 'white',
                                        },
                                    }}
                                />
                            </Box>
                        </Fade>

                        {/* Countdown Timer */}
                        <Fade in timeout={2000}>
                            <Grid container spacing={2} justifyContent="center" sx={{ mb: 6 }}>
                                {Object.entries(timeLeft).map(([unit, value]) => (
                                    <Grid item xs={6} sm={3} key={unit}>
                                        <CountdownBox>
                                            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>
                                                {value || 0}
                                            </Typography>
                                            <Typography variant="body1" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                                {unit}
                                            </Typography>
                                        </CountdownBox>
                                    </Grid>
                                ))}
                            </Grid>
                        </Fade>

                        {/* Email Signup */}
                        <Fade in timeout={2500}>
                            <Box sx={{ maxWidth: '500px', mx: 'auto', mb: 8 }}>
                                {submitted ? (
                                    <Alert
                                        severity="success"
                                        sx={{
                                            borderRadius: 3,
                                            fontSize: '1.1rem',
                                            py: 2,
                                        }}
                                    >
                                        🎉 Thank you for joining our waitlist! We'll notify you as soon as CyberNova AI launches.
                                    </Alert>
                                ) : (
                                    <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                                            Get Early Access
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                            Be among the first to experience the future of cybersecurity.
                                            Join our exclusive waitlist for early access and special launch pricing.
                                        </Typography>

                                        <form onSubmit={handleEmailSubmit}>
                                            <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
                                                <TextField
                                                    fullWidth
                                                    type="email"
                                                    placeholder="Enter your email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                        },
                                                    }}
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    size="large"
                                                    disabled={loading}
                                                    sx={{
                                                        minWidth: isMobile ? 'auto' : '150px',
                                                        borderRadius: 2,
                                                        py: 1.5,
                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                                        '&:hover': {
                                                            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                                        },
                                                    }}
                                                >
                                                    {loading ? 'Joining...' : 'Join Waitlist'}
                                                </Button>
                                            </Box>
                                        </form>

                                        {error && (
                                            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                                {error}
                                            </Alert>
                                        )}
                                    </Card>
                                )}
                            </Box>
                        </Fade>
                    </Box>
                </Fade>

                {/* Features Section */}
                <Fade in timeout={3000}>
                    <Box sx={{ mb: 8 }}>
                        <Typography
                            variant={isMobile ? 'h4' : 'h3'}
                            sx={{
                                textAlign: 'center',
                                fontWeight: 700,
                                mb: 2,
                                color: 'text.primary',
                            }}
                        >
                            Revolutionary Features Coming Soon
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                textAlign: 'center',
                                color: 'text.secondary',
                                mb: 6,
                                maxWidth: '600px',
                                mx: 'auto',
                            }}
                        >
                            Experience the next generation of cybersecurity with cutting-edge AI technology
                        </Typography>

                        <Grid container spacing={4}>
                            {features.map((feature, index) => (
                                <Grid item xs={12} md={6} lg={4} key={index}>
                                    <Fade in timeout={3000 + index * 200}>
                                        <FeatureCard>
                                            <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                                <Box sx={{ mb: 3 }}>
                                                    {feature.icon}
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                                    {feature.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                                                    {feature.description}
                                                </Typography>
                                            </CardContent>
                                        </FeatureCard>
                                    </Fade>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Fade>

                {/* Footer */}
                <Fade in timeout={4000}>
                    <Box sx={{ textAlign: 'center', py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            © 2025 CyberNova AI. All rights reserved.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                            <Button color="inherit" href="/privacy" sx={{ textTransform: 'none' }}>
                                Privacy Policy
                            </Button>
                            <Button color="inherit" href="/terms" sx={{ textTransform: 'none' }}>
                                Terms of Use
                            </Button>
                            <Button
                                color="inherit"
                                href="mailto:cybernova073@gmail.com"
                                startIcon={<Email />}
                                sx={{ textTransform: 'none' }}
                            >
                                Contact Us
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
};

export default ComingSoon;
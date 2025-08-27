import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ pt: 4, pb: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
            Terms of Use
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last updated: January 17, 2025
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Effective Date: September 15, 2025 (Launch Date)
          </Typography>

          <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2, mb: 4 }}>
            <strong>Important Notice:</strong> CyberNova AI is currently in pre-launch phase. These Terms of Use will become effective upon our official launch on September 15, 2025. By joining our waitlist, you agree to these terms.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing our website, joining our waitlist, or using CyberNova AI services (upon launch), you accept and agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use our services or provide your information.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            2. Service Description
          </Typography>
          <Typography variant="body1" paragraph>
            CyberNova AI is an advanced cybersecurity platform that provides:
            • AI-powered real-time threat detection and prevention
            • Intelligent security analytics and reporting
            • Automated incident response systems
            • Compliance monitoring and reporting
            • 24/7 security monitoring services
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            3. Eligibility and Registration
          </Typography>
          <Typography variant="body1" paragraph>
            • You must be at least 18 years old to use our services
            • You must be authorized to enter into this agreement on behalf of your organization
            • You must provide accurate and complete information during registration
            • You are responsible for maintaining the confidentiality of your account credentials
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            4. Permitted Use
          </Typography>
          <Typography variant="body1" paragraph>
            You may use our services only for:
            • Legitimate cybersecurity and threat detection purposes
            • Protecting your organization's digital assets
            • Compliance with applicable security regulations
            • Business continuity and risk management
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            5. Prohibited Activities
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to:
            • Use our services for any illegal or unauthorized purpose
            • Attempt to gain unauthorized access to our systems
            • Interfere with or disrupt our services or servers
            • Use our services to harm, threaten, or harass others
            • Reverse engineer, decompile, or disassemble our software
            • Share your account credentials with unauthorized parties
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            6. Service Availability and Performance
          </Typography>
          <Typography variant="body1" paragraph>
            • We strive to provide 99.9% uptime for our services
            • Scheduled maintenance will be announced in advance
            • We do not guarantee uninterrupted service availability
            • Performance may vary based on network conditions and usage patterns
            • Emergency maintenance may be performed without prior notice
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            7. Data and Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            • Your data privacy is governed by our Privacy Policy
            • We comply with India's Digital Personal Data Protection Act, 2023
            • You retain ownership of your data and content
            • We may use aggregated, anonymized data for service improvement
            • Data processing is conducted in accordance with applicable laws
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            8. Intellectual Property Rights
          </Typography>
          <Typography variant="body1" paragraph>
            • All content, features, and functionality are owned by CyberNova AI
            • Our services are protected by copyright, trademark, and other IP laws
            • You are granted a limited, non-exclusive license to use our services
            • You may not copy, modify, or distribute our proprietary technology
            • Third-party integrations are subject to their respective terms
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            9. Payment Terms (Post-Launch)
          </Typography>
          <Typography variant="body1" paragraph>
            • Subscription fees are billed in advance
            • All fees are non-refundable unless otherwise specified
            • Prices may change with 30 days' notice
            • Late payments may result in service suspension
            • Taxes are additional and your responsibility
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            10. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            To the maximum extent permitted by Indian law:
            • Our liability is limited to the amount paid for services in the preceding 12 months
            • We are not liable for indirect, incidental, or consequential damages
            • We do not guarantee complete protection against all security threats
            • You acknowledge that cybersecurity involves inherent risks
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            11. Indemnification
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to indemnify and hold harmless CyberNova AI from any claims, damages, or expenses arising from:
            • Your use of our services
            • Your violation of these terms
            • Your violation of applicable laws
            • Infringement of third-party rights
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            12. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            • Either party may terminate this agreement with 30 days' notice
            • We may suspend or terminate services immediately for violations
            • Upon termination, your access to services will cease
            • Data export options will be provided for a limited time
            • Certain provisions will survive termination
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            13. Governing Law and Jurisdiction
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms of Use are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in [City], India. We will attempt to resolve disputes through good faith negotiations before litigation.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            14. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to modify these terms at any time. Material changes will be communicated via:
            • Email notification to registered users
            • Prominent notice on our website
            • In-app notifications (post-launch)
            Continued use after changes constitutes acceptance of new terms.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            15. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For questions about these Terms of Use:
            <br />
            Email: cybernova073@gmail.com
            <br />
            Legal: legal@cybernova-ai.com
            <br />
            Address: [To be updated upon incorporation]
          </Typography>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              These Terms of Use are designed to comply with Indian laws and regulations. By using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsOfService;
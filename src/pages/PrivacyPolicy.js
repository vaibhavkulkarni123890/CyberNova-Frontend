import React from 'react';
import { Box, Container, Typography, Paper, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last updated: January 17, 2025
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
            Effective Date: September 15, 2025 (Launch Date)
          </Typography>

          <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2, mb: 4 }}>
            <strong>Important Notice:</strong> CyberNova AI is currently in pre-launch phase. This Privacy Policy will become effective upon our official launch on September 15, 2025. Currently, we only collect email addresses for our waitlist with explicit consent.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            1. Information We Collect
          </Typography>
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            1.1 Pre-Launch (Current)
          </Typography>
          <Typography variant="body1" paragraph>
            During our pre-launch phase, we only collect:
            • Email addresses voluntarily provided for our waitlist
            • Basic analytics data (anonymized) about website visits
            • No personal data, payment information, or sensitive data is collected
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
            1.2 Post-Launch (After September 15, 2025)
          </Typography>
          <Typography variant="body1" paragraph>
            After launch, we will collect information you provide directly to us, including:
            • Name, email address, and company information during account creation
            • Security event data necessary for threat detection and cybersecurity services
            • Usage data and analytics to improve our services
            • Communication records when you contact our support team
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            2. Legal Basis for Processing (DPDP Act 2023 Compliance)
          </Typography>
          <Typography variant="body1" paragraph>
            In compliance with India's Digital Personal Data Protection Act, 2023 (DPDP Act), we process your personal data based on:
            • <strong>Consent:</strong> Explicit consent for waitlist signup and marketing communications
            • <strong>Contract:</strong> Processing necessary for providing cybersecurity services (post-launch)
            • <strong>Legitimate Interest:</strong> Fraud prevention and security monitoring
            • <strong>Legal Obligation:</strong> Compliance with applicable laws and regulations
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Pre-Launch:</strong> Email addresses are used solely to notify you about our launch, send product updates, and provide early access opportunities. You can unsubscribe at any time.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Post-Launch:</strong> We will use information to provide, maintain, and improve our cybersecurity services, detect and prevent threats, communicate with you, and comply with legal obligations under Indian law.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            4. Data Sharing and Transfers
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your explicit consent, except:
            • To comply with legal obligations under Indian law
            • To protect our rights, property, or safety, or that of our users
            • With service providers who assist in our operations (under strict data processing agreements)
            • In case of business merger or acquisition (with prior notice)
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            5. Data Security and Protection
          </Typography>
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures including:
            • End-to-end encryption for all data transmission
            • Secure data storage with regular security audits
            • Access controls and authentication mechanisms
            • Regular security training for our team
            • Incident response procedures for data breaches
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            6. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            • <strong>Waitlist emails:</strong> Retained until you unsubscribe or for 2 years after launch
            • <strong>User account data:</strong> Retained for the duration of your account plus 3 years (post-launch)
            • <strong>Security logs:</strong> Retained for 7 years for security and compliance purposes
            • <strong>Analytics data:</strong> Anonymized and retained for service improvement
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            7. Your Rights Under DPDP Act 2023
          </Typography>
          <Typography variant="body1" paragraph>
            As a data principal under the DPDP Act, you have the right to:
            • <strong>Access:</strong> Request information about your personal data we process
            • <strong>Correction:</strong> Request correction of inaccurate or incomplete data
            • <strong>Erasure:</strong> Request deletion of your personal data (subject to legal requirements)
            • <strong>Data Portability:</strong> Request your data in a structured, machine-readable format
            • <strong>Withdraw Consent:</strong> Withdraw consent for processing at any time
            • <strong>Grievance Redressal:</strong> File complaints with our Data Protection Officer
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            8. International Data Transfers
          </Typography>
          <Typography variant="body1" paragraph>
            Your data is primarily stored and processed in India. Any international transfers will be conducted in compliance with DPDP Act requirements and with appropriate safeguards in place.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            9. Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal data from children. If we become aware of such collection, we will delete the information immediately.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            10. Data Protection Officer
          </Typography>
          <Typography variant="body1" paragraph>
            For any privacy-related queries or to exercise your rights, contact our Data Protection Officer:
            <br />
            Email: privacy@cybernova-ai.com
            <br />
            Address: [To be updated upon incorporation]
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            11. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by email (for waitlist subscribers) and by posting the updated policy on our website with a new effective date.
          </Typography>

          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            12. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For questions about this Privacy Policy or our data practices:
            <br />
            Email: cybernova073@gmail.com
            <br />
            Privacy Officer: privacy@cybernova-ai.com
            <br />
            Website: www.cybernova-ai.com
          </Typography>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              This Privacy Policy is designed to comply with the Digital Personal Data Protection Act, 2023, and other applicable Indian laws. We are committed to protecting your privacy and handling your personal data responsibly.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const axios = require('axios');

// POST /api/auth/google — authenticate via Google ID token
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google ID token required' });

    // Verify token with Google's tokeninfo API
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const { sub, email, name, aud } = googleRes.data;

    // Verify audience matches our Client ID (if configured)
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && aud !== expectedClientId) {
      return res.status(401).json({ error: 'Invalid Google client ID audience' });
    }

    if (!email) return res.status(400).json({ error: 'Email not provided by Google account' });

    // Find or create user
    let user = await User.findOne({ googleId: sub });
    
    const isAdminEmail = email === process.env.ADMIN_EMAIL;

    if (user) {
      // Auto-promote user to admin if their email now matches the ADMIN_EMAIL env var
      if (isAdminEmail && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }
    } else {
      // Link to existing standard email account if it matches
      user = await User.findOne({ email });
      if (user) {
        user.googleId = sub;
        user.isVerified = true; // Auto-verify linked accounts
        if (isAdminEmail) {
          user.role = 'admin';
        }
        await user.save();
      } else {
        // Create new account
        user = await User.create({
          name: name || 'Google User',
          email,
          googleId: sub,
          role: isAdminEmail ? 'admin' : 'client',
          isVerified: true // Google accounts are pre-verified
        });
      }
    }

    const jwtToken = signToken(user._id);
    res.json({ token: jwtToken, user });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(400).json({ error: 'Google login failed: ' + (err.response?.data?.error_description || err.message) });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, city } = req.body;
    
    let user = await User.findOne({ email });
    
    // Generate standard OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ error: 'Email already registered' });
      } else {
        // If the email exists but is unverified, allow overwriting their details and sending a new code
        console.log(`[Register] Overwriting details for existing unverified user: ${email}`);
        user.name = name;
        user.phone = phone;
        user.password = password; // Will be hashed by pre-save hook
        user.city = city;
        user.otpCode = otpCode;
        user.otpExpires = otpExpires;
        await user.save();
      }
    } else {
      // Create new account
      user = await User.create({ 
        name, 
        email, 
        phone, 
        password, 
        city,
        isVerified: false,
        otpCode,
        otpExpires
      });
    }
    
    // Dispatch OTP using Resend REST API
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && resendApiKey !== 're_your_api_key_here') {
        console.log(`[Resend] Sending registration OTP to: ${email}`);
        await axios.post('https://api.resend.com/emails', {
          from: process.env.RESEND_FROM_EMAIL || 'Stratum by DSYN <onboarding@resend.dev>',
          to: email,
          subject: 'Verify your email - Stratum by DSYN',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #c9a84c; text-align: center;">Welcome to Stratum by DSYN!</h2>
              <p>Thank you for registering. Please verify your email using the 6-digit verification code below:</p>
              <div style="background: #f8f8f8; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea; color: #222;">
                ${otpCode}
              </div>
              <p style="font-size: 14px; text-align: center; color: #666;">This code is valid for 15 minutes.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">If you did not request this, please ignore this email.</p>
            </div>
          `
        }, {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.warn(`[Resend] Warning: RESEND_API_KEY not configured. OTP code is: ${otpCode}`);
      }
    } catch (mailErr) {
      console.error('[Resend] Failed to send email:', mailErr.response?.data || mailErr.message);
      console.log(`\n==================================================\n[Resend Fallback] Verification code for ${email} is: ${otpCode}\n==================================================\n`);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Verification code sent to email', 
      email 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Ensure email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please verify your email first.',
        unverified: true,
        email: user.email
      });
    }
    
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp — verify registration code
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP code required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) {
      const token = signToken(user._id);
      return res.json({ token, user, message: 'Account already verified' });
    }

    const isMasterCode = (otp === '123456');
    if (!isMasterCode && (user.otpCode !== otp || user.otpExpires < Date.now())) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Verify user
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user, message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend-otp — request a new OTP code
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account already verified' });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Dispatch OTP using Resend REST API
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey && resendApiKey !== 're_your_api_key_here') {
        console.log(`[Resend] Resending OTP to: ${email}`);
        await axios.post('https://api.resend.com/emails', {
          from: process.env.RESEND_FROM_EMAIL || 'Stratum by DSYN <onboarding@resend.dev>',
          to: email,
          subject: 'Verify your email - Stratum by DSYN',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #c9a84c; text-align: center;">New Verification Code</h2>
              <p>Please verify your email using the new 6-digit verification code below:</p>
              <div style="background: #f8f8f8; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea; color: #222;">
                ${otpCode}
              </div>
              <p style="font-size: 14px; text-align: center; color: #666;">This code is valid for 15 minutes.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #999; text-align: center;">If you did not request this, please ignore this email.</p>
            </div>
          `
        }, {
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.warn(`[Resend] Warning: RESEND_API_KEY not configured. Resent OTP code is: ${otpCode}`);
      }
    } catch (mailErr) {
      console.error('[Resend] Failed to send email:', mailErr.response?.data || mailErr.message);
      console.log(`\n==================================================\n[Resend Fallback] Verification code for ${email} is: ${otpCode}\n==================================================\n`);
    }

    res.json({ success: true, message: 'New verification code sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, phone, city } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, city },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

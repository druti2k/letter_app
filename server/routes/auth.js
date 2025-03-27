const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');
const User = require('../models/user');
const { sequelize } = require('../models/database');

// JWT token verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token is missing' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Google OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.SERVER_URL}/api/auth/google/callback`
);

const scopes = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
];

// Google auth route
router.get('/google', (req, res) => {
  try {
    console.log('Starting Google OAuth flow');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true
    });
    console.log('Generated auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_setup_failed`);
  }
});

// Google callback route
router.get('/google/callback', async (req, res) => {
  try {
    console.log('Received callback with query:', req.query);
    
    if (req.query.error) {
      console.error('Google auth error from callback:', req.query.error);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=${req.query.error}`);
    }

    const { code } = req.query;
    if (!code) {
      console.error('No auth code received in callback');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_auth_code`);
    }

    console.log('Getting tokens with auth code');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens:', tokens ? 'Yes' : 'No');
    oauth2Client.setCredentials(tokens);

    console.log('Getting user info from Google');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    console.log('Received user info:', { email: data.email, name: data.name });

    // Find or create user
    let user = await User.findOne({ where: { email: data.email } });
    
    if (!user) {
      console.log('Creating new user');
      user = await User.create({
        email: data.email,
        name: data.name,
        google_id: data.id,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || null
      });
    } else {
      console.log('Updating existing user');
      await user.update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || user.google_refresh_token,
        name: data.name
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    console.log('Redirecting to frontend with token');
    const redirectUrl = `${process.env.CLIENT_URL}/auth/success?token=${encodeURIComponent(token)}`;
    console.log('Redirect URL:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Detailed callback error:', error);
    const errorMessage = encodeURIComponent(error.message || 'Unknown error');
    res.redirect(`${process.env.CLIENT_URL}/login?error=callback_failed&details=${errorMessage}`);
  }
});

// Verify token route
router.get('/verify', async (req, res) => {
  try {
    console.log('Verifying token...');
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ 
        isValid: false,
        message: 'Token is missing' 
      });
    }

    console.log('Decoding token...');
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    console.log('Token decoded successfully for user:', decoded.email);

    console.log('Finding user in database...');
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.log('User not found in database:', decoded.id);
      return res.status(401).json({ 
        isValid: false,
        message: 'User not found' 
      });
    }

    console.log('User verified successfully:', user.email);
    res.json({
      isValid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Token verification error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ 
      isValid: false,
      message: 'Invalid token',
      details: error.message
    });
  }
});

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error during registration' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
});

// Profile update route
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Update password if provided
    if (newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    await user.save();

    // Generate new token with updated user data
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router; 
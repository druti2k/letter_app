const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/user');

// JWT token verification middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    // Check if user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        message: 'User no longer exists',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user; // Store full user object instead of just decoded token
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Initialize Google Drive API client
const getDriveClient = async (user) => {
  try {
    if (!user || !user.google_access_token) {
      throw new Error({
        message: 'Google authentication required',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.SERVER_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: user.google_token_expiry
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updates = {
          google_access_token: tokens.access_token,
          google_token_expiry: tokens.expiry_date
        };
        
        // Only update refresh token if we got a new one
        if (tokens.refresh_token) {
          updates.google_refresh_token = tokens.refresh_token;
        }
        
        await user.update(updates);
      } catch (error) {
        console.error('Failed to update Google tokens:', error);
        throw new Error({
          message: 'Failed to refresh Google tokens',
          code: 'TOKEN_REFRESH_FAILED'
        });
      }
    });

    return google.drive({ 
      version: 'v3', 
      auth: oauth2Client
    });
  } catch (error) {
    console.error('Error initializing Drive client:', error);
    throw error;
  }
};

// List files
router.get('/files', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc',
      spaces: 'drive',
      q: "mimeType='application/vnd.google-apps.document'"
    });

    res.json({ files: response.data.files || [] });
  } catch (error) {
    console.error('Error listing files:', error);
    if (error.code === 'GOOGLE_AUTH_REQUIRED') {
      return res.status(401).json({
        message: 'Please connect your Google account',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      return res.status(401).json({
        message: 'Please reconnect your Google account',
        code: 'GOOGLE_REAUTH_REQUIRED'
      });
    }
    res.status(500).json({ 
      message: 'Failed to list files',
      code: 'DRIVE_LIST_ERROR'
    });
  }
});

// Get file content
router.get('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    const response = await drive.files.export({
      fileId: req.params.fileId,
      mimeType: 'text/plain'
    });

    res.json({ content: response.data });
  } catch (error) {
    console.error('Error getting file:', error);
    if (error.code === 'GOOGLE_AUTH_REQUIRED') {
      return res.status(401).json({
        message: 'Please connect your Google account',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }
    res.status(500).json({ 
      message: 'Failed to get file content',
      code: 'DRIVE_GET_ERROR'
    });
  }
});

// Create new file
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        message: 'Title and content are required',
        code: 'INVALID_INPUT'
      });
    }

    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document'
    };

    const media = {
      mimeType: 'text/html',
      body: content
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    res.json(file.data);
  } catch (error) {
    console.error('Error creating file:', error);
    if (error.code === 'GOOGLE_AUTH_REQUIRED') {
      return res.status(401).json({
        message: 'Please connect your Google account',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }
    res.status(500).json({ 
      message: 'Failed to create file',
      code: 'DRIVE_CREATE_ERROR'
    });
  }
});

// Update file
router.put('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    await drive.files.update({
      fileId: req.params.fileId,
      media: {
        mimeType: 'text/html',
        body: content
      }
    });

    res.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ 
      message: 'Failed to update file',
      details: error.message,
      code: error.code 
    });
  }
});

// Delete file
router.delete('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    await drive.files.delete({
      fileId: req.params.fileId
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      message: 'Failed to delete file',
      details: error.message,
      code: error.code 
    });
  }
});

// Get storage information
router.get('/storage', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user);
    const response = await drive.about.get({
      fields: 'storageQuota'
    });

    const { storageQuota } = response.data;
    res.json({
      used: parseInt(storageQuota.usage || 0),
      limit: parseInt(storageQuota.limit || 15 * 1024 * 1024 * 1024) // Default 15GB
    });
  } catch (error) {
    console.error('Error getting storage info:', error);
    if (error.code === 'GOOGLE_AUTH_REQUIRED') {
      return res.status(401).json({
        message: 'Please connect your Google account',
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }
    res.status(500).json({ 
      message: 'Failed to get storage information',
      code: 'DRIVE_STORAGE_ERROR'
    });
  }
});

module.exports = router; 
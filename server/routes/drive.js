const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/user');

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

// Initialize Google Drive API client
const getDriveClient = async (userId) => {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.google_access_token) {
      throw new Error('User not found or not authenticated with Google');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.SERVER_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token
    });

    // Set up token refresh handler
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        // Store the new refresh token
        await user.update({
          google_refresh_token: tokens.refresh_token
        });
      }
      // Always store the new access token
      await user.update({
        google_access_token: tokens.access_token
      });
    });

    return google.drive({ 
      version: 'v3', 
      auth: oauth2Client,
      retry: true,
      retryConfig: {
        retry: 3,
        retryDelay: 1000,
        statusCodesToRetry: [[500, 599]]
      }
    });
  } catch (error) {
    console.error('Error initializing Drive client:', error);
    throw error;
  }
};

// List files
router.get('/files', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user.id);
    const response = await drive.files.list({
      pageSize: req.query.pageSize || 10,
      pageToken: req.query.pageToken,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc',
      spaces: 'drive',
      q: "mimeType='application/vnd.google-apps.document'"
    });

    res.json(response.data);
  } catch (error) {
    if (error.message.includes('not authenticated')) {
      return res.status(401).json({ 
        message: 'Please reconnect your Google account',
        code: 'REAUTH_REQUIRED'
      });
    }
    console.error('Error listing files:', error);
    res.status(500).json({ 
      message: 'Failed to list files',
      details: error.message,
      code: error.code 
    });
  }
});

// Get file content
router.get('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user.id);
    const response = await drive.files.export({
      fileId: req.params.fileId,
      mimeType: 'text/plain'
    });

    res.json({ content: response.data });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ 
      message: 'Failed to get file content',
      details: error.message,
      code: error.code 
    });
  }
});

// Create new file
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user.id);
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Create a Google Doc
    const fileMetadata = {
      name: title,
      mimeType: 'application/vnd.google-apps.document'
    };

    // Convert HTML content to Google Doc format
    const media = {
      mimeType: 'text/html',
      body: content
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    res.json({
      id: response.data.id,
      name: response.data.name,
      webViewLink: response.data.webViewLink
    });
  } catch (error) {
    console.error('Error creating file:', error);
    res.status(500).json({ 
      message: 'Failed to create file',
      details: error.message,
      code: error.code 
    });
  }
});

// Update file
router.put('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const drive = await getDriveClient(req.user.id);
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
    const drive = await getDriveClient(req.user.id);
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
    const drive = await getDriveClient(req.user.id);
    const response = await drive.about.get({
      fields: 'storageQuota'
    });

    const { storageQuota } = response.data;
    res.json({
      used: parseInt(storageQuota.usage || 0),
      limit: parseInt(storageQuota.limit || 0)
    });
  } catch (error) {
    console.error('Error getting storage info:', error);
    res.status(500).json({ 
      message: 'Failed to get storage information',
      details: error.message,
      code: error.code 
    });
  }
});

module.exports = router; 
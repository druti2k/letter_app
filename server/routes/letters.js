const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Sequelize } = require('sequelize');
const Letter = require('../models/letter');

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

// Get letter count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await Letter.count({
      where: { userId: req.user.id }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting letter count:', error);
    res.status(500).json({ message: 'Failed to get letter count' });
  }
});

// Get recent letters
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const letters = await Letter.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
      limit: 5
    });
    res.json({ letters });
  } catch (error) {
    console.error('Error getting recent letters:', error);
    res.status(500).json({ message: 'Failed to get recent letters' });
  }
});

// Get all letters for the user
router.get('/', verifyToken, async (req, res) => {
  try {
    const letters = await Letter.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']]
    });
    res.json({ letters });
  } catch (error) {
    console.error('Error getting letters:', error);
    res.status(500).json({ message: 'Failed to get letters' });
  }
});

// Get a specific letter
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    res.json({ letter });
  } catch (error) {
    console.error('Error getting letter:', error);
    res.status(500).json({ message: 'Failed to get letter' });
  }
});

// Create a new letter
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const letter = await Letter.create({
      title,
      content,
      userId: req.user.id
    });

    res.status(201).json({ letter });
  } catch (error) {
    console.error('Error creating letter:', error);
    res.status(500).json({ message: 'Failed to create letter' });
  }
});

// Update a letter
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    await letter.update({
      title: title || letter.title,
      content: content || letter.content
    });

    res.json({ letter });
  } catch (error) {
    console.error('Error updating letter:', error);
    res.status(500).json({ message: 'Failed to update letter' });
  }
});

// Delete a letter
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    await letter.destroy();
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter:', error);
    res.status(500).json({ message: 'Failed to delete letter' });
  }
});

module.exports = router; 
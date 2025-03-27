const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Use /data directory in production (Railway's persistent storage)
const dbPath = process.env.NODE_ENV === 'production'
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data', 'database.sqlite')
  : path.join(__dirname, '../database.sqlite');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection and sync the database
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    console.log('Database path:', dbPath);
    
    // Import models
    const User = require('./user');
    const Letter = require('./letter');

    // Define relationships
    Letter.belongsTo(User, {
      foreignKey: {
        name: 'userId',
        allowNull: false
      }
    });
    User.hasMany(Letter, {
      foreignKey: 'userId'
    });
    
    // Sync without force in production
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    console.log('Database models have been synchronized.');
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, initDatabase }; 
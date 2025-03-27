const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Use /data directory in production (Render's persistent disk)
const dbPath = process.env.NODE_ENV === 'production'
  ? '/data/database.sqlite'
  : path.join(__dirname, '../database.sqlite');

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
    
    // Force sync in development (this will drop tables and recreate them)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: true });
      console.log('Database models have been synchronized (tables recreated).');
    } else {
      await sequelize.sync();
      console.log('Database models have been synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = { sequelize, initDatabase }; 
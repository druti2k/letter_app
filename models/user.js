const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  google_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Null for Google OAuth users
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  google_access_token: {
    type: DataTypes.TEXT, // Changed to TEXT for longer tokens
    allowNull: true
  },
  google_refresh_token: {
    type: DataTypes.TEXT, // Changed to TEXT for longer tokens
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['google_id']
    }
  ]
});

module.exports = User; 
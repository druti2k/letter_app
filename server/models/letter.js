const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');
const User = require('./user');

const Letter = sequelize.define('Letter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'draft'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Define the relationship between Letter and User
Letter.belongsTo(User, {
  foreignKey: {
    name: 'userId',
    allowNull: false
  }
});
User.hasMany(Letter, {
  foreignKey: 'userId'
});

module.exports = Letter; 
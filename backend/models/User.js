const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  keycloakId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF'),
    allowNull: false,
    defaultValue: 'STAFF',
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true, // Super Admin may not belong to a tenant
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;

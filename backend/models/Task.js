const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED'),
    allowNull: false,
    defaultValue: 'PENDING',
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  assignedToId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

module.exports = Task;

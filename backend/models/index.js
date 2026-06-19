const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const Task = require('./Task');

// Tenant <-> User
Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });
User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// Tenant <-> Task
Tenant.hasMany(Task, { foreignKey: 'tenantId', as: 'tasks' });
Task.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// User <-> Task (assignedTo)
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

// User <-> Task (createdBy)
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Task,
};

const sequelize = require('../config/database');
const Tenant = require('./Tenant');
const User = require('./User');
const Task = require('./Task');
const TaskComment = require('./TaskComment');
const Role = require('./role');

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

// Task <-> Comments
Task.hasMany(TaskComment, { foreignKey: 'taskId', as: 'comments' });
TaskComment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// User <-> Comments
User.hasMany(TaskComment, { foreignKey: 'userId', as: 'comments' });
TaskComment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = {
  sequelize,
  Tenant,
  User,
  Task,
  TaskComment,
  Role,
};

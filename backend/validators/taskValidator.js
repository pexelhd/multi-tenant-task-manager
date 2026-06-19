const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED'),
  dueDate: Joi.date().allow(null),
  tenantId: Joi.string().uuid(), // optional override for Super Admin only; Admin is auto-scoped
  assignedToId: Joi.string().uuid().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(150),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED'),
  dueDate: Joi.date().allow(null),
  assignedToId: Joi.string().uuid().allow(null),
});

// Staff can only update status
const staffUpdateTaskSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED').required(),
});

module.exports = { createTaskSchema, updateTaskSchema, staffUpdateTaskSchema };

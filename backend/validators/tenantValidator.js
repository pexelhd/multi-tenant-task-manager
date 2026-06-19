const Joi = require('joi');

const createTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});

const updateTenantSchema = Joi.object({
  name: Joi.string().min(2).max(100),
});

module.exports = { createTenantSchema, updateTenantSchema };

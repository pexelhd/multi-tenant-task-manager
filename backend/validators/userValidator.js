const Joi = require('joi');

const createUserSchema = Joi.object({
  keycloakId: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'STAFF').required(),
  tenantId: Joi.string().uuid().allow(null).when('role', {
    is: 'SUPER_ADMIN',
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN', 'STAFF'),
  tenantId: Joi.string().uuid().allow(null),
});

module.exports = { createUserSchema, updateUserSchema };

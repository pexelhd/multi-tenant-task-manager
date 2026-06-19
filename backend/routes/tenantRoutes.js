const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const validate = require('../middleware/validate');

const tenantController = require('../controllers/tenantController');
const { createTenantSchema, updateTenantSchema } = require('../validators/tenantValidator');

// All tenant routes require authentication, and all are Super Admin only
router.use(verifyToken, requireRole('SUPER_ADMIN'));

router.post('/', validate(createTenantSchema), tenantController.createTenant);
router.get('/', tenantController.getTenants);
router.get('/:id', tenantController.getTenantById);
router.put('/:id', validate(updateTenantSchema), tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;

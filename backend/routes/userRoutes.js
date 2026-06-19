const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const loadDbUser = require('../middleware/loadDbUser');
const validate = require('../middleware/validate');

const userController = require('../controllers/userController');
const { createUserSchema, updateUserSchema } = require('../validators/userValidator');

// All routes require auth + a matching DB user record
router.use(verifyToken, loadDbUser);

// Only Super Admin and Admin can manage users
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createUserSchema), userController.createUser);
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), userController.getUsers);
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), userController.getUserById);
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), userController.deleteUser);

module.exports = router;

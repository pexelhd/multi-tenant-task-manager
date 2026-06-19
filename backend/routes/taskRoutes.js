const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/rbac');
const loadDbUser = require('../middleware/loadDbUser');
const validate = require('../middleware/validate');

const taskController = require('../controllers/taskController');
const {
  createTaskSchema,
  updateTaskSchema,
  staffUpdateTaskSchema,
} = require('../validators/taskValidator');

// All routes require auth + a matching DB user record
router.use(verifyToken, loadDbUser);

// Conditional validation middleware: pick schema based on role
function conditionalUpdateValidate(req, res, next) {
  const roles = req.user.roles;
  const isStaff = roles.includes('STAFF') && !roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN');
  const schema = isStaff ? staffUpdateTaskSchema : updateTaskSchema;
  return validate(schema)(req, res, next);
}

// Create: Super Admin + Admin only
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), validate(createTaskSchema), taskController.createTask);

// Read: all roles (visibility is scoped inside the controller)
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), taskController.getTasks);
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), taskController.getTaskById);

// Update: all roles can hit this route, but Staff is restricted to status-only via schema + controller checks
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'STAFF'), conditionalUpdateValidate, taskController.updateTask);

// Delete: Super Admin + Admin only
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), taskController.deleteTask);

module.exports = router;

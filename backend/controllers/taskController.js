const { Task, User, Tenant } = require('../models');
const { Op } = require('sequelize');

function getRoleInfo(req) {
  const roles = req.user.roles;
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('ADMIN');
  const isStaff = roles.includes('STAFF');
  return { isSuperAdmin, isAdmin, isStaff };
}

// Create Task (Super Admin: any tenant. Admin: own tenant only. Staff: cannot create.)
exports.createTask = async (req, res) => {
  try {
    const { isSuperAdmin } = getRoleInfo(req);
    const { title, description, status, dueDate, tenantId, assignedToId } = req.body;

    let finalTenantId = tenantId;
    if (!isSuperAdmin) {
      finalTenantId = req.dbUser.tenantId;
    }

    if (!finalTenantId) {
      return res.status(400).json({ success: false, message: 'tenantId is required' });
    }

    const tenant = await Tenant.findByPk(finalTenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // If assigning, validate the assignee belongs to the same tenant
    if (assignedToId) {
      const assignee = await User.findByPk(assignedToId);
      if (!assignee) {
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }
      if (assignee.tenantId !== finalTenantId) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'PENDING',
      dueDate,
      tenantId: finalTenantId,
      assignedToId: assignedToId || null,
      createdById: req.dbUser.id,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Tasks (Super Admin: all. Admin: own tenant. Staff: only assigned to them.)
exports.getTasks = async (req, res) => {
  try {
    const { isSuperAdmin, isStaff } = getRoleInfo(req);
    const { page = 1, limit = 10, search = '', status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (!isSuperAdmin) {
      where.tenantId = req.dbUser.tenantId;
    }
    if (isStaff) {
      where.assignedToId = req.dbUser.id;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
      ],
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get single Task (scoped)
exports.getTaskById = async (req, res) => {
  try {
    const { isSuperAdmin, isStaff } = getRoleInfo(req);
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
      ],
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!isSuperAdmin && task.tenantId !== req.dbUser.tenantId) {
      return res.status(403).json({ success: false, message: 'Forbidden: task belongs to another tenant' });
    }

    if (isStaff && task.assignedToId !== req.dbUser.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: this task is not assigned to you' });
    }

    return res.json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update Task (Super Admin/Admin: full update. Staff: status only, own tasks only.)
exports.updateTask = async (req, res) => {
  try {
    const { isSuperAdmin, isStaff } = getRoleInfo(req);
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!isSuperAdmin && task.tenantId !== req.dbUser.tenantId) {
      return res.status(403).json({ success: false, message: 'Forbidden: task belongs to another tenant' });
    }

    if (isStaff) {
      if (task.assignedToId !== req.dbUser.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: this task is not assigned to you' });
      }
      // Staff can only update status (already validated by staffUpdateTaskSchema)
      task.status = req.body.status;
      await task.save();
      return res.json({ success: true, data: task });
    }

    // Super Admin / Admin full update
    const { title, description, status, dueDate, assignedToId } = req.body;

    if (assignedToId) {
      const assignee = await User.findByPk(assignedToId);
      if (!assignee) {
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }
      if (assignee.tenantId !== task.tenantId) {
        return res.status(400).json({ success: false, message: 'Assigned user does not belong to this tenant' });
      }
      task.assignedToId = assignedToId;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();
    return res.json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Task (Super Admin/Admin only — enforced at route level)
exports.deleteTask = async (req, res) => {
  try {
    const { isSuperAdmin } = getRoleInfo(req);
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!isSuperAdmin && task.tenantId !== req.dbUser.tenantId) {
      return res.status(403).json({ success: false, message: 'Forbidden: task belongs to another tenant' });
    }

    await task.destroy();
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

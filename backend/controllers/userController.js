const { User, Tenant } = require('../models');
const { Op } = require('sequelize');

// Helper: is this requester scoped to one tenant?
function getTenantScope(req) {
  const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
  return isSuperAdmin ? null : req.dbUser.tenantId;
}

// Create User (Super Admin: any tenant. Admin: own tenant only)
exports.createUser = async (req, res) => {
  try {
    const { keycloakId, email, name, role, tenantId } = req.body;
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

    let finalTenantId = tenantId;

    // Admins can only create users within their own tenant
    if (!isSuperAdmin) {
      if (role === 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Cannot create a Super Admin user' });
      }
      finalTenantId = req.dbUser.tenantId;
    }

    if (finalTenantId) {
      const tenant = await Tenant.findByPk(finalTenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      keycloakId,
      email,
      name,
      role,
      tenantId: finalTenantId || null,
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get Users (Super Admin: all. Admin: own tenant only)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const tenantScope = getTenantScope(req);

    const where = {};
    if (tenantScope) {
      where.tenantId = tenantScope;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name'] }],
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

// Get single User by ID (scoped)
exports.getUserById = async (req, res) => {
  try {
    const tenantScope = getTenantScope(req);
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name'] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (tenantScope && user.tenantId !== tenantScope) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot access users from another tenant' });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update User (scoped)
exports.updateUser = async (req, res) => {
  try {
    const tenantScope = getTenantScope(req);
    const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (tenantScope && user.tenantId !== tenantScope) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot modify users from another tenant' });
    }

    const { email, name, role, tenantId } = req.body;

    if (!isSuperAdmin && role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot assign Super Admin role' });
    }

    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (isSuperAdmin && tenantId !== undefined) user.tenantId = tenantId;

    await user.save();
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete User (scoped)
exports.deleteUser = async (req, res) => {
  try {
    const tenantScope = getTenantScope(req);
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (tenantScope && user.tenantId !== tenantScope) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot delete users from another tenant' });
    }

    await user.destroy();
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

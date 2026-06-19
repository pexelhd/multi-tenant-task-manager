const { Tenant } = require('../models');

// Create Tenant (Super Admin only)
exports.createTenant = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tenant name is required' });
    }

    const existing = await Tenant.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Tenant with this name already exists' });
    }

    const tenant = await Tenant.create({ name });
    return res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all Tenants (Super Admin only)
exports.getTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const { Op } = require('sequelize');
    const where = search
      ? { name: { [Op.iLike]: `%${search}%` } }
      : {};

    const { count, rows } = await Tenant.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
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

// Get single Tenant by ID
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    return res.json({ success: true, data: tenant });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update Tenant (Super Admin only)
exports.updateTenant = async (req, res) => {
  try {
    const { name } = req.body;
    const tenant = await Tenant.findByPk(req.params.id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (name) tenant.name = name;
    await tenant.save();

    return res.json({ success: true, data: tenant });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Tenant (Super Admin only)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    await tenant.destroy();
    return res.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

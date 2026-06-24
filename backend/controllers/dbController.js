const { User, Task, Tenant } = require('../models');
const { Op } = require('sequelize');

exports.getSummary = async (req, res) => {
  try {
    const roles = req.user?.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    const taskWhere = isSuperAdmin ? {} : { tenantId: req.dbUser?.tenantId };
    const now = new Date();

    const [
      userCount,
      taskCount,
      tenantCount,
      pendingCount,
      inProgressCount,
      completedCount,
      overdueCount,
      highPriorityCount,
    ] = await Promise.all([
      User.count(),
      Task.count({ where: taskWhere }),
      Tenant.count(),
      Task.count({ where: { ...taskWhere, status: 'PENDING' } }),
      Task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      Task.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      Task.count({
        where: {
          ...taskWhere,
          status: { [Op.ne]: 'COMPLETED' },
          dueDate: { [Op.lt]: now },
        },
      }),
      Task.count({ where: { ...taskWhere, priority: 'HIGH', status: { [Op.ne]: 'COMPLETED' } } }),
    ]);

    return res.json({
      success: true,
      summary: {
        userCount,
        taskCount,
        tenantCount,
        pendingCount,
        inProgressCount,
        completedCount,
        overdueCount,
        highPriorityCount,
      },
    });
  } catch (err) {
    console.error('DB summary error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to query the database.' });
  }
};

const { Task, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');

function tenantScope(req) {
  const roles = req.user?.roles || [];
  if (roles.includes('SUPER_ADMIN')) return {};
  return { tenantId: req.dbUser?.tenantId };
}

exports.getAnalytics = async (req, res) => {
  try {
    const scope = tenantScope(req);
    const now = new Date();

    // Tasks by status
    const byStatus = await Task.findAll({
      where: scope,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    // Tasks by priority
    const byPriority = await Task.findAll({
      where: scope,
      attributes: ['priority', [fn('COUNT', col('id')), 'count']],
      group: ['priority'],
      raw: true,
    });

    // Tasks created per day — last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const createdPerDay = await Task.findAll({
      where: { ...scope, createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    });

    // Tasks completed per day — last 30 days
    const completedPerDay = await Task.findAll({
      where: { ...scope, status: 'COMPLETED', updatedAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [fn('DATE', col('updatedAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('updatedAt'))],
      order: [[fn('DATE', col('updatedAt')), 'ASC']],
      raw: true,
    });

    // Tasks by assignee (top 10)
    const byAssignee = await Task.findAll({
      where: { ...scope, assignedToId: { [Op.ne]: null } },
      attributes: ['assignedToId', [fn('COUNT', col('Task.id')), 'count']],
      include: [{ model: User, as: 'assignedTo', attributes: ['name'] }],
      group: ['Task.assignedToId', 'assignedTo.id'],
      order: [[fn('COUNT', col('Task.id')), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Overdue by priority
    const overdueByPriority = await Task.findAll({
      where: {
        ...scope,
        status: { [Op.ne]: 'COMPLETED' },
        dueDate: { [Op.lt]: now },
      },
      attributes: ['priority', [fn('COUNT', col('id')), 'count']],
      group: ['priority'],
      raw: true,
    });

    // Merge created/completed into a single timeline array (last 30 days)
    const dateMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { date: key, created: 0, completed: 0 };
    }
    createdPerDay.forEach((r) => {
      const key = String(r.date).split('T')[0];
      if (dateMap[key]) dateMap[key].created = parseInt(r.count, 10);
    });
    completedPerDay.forEach((r) => {
      const key = String(r.date).split('T')[0];
      if (dateMap[key]) dateMap[key].completed = parseInt(r.count, 10);
    });
    const timeline = Object.values(dateMap);

    return res.json({
      success: true,
      data: {
        byStatus: byStatus.map((r) => ({ name: r.status.replace('_', ' '), value: parseInt(r.count, 10) })),
        byPriority: byPriority.map((r) => ({ name: r.priority, value: parseInt(r.count, 10) })),
        timeline,
        byAssignee: byAssignee.map((r) => ({
          name: r['assignedTo.name'] || 'Unknown',
          count: parseInt(r.count, 10),
        })),
        overdueByPriority: overdueByPriority.map((r) => ({
          name: r.priority,
          value: parseInt(r.count, 10),
        })),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const { User, Task, Tenant } = require('../models');

exports.getSummary = async (req, res) => {
  try {
    const [userCount, taskCount, tenantCount] = await Promise.all([
      User.count(),
      Task.count(),
      Tenant.count(),
    ]);

    return res.json({
      success: true,
      summary: {
        userCount,
        taskCount,
        tenantCount,
      },
    });
  } catch (err) {
    console.error('DB summary error:', err.message);
    return res.status(500).json({ success: false, message: 'Unable to query the database.' });
  }
};

const { TaskComment, Task, User } = require('../models');

function tenantScope(req) {
  const roles = req.user?.roles || [];
  if (roles.includes('SUPER_ADMIN')) return {};
  return { tenantId: req.dbUser?.tenantId };
}

// GET /api/tasks/:taskId/comments
exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ where: { id: taskId, ...tenantScope(req) } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const comments = await TaskComment.findAll({
      where: { taskId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'ASC']],
    });

    return res.json({ success: true, data: comments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tasks/:taskId/comments
exports.createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const task = await Task.findOne({ where: { id: taskId, ...tenantScope(req) } });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const roles = req.user?.roles || [];
    const isStaff = roles.includes('STAFF') && !roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN');
    if (isStaff && task.assignedToId !== req.dbUser.id) {
      return res.status(403).json({ success: false, message: 'You can only comment on tasks assigned to you' });
    }

    const comment = await TaskComment.create({
      taskId,
      userId: req.dbUser.id,
      content: content.trim(),
    });

    const full = await TaskComment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'role'] }],
    });

    return res.status(201).json({ success: true, data: full });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/tasks/:taskId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const roles = req.user?.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    const comment = await TaskComment.findOne({ where: { id: commentId, taskId } });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only author or super admin can delete
    if (!isSuperAdmin && comment.userId !== req.dbUser.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    await comment.destroy();
    return res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * RBAC middleware factory.
 * Usage: requireRole('SUPER_ADMIN', 'ADMIN')
 * Allows access only if req.user.roles includes one of the allowed roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
}

module.exports = requireRole;

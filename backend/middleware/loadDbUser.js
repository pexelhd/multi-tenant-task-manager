const { User } = require('../models');

/**
 * Loads the corresponding database User record for the authenticated
 * Keycloak identity, and attaches it as req.dbUser.
 * Must run AFTER verifyToken (needs req.user.keycloakId).
 */
async function loadDbUser(req, res, next) {
  try {
    const user = await User.findOne({ where: { keycloakId: req.user.keycloakId } });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'No matching user record found in the system. Contact an administrator.',
      });
    }

    req.dbUser = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = loadDbUser;

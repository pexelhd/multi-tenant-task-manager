const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {}, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = {
      keycloakId: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.preferred_username,
      // Keycloak roles usually live under realm_access.roles
      roles: decoded.realm_access ? decoded.realm_access.roles : [],
    };

    next();
  });
}

module.exports = verifyToken;

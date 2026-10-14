const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Extract token from Authorization header or cookies
 */
function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7).trim();
  }
  if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
    return req.cookies.token || req.cookies.jwt;
  }
  return null;
}

/**
 * General authentication middleware
 */
function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    if (req.accepts('html') && !req.path.startsWith('/api/')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }
}

/**
 * Role-based access control middleware factory
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
        });
      }
      next();
    });
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin: requireRole('ADMIN'),
  requireSupervisor: requireRole('SUPERVISOR'),
  requireTeamMember: requireRole('TEAM_MEMBER'),
  requireSupervisorOrAdmin: requireRole('ADMIN', 'SUPERVISOR')
};

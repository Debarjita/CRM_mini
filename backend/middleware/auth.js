// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Optional auth middleware (doesn't block if not authenticated)
const optionalAuth = (req, res, next) => {
  // Just continue regardless of auth status
  next();
};

// Admin auth middleware (if you need admin-only routes)
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireAdmin
};
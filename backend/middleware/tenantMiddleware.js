const tenantMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Super Admin handling
  if (req.user.role === "super_admin") {
    // If super admin is in support/impersonation mode (or explicitly specified agencyId via header or query)
    const agencyHeader = req.headers["x-impersonate-agency-id"] || req.query.agencyId;
    if (agencyHeader) {
      req.agencyId = parseInt(agencyHeader, 10);
    }
    
    // If an agency-scoped mutation or specific read route requires an agencyId
    // and none is set, controllers or this check will guide the Super Admin
    return next();
  }

  // All other users must belong to an agency
  if (!req.user.agencyId) {
    return res.status(403).json({
      success: false,
      message: "User is not associated with an agency",
    });
  }

  // Always force tenant scope to authenticated user's agencyId (tamper-proof)
  req.agencyId = req.user.agencyId;

  next();
};

export default tenantMiddleware;
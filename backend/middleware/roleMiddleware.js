const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // Super Admin has platform-wide permissions and support access
        if (req.user.role === "super_admin") {
            return next();
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission for this resource.",
            });
        }

        next();
    };
};

export default roleMiddleware;
import jwt from "jsonwebtoken";
import { User, Agency, Client } from "../models/index.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    // Super Admin handling & Support Mode (Impersonation)
    if (user.role === "super_admin") {
      const impersonateHeader = req.headers["x-impersonate-agency-id"];
      if (impersonateHeader) {
        const targetAgencyId = parseInt(impersonateHeader, 10);
        if (!isNaN(targetAgencyId)) {
          const targetAgency = await Agency.findByPk(targetAgencyId);
          if (targetAgency) {
            req.agencyId = targetAgency.id;
            req.isImpersonating = true;
            req.impersonatedAgency = targetAgency;
          }
        }
      } else {
        req.agencyId = null;
        req.isImpersonating = false;
      }
    } else {
      // Non-super admin users must belong to an active agency
      if (!user.agencyId) {
        return res.status(403).json({
          success: false,
          message: "User is not associated with an agency",
        });
      }

      const agency = await Agency.findByPk(user.agencyId);

      if (!agency) {
        return res.status(403).json({
          success: false,
          message: "Agency not found",
        });
      }

      if (agency.status === "suspended" || agency.status === "inactive" || agency.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Your agency account has been suspended. Please contact support.",
        });
      }

      req.agencyId = user.agencyId;

      // Handle client association
      if (user.role === "agency_client") {
        if (user.clientId) {
          req.clientId = user.clientId;
        } else {
          const client = await Client.findOne({
            where: {
              email: user.email,
              agencyId: user.agencyId,
            },
          });
          if (client) {
            req.clientId = client.id;
            user.clientId = client.id;
            await user.save();
          }
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;

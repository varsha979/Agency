import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, impersonatedAgency } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Super Admin has universal access (especially when in Support Mode impersonating an agency)
    if (user.role === "super_admin") {
        return <Layout>{children}</Layout>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
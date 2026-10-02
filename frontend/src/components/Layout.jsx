import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
    const { user, impersonatedAgency, exitImpersonation, logoutUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleExitSupport = () => {
        exitImpersonation();
        navigate("/super-admin/agencies");
    };

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };

    const isSuperAdminImpersonating = user?.role === "super_admin" && impersonatedAgency;

    const navLinkClass = ({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`;

    return (
        <div className="app-layout">
            {/* 1. Prominent Support Mode (Impersonation) Banner */}
            {isSuperAdminImpersonating && (
                <div className="impersonation-banner">
                    <div className="banner-content">
                        <span className="banner-icon">⚠️</span>
                        <span>
                            <strong>Support Mode Active:</strong> You are viewing{" "}
                            <span className="agency-highlight">
                                {impersonatedAgency.name}
                            </span>{" "}
                            workspace as <strong>Super Admin</strong>.
                        </span>
                    </div>
                    <button
                        className="exit-support-btn"
                        onClick={handleExitSupport}
                    >
                        Exit Support Mode ✕
                    </button>
                </div>
            )}

            {/* 2. Top Header Bar */}
            <header className="app-topbar">
                <div className="topbar-brand">
                    <Link to={user?.role === "super_admin" && !isSuperAdminImpersonating ? "/super-admin" : user?.role === "agency_client" ? "/client" : "/agency"}>
                        <span className="brand-logo-text">Agency<span>Sync</span></span>
                    </Link>
                    {impersonatedAgency && (
                        <span className="tenant-tag">
                            🏢 {impersonatedAgency.name}
                        </span>
                    )}
                </div>

                <div className="topbar-right">
                    <span className={`role-badge ${user?.role}`}>
                        {user?.role === "super_admin"
                            ? "SUPER ADMIN"
                            : user?.role === "agency_admin"
                            ? "AGENCY ADMIN"
                            : user?.role === "agency_team"
                            ? "TEAM MEMBER"
                            : "CLIENT PORTAL"}
                    </span>

                    <div className="user-profile-badge">
                        <div className="avatar-circle">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="user-info-text">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                    </div>

                    <button className="btn-logout" onClick={handleLogout} title="Log Out">
                        Sign Out
                    </button>
                </div>
            </header>

            <div className="app-body">
                {/* 3. Navigation Sidebar */}
                <aside className="app-sidebar">
                    <nav className="sidebar-nav">
                        {/* Super Admin Navigation (when NOT impersonating) */}
                        {user?.role === "super_admin" && !isSuperAdminImpersonating && (
                            <>
                                <div className="nav-section-title">PLATFORM OWNER</div>
                                <NavLink to="/super-admin" end className={navLinkClass}>
                                    <span className="nav-icon">📊</span> Platform Dashboard
                                </NavLink>
                                <NavLink to="/super-admin/agencies" className={navLinkClass}>
                                    <span className="nav-icon">🏢</span> Agency Management
                                </NavLink>
                                <NavLink to="/super-admin/activities" className={navLinkClass}>
                                    <span className="nav-icon">📜</span> Platform Audit Log
                                </NavLink>
                            </>
                        )}

                        {/* Agency Navigation (Agency Admin, Agency Team, or Super Admin in Support Mode) */}
                        {(user?.role === "agency_admin" ||
                            user?.role === "agency_team" ||
                            isSuperAdminImpersonating) && (
                            <>
                                <div className="nav-section-title">
                                    {isSuperAdminImpersonating
                                        ? `AGENCY: ${impersonatedAgency.name.toUpperCase()}`
                                        : "WORKSPACE"}
                                </div>
                                <NavLink to="/agency" end className={navLinkClass}>
                                    <span className="nav-icon">📈</span> Dashboard
                                </NavLink>
                                <NavLink to="/agency/projects" className={navLinkClass}>
                                    <span className="nav-icon">📁</span> Projects & Workflow
                                </NavLink>
                                <NavLink to="/agency/clients" className={navLinkClass}>
                                    <span className="nav-icon">👥</span> Clients
                                </NavLink>
                                {(user?.role === "agency_admin" || isSuperAdminImpersonating) && (
                                    <NavLink to="/agency/team" className={navLinkClass}>
                                        <span className="nav-icon">🛡️</span> Team Members
                                    </NavLink>
                                )}
                                <NavLink to="/agency/meetings" className={navLinkClass}>
                                    <span className="nav-icon">📅</span> Meetings
                                </NavLink>
                                <NavLink to="/agency/feedback" className={navLinkClass}>
                                    <span className="nav-icon">💬</span> Feedback & Requests
                                </NavLink>
                                <NavLink to="/agency/files" className={navLinkClass}>
                                    <span className="nav-icon">📂</span> Documents & Files
                                </NavLink>

                                {isSuperAdminImpersonating && (
                                    <div className="impersonation-quick-exit">
                                        <button
                                            onClick={handleExitSupport}
                                            className="btn-exit-impersonation"
                                        >
                                            ← Back to Super Admin
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Client Portal Navigation */}
                        {user?.role === "agency_client" && (
                            <>
                                <div className="nav-section-title">CLIENT PORTAL</div>
                                <NavLink to="/client" end className={navLinkClass}>
                                    <span className="nav-icon">🏠</span> Overview & Projects
                                </NavLink>
                            </>
                        )}
                    </nav>
                </aside>

                {/* 4. Main Page Content */}
                <main className="app-main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;

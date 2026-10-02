import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const { user } = useAuth();

    const linkClass = ({ isActive }) =>
        `block px-4 py-3 rounded-lg transition ${
            isActive
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
        }`;

    return (
        <aside className="w-64 min-h-screen bg-white border-r p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-blue-600">
                    AgencySync
                </h1>
                <p className="text-sm text-gray-500">
                    Project Management
                </p>
            </div>

            <nav className="space-y-2">

                {user?.role === "super_admin" && (
                    <>
                        <NavLink to="/super-admin" className={linkClass}>
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/super-admin/agencies"
                            className={linkClass}
                        >
                            Agencies
                        </NavLink>
                    </>
                )}

                {(user?.role === "agency_admin" ||
                    user?.role === "agency_team") && (
                    <>
                        <NavLink to="/agency" className={linkClass}>
                            Dashboard
                        </NavLink>

                        <NavLink to="/agency/team" className={linkClass}>
                            Team
                        </NavLink>

                        <NavLink to="/agency/clients" className={linkClass}>
                            Clients
                        </NavLink>

                        <NavLink to="/agency/projects" className={linkClass}>
                            Projects
                        </NavLink>

                        <NavLink to="/agency/meetings" className={linkClass}>
                            Meetings
                        </NavLink>

                        <NavLink to="/agency/feedback" className={linkClass}>
                            Feedback
                        </NavLink>

                        <NavLink to="/agency/files" className={linkClass}>
                            Files
                        </NavLink>
                    </>
                )}

                {user?.role === "agency_client" && (
                    <NavLink to="/client" className={linkClass}>
                        My Dashboard
                    </NavLink>
                )}

            </nav>
        </aside>
    );
};

export default Sidebar;
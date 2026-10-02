import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const AgencyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { impersonateAgency } = useAuth();

    const [agency, setAgency] = useState(null);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            const response = await api.get(`/super-admin/agencies/${id}`);

            if (response.data.success) {
                setAgency(response.data.agency);
                setStats(response.data.stats);
                setUsers(response.data.users);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load agency details"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleEnterSupportMode = async () => {
        if (!agency || agency.status !== "active") {
            toast.error("Cannot enter support mode for a non-active agency");
            return;
        }

        try {
            const response = await api.post(`/super-admin/agencies/${agency.id}/support`);
            if (response.data.success) {
                impersonateAgency(response.data.agency);
                toast.info(`Entered Support Mode for ${agency.name}`);
                navigate("/agency");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to enter support mode");
        }
    };

    const handleToggleStatus = async (newStatus) => {
        try {
            const res = await api.patch(`/super-admin/agencies/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchDetails();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Status change failed");
        }
    };

    if (loading) {
        return <div className="loading-state">Loading agency information...</div>;
    }

    if (!agency) {
        return (
            <div className="page-container">
                <h2>Agency not found</h2>
                <button className="btn-secondary mt-4" onClick={() => navigate("/super-admin/agencies")}>
                    ← Back to Agencies
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="flex-between mb-4">
                <button
                    className="btn-secondary"
                    onClick={() => navigate("/super-admin/agencies")}
                >
                    ← Back to Agencies
                </button>

                <div className="action-row">
                    {agency.status === "active" ? (
                        <button
                            className="btn-primary"
                            onClick={handleEnterSupportMode}
                        >
                            👁️ Enter Agency Workspace (Support Mode)
                        </button>
                    ) : (
                        <button
                            className="btn-secondary"
                            onClick={() => handleToggleStatus("active")}
                        >
                            Activate Agency
                        </button>
                    )}

                    {agency.status === "active" && (
                        <button
                            className="btn-danger"
                            onClick={() => handleToggleStatus("suspended")}
                        >
                            Suspend Agency
                        </button>
                    )}
                </div>
            </div>

            <div className="page-header">
                <div>
                    <h1 className="page-title">{agency.name}</h1>
                    <p className="page-subtitle">{agency.email}</p>
                </div>
                <span className={`badge ${
                    agency.status === "active"
                        ? "badge-green"
                        : agency.status === "suspended"
                        ? "badge-red"
                        : "badge-gray"
                }`}>
                    {agency.status.toUpperCase()}
                </span>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <span className="metric-label">Team Members</span>
                    <h2 className="metric-value">{stats?.users || 0}</h2>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Clients</span>
                    <h2 className="metric-value">{stats?.clients || 0}</h2>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Projects</span>
                    <h2 className="metric-value">{stats?.projects || 0}</h2>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Tasks</span>
                    <h2 className="metric-value">{stats?.tasks || 0}</h2>
                </div>
            </div>

            <div className="details-card">
                <h3>Agency Metadata</h3>
                <div className="details-grid">
                    <div>
                        <strong>Company Name</strong>
                        <p>{agency.name}</p>
                    </div>
                    <div>
                        <strong>Contact Email</strong>
                        <p>{agency.email}</p>
                    </div>
                    <div>
                        <strong>Phone</strong>
                        <p>{agency.phone || "Not set"}</p>
                    </div>
                    <div>
                        <strong>Registered Since</strong>
                        <p>{new Date(agency.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="details-card">
                <h3>Registered Team Members & Admins</h3>
                {users.length === 0 ? (
                    <p className="empty-text">No users found for this agency.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td><strong>{user.name}</strong></td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className="role-tag">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.status === "active" ? "badge-green" : "badge-gray"}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgencyDetails;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const response = await api.get("/super-admin/dashboard");

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return <div className="loading-state">Loading platform metrics...</div>;
    }

    if (!stats) {
        return <div className="empty-state">Unable to load dashboard.</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Super Admin Platform Overview</h1>
                    <p className="page-subtitle">
                        Cross-tenant metrics, platform health, and agency administration
                    </p>
                </div>
                <div className="action-row">
                    <Link to="/super-admin/agencies" className="btn-primary">
                        🏢 Manage Agencies
                    </Link>
                    <Link to="/super-admin/activities" className="btn-secondary">
                        📜 View Audit Log
                    </Link>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <span className="metric-label">Total Agencies</span>
                    <h2 className="metric-value">{stats.totalAgencies}</h2>
                    <span className="metric-hint">Platform registered tenants</span>
                </div>

                <div className="metric-card highlight-green">
                    <span className="metric-label">Active Agencies</span>
                    <h2 className="metric-value">{stats.activeAgencies}</h2>
                    <span className="metric-hint">Operational workspaces</span>
                </div>

                <div className="metric-card highlight-amber">
                    <span className="metric-label">Inactive Agencies</span>
                    <h2 className="metric-value">{stats.inactiveAgencies}</h2>
                    <span className="metric-hint">Pending activation</span>
                </div>

                <div className="metric-card highlight-red">
                    <span className="metric-label">Suspended Agencies</span>
                    <h2 className="metric-value">{stats.suspendedAgencies}</h2>
                    <span className="metric-hint">Login blocked</span>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Total Users</span>
                    <h2 className="metric-value">{stats.totalUsers}</h2>
                    <span className="metric-hint">Admins, team & clients</span>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Total Clients</span>
                    <h2 className="metric-value">{stats.totalClients}</h2>
                    <span className="metric-hint">Across all agencies</span>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Total Projects</span>
                    <h2 className="metric-value">{stats.totalProjects}</h2>
                    <span className="metric-hint">Active & completed</span>
                </div>

                <div className="metric-card">
                    <span className="metric-label">Total Tasks</span>
                    <h2 className="metric-value">{stats.totalTasks}</h2>
                    <span className="metric-hint">Real work items tracked</span>
                </div>
            </div>

            <div className="details-card mt-6">
                <h3>Quick Management Links</h3>
                <div className="quick-actions-grid">
                    <Link to="/super-admin/agencies" className="quick-action-card">
                        <span className="qa-icon">🏢</span>
                        <div>
                            <strong>Agency Management & Support Mode</strong>
                            <p>Browse agency directory, toggle active/suspended statuses, or enter support mode to view tenant workspaces.</p>
                        </div>
                    </Link>
                    <Link to="/super-admin/activities" className="quick-action-card">
                        <span className="qa-icon">📜</span>
                        <div>
                            <strong>Platform-Wide Audit Trail</strong>
                            <p>Inspect real-time actions, entity updates, and security events across all tenants.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
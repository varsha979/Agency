import { useEffect, useState } from "react";
import api from "../../services/api";

const PlatformActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await api.get("/super-admin/activities");
            if (response.data.success) {
                setActivities(response.data.activities);
            }
        } catch (error) {
            console.error("Failed to fetch platform activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    const getActionBadgeClass = (action) => {
        if (action?.includes("created") || action?.includes("added")) return "badge-green";
        if (action?.includes("updated") || action?.includes("status")) return "badge-blue";
        if (action?.includes("deleted") || action?.includes("removed")) return "badge-red";
        return "badge-gray";
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Platform Audit & Activity Log</h1>
                    <p className="page-subtitle">
                        Real-time audit trail of operations across all agency tenants
                    </p>
                </div>
                <button className="btn-secondary" onClick={fetchActivities}>
                    🔄 Refresh Log
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading activity audit log...</div>
            ) : activities.length === 0 ? (
                <div className="empty-state">No platform activities recorded yet.</div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Agency Tenant</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Description</th>
                                <th>Client Visible</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((act) => (
                                <tr key={act.id}>
                                    <td className="timestamp-cell">
                                        {new Date(act.createdAt).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className="tenant-pill">
                                            {act.Agency?.name || `Agency #${act.agencyId}`}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actor-cell">
                                            <strong>{act.User?.name || "System"}</strong>
                                            <span className="sub-text">{act.User?.role || "Automated"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${getActionBadgeClass(act.action)}`}>
                                            {act.action?.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td>{act.description}</td>
                                    <td>
                                        {act.isClientVisible ? (
                                            <span className="badge badge-green">Yes</span>
                                        ) : (
                                            <span className="badge badge-gray">Internal Only</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PlatformActivities;

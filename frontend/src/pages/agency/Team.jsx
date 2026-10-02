import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const Team = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "agency_team",
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            const res = await api.get("/team");
            if (res.data.success) {
                setMembers(res.data.members);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load team");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.post("/team", form);
            if (res.data.success) {
                toast.success("Team member invited successfully");
                setShowInviteModal(false);
                setForm({ name: "", email: "", password: "", role: "agency_team" });
                fetchTeam();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create team member");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (memberId, currentStatus) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        try {
            const res = await api.patch(`/team/${memberId}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(res.data.message);
                fetchTeam();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDeleteMember = async (memberId) => {
        if (!window.confirm("Remove this team member from the agency?")) return;
        try {
            const res = await api.delete(`/team/${memberId}`);
            if (res.data.success) {
                toast.success("Team member removed");
                fetchTeam();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    };

    const isAgencyAdmin = user?.role === "agency_admin" || user?.role === "super_admin";

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Agency Team Management</h1>
                    <p className="page-subtitle">
                        Manage agency specialists, assign roles, and control access permissions
                    </p>
                </div>
                {isAgencyAdmin && (
                    <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                        + Invite Team Member
                    </button>
                )}
            </div>

            {loading ? (
                <div className="loading-state">Loading team roster...</div>
            ) : members.length === 0 ? (
                <div className="empty-state">No team members registered yet.</div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                {isAgencyAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="member-name-cell">
                                            <div className="avatar-circle-sm">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <strong>{member.name}</strong>
                                        </div>
                                    </td>
                                    <td>{member.email}</td>
                                    <td>
                                        <span className={`role-tag ${member.role === "agency_admin" ? "admin" : ""}`}>
                                            {member.role === "agency_admin" ? "Agency Admin" : "Specialist / Team"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${member.status === "active" ? "badge-green" : "badge-gray"}`}>
                                            {member.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="timestamp-cell">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </td>
                                    {isAgencyAdmin && (
                                        <td>
                                            <div className="action-row">
                                                <button
                                                    className="btn-sm btn-secondary"
                                                    onClick={() => handleToggleStatus(member.id, member.status)}
                                                >
                                                    {member.status === "active" ? "Deactivate" : "Activate"}
                                                </button>
                                                {member.id !== user?.id && (
                                                    <button
                                                        className="btn-sm btn-danger"
                                                        onClick={() => handleDeleteMember(member.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Invite Agency Member</h2>
                            <button className="modal-close-btn" onClick={() => setShowInviteModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Jane Doe"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Work Email *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="e.g. jane@nexus.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Initial Password *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Minimum 8 characters"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Role & Permissions *</label>
                                <select
                                    className="form-input"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="agency_team">Specialist / Team Member (Assigned Projects & Tasks)</option>
                                    <option value="agency_admin">Agency Administrator (Full Management Access)</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Inviting..." : "Create Team Member"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
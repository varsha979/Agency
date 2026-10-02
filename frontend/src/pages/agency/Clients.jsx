import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const Clients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const [form, setForm] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        password: "",
    });

    const [editForm, setEditForm] = useState({
        name: "",
        companyName: "",
        phone: "",
        status: "active",
    });

    const [submitting, setSubmitting] = useState(false);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await api.get("/clients");
            if (res.data.success) {
                setClients(res.data.clients);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.post("/clients", form);
            if (res.data.success) {
                toast.success("Client registered and portal login created!");
                setShowCreateModal(false);
                setForm({ name: "", companyName: "", email: "", phone: "", password: "" });
                fetchClients();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create client");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditOpen = (client) => {
        setEditingClient(client);
        setEditForm({
            name: client.name,
            companyName: client.companyName || "",
            phone: client.phone || "",
            status: client.status || "active",
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.put(`/clients/${editingClient.id}`, editForm);
            if (res.data.success) {
                toast.success("Client details updated");
                setEditingClient(null);
                fetchClients();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update client");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this client company and revoke their portal access?")) return;
        try {
            const res = await api.delete(`/clients/${id}`);
            if (res.data.success) {
                toast.success("Client deleted");
                fetchClients();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete client");
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Client Company Directory</h1>
                    <p className="page-subtitle">
                        Manage client companies, contact persons, and portal login credentials
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Register New Client
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading client directory...</div>
            ) : clients.length === 0 ? (
                <div className="empty-state">No clients registered in your agency yet.</div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Active Projects</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="company-cell">
                                            <span className="company-avatar">
                                                {client.companyName?.charAt(0).toUpperCase() || "C"}
                                            </span>
                                            <strong>{client.companyName || "Unnamed Company"}</strong>
                                        </div>
                                    </td>
                                    <td>{client.name}</td>
                                    <td>{client.email}</td>
                                    <td>{client.phone || "-"}</td>
                                    <td>
                                        <span className="badge badge-blue">
                                            {client.Projects?.length || 0} Projects
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${client.status === "active" ? "badge-green" : "badge-gray"}`}>
                                            {client.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button
                                                className="btn-sm btn-secondary"
                                                onClick={() => handleEditOpen(client)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn-sm btn-danger"
                                                onClick={() => handleDelete(client.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Client Modal */}
            {showCreateModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Register New Client Company</h2>
                            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Acme Corporation"
                                    value={form.companyName}
                                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Primary Contact Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. John Doe"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Portal Login Email *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="e.g. contact@acme.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Initial Password for Client Portal *</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Password for client to log in"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="+1 (555) 000-0000"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Registering..." : "Create Client & Login"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Client Modal */}
            {editingClient && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Edit Client Information</h2>
                            <button className="modal-close-btn" onClick={() => setEditingClient(null)}>✕</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editForm.companyName}
                                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Contact Person</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    className="form-input"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setEditingClient(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const Agencies = () => {
  const navigate = useNavigate();
  const { impersonateAgency } = useAuth();
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAgencies = async () => {
    try {
      setLoading(true);

      const response = await api.get("/super-admin/agencies", {
        params: {
          search: search || undefined,
          status: status || undefined,
        },
      });

      if (response.data.success) {
        setAgencies(response.data.agencies);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load agencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, [search, status]);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/super-admin/agencies/${id}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        fetchAgencies();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update agency status");
    }
  };

  const handleEnterSupportMode = async (agency) => {
    if (agency.status !== "active") {
      toast.error(`Cannot enter support mode for a ${agency.status} agency.`);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agency Tenant Management</h1>
          <p className="page-subtitle">
            Manage agency tenants, toggle operational status, and enter Support Mode.
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          className="form-input search-input"
          placeholder="Search by agency name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading registered agencies...</div>
      ) : agencies.length === 0 ? (
        <div className="empty-state">No agencies found matching criteria.</div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id}>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => navigate(`/super-admin/agencies/${agency.id}`)}
                    >
                      <strong>{agency.name}</strong>
                    </button>
                  </td>

                  <td>{agency.email}</td>

                  <td>{agency.phone || "-"}</td>

                  <td>
                    <span className={`badge ${
                      agency.status === "active"
                        ? "badge-green"
                        : agency.status === "suspended"
                        ? "badge-red"
                        : "badge-gray"
                    }`}>
                      {agency.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="timestamp-cell">
                    {new Date(agency.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    <div className="action-row">
                      {/* Support Mode Impersonation Button */}
                      {agency.status === "active" ? (
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleEnterSupportMode(agency)}
                          title="Enter agency workspace in support mode"
                        >
                          👁️ Support Mode
                        </button>
                      ) : (
                        <button
                          className="btn-sm btn-disabled"
                          disabled
                          title="Activate agency to access support mode"
                        >
                          Support Mode Locked
                        </button>
                      )}

                      {/* Status Toggle Controls */}
                      {agency.status !== "active" && (
                        <button
                          className="btn-sm btn-secondary"
                          onClick={() => updateStatus(agency.id, "active")}
                        >
                          Activate
                        </button>
                      )}

                      {agency.status !== "suspended" && (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => updateStatus(agency.id, "suspended")}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
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

export default Agencies;

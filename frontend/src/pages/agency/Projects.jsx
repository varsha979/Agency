import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    managerId: "",
    priority: "medium",
    status: "planning",
    startDate: "",
    dueDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, clientsRes, teamRes] = await Promise.all([
        api.get("/projects"),
        api.get("/clients"),
        api.get("/team"),
      ]);

      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }
      if (clientsRes.data.success) {
        setClients(clientsRes.data.clients);
      }
      if (teamRes.data.success) {
        setTeam(teamRes.data.members);
      }
    } catch (error) {
      console.error("Failed to fetch projects data:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.clientId) {
      toast.error("Project name and client are required");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/projects", form);
      if (res.data.success) {
        toast.success("Project created successfully");
        setShowCreateModal(false);
        setForm({
          name: "",
          description: "",
          clientId: "",
          managerId: "",
          priority: "medium",
          status: "planning",
          startDate: "",
          dueDate: "",
        });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = statusFilter
    ? projects.filter((p) => p.status === statusFilter)
    : projects;

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "badge-green";
      case "in_progress":
        return "badge-blue";
      case "on_hold":
        return "badge-amber";
      default:
        return "badge-gray";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "badge-red";
      case "medium":
        return "badge-amber";
      default:
        return "badge-gray";
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects & Deliverables</h1>
          <p className="page-subtitle">
            Manage agency client projects with real-time derived progress tracking
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Project
        </button>
      </div>

      <div className="filters-bar">
        <select
          className="input-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Project Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <span className="sub-text">
          Showing {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      {loading ? (
        <div className="loading-state">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">No projects found. Create one to get started!</div>
      ) : (
        <div className="project-cards-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div>
                  <h3 className="project-title">{project.name}</h3>
                  <span className="project-client-name">
                    🏢 {project.Client?.companyName || project.Client?.name || "Unassigned Client"}
                  </span>
                </div>
                <div className="badge-row">
                  <span className={`badge ${getPriorityBadge(project.priority)}`}>
                    {project.priority?.toUpperCase()}
                  </span>
                  <span className={`badge ${getStatusBadge(project.status)}`}>
                    {project.status?.replace("_", " ")}
                  </span>
                </div>
              </div>

              <p className="project-desc">
                {project.description || "No description provided."}
              </p>

              {/* Dynamic Derived Progress Bar */}
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-label">Derived Real Progress</span>
                  <span className="progress-percent font-bold">
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <span className="progress-subtext">
                  {project.completedTasks !== undefined
                    ? `${project.completedTasks} of ${project.totalTasks} tasks completed`
                    : "Calculated from completed tasks"}
                </span>
              </div>

              <div className="project-meta-grid">
                <div>
                  <span className="meta-label">Project Manager</span>
                  <p className="meta-value">
                    {project.manager?.name || "Lead Assigned"}
                  </p>
                </div>
                <div>
                  <span className="meta-label">Due Date</span>
                  <p className="meta-value">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Flexible"}
                  </p>
                </div>
              </div>

              <div className="project-card-footer">
                <Link
                  to={`/agency/projects/${project.id}`}
                  className="btn-block btn-secondary text-center"
                >
                  Open Project Workspace →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Create New Client Project</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Next-Gen Mobile App Redesign"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client Company *</label>
                <select
                  className="form-input"
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  required
                >
                  <option value="">Select Client Company</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Project Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describe project objectives and scope..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Project Manager</label>
                  <select
                    className="form-input"
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  >
                    <option value="">Assign Later</option>
                    {team.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-input"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Target Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

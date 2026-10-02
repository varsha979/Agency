import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const AgencyDashboard = () => {
  const { user, impersonatedAgency } = useAuth();
  const [data, setData] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, myTasksRes] = await Promise.allSettled([
        api.get("/agencies/dashboard"),
        api.get("/tasks/my-tasks"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.success) {
        setData(dashRes.value.data);
      } else if (dashRes.status === "rejected") {
        toast.error(
          dashRes.reason.response?.data?.message || "Failed to load agency dashboard"
        );
      }

      if (myTasksRes.status === "fulfilled" && myTasksRes.value.data.success) {
        setMyTasks(myTasksRes.value.data.tasks || []);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load agency dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [impersonatedAgency]);

  if (loading) {
    return <div className="loading-state">Loading workspace dashboard...</div>;
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="card text-center p-8">
          <h2>Unable to load dashboard</h2>
          <p className="sub-text mt-2">
            Please make sure you have active agency permissions or contact your agency administrator.
          </p>
          <button className="btn-primary mt-4" onClick={fetchDashboard}>
            Retry Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { agency, stats, recentProjects, recentActivities } = data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agency Workspace Dashboard</h1>
          <p className="page-subtitle">
            Welcome to {agency.name} • Operational Overview
          </p>
        </div>

        <div className="action-row">
          <Link to="/agency/projects" className="btn-primary">
            📁 View All Projects
          </Link>
          <Link to="/agency/clients" className="btn-secondary">
            👥 Clients Directory
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card highlight-blue">
          <span className="metric-label">Active Projects</span>
          <h2 className="metric-value">{stats.activeProjects || 0}</h2>
          <span className="metric-hint">In planning or in-progress</span>
        </div>

        <div className="metric-card highlight-amber">
          <span className="metric-label">Due Tasks</span>
          <h2 className="metric-value">{stats.dueTasks || 0}</h2>
          <span className="metric-hint">Pending completion</span>
        </div>

        <div className="metric-card highlight-red">
          <span className="metric-label">Pending Feedback</span>
          <h2 className="metric-value">{stats.pendingFeedback || 0}</h2>
          <span className="metric-hint">Client change requests</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Total Clients</span>
          <h2 className="metric-value">{stats.clients || 0}</h2>
          <span className="metric-hint">Active accounts</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Team Members</span>
          <h2 className="metric-value">{stats.users || 0}</h2>
          <span className="metric-hint">Admins & specialists</span>
        </div>

        <div className="metric-card highlight-green">
          <span className="metric-label">Completed Tasks</span>
          <h2 className="metric-value">{stats.completedTasks || 0}</h2>
          <span className="metric-hint">Finished deliverables</span>
        </div>
      </div>

      <div className="dashboard-columns mt-6">
        {/* Recent Projects with Derived Progress */}
        <div className="column-card">
          <div className="flex-between mb-4">
            <h3>Active Projects</h3>
            <Link to="/agency/projects" className="text-link">
              View All →
            </Link>
          </div>

          {!recentProjects || recentProjects.length === 0 ? (
            <p className="empty-text">No active projects found.</p>
          ) : (
            <div className="recent-projects-list">
              {recentProjects.map((p) => (
                <div key={p.id} className="project-mini-card">
                  <div className="flex-between">
                    <div>
                      <Link to={`/agency/projects/${p.id}`} className="project-title-link">
                        {p.name}
                      </Link>
                      <span className="sub-text block">
                        {p.Client?.companyName || "No client"}
                      </span>
                    </div>
                    <span className={`badge ${
                      p.status === "completed"
                        ? "badge-green"
                        : p.status === "in_progress"
                        ? "badge-blue"
                        : "badge-gray"
                    }`}>
                      {p.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Timeline Activities */}
        <div className="column-card">
          <div className="flex-between mb-4">
            <h3>Recent Activity Timeline</h3>
            <span className="sub-text">Live Workspace Feed</span>
          </div>

          {!recentActivities || recentActivities.length === 0 ? (
            <p className="empty-text">No recent activity logged.</p>
          ) : (
            <div className="activity-timeline">
              {recentActivities.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <p className="timeline-desc">{act.description}</p>
                    <span className="timeline-time">
                      {act.User?.name || "System"} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Assigned Tasks (Especially relevant for Agency Team members) */}
        {myTasks.length > 0 && (
          <div className="column-card">
            <div className="flex-between mb-4">
              <h3>My Assigned Tasks ({myTasks.length})</h3>
              <span className="badge badge-blue">Team Focus</span>
            </div>
            <div className="recent-projects-list">
              {myTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="project-mini-card">
                  <div className="flex-between">
                    <div>
                      <strong>{task.title}</strong>
                      <span className="sub-text block">
                        Project: {task.Project?.name || "General"}
                      </span>
                    </div>
                    <span className={`badge ${
                      task.status === "completed"
                        ? "badge-green"
                        : task.status === "in_progress"
                        ? "badge-blue"
                        : "badge-gray"
                    }`}>
                      {task.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;

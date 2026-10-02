import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const ClientDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects"); // projects | feedback | meetings | files
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Form for submitting new feedback / change request
  const [feedbackForm, setFeedbackForm] = useState({
    projectId: "",
    title: "",
    description: "",
    type: "change_request",
    priority: "medium",
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Replying to existing feedback
  const [replyTexts, setReplyTexts] = useState({});

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get("/client-portal/dashboard");
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Client dashboard error:", error);
      toast.error(error.response?.data?.message || "Failed to load client workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.projectId || !feedbackForm.title || !feedbackForm.description) {
      toast.error("Please fill in project, title, and description");
      return;
    }

    try {
      setSubmittingFeedback(true);
      const res = await api.post("/feedback", feedbackForm);
      if (res.data.success) {
        toast.success("Feedback submitted to the agency team!");
        setShowFeedbackModal(false);
        setFeedbackForm({
          projectId: "",
          title: "",
          description: "",
          type: "change_request",
          priority: "medium",
        });
        fetchDashboard();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReplySubmit = async (fbId) => {
    const text = replyTexts[fbId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/feedback/${fbId}/comments`, {
        comment: text.trim(),
      });
      if (res.data.success) {
        toast.success("Comment posted");
        setReplyTexts({ ...replyTexts, [fbId]: "" });
        fetchDashboard();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("File download failed");
    }
  };

  if (loading) {
    return <div className="loading-state">Loading your client portal...</div>;
  }

  if (!data) {
    return (
      <div className="page-container">
        <h2>Unable to load client portal</h2>
      </div>
    );
  }

  const { client, projects = [], meetings = [], feedback = [], files = [] } = data;

  const getWorkflowBadge = (status) => {
    switch (status) {
      case "resolved":
        return "badge-green";
      case "in_progress":
      case "in_review":
        return "badge-blue";
      case "declined":
        return "badge-red";
      default:
        return "badge-amber";
    }
  };

  return (
    <div className="page-container">
      {/* Client Portal Header */}
      <div className="client-hero-card">
        <div className="flex-between">
          <div>
            <span className="client-portal-tag">CLIENT PORTAL</span>
            <h1 className="client-company-title">
              {client?.companyName || "Welcome to Your Client Portal"}
            </h1>
            <p className="client-subtext">
              Primary Contact: <strong>{client?.name}</strong> • Real-time project tracking and agency deliverables
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowFeedbackModal(true)}
          >
            + Submit Change Request / Feedback
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-nav mt-6">
        <button
          className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          📁 Active Projects ({projects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
          onClick={() => setActiveTab("feedback")}
        >
          💬 Feedback & Change Requests ({feedback.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "meetings" ? "active" : ""}`}
          onClick={() => setActiveTab("meetings")}
        >
          📅 Shared Meetings ({meetings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "files" ? "active" : ""}`}
          onClick={() => setActiveTab("files")}
        >
          📂 Shared Deliverables & Files ({files.length})
        </button>
      </div>

      {/* TAB: PROJECTS */}
      {activeTab === "projects" && (
        <div className="tab-pane">
          {projects.length === 0 ? (
            <div className="empty-state">No active projects assigned to your company.</div>
          ) : (
            <div className="client-projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="client-project-card">
                  <div className="flex-between">
                    <div>
                      <h3 className="project-title">{project.name}</h3>
                      <p className="project-desc mt-1">{project.description || "Project in progress."}</p>
                    </div>
                    <span className="badge badge-blue">
                      {project.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Derived Progress Bar */}
                  <div className="progress-section mt-4">
                    <div className="progress-header">
                      <span><strong>Real Derived Progress:</strong></span>
                      <span className="font-bold text-lg">{project.progress || 0}% Complete</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-subtext">
                      {project.completedTasks} of {project.totalTasks} deliverables completed
                    </span>
                  </div>

                  {/* Milestones Roadmap */}
                  {project.milestones && project.milestones.length > 0 && (
                    <div className="milestones-roadmap mt-4">
                      <h4>Milestones Roadmap</h4>
                      <div className="milestones-steps">
                        {project.milestones.map((m, idx) => (
                          <div key={m.id} className={`step-node ${m.status}`}>
                            <div className="step-circle">
                              {m.status === "completed" ? "✓" : idx + 1}
                            </div>
                            <div className="step-label">
                              <strong>{m.title}</strong>
                              <span className="sub-text block">
                                {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "Pending"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: FEEDBACK & CHANGE REQUESTS */}
      {activeTab === "feedback" && (
        <div className="tab-pane">
          <div className="flex-between mb-4">
            <div>
              <h3>Your Feedback & Change Requests</h3>
              <p className="sub-text">
                Track status updates and read agency team responses
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowFeedbackModal(true)}
            >
              + New Request
            </button>
          </div>

          {feedback.length === 0 ? (
            <div className="empty-state">No feedback submitted yet. Have an idea or bug report? Click "+ New Request".</div>
          ) : (
            <div className="feedback-cards-container">
              {feedback.map((item) => (
                <div key={item.id} className="feedback-card">
                  <div className="flex-between">
                    <div>
                      <span className="feedback-type-tag">
                        {item.type?.replace("_", " ").toUpperCase()}
                      </span>
                      <h4 className="mt-1">{item.title}</h4>
                      <p className="sub-text">Project: {item.Project?.name || "General"}</p>
                    </div>
                    <span className={`badge ${getWorkflowBadge(item.status)}`}>
                      {item.status?.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  <p className="feedback-desc mt-3">{item.description}</p>

                  {/* Threaded Discussion */}
                  <div className="threaded-comments-box mt-4">
                    <h5>Agency Conversation:</h5>
                    {(!item.FeedbackComments || item.FeedbackComments.length === 0) ? (
                      <p className="sub-text italic">The agency team is reviewing your request.</p>
                    ) : (
                      <div className="comments-stream">
                        {item.FeedbackComments.map((c) => (
                          <div key={c.id} className="comment-bubble">
                            <div className="comment-meta">
                              <strong>{c.User?.name}</strong>
                              <span className="role-tag">{c.User?.role}</span>
                              <span className="timestamp-cell">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="comment-text">{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="reply-form mt-3">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Reply to the agency team..."
                        value={replyTexts[item.id] || ""}
                        onChange={(e) => setReplyTexts({ ...replyTexts, [item.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleReplySubmit(item.id)}
                      />
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => handleReplySubmit(item.id)}
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SHARED MEETINGS */}
      {activeTab === "meetings" && (
        <div className="tab-pane">
          <div className="mb-4">
            <h3>Scheduled Client Syncs & Meetings</h3>
            <p className="sub-text">Upcoming video conferences and meeting notes prepared for your company.</p>
          </div>

          {meetings.length === 0 ? (
            <div className="empty-state">No upcoming meetings scheduled with the agency.</div>
          ) : (
            <div className="meetings-grid">
              {meetings.map((mtg) => (
                <div key={mtg.id} className="meeting-card">
                  <div className="flex-between">
                    <h4>{mtg.title}</h4>
                    <span className="badge badge-green">Confirmed Sync</span>
                  </div>
                  <p className="mt-2 text-sm">📅 <strong>{new Date(mtg.meetingDate).toLocaleString()}</strong></p>
                  {mtg.notes && <p className="meeting-notes mt-2">{mtg.notes}</p>}
                  {mtg.meetingLink && (
                    <a
                      href={mtg.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-sm btn-primary mt-3 inline-block"
                    >
                      🔗 Join Video Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SHARED FILES */}
      {activeTab === "files" && (
        <div className="tab-pane">
          <div className="mb-4">
            <h3>Shared Deliverables & Project Assets</h3>
            <p className="sub-text">Official documents, specifications, and files shared with your team.</p>
          </div>

          {files.length === 0 ? (
            <div className="empty-state">No shared files available for download yet.</div>
          ) : (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Deliverable Name</th>
                    <th>Project</th>
                    <th>Date Shared</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>📄 <strong>{file.originalName}</strong></td>
                      <td>{file.Project?.name || "General"}</td>
                      <td className="timestamp-cell">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleDownloadFile(file)}
                        >
                          ⬇ Download Deliverable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Submit Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Submit Feedback or Change Request</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="modal-form">
              <div className="form-group">
                <label>Target Project *</label>
                <select
                  className="form-input"
                  value={feedbackForm.projectId}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, projectId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Request Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Add export to PDF button on report"
                  value={feedbackForm.title}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="form-input"
                    value={feedbackForm.type}
                    onChange={(e) =>
                      setFeedbackForm({ ...feedbackForm, type: e.target.value })
                    }
                  >
                    <option value="change_request">Change Request</option>
                    <option value="feedback">General Feedback</option>
                    <option value="bug">Bug / Defect</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Urgency / Priority</label>
                  <select
                    className="form-input"
                    value={feedbackForm.priority}
                    onChange={(e) =>
                      setFeedbackForm({ ...feedbackForm, priority: e.target.value })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Details & Acceptance Criteria *</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Provide complete description and steps..."
                  value={feedbackForm.description}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, description: e.target.value })
                  }
                  required
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingFeedback}
                >
                  {submittingFeedback ? "Submitting..." : "Send to Agency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
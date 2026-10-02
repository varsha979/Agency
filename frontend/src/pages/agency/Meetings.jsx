import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const Meetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [form, setForm] = useState({
        title: "",
        projectId: "",
        meetingDate: "",
        notes: "",
        meetingLink: "",
        isSharedWithClient: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [aiSummaryModal, setAiSummaryModal] = useState(null);
    const [aiSummarizingId, setAiSummarizingId] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [meetingsRes, projectsRes] = await Promise.all([
                api.get("/meetings"),
                api.get("/projects"),
            ]);

            if (meetingsRes.data.success) {
                setMeetings(meetingsRes.data.meetings);
            }
            if (projectsRes.data.success) {
                setProjects(projectsRes.data.projects);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load meetings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const res = await api.post("/meetings", form);
            if (res.data.success) {
                toast.success("Meeting scheduled successfully");
                setShowCreateModal(false);
                setForm({
                    title: "",
                    projectId: "",
                    meetingDate: "",
                    notes: "",
                    meetingLink: "",
                    isSharedWithClient: false,
                });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to schedule meeting");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this meeting?")) return;
        try {
            const res = await api.delete(`/meetings/${id}`);
            if (res.data.success) {
                toast.success("Meeting removed");
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to delete meeting");
        }
    };

    const handleSummarizeMeeting = async (mtg) => {
        if (!mtg.notes || !mtg.notes.trim()) {
            toast.info("This meeting doesn't have any notes yet to summarize.");
            return;
        }

        try {
            setAiSummarizingId(mtg.id);
            const res = await api.post(`/ai/meetings/${mtg.id}/summary`);
            if (res.data.success) {
                setAiSummaryModal({
                    title: mtg.title,
                    summary: res.data.summary || res.data.actionItems,
                });
                toast.success("AI Action Items generated!");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate AI summary");
        } finally {
            setAiSummarizingId(null);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Meetings & Client Syncs</h1>
                    <p className="page-subtitle">
                        Schedule client syncs or internal discussions with granular client visibility
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Schedule New Meeting
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Loading scheduled meetings...</div>
            ) : meetings.length === 0 ? (
                <div className="empty-state">No meetings scheduled yet.</div>
            ) : (
                <div className="meetings-grid">
                    {meetings.map((mtg) => (
                        <div key={mtg.id} className="meeting-card">
                            <div className="flex-between">
                                <div>
                                    <h3 className="meeting-title">{mtg.title}</h3>
                                    <span className="project-tag">
                                        📁 {mtg.Project?.name || "General Agency Sync"}
                                    </span>
                                </div>
                                <span className={`badge ${mtg.isSharedWithClient ? "badge-green" : "badge-gray"}`}>
                                    {mtg.isSharedWithClient ? "Client Visible" : "Internal Agency"}
                                </span>
                            </div>

                            <p className="mt-3 text-sm">
                                📅 <strong>{new Date(mtg.meetingDate).toLocaleString()}</strong>
                            </p>

                            {mtg.notes && <p className="meeting-notes mt-2">{mtg.notes}</p>}

                            <div className="action-row mt-4">
                                {mtg.meetingLink ? (
                                    <a
                                        href={mtg.meetingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-sm btn-secondary"
                                    >
                                        🔗 Join Video Call
                                    </a>
                                ) : (
                                    <span className="sub-text">No link provided</span>
                                )}
                                <button
                                    className="btn-sm btn-secondary"
                                    onClick={() => handleSummarizeMeeting(mtg)}
                                    disabled={aiSummarizingId === mtg.id}
                                    title="Generate AI Executive Summary & Action Items"
                                >
                                    {aiSummarizingId === mtg.id ? "Analyzing..." : "✨ AI Action Items"}
                                </button>
                                <button
                                    className="btn-sm btn-danger ml-auto"
                                    onClick={() => handleDelete(mtg.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule Modal */}
            {showCreateModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Schedule Meeting / Sync</h2>
                            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Meeting Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Sprint Review & Roadmap Alignment"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Associated Project</label>
                                <select
                                    className="form-input"
                                    value={form.projectId}
                                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                                >
                                    <option value="">General Meeting (No specific project)</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.Client?.companyName || "Client"})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={form.meetingDate}
                                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Video Call URL</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://meet.google.com/..."
                                    value={form.meetingLink}
                                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Agenda & Meeting Notes</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Agenda topics, discussion points..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isSharedWithClient}
                                        onChange={(e) => setForm({ ...form, isSharedWithClient: e.target.checked })}
                                    />
                                    <span>
                                        <strong>Share with Client:</strong> If checked, this meeting and its notes will appear in the client portal.
                                    </span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Scheduling..." : "Schedule Meeting"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Meeting Summary Modal */}
            {aiSummaryModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>✨ AI Meeting Summary & Action Items</h2>
                            <button className="modal-close-btn" onClick={() => setAiSummaryModal(null)}>✕</button>
                        </div>
                        <div className="modal-body p-4">
                            <h4 className="mb-2 text-indigo-400">Meeting: {aiSummaryModal.title}</h4>
                            <div className="ai-output-box">
                                <pre className="ai-text-display">{aiSummaryModal.summary}</pre>
                            </div>
                        </div>
                        <div className="modal-actions p-4">
                            <button className="btn-primary" onClick={() => setAiSummaryModal(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meetings;
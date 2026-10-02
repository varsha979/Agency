import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/api";

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [progress, setProgress] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [team, setTeam] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [files, setFiles] = useState([]);
    const [activities, setActivities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("tasks"); // tasks | milestones | meetings | feedback | files | ai | timeline

    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);

    // AI states
    const [aiLoading, setAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [aiClientDraft, setAiClientDraft] = useState("");
    const [aiMeetingSummary, setAiMeetingSummary] = useState("");

    // Form states
    const [taskForm, setTaskForm] = useState({
        title: "",
        description: "",
        milestoneId: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
    });

    const [milestoneForm, setMilestoneForm] = useState({
        title: "",
        description: "",
        dueDate: "",
    });

    const [meetingForm, setMeetingForm] = useState({
        title: "",
        meetingDate: "",
        notes: "",
        meetingLink: "",
        isSharedWithClient: false,
    });

    const [fileForm, setFileForm] = useState({
        file: null,
        isSharedWithClient: false,
    });

    // Feedback reply state
    const [commentTexts, setCommentTexts] = useState({});

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [
                projRes,
                progRes,
                milestonesRes,
                tasksRes,
                teamRes,
                meetingsRes,
                feedbackRes,
                filesRes,
                activitiesRes
            ] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/projects/${id}/progress`),
                api.get(`/milestones/project/${id}`),
                api.get(`/tasks/project/${id}`),
                api.get("/team"),
                api.get(`/meetings/project/${id}`),
                api.get(`/feedback/project/${id}`),
                api.get(`/files?projectId=${id}`),
                api.get(`/activities/project/${id}`),
            ]);

            if (projRes.data.success) setProject(projRes.data.project);
            if (progRes.data.success) setProgress(progRes.data);
            if (milestonesRes.data.success) setMilestones(milestonesRes.data.milestones);
            if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
            if (teamRes.data.success) setTeam(teamRes.data.members);
            if (meetingsRes.data.success) setMeetings(meetingsRes.data.meetings);
            if (feedbackRes.data.success) setFeedbackList(feedbackRes.data.feedback);
            if (filesRes.data.success) setFiles(filesRes.data.files);
            if (activitiesRes.data.success) setActivities(activitiesRes.data.activities);
        } catch (error) {
            console.error("Project details load error:", error);
            toast.error(error.response?.data?.message || "Failed to load project details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [id]);

    // Handlers
    const handleStatusChange = async (newStatus) => {
        try {
            const res = await api.patch(`/projects/${id}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success("Project status updated");
                setProject({ ...project, status: newStatus });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update project status");
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/tasks", {
                ...taskForm,
                projectId: id,
                milestoneId: taskForm.milestoneId || null,
                assignedTo: taskForm.assignedTo || null,
            });
            if (res.data.success) {
                toast.success("Task created");
                setShowTaskModal(false);
                setTaskForm({ title: "", description: "", milestoneId: "", assignedTo: "", priority: "medium", dueDate: "" });
                fetchAllData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create task");
        }
    };

    const handleTaskStatus = async (taskId, newStatus) => {
        try {
            const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(`Task marked as ${newStatus}`);
                fetchAllData(); // Refreshes derived progress!
            }
        } catch (error) {
            toast.error("Failed to update task status");
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            toast.success("Task deleted");
            fetchAllData();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const handleCreateMilestone = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/milestones", {
                ...milestoneForm,
                projectId: id,
            });
            if (res.data.success) {
                toast.success("Milestone created");
                setShowMilestoneModal(false);
                setMilestoneForm({ title: "", description: "", dueDate: "" });
                fetchAllData();
            }
        } catch (error) {
            toast.error("Failed to create milestone");
        }
    };

    const handleMilestoneStatus = async (milestoneId, newStatus) => {
        try {
            await api.patch(`/milestones/${milestoneId}/status`, { status: newStatus });
            toast.success("Milestone status updated");
            fetchAllData();
        } catch (error) {
            toast.error("Failed to update milestone status");
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/meetings", {
                ...meetingForm,
                projectId: id,
                clientId: project.clientId,
            });
            if (res.data.success) {
                toast.success("Meeting scheduled");
                setShowMeetingModal(false);
                setMeetingForm({ title: "", meetingDate: "", notes: "", meetingLink: "", isSharedWithClient: false });
                fetchAllData();
            }
        } catch (error) {
            toast.error("Failed to create meeting");
        }
    };

    const handleUploadFile = async (e) => {
        e.preventDefault();
        if (!fileForm.file) return;
        try {
            const formData = new FormData();
            formData.append("file", fileForm.file);
            formData.append("projectId", id);
            formData.append("clientId", project.clientId);
            formData.append("isSharedWithClient", fileForm.isSharedWithClient);

            const res = await api.post("/files/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data.success) {
                toast.success("File attached to project");
                setShowFileModal(false);
                setFileForm({ file: null, isSharedWithClient: false });
                fetchAllData();
            }
        } catch (error) {
            toast.error("Upload failed");
        }
    };

    const handleDownloadFile = async (file) => {
        try {
            const response = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            toast.error("Download failed");
        }
    };

    const handleFeedbackStatus = async (fbId, newStatus) => {
        try {
            await api.patch(`/feedback/${fbId}/status`, { status: newStatus });
            toast.success("Feedback status updated");
            fetchAllData();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleAddComment = async (fbId) => {
        const text = commentTexts[fbId];
        if (!text || !text.trim()) return;

        try {
            await api.post(`/feedback/${fbId}/comments`, { comment: text.trim() });
            toast.success("Comment added");
            setCommentTexts({ ...commentTexts, [fbId]: "" });
            fetchAllData();
        } catch {
            toast.error("Failed to post comment");
        }
    };

    // AI Analysis
    const runAiAnalysis = async () => {
        try {
            setAiLoading(true);
            const res = await api.get(`/ai/projects/${id}/summary`);
            if (res.data.success) {
                setAiAnalysis(res.data.summary);
                toast.success("AI Project Analysis generated!");
            }
        } catch (error) {
            toast.error("AI Analysis failed");
        } finally {
            setAiLoading(false);
        }
    };

    const runAiClientDraft = async () => {
        try {
            setAiLoading(true);
            const res = await api.post(`/ai/projects/${id}/client-update`);
            if (res.data.success) {
                setAiClientDraft(res.data.draft);
                toast.success("Client update email drafted!");
            }
        } catch (error) {
            toast.error("Draft generation failed");
        } finally {
            setAiLoading(false);
        }
    };

    const runAiMeetingSummary = async () => {
        const meetingWithNotes = meetings.find((m) => m.notes && m.notes.trim());
        if (!meetingWithNotes) {
            toast.info("No meeting with notes found for this project. Please add notes to a meeting first!");
            return;
        }

        try {
            setAiLoading(true);
            const res = await api.post(`/ai/meetings/${meetingWithNotes.id}/summary`);
            if (res.data.success) {
                setAiMeetingSummary(res.data.summary || res.data.actionItems);
                toast.success(`Action items generated from meeting: "${meetingWithNotes.title}"!`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate meeting summary");
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Loading project details & real-time work items...</div>;
    }

    if (!project) {
        return (
            <div className="page-container">
                <h2>Project not found</h2>
                <button className="btn-secondary mt-4" onClick={() => navigate("/agency/projects")}>
                    ← Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="flex-between mb-4">
                <button className="btn-secondary" onClick={() => navigate("/agency/projects")}>
                    ← Back to Projects
                </button>
                <div className="action-row">
                    <span className="sub-text">Status:</span>
                    <select
                        className="input-select"
                        value={project.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="project-banner-card">
                <div className="flex-between">
                    <div>
                        <h1 className="project-banner-title">{project.name}</h1>
                        <p className="project-banner-subtitle">
                            Client: <strong>{project.Client?.companyName || "Client"}</strong> ({project.Client?.name}) • Manager: <strong>{project.manager?.name || "Unassigned"}</strong>
                        </p>
                    </div>
                    <span className={`badge ${project.priority === "high" ? "badge-red" : "badge-amber"}`}>
                        {project.priority?.toUpperCase()} PRIORITY
                    </span>
                </div>

                {/* Derived Progress Bar */}
                <div className="progress-section mt-4">
                    <div className="progress-header">
                        <span><strong>Real Derived Progress:</strong> Calculated automatically from real task completion</span>
                        <span className="font-bold text-lg">{progress?.progress || project.progress || 0}% Complete</span>
                    </div>
                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${progress?.progress || project.progress || 0}%` }}
                        ></div>
                    </div>
                    <span className="progress-subtext">
                        {tasks.filter((t) => t.status === "completed").length} of {tasks.length} tasks completed
                    </span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tabs-nav mt-6">
                <button
                    className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
                    onClick={() => setActiveTab("tasks")}
                >
                    📋 Tasks ({tasks.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === "milestones" ? "active" : ""}`}
                    onClick={() => setActiveTab("milestones")}
                >
                    🚩 Milestones ({milestones.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === "meetings" ? "active" : ""}`}
                    onClick={() => setActiveTab("meetings")}
                >
                    📅 Meetings ({meetings.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
                    onClick={() => setActiveTab("feedback")}
                >
                    💬 Feedback ({feedbackList.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === "files" ? "active" : ""}`}
                    onClick={() => setActiveTab("files")}
                >
                    📂 Deliverables & Files ({files.length})
                </button>
                <button
                    className={`tab-btn highlight-tab ${activeTab === "ai" ? "active" : ""}`}
                    onClick={() => setActiveTab("ai")}
                >
                    🤖 AI Assistant
                </button>
                <button
                    className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
                    onClick={() => setActiveTab("timeline")}
                >
                    📜 Timeline ({activities.length})
                </button>
            </div>

            {/* TAB CONTENT: TASKS */}
            {activeTab === "tasks" && (
                <div className="tab-pane">
                    <div className="flex-between mb-4">
                        <h3>Project Tasks & Work Items</h3>
                        <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
                            + Add Task
                        </button>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="empty-state">No tasks created yet. Add tasks to start deriving project progress!</div>
                    ) : (
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Title & Scope</th>
                                        <th>Assigned To</th>
                                        <th>Milestone</th>
                                        <th>Priority</th>
                                        <th>Due Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task.id}>
                                            <td>
                                                <strong>{task.title}</strong>
                                                {task.description && <p className="sub-text">{task.description}</p>}
                                            </td>
                                            <td>{task.User?.name || "Unassigned"}</td>
                                            <td>{task.Milestone?.title || "None"}</td>
                                            <td>
                                                <span className={`badge ${task.priority === "urgent" || task.priority === "high" ? "badge-red" : "badge-gray"}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="timestamp-cell">
                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                                            </td>
                                            <td>
                                                <select
                                                    className="input-select-sm"
                                                    value={task.status}
                                                    onChange={(e) => handleTaskStatus(task.id, e.target.value)}
                                                >
                                                    <option value="todo">To Do</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-sm btn-danger"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    Delete
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

            {/* TAB CONTENT: MILESTONES */}
            {activeTab === "milestones" && (
                <div className="tab-pane">
                    <div className="flex-between mb-4">
                        <h3>Project Milestones</h3>
                        <button className="btn-primary" onClick={() => setShowMilestoneModal(true)}>
                            + Add Milestone
                        </button>
                    </div>

                    {milestones.length === 0 ? (
                        <div className="empty-state">No milestones defined yet.</div>
                    ) : (
                        <div className="milestones-timeline-grid">
                            {milestones.map((m, index) => (
                                <div key={m.id} className="milestone-card">
                                    <div className="milestone-number">#{index + 1}</div>
                                    <div className="milestone-body">
                                        <div className="flex-between">
                                            <h4>{m.title}</h4>
                                            <select
                                                className="input-select-sm"
                                                value={m.status}
                                                onChange={(e) => handleMilestoneStatus(m.id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                            </select>
                                        </div>
                                        <p className="sub-text mt-1">{m.description || "No milestone description."}</p>
                                        <div className="milestone-footer mt-3">
                                            <span>📅 Target: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "Flexible"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: MEETINGS */}
            {activeTab === "meetings" && (
                <div className="tab-pane">
                    <div className="flex-between mb-4">
                        <div>
                            <h3>Meetings & Syncs</h3>
                            <p className="sub-text">Internal notes remain hidden from the client portal unless marked shared.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowMeetingModal(true)}>
                            + Schedule Meeting
                        </button>
                    </div>

                    {meetings.length === 0 ? (
                        <div className="empty-state">No meetings scheduled for this project.</div>
                    ) : (
                        <div className="meetings-grid">
                            {meetings.map((mtg) => (
                                <div key={mtg.id} className="meeting-card">
                                    <div className="flex-between">
                                        <h4>{mtg.title}</h4>
                                        {mtg.isSharedWithClient ? (
                                            <span className="badge badge-green">Shared with Client</span>
                                        ) : (
                                            <span className="badge badge-gray">Internal Only</span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm">📅 <strong>{new Date(mtg.meetingDate).toLocaleString()}</strong></p>
                                    {mtg.notes && <p className="meeting-notes mt-2">{mtg.notes}</p>}
                                    {mtg.meetingLink && (
                                        <a href={mtg.meetingLink} target="_blank" rel="noreferrer" className="btn-sm btn-secondary mt-3 inline-block">
                                            🔗 Open Video Link
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: FEEDBACK & REQUESTS */}
            {activeTab === "feedback" && (
                <div className="tab-pane">
                    <div className="flex-between mb-4">
                        <div>
                            <h3>Client Feedback & Change Requests</h3>
                            <p className="sub-text">Workflow: Open → In Review → In Progress → Resolved / Declined</p>
                        </div>
                    </div>

                    {feedbackList.length === 0 ? (
                        <div className="empty-state">No feedback submitted for this project yet.</div>
                    ) : (
                        <div className="feedback-cards-container">
                            {feedbackList.map((item) => (
                                <div key={item.id} className="feedback-card">
                                    <div className="flex-between">
                                        <div>
                                            <span className="feedback-type-tag">{item.type?.replace("_", " ").toUpperCase()}</span>
                                            <h4 className="mt-1">{item.title}</h4>
                                            <p className="sub-text">Submitted by {item.creator?.name || "Client"}</p>
                                        </div>
                                        <div className="status-selector-row">
                                            <label className="text-xs">Workflow Status:</label>
                                            <select
                                                className="input-select-sm"
                                                value={item.status}
                                                onChange={(e) => handleFeedbackStatus(item.id, e.target.value)}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_review">In Review</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="declined">Declined</option>
                                            </select>
                                        </div>
                                    </div>

                                    <p className="feedback-desc mt-3">{item.description}</p>

                                    {/* Threaded Comments */}
                                    <div className="threaded-comments-box mt-4">
                                        <h5>Discussion & Agency Responses:</h5>
                                        {(!item.FeedbackComments || item.FeedbackComments.length === 0) ? (
                                            <p className="sub-text italic">No replies yet. Respond below to keep client updated.</p>
                                        ) : (
                                            <div className="comments-stream">
                                                {item.FeedbackComments.map((c) => (
                                                    <div key={c.id} className="comment-bubble">
                                                        <div className="comment-meta">
                                                            <strong>{c.User?.name}</strong>
                                                            <span className="role-tag">{c.User?.role}</span>
                                                            <span className="timestamp-cell">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="comment-text">{c.comment}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply form */}
                                        <div className="reply-form mt-3">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Write an agency reply to the client..."
                                                value={commentTexts[item.id] || ""}
                                                onChange={(e) => setCommentTexts({ ...commentTexts, [item.id]: e.target.value })}
                                                onKeyDown={(e) => e.key === "Enter" && handleAddComment(item.id)}
                                            />
                                            <button
                                                className="btn-primary btn-sm"
                                                onClick={() => handleAddComment(item.id)}
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

            {/* TAB CONTENT: FILES */}
            {activeTab === "files" && (
                <div className="tab-pane">
                    <div className="flex-between mb-4">
                        <div>
                            <h3>Project Files & Attachments</h3>
                            <p className="sub-text">Control which files are shared directly to the client portal.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setShowFileModal(true)}>
                            + Attach File
                        </button>
                    </div>

                    {files.length === 0 ? (
                        <div className="empty-state">No files attached to this project.</div>
                    ) : (
                        <div className="table-card">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Client Visibility</th>
                                        <th>Uploaded By</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file) => (
                                        <tr key={file.id}>
                                            <td>📄 <strong>{file.originalName}</strong></td>
                                            <td>
                                                {file.isSharedWithClient ? (
                                                    <span className="badge badge-green">Shared with Client</span>
                                                ) : (
                                                    <span className="badge badge-gray">Private (Agency Only)</span>
                                                )}
                                            </td>
                                            <td>{file.User?.name || "Agency Member"}</td>
                                            <td className="timestamp-cell">{new Date(file.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn-sm btn-secondary" onClick={() => handleDownloadFile(file)}>
                                                    ⬇ Download
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

            {/* TAB CONTENT: AI ASSISTANT */}
            {activeTab === "ai" && (
                <div className="tab-pane">
                    <div className="ai-feature-card">
                        <div className="ai-header">
                            <div>
                                <h3>🤖 Practical AI Project Intelligence</h3>
                                <p className="sub-text">
                                    Analyze real project velocity, identify bottlenecks, and draft executive client updates with one click.
                                </p>
                            </div>
                            <div className="action-row">
                                <button className="btn-primary" onClick={runAiAnalysis} disabled={aiLoading}>
                                    {aiLoading ? "Analyzing..." : "🔍 Run Health & Risk Analysis"}
                                </button>
                                <button className="btn-secondary" onClick={runAiClientDraft} disabled={aiLoading}>
                                    {aiLoading ? "Drafting..." : "✍️ Draft Client Update Email"}
                                </button>
                                <button className="btn-secondary" onClick={runAiMeetingSummary} disabled={aiLoading}>
                                    {aiLoading ? "Processing..." : "🎯 Meeting Notes to Action Items"}
                                </button>
                            </div>
                        </div>

                        {aiAnalysis && (
                            <div className="ai-output-box mt-4">
                                <h4>📋 Project Health & Risk Report:</h4>
                                <pre className="ai-text-display">{aiAnalysis}</pre>
                            </div>
                        )}

                        {aiClientDraft && (
                            <div className="ai-output-box mt-4">
                                <h4>✉️ Client Progress Update Email Draft:</h4>
                                <pre className="ai-text-display">{aiClientDraft}</pre>
                            </div>
                        )}

                        {aiMeetingSummary && (
                            <div className="ai-output-box mt-4">
                                <h4>🎯 AI Meeting Summary & Action Items:</h4>
                                <pre className="ai-text-display">{aiMeetingSummary}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: TIMELINE */}
            {activeTab === "timeline" && (
                <div className="tab-pane">
                    <h3>Project Audit & Activity Stream</h3>
                    {activities.length === 0 ? (
                        <div className="empty-state">No events recorded for this project.</div>
                    ) : (
                        <div className="activity-timeline mt-4">
                            {activities.map((act) => (
                                <div key={act.id} className="timeline-item">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <p className="timeline-desc">{act.description}</p>
                                        <span className="timeline-time">
                                            {act.User?.name || "System"} • {new Date(act.createdAt).toLocaleString()}
                                            {act.isClientVisible && " • (Visible to Client)"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODALS */}
            {/* 1. Add Task Modal */}
            {showTaskModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Add New Project Task</h2>
                            <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="modal-form">
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Implement Webhook Handlers"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    placeholder="Task details and expectations..."
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Assign Team Member</label>
                                    <select
                                        className="form-input"
                                        value={taskForm.assignedTo}
                                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                    >
                                        <option value="">Unassigned</option>
                                        {team.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Link to Milestone</label>
                                    <select
                                        className="form-input"
                                        value={taskForm.milestoneId}
                                        onChange={(e) => setTaskForm({ ...taskForm, milestoneId: e.target.value })}
                                    >
                                        <option value="">No Milestone</option>
                                        {milestones.map((m) => (
                                            <option key={m.id} value={m.id}>{m.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        className="form-input"
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Add Milestone Modal */}
            {showMilestoneModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Add Project Milestone</h2>
                            <button className="modal-close-btn" onClick={() => setShowMilestoneModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateMilestone} className="modal-form">
                            <div className="form-group">
                                <label>Milestone Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Phase 2: Core Frontend Deployment"
                                    value={milestoneForm.title}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={milestoneForm.description}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Target Completion Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={milestoneForm.dueDate}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowMilestoneModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Milestone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Schedule Meeting Modal */}
            {showMeetingModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Schedule Project Sync / Meeting</h2>
                            <button className="modal-close-btn" onClick={() => setShowMeetingModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateMeeting} className="modal-form">
                            <div className="form-group">
                                <label>Meeting Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Sprint Progress & Catalog Walkthrough"
                                    value={meetingForm.title}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={meetingForm.meetingDate}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Meeting Video Link</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    placeholder="https://meet.google.com/..."
                                    value={meetingForm.meetingLink}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Meeting Agenda & Notes</label>
                                <textarea
                                    className="form-input"
                                    rows="2"
                                    value={meetingForm.notes}
                                    onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={meetingForm.isSharedWithClient}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, isSharedWithClient: e.target.checked })}
                                    />
                                    <span><strong>Share with Client Portal:</strong> Check this so client can view notes and video link.</span>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowMeetingModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Schedule Meeting</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Attach File Modal */}
            {showFileModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Attach File to Project</h2>
                            <button className="modal-close-btn" onClick={() => setShowFileModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUploadFile} className="modal-form">
                            <div className="form-group">
                                <label>Select Deliverable File *</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    onChange={(e) => setFileForm({ ...fileForm, file: e.target.files[0] })}
                                    required
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={fileForm.isSharedWithClient}
                                        onChange={(e) => setFileForm({ ...fileForm, isSharedWithClient: e.target.checked })}
                                    />
                                    <span><strong>Share with Client Portal:</strong> Check this so client can download this file.</span>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowFileModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Upload File</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
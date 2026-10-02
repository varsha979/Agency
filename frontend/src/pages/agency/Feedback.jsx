import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const Feedback = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const res = await api.get("/feedback");
            if (res.data.success) {
                setFeedbackList(res.data.feedback);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    const handleStatusChange = async (fbId, newStatus) => {
        try {
            const res = await api.patch(`/feedback/${fbId}/status`, { status: newStatus });
            if (res.data.success) {
                toast.success(`Feedback status changed to ${newStatus.replace("_", " ")}`);
                fetchFeedback();
                if (selectedFeedback?.id === fbId) {
                    setSelectedFeedback({ ...selectedFeedback, status: newStatus });
                }
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleOpenDetail = async (fb) => {
        try {
            const res = await api.get(`/feedback/${fb.id}`);
            if (res.data.success) {
                setSelectedFeedback(res.data.feedback);
            }
        } catch {
            setSelectedFeedback(fb);
        }
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedFeedback) return;

        try {
            setSubmittingComment(true);
            const res = await api.post(`/feedback/${selectedFeedback.id}/comments`, {
                comment: newComment.trim(),
            });
            if (res.data.success) {
                toast.success("Response sent to client");
                setNewComment("");
                // Refresh comments
                const detailRes = await api.get(`/feedback/${selectedFeedback.id}`);
                if (detailRes.data.success) {
                    setSelectedFeedback(detailRes.data.feedback);
                }
            }
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const filteredList = statusFilter
        ? feedbackList.filter((f) => f.status === statusFilter)
        : feedbackList;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Client Feedback & Change Requests</h1>
                    <p className="page-subtitle">
                        Workflow: Open → In Review → In Progress → Resolved / Declined
                    </p>
                </div>
            </div>

            <div className="filters-bar">
                <select
                    className="input-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="declined">Declined</option>
                </select>
                <span className="sub-text">
                    Showing {filteredList.length} of {feedbackList.length} feedback items
                </span>
            </div>

            {loading ? (
                <div className="loading-state">Loading feedback items...</div>
            ) : filteredList.length === 0 ? (
                <div className="empty-state">No feedback found.</div>
            ) : (
                <div className="feedback-cards-container">
                    {filteredList.map((item) => (
                        <div key={item.id} className="feedback-card">
                            <div className="flex-between">
                                <div>
                                    <div className="badge-row">
                                        <span className="feedback-type-tag">
                                            {item.type?.replace("_", " ").toUpperCase()}
                                        </span>
                                        <span className={`badge ${
                                            item.priority === "high" ? "badge-red" : "badge-gray"
                                        }`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    <h3 className="mt-2">{item.title}</h3>
                                    <p className="sub-text">
                                        📁 Project: <strong>{item.Project?.name || "General"}</strong> • Client: <strong>{item.Client?.companyName || "Client"}</strong>
                                    </p>
                                </div>

                                <div className="status-selector-row">
                                    <label className="text-xs">Workflow Stage:</label>
                                    <select
                                        className="input-select-sm"
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
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

                            <div className="flex-between mt-4">
                                <span className="timestamp-cell">
                                    Submitted {new Date(item.createdAt).toLocaleDateString()} by {item.creator?.name || "Client"}
                                </span>
                                <button
                                    className="btn-secondary btn-sm"
                                    onClick={() => handleOpenDetail(item)}
                                >
                                    💬 View Discussion Thread ({item.FeedbackComments?.length || 0})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Threaded Discussion Drawer / Modal */}
            {selectedFeedback && (
                <div className="modal-backdrop">
                    <div className="modal-dialog modal-dialog-lg">
                        <div className="modal-header">
                            <div>
                                <span className="feedback-type-tag">
                                    {selectedFeedback.type?.toUpperCase()}
                                </span>
                                <h2>{selectedFeedback.title}</h2>
                                <p className="sub-text">
                                    Project: {selectedFeedback.Project?.name} • Client: {selectedFeedback.Client?.companyName}
                                </p>
                            </div>
                            <button
                                className="modal-close-btn"
                                onClick={() => setSelectedFeedback(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            <div className="feedback-main-description">
                                <strong>Original Request Description:</strong>
                                <p>{selectedFeedback.description}</p>
                            </div>

                            <hr className="divider mt-4 mb-4" />

                            <h4>Threaded Discussion History</h4>
                            {(!selectedFeedback.FeedbackComments || selectedFeedback.FeedbackComments.length === 0) ? (
                                <p className="empty-text">No comments yet. Be the first to respond!</p>
                            ) : (
                                <div className="comments-stream mt-3">
                                    {selectedFeedback.FeedbackComments.map((comment) => (
                                        <div key={comment.id} className="comment-bubble">
                                            <div className="comment-meta">
                                                <strong>{comment.User?.name || "User"}</strong>
                                                <span className="role-tag">{comment.User?.role}</span>
                                                <span className="timestamp-cell">
                                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="comment-text">{comment.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendComment} className="reply-form mt-4">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Write your response to the client..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submittingComment}
                                >
                                    {submittingComment ? "Sending..." : "Post Reply"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feedback;
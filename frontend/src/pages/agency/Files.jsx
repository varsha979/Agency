import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";

const Files = () => {
    const [files, setFiles] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        projectId: "",
        isSharedWithClient: false,
        file: null,
    });
    const [uploading, setUploading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [filesRes, projectsRes] = await Promise.all([
                api.get("/files", {
                    params: selectedProject ? { projectId: selectedProject } : {},
                }),
                api.get("/projects"),
            ]);

            if (filesRes.data.success) {
                setFiles(filesRes.data.files);
            }
            if (projectsRes.data.success) {
                setProjects(projectsRes.data.projects);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedProject]);

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            setUploadForm({ ...uploadForm, file: e.target.files[0] });
        }
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) {
            toast.error("Please select a file to upload");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", uploadForm.file);
            if (uploadForm.projectId) formData.append("projectId", uploadForm.projectId);
            formData.append("isSharedWithClient", uploadForm.isSharedWithClient);

            const res = await api.post("/files/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                toast.success("File uploaded successfully");
                setShowUploadModal(false);
                setUploadForm({ projectId: "", isSharedWithClient: false, file: null });
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            const res = await api.delete(`/files/${id}`);
            if (res.data.success) {
                toast.success("File deleted");
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    };

    const handleDownload = async (file) => {
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
            toast.error("Download failed or file not accessible");
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documents & Files</h1>
                    <p className="page-subtitle">
                        Manage agency and project deliverables with client permission controls
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowUploadModal(true)}
                >
                    + Upload New File
                </button>
            </div>

            <div className="filters-bar">
                <select
                    className="input-select"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                >
                    <option value="">All Projects</option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-state">Loading documents...</div>
            ) : files.length === 0 ? (
                <div className="empty-state">No files uploaded yet.</div>
            ) : (
                <div className="table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Project</th>
                                <th>Size</th>
                                <th>Client Visibility</th>
                                <th>Uploaded By</th>
                                <th>Uploaded At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id}>
                                    <td>
                                        <div className="file-name-cell">
                                            <span className="file-icon">📄</span>
                                            <strong>{file.originalName}</strong>
                                        </div>
                                    </td>
                                    <td>{file.Project?.name || "General"}</td>
                                    <td>{formatBytes(file.size)}</td>
                                    <td>
                                        {file.isSharedWithClient ? (
                                            <span className="badge badge-green">Shared with Client</span>
                                        ) : (
                                            <span className="badge badge-gray">Private (Agency Only)</span>
                                        )}
                                    </td>
                                    <td>{file.User?.name || "Agency"}</td>
                                    <td className="timestamp-cell">
                                        {new Date(file.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="action-row">
                                            <button
                                                className="btn-sm btn-secondary"
                                                onClick={() => handleDownload(file)}
                                            >
                                                ⬇ Download
                                            </button>
                                            <button
                                                className="btn-sm btn-danger"
                                                onClick={() => handleDelete(file.id)}
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="modal-backdrop">
                    <div className="modal-dialog">
                        <div className="modal-header">
                            <h2>Upload Deliverable or Document</h2>
                            <button
                                className="modal-close-btn"
                                onClick={() => setShowUploadModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUploadSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Target Project (Optional)</label>
                                <select
                                    className="form-input"
                                    value={uploadForm.projectId}
                                    onChange={(e) =>
                                        setUploadForm({
                                            ...uploadForm,
                                            projectId: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">General Agency File</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Select File</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={uploadForm.isSharedWithClient}
                                        onChange={(e) =>
                                            setUploadForm({
                                                ...uploadForm,
                                                isSharedWithClient: e.target.checked,
                                            })
                                        }
                                    />
                                    <span>
                                        <strong>Share with Client Portal:</strong> Check this to make this file visible and downloadable by the client.
                                    </span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowUploadModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={uploading}
                                >
                                    {uploading ? "Uploading..." : "Upload File"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Files;

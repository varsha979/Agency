import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const { loginUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setErrorMessage("");

        try {
            setLoading(true);

            const response = await api.post("/auth/login", {
                email,
                password,
            });

            if (response.data.success) {
                toast.success("Welcome back!");
                loginUser(response.data.user, response.data.token);

                const role = response.data.user.role;
                if (role === "super_admin") {
                    navigate("/super-admin");
                } else if (role === "agency_client") {
                    navigate("/client");
                } else {
                    navigate("/agency");
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Login failed. Check your credentials.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = (demoEmail, demoPassword = "Password123!") => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setErrorMessage("");
    };

    return (
        <div className="login-screen">
            <div className="login-container">
                <div className="login-brand-header">
                    <div className="logo-symbol">⚡</div>
                    <h1>Agency<span>Sync</span></h1>
                    <p>Enterprise Multi-Tenant Project Management SaaS</p>
                </div>

                {errorMessage && (
                    <div className="login-alert-error">
                        <span>⚠️</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="login-box">
                    <h2>Sign In to Your Workspace</h2>
                    <p className="login-box-sub">Enter credentials or click any demo role below</p>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label>Work Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-block btn-lg"
                            disabled={loading}
                        >
                            {loading ? "Authenticating..." : "Sign In to Portal →"}
                        </button>
                    </form>

                    {/* Quick Demo Credentials */}
                    <div className="demo-accounts-panel">
                        <div className="demo-title">
                            <span>⚡ 1-Click Evaluation Credentials</span>
                        </div>

                        <div className="demo-pills-grid">
                            <button
                                type="button"
                                className="demo-pill super"
                                onClick={() => fillCredentials("superadmin@agencysync.com")}
                            >
                                <strong>Super Admin</strong>
                                <span>Platform Owner</span>
                            </button>

                            <button
                                type="button"
                                className="demo-pill agency"
                                onClick={() => fillCredentials("admin@nexus.com")}
                            >
                                <strong>Agency A Admin</strong>
                                <span>Nexus Digital</span>
                            </button>

                            <button
                                type="button"
                                className="demo-pill team"
                                onClick={() => fillCredentials("sarah.dev@nexus.com")}
                            >
                                <strong>Agency A Team</strong>
                                <span>Sarah (Fullstack)</span>
                            </button>

                            <button
                                type="button"
                                className="demo-pill client"
                                onClick={() => fillCredentials("client@acme.com")}
                            >
                                <strong>Client Portal</strong>
                                <span>Acme Corp</span>
                            </button>

                            <button
                                type="button"
                                className="demo-pill agency"
                                onClick={() => fillCredentials("admin@apex.com")}
                            >
                                <strong>Agency B Admin</strong>
                                <span>Apex Growth</span>
                            </button>

                            <button
                                type="button"
                                className="demo-pill suspended"
                                onClick={() => fillCredentials("admin@vortex.com")}
                                title="Click to test Suspended Agency login block!"
                            >
                                <strong>Suspended Agency</strong>
                                <span>Vortex (Blocked)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
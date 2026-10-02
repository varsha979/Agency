import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    withCredentials: true,
});

// Interceptor to inject Token and Support Mode (Impersonation) Header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const impersonatedAgency = localStorage.getItem("impersonatedAgency");
    if (impersonatedAgency) {
        try {
            const agencyObj = JSON.parse(impersonatedAgency);
            if (agencyObj?.id) {
                config.headers["x-impersonate-agency-id"] = agencyObj.id;
            }
        } catch {
            // Ignore parse errors
        }
    }

    return config;
});

export default api;
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token") || null;
    });

    const [impersonatedAgency, setImpersonatedAgency] = useState(() => {
        const saved = localStorage.getItem("impersonatedAgency");
        return saved ? JSON.parse(saved) : null;
    });

    const loginUser = (userData, authToken = null) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        if (authToken) {
            setToken(authToken);
            localStorage.setItem("token", authToken);
        }
    };

    const logoutUser = () => {
        setUser(null);
        setToken(null);
        setImpersonatedAgency(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("impersonatedAgency");
    };

    const impersonateAgency = (agency) => {
        setImpersonatedAgency(agency);
        localStorage.setItem("impersonatedAgency", JSON.stringify(agency));
    };

    const exitImpersonation = () => {
        setImpersonatedAgency(null);
        localStorage.removeItem("impersonatedAgency");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                impersonatedAgency,
                loginUser,
                logoutUser,
                impersonateAgency,
                exitImpersonation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
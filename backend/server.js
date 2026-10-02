import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB, sequelize } from "./config/db.js";
import "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import agencyRoutes from "./routes/agencyRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import clientPortalRoutes from "./routes/clientPortalRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/dashboard", agencyRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/client-portal", clientPortalRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/ai", aiRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "AgencySync API is running",
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync();
        console.log("Database tables synchronized");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
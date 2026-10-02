import { Agency, User, Client, Project, Task, Feedback, Meeting, ActivityLog } from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

const createAgency = async (req, res) => {
    try {
        const { name, email, phone, adminName, adminEmail, adminPassword } = req.body;

        if (!name || !email || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing",
            });
        }

        // Check if agency already exists
        const existingAgency = await Agency.findOne({
            where: { email },
        });

        if (existingAgency) {
            return res.status(409).json({
                success: false,
                message: "Agency already exists",
            });
        }

        // Check if admin email already exists
        const existingUser = await User.findOne({
            where: { email: adminEmail },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Admin email already exists",
            });
        }

        // Create agency
        const agency = await Agency.create({
            name,
            email,
            phone,
            status: "active",
        });

        // Hash admin password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create Agency Admin
        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "agency_admin",
            agencyId: agency.id,
            status: "active",
        });

        return res.status(201).json({
            success: true,
            message: "Agency created successfully",
            agency: {
                id: agency.id,
                name: agency.name,
                email: agency.email,
                status: agency.status,
            },
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                agencyId: admin.agencyId,
            },
        });
    } catch (error) {
        console.error("Create agency error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create agency",
        });
    }
};

const getAgencyDashboard = async (req, res) => {
    try {
        if (!req.agencyId) {
            return res.status(400).json({
                success: false,
                message: "Agency context is missing",
            });
        }

        const agency = await Agency.findByPk(req.agencyId, {
            attributes: ["id", "name", "email", "phone", "status", "createdAt"],
        });

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: "Agency not found",
            });
        }

        const [
            userCount,
            clientCount,
            totalProjects,
            activeProjects,
            totalTasks,
            completedTasks,
            pendingFeedbackCount,
            recentProjects,
            recentActivities
        ] = await Promise.all([
            User.count({
                where: {
                    agencyId: req.agencyId,
                    role: { [Op.in]: ["agency_admin", "agency_team"] },
                },
            }),
            Client.count({
                where: {
                    agencyId: req.agencyId,
                },
            }),
            Project.count({
                where: {
                    agencyId: req.agencyId,
                },
            }),
            Project.count({
                where: {
                    agencyId: req.agencyId,
                    status: { [Op.in]: ["planning", "in_progress"] },
                },
            }),
            Task.count({
                where: {
                    agencyId: req.agencyId,
                },
            }),
            Task.count({
                where: {
                    agencyId: req.agencyId,
                    status: "completed",
                },
            }),
            Feedback.count({
                where: {
                    agencyId: req.agencyId,
                    status: { [Op.in]: ["open", "in_review", "in_progress"] },
                },
            }),
            Project.findAll({
                where: { agencyId: req.agencyId },
                include: [{ model: Client, attributes: ["id", "name", "companyName"] }],
                order: [["createdAt", "DESC"]],
                limit: 5,
            }),
            ActivityLog.findAll({
                where: { agencyId: req.agencyId },
                include: [{ model: User, attributes: ["id", "name", "role"] }],
                order: [["createdAt", "DESC"]],
                limit: 6,
            }),
        ]);

        return res.json({
            success: true,
            agency,
            stats: {
                users: userCount,
                clients: clientCount,
                projects: totalProjects,
                activeProjects,
                tasks: totalTasks,
                completedTasks,
                dueTasks: totalTasks - completedTasks,
                pendingFeedback: pendingFeedbackCount,
            },
            recentProjects,
            recentActivities,
        });

    } catch (error) {
        console.error("Agency dashboard error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load agency dashboard",
        });
    }
};

export { createAgency, getAgencyDashboard };

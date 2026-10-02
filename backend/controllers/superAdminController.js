import {
    Agency,
    User,
    Client,
    Project,
    Task,
    ActivityLog
} from "../models/index.js";
import { Op } from "sequelize";

// Super Admin Dashboard
const getDashboard = async (req, res) => {
    try {
        const totalAgencies = await Agency.count();
        const activeAgencies = await Agency.count({
            where: { status: "active" }
        });
        const inactiveAgencies = await Agency.count({
            where: { status: "inactive" }
        });
        const suspendedAgencies = await Agency.count({
            where: { status: "suspended" }
        });

        const totalUsers = await User.count();
        const totalClients = await Client.count();
        const totalProjects = await Project.count();
        const totalTasks = await Task.count();

        return res.json({
            success: true,
            stats: {
                totalAgencies,
                activeAgencies,
                inactiveAgencies,
                suspendedAgencies,
                totalUsers,
                totalClients,
                totalProjects,
                totalTasks
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load Super Admin dashboard",
            error: error.message
        });
    }
};

// Get all agencies
const getAgencies = async (req, res) => {
    try {
        const { search, status } = req.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where[Op.or] = [
                {
                    name: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                }
            ];
        }

        const agencies = await Agency.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email", "role"],
                    where: { role: "agency_admin" },
                    required: false,
                },
            ],
            order: [["createdAt", "DESC"]]
        });

        return res.json({
            success: true,
            agencies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch agencies",
            error: error.message
        });
    }
};

// Get agency details
const getAgencyDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: "Agency not found"
            });
        }

        const users = await User.findAll({
            where: { agencyId: id },
            attributes: {
                exclude: ["password"]
            }
        });

        const clients = await Client.count({
            where: { agencyId: id }
        });

        const projects = await Project.count({
            where: { agencyId: id }
        });

        const tasks = await Task.count({
            where: { agencyId: id }
        });

        return res.json({
            success: true,
            agency,
            stats: {
                users: users.length,
                clients,
                projects,
                tasks
            },
            users
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch agency details",
            error: error.message
        });
    }
};

// Update agency status
const updateAgencyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "active",
            "inactive",
            "suspended"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid agency status"
            });
        }

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: "Agency not found"
            });
        }

        agency.status = status;
        await agency.save();

        return res.json({
            success: true,
            message: `Agency status changed to ${status} successfully`,
            agency
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update agency status",
            error: error.message
        });
    }
};

// Get agency activity
const getAgencyActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: "Agency not found"
            });
        }

        const activities = await ActivityLog.findAll({
            where: {
                agencyId: id
            },
            include: [{ model: User, attributes: ["id", "name", "role"] }],
            order: [["createdAt", "DESC"]],
            limit: 50
        });

        return res.json({
            success: true,
            activities
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch agency activity",
            error: error.message
        });
    }
};

// Get platform-wide activity log
const getPlatformActivities = async (req, res) => {
    try {
        const activities = await ActivityLog.findAll({
            include: [
                { model: Agency, attributes: ["id", "name"] },
                { model: User, attributes: ["id", "name", "role", "email"] },
                { model: Project, attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
            limit: 100,
        });

        return res.json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch platform activity logs",
            error: error.message,
        });
    }
};

// Super Admin Support Mode (Impersonation)
const supportAgency = async (req, res) => {
    try {
        const { id } = req.params;

        const agency = await Agency.findByPk(id);

        if (!agency) {
            return res.status(404).json({
                success: false,
                message: "Agency not found",
            });
        }

        if (agency.status !== "active") {
            return res.status(403).json({
                success: false,
                message: `Cannot enter support mode for a ${agency.status} agency. Please activate it first.`,
            });
        }

        // Get agency admin
        const agencyAdmin = await User.findOne({
            where: {
                agencyId: id,
                role: "agency_admin",
                status: "active",
            },
            attributes: {
                exclude: ["password"],
            },
        });

        return res.json({
            success: true,
            message: `Entered support mode for ${agency.name}`,
            agency: {
                id: agency.id,
                name: agency.name,
                email: agency.email,
                status: agency.status,
            },
            supportUser: agencyAdmin || null,
        });

    } catch (error) {
        console.error("Support mode error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to activate support mode",
            error: error.message,
        });
    }
};

export {
    getDashboard,
    getAgencies,
    getAgencyDetails,
    updateAgencyStatus,
    getAgencyActivity,
    getPlatformActivities,
    supportAgency,
};
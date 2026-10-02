import {
    ActivityLog,
    User,
    Project,
} from "../models/index.js";
import { Op } from "sequelize";

const createActivity = async (req, res) => {
    try {
        const {
            projectId,
            action,
            description,
            entityType,
            entityId,
            isClientVisible,
        } = req.body;

        if (!action) {
            return res.status(400).json({
                success: false,
                message: "Action is required",
            });
        }

        const activity = await ActivityLog.create({
            agencyId: req.agencyId,
            userId: req.user.id,
            projectId: projectId || null,
            action,
            description: description || null,
            entityType: entityType || null,
            entityId: entityId || null,
            isClientVisible: Boolean(isClientVisible),
        });

        res.status(201).json({
            success: true,
            message: "Activity created successfully",
            activity,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getActivities = async (req, res) => {
    try {
        const where = {
            agencyId: req.agencyId,
        };

        // Client isolation: only client-visible activities for client's projects
        if (req.user.role === "agency_client") {
            const clientProjects = await Project.findAll({
                where: { agencyId: req.agencyId, clientId: req.clientId },
                attributes: ["id"],
            });
            const pIds = clientProjects.map((p) => p.id);
            where.projectId = { [Op.in]: pIds };
            where.isClientVisible = true;
        }

        const activities = await ActivityLog.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "role"],
                    required: false,
                },
                {
                    model: Project,
                    attributes: ["id", "name"],
                    required: false,
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 50,
        });

        res.json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({
            where: { id: projectId, agencyId: req.agencyId },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found in your agency",
            });
        }

        const where = {
            projectId,
            agencyId: req.agencyId,
        };

        if (req.user.role === "agency_client") {
            if (project.clientId !== req.clientId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
            where.isClientVisible = true;
        }

        const activities = await ActivityLog.findAll({
            where,
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "role"],
                    required: false,
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 50,
        });

        res.json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    createActivity,
    getActivities,
    getProjectActivities,
};
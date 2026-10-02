import { Milestone, Project } from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

const createMilestone = async (req, res) => {
    try {
        const { projectId, title, description, dueDate, order } = req.body;

        if (!projectId || !title) {
            return res.status(400).json({
                success: false,
                message: "Project ID and title are required",
            });
        }

        const project = await Project.findOne({
            where: {
                id: projectId,
                agencyId: req.agencyId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found in your agency",
            });
        }

        const milestone = await Milestone.create({
            agencyId: req.agencyId,
            projectId,
            title,
            description: description || null,
            dueDate: dueDate || null,
            status: "pending",
            order: order || 0,
        });

        await logActivity({
            req,
            action: "milestone_created",
            description: `Milestone "${milestone.title}" was added to project "${project.name}"`,
            entityType: "milestone",
            entityId: milestone.id,
            projectId: milestone.projectId,
            isClientVisible: true,
        });

        res.status(201).json({
            success: true,
            message: "Milestone created successfully",
            milestone,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findOne({
            where: {
                id: projectId,
                agencyId: req.agencyId,
            },
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found in your agency",
            });
        }

        // Client isolation check
        if (req.user.role === "agency_client" && project.clientId !== req.clientId) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }

        const milestones = await Milestone.findAll({
            where: {
                projectId,
                agencyId: req.agencyId,
            },
            order: [
                ["order", "ASC"],
                ["dueDate", "ASC"],
                ["id", "ASC"],
            ],
        });

        res.json({
            success: true,
            milestones,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, dueDate, order } = req.body;

        const milestone = await Milestone.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: "Milestone not found in your agency",
            });
        }

        if (title !== undefined) milestone.title = title;
        if (description !== undefined) milestone.description = description;
        if (status !== undefined) milestone.status = status;
        if (dueDate !== undefined) milestone.dueDate = dueDate;
        if (order !== undefined) milestone.order = order;

        await milestone.save();

        await logActivity({
            req,
            action: "milestone_updated",
            description: `Milestone "${milestone.title}" was updated`,
            entityType: "milestone",
            entityId: milestone.id,
            projectId: milestone.projectId,
            isClientVisible: true,
        });

        res.json({
            success: true,
            message: "Milestone updated successfully",
            milestone,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateMilestoneStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "in_progress",
            "completed",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid milestone status",
            });
        }

        const milestone = await Milestone.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: "Milestone not found",
            });
        }

        milestone.status = status;
        await milestone.save();

        await logActivity({
            req,
            action: "milestone_status_updated",
            description: `Milestone "${milestone.title}" status changed to ${status}`,
            entityType: "milestone",
            entityId: milestone.id,
            projectId: milestone.projectId,
            isClientVisible: true,
        });

        res.json({
            success: true,
            message: "Milestone status updated",
            milestone,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteMilestone = async (req, res) => {
    try {
        const { id } = req.params;

        const milestone = await Milestone.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!milestone) {
            return res.status(404).json({
                success: false,
                message: "Milestone not found in your agency",
            });
        }

        await milestone.destroy();

        res.json({
            success: true,
            message: "Milestone deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    createMilestone,
    getMilestones,
    updateMilestone,
    updateMilestoneStatus,
    deleteMilestone,
};
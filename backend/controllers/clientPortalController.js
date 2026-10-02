import {
    Client,
    Project,
    Task,
    Milestone,
    Meeting,
    Feedback,
    FeedbackComment,
    File,
    ActivityLog,
    User,
} from "../models/index.js";
import { Op } from "sequelize";

const getClientDashboard = async (req, res) => {
    try {
        if (!req.agencyId) {
            return res.status(403).json({
                success: false,
                message: "Agency context missing",
            });
        }

        const client = await Client.findOne({
            where: {
                agencyId: req.agencyId,
                ...(req.clientId ? { id: req.clientId } : { email: req.user.email }),
            },
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client profile not found in this agency",
            });
        }

        // Fetch company's projects
        const projects = await Project.findAll({
            where: {
                agencyId: req.agencyId,
                clientId: client.id,
            },
            order: [["createdAt", "DESC"]],
        });

        const projectIds = projects.map((p) => p.id);

        const projectData = await Promise.all(
            projects.map(async (project) => {
                const tasks = await Task.findAll({
                    where: {
                        projectId: project.id,
                        agencyId: req.agencyId,
                    },
                });

                const milestones = await Milestone.findAll({
                    where: {
                        projectId: project.id,
                        agencyId: req.agencyId,
                    },
                    order: [
                        ["order", "ASC"],
                        ["dueDate", "ASC"],
                    ],
                });

                const completedTasks = tasks.filter(
                    (task) => task.status === "completed"
                ).length;

                let progress = 0;
                if (tasks.length > 0) {
                    progress = Math.round((completedTasks / tasks.length) * 100);
                } else if (milestones.length > 0) {
                    const completedMilestones = milestones.filter(
                        (m) => m.status === "completed"
                    ).length;
                    progress = Math.round(
                        (completedMilestones / milestones.length) * 100
                    );
                }

                return {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    priority: project.priority,
                    startDate: project.startDate,
                    dueDate: project.dueDate,
                    progress,
                    totalTasks: tasks.length,
                    completedTasks,
                    milestones,
                };
            })
        );

        // Fetch ONLY meeting notes explicitly marked as shared with client
        const meetings = await Meeting.findAll({
            where: {
                agencyId: req.agencyId,
                clientId: client.id,
                isSharedWithClient: true,
            },
            include: [{ model: Project, attributes: ["id", "name"] }],
            order: [["meetingDate", "ASC"]],
            limit: 15,
        });

        // Fetch client's feedback with threaded comments
        const feedback = await Feedback.findAll({
            where: {
                agencyId: req.agencyId,
                clientId: client.id,
            },
            include: [
                { model: Project, attributes: ["id", "name"] },
                {
                    model: FeedbackComment,
                    include: [{ model: User, attributes: ["id", "name", "role"] }],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 25,
        });

        // Fetch ONLY files explicitly marked as shared with client
        const files = await File.findAll({
            where: {
                agencyId: req.agencyId,
                clientId: client.id,
                isSharedWithClient: true,
            },
            include: [{ model: Project, attributes: ["id", "name"] }],
            order: [["createdAt", "DESC"]],
        });

        // Fetch client-visible activity logs for client's projects
        let activities = [];
        if (projectIds.length > 0) {
            activities = await ActivityLog.findAll({
                where: {
                    agencyId: req.agencyId,
                    projectId: { [Op.in]: projectIds },
                    isClientVisible: true,
                },
                include: [{ model: User, attributes: ["id", "name"] }],
                order: [["createdAt", "DESC"]],
                limit: 10,
            });
        }

        res.json({
            success: true,
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                companyName: client.companyName,
            },
            projects: projectData,
            meetings,
            feedback,
            files,
            activities,
            data: {
                client: {
                    id: client.id,
                    name: client.name,
                    email: client.email,
                    companyName: client.companyName,
                },
                projects: projectData,
                meetings,
                feedback,
                files,
                activities,
            },
        });

    } catch (error) {
        console.error("Client dashboard error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    getClientDashboard,
};
import {
    Meeting,
    Project,
    Client,
} from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

const createMeeting = async (req, res) => {
    try {
        const {
            projectId,
            clientId,
            title,
            meetingDate,
            notes,
            meetingLink,
            isSharedWithClient,
        } = req.body;

        if (!title || !meetingDate) {
            return res.status(400).json({
                success: false,
                message: "Title and meeting date are required",
            });
        }

        let effectiveClientId = clientId || null;

        // If project is provided, verify tenant ownership
        if (projectId) {
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

            if (!effectiveClientId && project.clientId) {
                effectiveClientId = project.clientId;
            }
        }

        // If client is provided, verify tenant ownership
        if (effectiveClientId) {
            const client = await Client.findOne({
                where: {
                    id: effectiveClientId,
                    agencyId: req.agencyId,
                },
            });

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: "Client not found in your agency",
                });
            }
        }

        const meeting = await Meeting.create({
            agencyId: req.agencyId,
            projectId: projectId || null,
            clientId: effectiveClientId || null,
            title,
            meetingDate,
            notes: notes || null,
            meetingLink: meetingLink || null,
            isSharedWithClient: Boolean(isSharedWithClient),
        });

        await logActivity({
            req,
            action: "meeting_created",
            description: `Meeting "${meeting.title}" was scheduled`,
            entityType: "meeting",
            entityId: meeting.id,
            projectId: meeting.projectId || null,
            isClientVisible: Boolean(isSharedWithClient),
        });

        res.status(201).json({
            success: true,
            message: "Meeting created successfully",
            meeting,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMeetings = async (req, res) => {
    try {
        const where = {
            agencyId: req.agencyId,
        };

        // Client isolation: only view meetings explicitly shared with client
        if (req.user.role === "agency_client") {
            if (!req.clientId) {
                return res.status(403).json({
                    success: false,
                    message: "Client profile not found",
                });
            }
            where.clientId = req.clientId;
            where.isSharedWithClient = true;
        }

        const meetings = await Meeting.findAll({
            where,
            include: [
                {
                    model: Project,
                    attributes: ["id", "name"],
                    required: false,
                },
                {
                    model: Client,
                    attributes: ["id", "name", "companyName"],
                    required: false,
                },
            ],
            order: [["meetingDate", "DESC"]],
        });

        res.json({
            success: true,
            count: meetings.length,
            meetings,
            data: meetings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getProjectMeetings = async (req, res) => {
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
            where.isSharedWithClient = true;
        }

        const meetings = await Meeting.findAll({
            where,
            order: [["meetingDate", "DESC"]],
        });

        res.json({
            success: true,
            count: meetings.length,
            meetings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found in your agency",
            });
        }

        const {
            title,
            meetingDate,
            notes,
            meetingLink,
            isSharedWithClient,
            projectId,
            clientId,
        } = req.body;

        if (title !== undefined) meeting.title = title;
        if (meetingDate !== undefined) meeting.meetingDate = meetingDate;
        if (notes !== undefined) meeting.notes = notes;
        if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
        if (isSharedWithClient !== undefined) meeting.isSharedWithClient = Boolean(isSharedWithClient);
        if (projectId !== undefined) meeting.projectId = projectId || null;
        if (clientId !== undefined) meeting.clientId = clientId || null;

        await meeting.save();

        res.json({
            success: true,
            message: "Meeting updated successfully",
            meeting,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;

        const meeting = await Meeting.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Meeting not found in your agency",
            });
        }

        await meeting.destroy();

        res.json({
            success: true,
            message: "Meeting deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    createMeeting,
    getMeetings,
    getProjectMeetings,
    updateMeeting,
    deleteMeeting,
};
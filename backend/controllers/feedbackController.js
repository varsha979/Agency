import {
  Feedback,
  FeedbackComment,
  Project,
  Client,
  User,
} from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

const createFeedback = async (req, res) => {
  try {
    const { projectId, title, description, type, priority } = req.body;

    if (!projectId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Project, title, and description are required",
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

    // Client isolation: Client can only submit feedback for their own company's projects
    if (req.user.role === "agency_client") {
      if (!req.clientId || req.clientId !== project.clientId) {
        return res.status(403).json({
          success: false,
          message: "You cannot submit feedback for this project",
        });
      }
    }

    const newFeedback = await Feedback.create({
      agencyId: req.agencyId,
      projectId,
      clientId: project.clientId,
      createdBy: req.user.id,
      title,
      description,
      type: type || "feedback",
      priority: priority || "medium",
      status: "open",
    });

    await logActivity({
      req,
      action: "feedback_created",
      description: `Feedback "${newFeedback.title}" was submitted`,
      entityType: "feedback",
      entityId: newFeedback.id,
      projectId: newFeedback.projectId,
      isClientVisible: true,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Create feedback error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create feedback",
      error: error.message,
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const where = {
      agencyId: req.agencyId,
    };

    if (req.user.role === "agency_client") {
      if (!req.clientId) {
        return res.status(403).json({
          success: false,
          message: "Client account not found",
        });
      }
      where.clientId = req.clientId;
    }

    const feedback = await Feedback.findAll({
      where,
      include: [
        {
          model: Project,
          attributes: ["id", "name"],
        },
        {
          model: Client,
          attributes: ["id", "name", "companyName"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"],
          required: false,
        },
        {
          model: FeedbackComment,
          attributes: ["id"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProjectFeedback = async (req, res) => {
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
      where.clientId = req.clientId;
    }

    const feedback = await Feedback.findAll({
      where,
      include: [
        {
          model: Client,
          attributes: ["id", "name", "companyName"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"],
          required: false,
        },
        {
          model: FeedbackComment,
          include: [
            {
              model: User,
              attributes: ["id", "name", "role"],
            },
          ],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
      include: [
        {
          model: Project,
          attributes: ["id", "name"],
        },
        {
          model: Client,
          attributes: ["id", "name", "companyName"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "role"],
          required: false,
        },
        {
          model: FeedbackComment,
          include: [
            {
              model: User,
              attributes: ["id", "name", "role"],
            },
          ],
          order: [["createdAt", "ASC"]],
        },
      ],
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    if (req.user.role === "agency_client" && feedback.clientId !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "in_review",
      "in_progress",
      "resolved",
      "declined",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid feedback status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const feedback = await Feedback.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    feedback.status = status;
    await feedback.save();

    await logActivity({
      req,
      action: "feedback_status_updated",
      description: `Feedback "${feedback.title}" status changed to ${status.replace("_", " ")}`,
      entityType: "feedback",
      entityId: feedback.id,
      projectId: feedback.projectId,
      isClientVisible: true,
    });

    res.json({
      success: true,
      message: "Feedback status updated",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addFeedbackComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const feedback = await Feedback.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    if (req.user.role === "agency_client" && feedback.clientId !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "You cannot comment on this feedback item",
      });
    }

    const feedbackComment = await FeedbackComment.create({
      agencyId: req.agencyId,
      feedbackId: id,
      userId: req.user.id,
      comment: comment.trim(),
    });

    await logActivity({
      req,
      action: "feedback_comment_added",
      description: `A comment was added to feedback "${feedback.title}" by ${req.user.name}`,
      entityType: "feedback",
      entityId: feedback.id,
      projectId: feedback.projectId,
      isClientVisible: true,
    });

    // Return comment with user details
    const commentWithUser = await FeedbackComment.findByPk(feedbackComment.id, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "role"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      feedbackComment: commentWithUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeedbackComments = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    if (req.user.role === "agency_client" && feedback.clientId !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const comments = await FeedbackComment.findAll({
      where: {
        feedbackId: id,
        agencyId: req.agencyId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "role"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createFeedback,
  getFeedback,
  getProjectFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  addFeedbackComment,
  getFeedbackComments,
};

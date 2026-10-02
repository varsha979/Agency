import fs from "fs";
import path from "path";

import { File, Project, Client, Task, Feedback, User } from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const { projectId, clientId, taskId, feedbackId, isSharedWithClient } = req.body;
    let effectiveClientId = clientId || null;

    // Verify project belongs to agency
    if (projectId) {
      const project = await Project.findOne({
        where: {
          id: projectId,
          agencyId: req.agencyId,
        },
      });

      if (!project) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Project not found in your agency",
        });
      }

      if (!effectiveClientId && project.clientId) {
        effectiveClientId = project.clientId;
      }
    }

    // Verify task belongs to agency
    if (taskId) {
      const task = await Task.findOne({
        where: { id: taskId, agencyId: req.agencyId },
      });
      if (!task) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Task not found in your agency",
        });
      }
    }

    // Verify feedback belongs to agency
    if (feedbackId) {
      const fb = await Feedback.findOne({
        where: { id: feedbackId, agencyId: req.agencyId },
      });
      if (!fb) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Feedback not found in your agency",
        });
      }
    }

    // Verify client belongs to agency
    if (effectiveClientId) {
      const client = await Client.findOne({
        where: {
          id: effectiveClientId,
          agencyId: req.agencyId,
        },
      });

      if (!client) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Client not found in your agency",
        });
      }
    }

    const file = await File.create({
      agencyId: req.agencyId,
      projectId: projectId || null,
      clientId: effectiveClientId || null,
      taskId: taskId || null,
      feedbackId: feedbackId || null,
      uploadedBy: req.user.id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      isSharedWithClient: Boolean(isSharedWithClient),
    });

    await logActivity({
      req,
      action: "file_uploaded",
      description: `File "${file.originalName}" was uploaded`,
      entityType: "file",
      entityId: file.id,
      projectId: file.projectId,
      isClientVisible: Boolean(isSharedWithClient),
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Upload file error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFiles = async (req, res) => {
  try {
    const { projectId, taskId, feedbackId } = req.query;

    const where = {
      agencyId: req.agencyId,
    };

    if (projectId) where.projectId = projectId;
    if (taskId) where.taskId = taskId;
    if (feedbackId) where.feedbackId = feedbackId;

    // Strict Client isolation: Clients can only see files belonging to their client account
    // AND explicitly marked as isSharedWithClient = true
    if (req.user.role === "agency_client") {
      if (!req.clientId) {
        return res.status(403).json({
          success: false,
          message: "Client account not found",
        });
      }

      where.clientId = req.clientId;
      where.isSharedWithClient = true;
    }

    const files = await File.findAll({
      where,
      include: [
        {
          model: Project,
          attributes: ["id", "name"],
          required: false,
        },
        {
          model: User,
          attributes: ["id", "name", "role"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: files.length,
      files,
      data: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Client isolation check: Client must own the file AND it must be shared with client
    if (req.user.role === "agency_client") {
      if (file.clientId !== req.clientId || !file.isSharedWithClient) {
        return res.status(403).json({
          success: false,
          message: "Access denied. This file is private or does not belong to your account.",
        });
      }
    }

    const resolvedPath = path.resolve(file.filePath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: "Physical file not found on disk",
      });
    }

    res.download(resolvedPath, file.originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found in your agency",
      });
    }

    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    await file.destroy();

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { uploadFile, getFiles, downloadFile, deleteFile };

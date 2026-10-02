import { Project, Client, Task, Milestone, User } from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

// Helper to compute derived project progress from real work
const calculateProjectProgress = async (projectId, agencyId) => {
  const tasks = await Task.findAll({
    where: { projectId, agencyId },
    attributes: ["id", "status"],
  });

  if (tasks.length > 0) {
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    return {
      progress: Math.round((completedTasks / tasks.length) * 100),
      totalTasks: tasks.length,
      completedTasks,
      totalMilestones: 0,
      completedMilestones: 0,
    };
  }

  // Fallback to milestones if no tasks yet
  const milestones = await Milestone.findAll({
    where: { projectId, agencyId },
    attributes: ["id", "status"],
  });

  if (milestones.length > 0) {
    const completedMilestones = milestones.filter(
      (m) => m.status === "completed"
    ).length;
    return {
      progress: Math.round((completedMilestones / milestones.length) * 100),
      totalTasks: 0,
      completedTasks: 0,
      totalMilestones: milestones.length,
      completedMilestones,
    };
  }

  return {
    progress: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMilestones: 0,
    completedMilestones: 0,
  };
};

const createProject = async (req, res) => {
  try {
    const { clientId, name, description, managerId, status, priority, startDate, dueDate } = req.body;

    if (!clientId || !name) {
      return res.status(400).json({
        success: false,
        message: "Client and project name are required",
      });
    }

    // Verify client belongs to current agency (tenant isolation)
    const client = await Client.findOne({
      where: {
        id: clientId,
        agencyId: req.agencyId,
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found in your agency",
      });
    }

    // Verify manager if assigned
    if (managerId) {
      const manager = await User.findOne({
        where: {
          id: managerId,
          agencyId: req.agencyId,
        },
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Assigned project manager not found in your agency",
        });
      }
    }

    const project = await Project.create({
      agencyId: req.agencyId,
      clientId,
      managerId: managerId || null,
      name,
      description: description || null,
      status: status || "planning",
      priority: priority || "medium",
      startDate: startDate || null,
      dueDate: dueDate || null,
    });

    await logActivity({
      req,
      action: "project_created",
      description: `Project "${project.name}" was created for client "${client.companyName}"`,
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      isClientVisible: true,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
};

const getProjects = async (req, res) => {
  try {
    const where = {
      agencyId: req.agencyId,
    };

    // Client isolation: clients can only view their own projects
    if (req.user.role === "agency_client") {
      if (!req.clientId) {
        return res.status(403).json({
          success: false,
          message: "Client account not found",
        });
      }
      where.clientId = req.clientId;
    }

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: Client,
          attributes: ["id", "name", "email", "companyName"],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Derive progress dynamically for each project from real work
    const projectsWithProgress = await Promise.all(
      projects.map(async (p) => {
        const progressStats = await calculateProjectProgress(p.id, req.agencyId);
        const pJson = p.toJSON();
        return {
          ...pJson,
          progress: progressStats.progress,
          totalTasks: progressStats.totalTasks,
          completedTasks: progressStats.completedTasks,
        };
      })
    );

    return res.json({
      success: true,
      count: projectsWithProgress.length,
      projects: projectsWithProgress,
      data: projectsWithProgress,
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
      include: [
        {
          model: Client,
          attributes: ["id", "name", "email", "companyName"],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
          required: false,
        },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Client isolation check
    if (req.user.role === "agency_client" && project.clientId !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own company's projects.",
      });
    }

    const progressStats = await calculateProjectProgress(project.id, req.agencyId);

    const projectData = project.toJSON();
    projectData.progress = progressStats.progress;
    projectData.totalTasks = progressStats.totalTasks;
    projectData.completedTasks = progressStats.completedTasks;

    return res.json({
      success: true,
      project: projectData,
      data: projectData,
      progress: progressStats,
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, clientId, managerId, status, priority, startDate, dueDate } = req.body;

    const project = await Project.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (clientId && clientId !== project.clientId) {
      const client = await Client.findOne({
        where: { id: clientId, agencyId: req.agencyId },
      });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found in your agency",
        });
      }
      project.clientId = clientId;
    }

    if (managerId !== undefined) {
      if (managerId !== null) {
        const manager = await User.findOne({
          where: { id: managerId, agencyId: req.agencyId },
        });
        if (!manager) {
          return res.status(404).json({
            success: false,
            message: "Project manager not found in your agency",
          });
        }
      }
      project.managerId = managerId;
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;

    await project.save();

    await logActivity({
      req,
      action: "project_updated",
      description: `Project "${project.name}" was updated`,
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      isClientVisible: true,
    });

    return res.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["planning", "in_progress", "on_hold", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project status",
      });
    }

    const project = await Project.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    project.status = status;
    await project.save();

    await logActivity({
      req,
      action: "project_status_updated",
      description: `Project "${project.name}" status changed to ${status.replace("_", " ")}`,
      entityType: "project",
      entityId: project.id,
      projectId: project.id,
      isClientVisible: true,
    });

    return res.json({
      success: true,
      message: "Project status updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update project status",
    });
  }
};

const getProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const progressStats = await calculateProjectProgress(project.id, req.agencyId);

    res.json({
      success: true,
      projectId: project.id,
      projectName: project.name,
      ...progressStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.destroy();

    return res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    });
  }
};

export {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  getProjectProgress,
  deleteProject,
};

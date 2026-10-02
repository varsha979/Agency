import { Task, Project, Milestone, User } from "../models/index.js";
import logActivity from "../utils/activityLogger.js";

const createTask = async (req, res) => {
  try {
    const {
      projectId,
      milestoneId,
      assignedTo,
      title,
      description,
      priority,
      dueDate,
    } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: "Project ID and title are required",
      });
    }

    // Check project belongs to current agency (tenant isolation)
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

    // Check milestone if provided
    if (milestoneId) {
      const milestone = await Milestone.findOne({
        where: {
          id: milestoneId,
          projectId,
          agencyId: req.agencyId,
        },
      });

      if (!milestone) {
        return res.status(404).json({
          success: false,
          message: "Milestone not found in this project",
        });
      }
    }

    // Check assigned team member if provided
    if (assignedTo) {
      const teamMember = await User.findOne({
        where: {
          id: assignedTo,
          agencyId: req.agencyId,
        },
      });

      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: "Team member not found in your agency",
        });
      }
    }

    const task = await Task.create({
      agencyId: req.agencyId,
      projectId,
      milestoneId: milestoneId || null,
      assignedTo: assignedTo || null,
      title,
      description: description || null,
      priority: priority || "medium",
      dueDate: dueDate || null,
      status: "todo",
    });

    await logActivity({
      req,
      action: "task_created",
      description: `Task "${task.title}" was created in project "${project.name}"`,
      entityType: "task",
      entityId: task.id,
      projectId: task.projectId,
      isClientVisible: true,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to agency
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
        message: "Access denied to project tasks",
      });
    }

    const tasks = await Task.findAll({
      where: {
        projectId,
        agencyId: req.agencyId,
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          required: false,
        },
        {
          model: Milestone,
          attributes: ["id", "title"],
          required: false,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: {
        agencyId: req.agencyId,
        assignedTo: req.user.id,
      },
      include: [
        {
          model: Project,
          attributes: ["id", "name", "status"],
        },
        {
          model: Milestone,
          attributes: ["id", "title"],
          required: false,
        },
      ],
      order: [["dueDate", "ASC"]],
    });

    res.json({
      success: true,
      count: tasks.length,
      tasks,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, milestoneId, priority, status, dueDate } = req.body;

    const task = await Task.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in your agency",
      });
    }

    if (assignedTo !== undefined) {
      if (assignedTo !== null) {
        const teamMember = await User.findOne({
          where: { id: assignedTo, agencyId: req.agencyId },
        });
        if (!teamMember) {
          return res.status(404).json({
            success: false,
            message: "Assigned user not found in your agency",
          });
        }
      }
      task.assignedTo = assignedTo;
    }

    if (milestoneId !== undefined) {
      if (milestoneId !== null) {
        const milestone = await Milestone.findOne({
          where: { id: milestoneId, projectId: task.projectId, agencyId: req.agencyId },
        });
        if (!milestone) {
          return res.status(404).json({
            success: false,
            message: "Milestone not found in this project",
          });
        }
      }
      task.milestoneId = milestoneId;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    await logActivity({
      req,
      action: "task_updated",
      description: `Task "${task.title}" was updated`,
      entityType: "task",
      entityId: task.id,
      projectId: task.projectId,
      isClientVisible: true,
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["todo", "in_progress", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    const task = await Task.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in your agency",
      });
    }

    task.status = status;
    await task.save();

    await logActivity({
      req,
      action: status === "completed" ? "task_completed" : "task_status_updated",
      description: `Task "${task.title}" marked as ${status.replace("_", " ")}`,
      entityType: "task",
      entityId: task.id,
      projectId: task.projectId,
      isClientVisible: true,
    });

    res.json({
      success: true,
      message: "Task status updated",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      where: {
        id,
        agencyId: req.agencyId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in your agency",
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createTask,
  getProjectTasks,
  getMyTasks,
  updateTask,
  updateTaskStatus,
  deleteTask,
};

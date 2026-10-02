import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Task = sequelize.define(
    "Task",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        agencyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        milestoneId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM(
                "todo",
                "in_progress",
                "completed"
            ),
            defaultValue: "todo",
        },

        priority: {
            type: DataTypes.ENUM(
                "low",
                "medium",
                "high",
                "urgent"
            ),
            defaultValue: "medium",
        },

        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "tasks",
        timestamps: true,
    }
);

export default Task;
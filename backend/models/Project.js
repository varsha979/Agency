import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Project = sequelize.define(
    "Project",
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

        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        managerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM(
                "planning",
                "in_progress",
                "on_hold",
                "completed"
            ),
            defaultValue: "planning",
        },

        priority: {
            type: DataTypes.ENUM("low", "medium", "high"),
            defaultValue: "medium",
        },

        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "projects",
        timestamps: true,
    }
);

export default Project;
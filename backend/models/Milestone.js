import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Milestone = sequelize.define(
    "Milestone",
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

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM(
                "pending",
                "in_progress",
                "completed"
            ),
            defaultValue: "pending",
        },

        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        tableName: "milestones",
        timestamps: true,
    }
);

export default Milestone;
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Feedback = sequelize.define(
    "Feedback",
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

        clientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        type: {
            type: DataTypes.ENUM("feedback", "change_request", "bug"),
            defaultValue: "feedback",
        },

        status: {
            type: DataTypes.ENUM(
                "open",
                "in_review",
                "in_progress",
                "resolved",
                "declined"
            ),
            defaultValue: "open",
        },

        priority: {
            type: DataTypes.ENUM(
                "low",
                "medium",
                "high"
            ),
            defaultValue: "medium",
        },
    },
    {
        tableName: "feedback",
        timestamps: true,
    }
);

export default Feedback;
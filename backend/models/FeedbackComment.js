import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const FeedbackComment = sequelize.define(
    "FeedbackComment",
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

        feedbackId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    },
    {
        tableName: "feedback_comments",
        timestamps: true,
    }
);

export default FeedbackComment;
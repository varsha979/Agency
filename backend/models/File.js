import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const File = sequelize.define(
    "File",
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
            allowNull: true,
        },

        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        taskId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        feedbackId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        isSharedWithClient: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        originalName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        fileName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        filePath: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        mimeType: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: "files",
        timestamps: true,
    }
);

export default File;
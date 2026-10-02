import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const ActivityLog = sequelize.define(
    "ActivityLog",
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

        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        projectId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        entityType: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        isClientVisible: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "activity_logs",
        timestamps: true,
    }
);

export default ActivityLog;
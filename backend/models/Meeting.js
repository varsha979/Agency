import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Meeting = sequelize.define(
    "Meeting",
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

        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        meetingDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        meetingLink: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        isSharedWithClient: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "meetings",
        timestamps: true,
    }
);

export default Meeting;
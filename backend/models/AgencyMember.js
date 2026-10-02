import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const AgencyMember = sequelize.define(
    "AgencyMember",
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
            allowNull: false,
        },

        designation: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "agency_members",
        timestamps: true,
    }
);

export default AgencyMember;
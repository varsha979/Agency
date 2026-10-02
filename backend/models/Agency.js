import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Agency = sequelize.define(
    "Agency",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        logo: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        status: {
            type: DataTypes.ENUM("active", "inactive", "suspended"),
            defaultValue: "active",
        },
    },
    {
        tableName: "agencies",
        timestamps: true,
    }
);

export default Agency;
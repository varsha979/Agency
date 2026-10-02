import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("MySQL Database Connected");
    } catch (error) {
        console.error("Database Connection Failed:", error.message);
        throw error;
    }
};

export { sequelize, connectDB };
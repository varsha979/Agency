import bcrypt from "bcryptjs";
import logActivity from "../utils/activityLogger.js";
import { Client, User, Project } from "../models/index.js";

const createClient = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            companyName,
            password,
        } = req.body;

        if (!name || !email || !companyName || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, company name, and password are required",
            });
        }

        // Check whether client already exists in this agency
        const existingClient = await Client.findOne({
            where: {
                email,
                agencyId: req.agencyId,
            },
        });

        if (existingClient) {
            return res.status(409).json({
                success: false,
                message: "A client with this email already exists in your agency",
            });
        }

        // Email must be globally unique in User table
        const existingUser = await User.findOne({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user login account with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create client company / contact record
        const client = await Client.create({
            agencyId: req.agencyId,
            name,
            email,
            phone: phone || null,
            companyName,
            status: "active",
        });

        // 2. Create client login account with direct clientId link
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "agency_client",
            agencyId: req.agencyId,
            clientId: client.id,
            status: "active",
        });

        await logActivity({
            req,
            action: "client_created",
            description: `Client "${client.companyName}" (${client.name}) was registered`,
            entityType: "client",
            entityId: client.id,
            isClientVisible: false,
        });

        res.status(201).json({
            success: true,
            message: "Client and portal login created successfully",
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                companyName: client.companyName,
                status: client.status,
            },
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                agencyId: user.agencyId,
                clientId: user.clientId,
            },
        });

    } catch (error) {
        console.error("Create client error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getClients = async (req, res) => {
    try {
        const clients = await Client.findAll({
            where: {
                agencyId: req.agencyId,
            },
            include: [
                {
                    model: Project,
                    attributes: ["id", "name", "status"],
                    required: false,
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.json({
            success: true,
            count: clients.length,
            clients,
        });

    } catch (error) {
        console.error("Get clients error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
            include: [
                {
                    model: Project,
                    attributes: ["id", "name", "status", "startDate", "dueDate"],
                },
            ],
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found in your agency",
            });
        }

        res.json({
            success: true,
            client,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, companyName, status } = req.body;

        const client = await Client.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        if (name !== undefined) client.name = name;
        if (phone !== undefined) client.phone = phone;
        if (companyName !== undefined) client.companyName = companyName;
        if (status !== undefined) {
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be active or inactive",
                });
            }
            client.status = status;

            // Also update associated user status
            await User.update(
                { status },
                { where: { agencyId: req.agencyId, [User.sequelize.Op.or]: [{ clientId: client.id }, { email: client.email }] } }
            );
        }

        await client.save();

        res.json({
            success: true,
            message: "Client updated successfully",
            client,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findOne({
            where: {
                id,
                agencyId: req.agencyId,
            },
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        // Remove associated user account
        await User.destroy({
            where: {
                agencyId: req.agencyId,
                [User.sequelize.Op.or]: [{ clientId: client.id }, { email: client.email }],
            },
        });

        await client.destroy();

        res.json({
            success: true,
            message: "Client and portal access deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
};

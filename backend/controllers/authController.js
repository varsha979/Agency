import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Agency, Client } from "../models/index.js";

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Suspended agency check: block login if parent agency is inactive or suspended
        let agency = null;
        if (user.role !== "super_admin") {
            if (!user.agencyId) {
                return res.status(403).json({
                    success: false,
                    message: "User is not associated with any agency",
                });
            }

            agency = await Agency.findByPk(user.agencyId);

            if (!agency) {
                return res.status(403).json({
                    success: false,
                    message: "Associated agency not found",
                });
            }

            if (agency.status === "suspended" || agency.status === "inactive" || agency.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Your agency account has been suspended. Please contact support.",
                });
            }
        }

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Link client user to clientId if not linked
        let clientId = user.clientId || null;
        if (user.role === "agency_client" && !clientId) {
            const clientRecord = await Client.findOne({
                where: { email: user.email, agencyId: user.agencyId },
            });
            if (clientRecord) {
                clientId = clientRecord.id;
                user.clientId = clientRecord.id;
                await user.save();
            }
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                agencyId: user.agencyId,
                clientId,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                agencyId: user.agencyId,
                clientId,
                agency: agency ? { id: agency.id, name: agency.name, status: agency.status } : null,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = req.user;
        let agency = null;
        if (user.agencyId) {
            agency = await Agency.findByPk(user.agencyId, {
                attributes: ["id", "name", "email", "status"],
            });
        }

        let client = null;
        if (user.role === "agency_client") {
            client = await Client.findOne({
                where: {
                    agencyId: user.agencyId,
                    ...(user.clientId ? { id: user.clientId } : { email: user.email }),
                },
            });
        }

        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                agencyId: user.agencyId,
                clientId: user.clientId || client?.id || null,
                agency,
                client,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            agencyId,
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required",
            });
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        const allowedRoles = [
            "super_admin",
            "agency_admin",
            "agency_team",
            "agency_client",
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            agencyId: agencyId || null,
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                agencyId: user.agencyId,
            },
        });
    } catch (error) {
        console.error("Registration Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during registration",
        });
    }
};

const logout = (req, res) => {
    res.clearCookie("token");

    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};

export { login, register, logout, getMe };
import { User } from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

const createTeamMember = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required",
            });
        }

        const memberRole = role === "agency_admin" ? "agency_admin" : "agency_team";

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const member = await User.create({
            name,
            email,
            password: hashedPassword,
            role: memberRole,
            agencyId: req.agencyId,
            status: "active",
        });

        return res.status(201).json({
            success: true,
            message: "Team member created successfully",
            member: {
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                agencyId: member.agencyId,
                status: member.status,
            },
        });
    } catch (error) {
        console.error("Create team member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create team member",
            error: error.message,
        });
    }
};

const getTeamMembers = async (req, res) => {
    try {
        const members = await User.findAll({
            where: {
                agencyId: req.agencyId,
                role: { [Op.in]: ["agency_admin", "agency_team"] },
            },
            attributes: [
                "id",
                "name",
                "email",
                "role",
                "status",
                "createdAt",
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.json({
            success: true,
            count: members.length,
            members,
        });
    } catch (error) {
        console.error("Get team members error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch team members",
            error: error.message,
        });
    }
};

const updateTeamMemberStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, role } = req.body;

        const member = await User.findOne({
            where: {
                id,
                agencyId: req.agencyId,
                role: { [Op.in]: ["agency_admin", "agency_team"] },
            },
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Team member not found in your agency",
            });
        }

        if (status) {
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be active or inactive",
                });
            }
            member.status = status;
        }

        if (role && ["agency_admin", "agency_team"].includes(role)) {
            member.role = role;
        }

        await member.save();

        return res.json({
            success: true,
            message: `Team member updated successfully`,
            member: {
                id: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                status: member.status,
            },
        });
    } catch (error) {
        console.error("Update team member error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update team member",
            error: error.message,
        });
    }
};

const deleteTeamMember = async (req, res) => {
    try {
        const { id } = req.params;

        if (parseInt(id, 10) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account",
            });
        }

        const member = await User.findOne({
            where: {
                id,
                agencyId: req.agencyId,
                role: { [Op.in]: ["agency_admin", "agency_team"] },
            },
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Team member not found in your agency",
            });
        }

        await member.destroy();

        return res.json({
            success: true,
            message: "Team member removed successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete team member",
            error: error.message,
        });
    }
};

export {
    createTeamMember,
    getTeamMembers,
    updateTeamMemberStatus,
    deleteTeamMember,
};

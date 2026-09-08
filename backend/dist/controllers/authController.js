"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.getRoles = exports.getCurrentUser = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'drivepro_super_secure_jwt_secret_key_2026';
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await db_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                instructorProfile: true,
                studentProfile: true,
                employeeProfile: true,
            }
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                instructorProfile: user.instructorProfile,
                studentProfile: user.studentProfile,
                employeeProfile: user.employeeProfile,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                instructorProfile: true,
                studentProfile: true,
                employeeProfile: true,
            }
        });
        return res.json({ success: true, user });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCurrentUser = getCurrentUser;
const getRoles = async (req, res) => {
    try {
        const roles = await db_1.prisma.role.findMany();
        return res.json({ success: true, data: roles });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRoles = getRoles;
const getUsers = async (req, res) => {
    try {
        const users = await db_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                avatar: true,
                status: true,
                createdAt: true,
            }
        });
        return res.json({ success: true, data: users });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUsers = getUsers;

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'drivepro_super_secure_jwt_secret_key_2026';

export const login = async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.email || req.body.username || '';
    const password = req.body.password || '';
    const identifier = String(rawIdentifier).trim().toLowerCase();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required' });
    }

    // Master Admin Credentials: user: admin & password: @dmin#123
    if ((identifier === 'admin' || identifier === 'admin@drivepro.com' || identifier === 'admin@nellaimuniskanna.com') && password === '@dmin#123') {
      const adminUser = {
        id: 'usr_admin_master',
        name: 'M. Muthukumar (Admin)',
        email: 'admin',
        role: 'SUPER_ADMIN',
        avatar: '/assets/images/owner.jpg',
        phone: '+91 94877 19904',
      };

      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role, name: adminUser.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: adminUser,
      });
    }

    // Database Lookup
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { name: { equals: identifier } }
          ]
        },
        include: {
          instructorProfile: true,
          studentProfile: true,
          employeeProfile: true,
        }
      });
    } catch (dbErr) {
      console.warn('Database query fallback during login:', dbErr);
    }

    if (user) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

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
    }

    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        instructorProfile: true,
        studentProfile: true,
        employeeProfile: true,
      }
    });
    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany();
    return res.json({ success: true, data: roles });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
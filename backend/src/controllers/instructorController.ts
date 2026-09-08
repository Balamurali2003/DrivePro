import { Request, Response } from 'express';
import { prisma } from '../db';
import { SmartAllocationService } from '../services/smartAllocationService';

export const getInstructors = async (req: Request, res: Response) => {
  try {
    const instructors = await prisma.instructor.findMany({
      include: {
        assignedVehicles: true,
        _count: { select: { assignedStudents: true, lessons: true } }
      },
      orderBy: { rating: 'desc' }
    });
    return res.json({ success: true, data: instructors });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstructorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instructor = await prisma.instructor.findFirst({
      where: { OR: [{ id }, { instructorCode: id }] },
      include: {
        assignedStudents: true,
        assignedVehicles: true,
        lessons: {
          include: { student: true, vehicle: true, attendance: true },
          orderBy: { lessonDate: 'desc' },
          take: 50,
        },
        feedbacks: { include: { student: true }, orderBy: { createdAt: 'desc' } },
        commissions: { orderBy: { periodMonth: 'desc' } },
      }
    });

    if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found' });
    return res.json({ success: true, data: instructor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSmartAllocations = async (req: Request, res: Response) => {
  try {
    const recommendations = await SmartAllocationService.getRecommendations(req.query as any);
    return res.json({ success: true, data: recommendations });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createInstructor = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.instructor.count();
    const instructorCode = `INS-${300 + count + 1}`;

    const instructor = await prisma.instructor.create({
      data: {
        instructorCode,
        fullName: data.fullName,
        photo: data.photo || null,
        phone: data.phone,
        email: data.email || null,
        gender: data.gender || 'Male',
        address: data.address || null,
        area: data.area || 'Indiranagar',
        experienceYears: data.experienceYears ? parseInt(data.experienceYears) : 3,
        drivingLicence: data.drivingLicence || 'KA0120150009876',
        licenceExpiry: data.licenceExpiry ? new Date(data.licenceExpiry) : new Date(Date.now() + 86400000 * 730),
        specializations: data.specializations || '["MANUAL", "AUTOMATIC", "HIGHWAY"]',
        languages: data.languages || '["English", "Hindi", "Kannada"]',
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary) : 28000,
        commissionPerLesson: data.commissionPerLesson ? parseFloat(data.commissionPerLesson) : 150,
        status: 'AVAILABLE',
      }
    });

    return res.status(201).json({ success: true, data: instructor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const updateInstructor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.instructor.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteInstructor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.instructor.delete({ where: { id } });
    return res.json({ success: true, message: 'Instructor deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

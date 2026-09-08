import { Request, Response } from 'express';
import { prisma } from '../db';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: { packages: true, _count: { select: { enrollments: true } } },
      orderBy: { createdAt: 'asc' }
    });
    return res.json({ success: true, data: courses });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.course.count();
    const code = `CRS-${100 + count + 1}`;
    const price = parseFloat(data.price);
    const tax = price * 0.18;
    const totalFee = price + tax - (parseFloat(data.discount) || 0);

    const course = await prisma.course.create({
      data: {
        code,
        name: data.name,
        description: data.description || null,
        courseType: data.courseType || 'BEGINNER',
        transmission: data.transmission || 'MANUAL',
        vehicleType: data.vehicleType || 'LMV_4W',
        numberOfLessons: data.numberOfLessons ? parseInt(data.numberOfLessons) : 15,
        lessonDurationMinutes: data.lessonDurationMinutes ? parseInt(data.lessonDurationMinutes) : 60,
        price,
        discount: parseFloat(data.discount) || 0,
        taxRate: 18,
        totalFee,
        validityDays: data.validityDays ? parseInt(data.validityDays) : 90,
        status: 'ACTIVE',
      }
    });

    return res.status(201).json({ success: true, data: course });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const price = data.price ? parseFloat(data.price) : undefined;
    const tax = price ? price * 0.18 : undefined;
    const totalFee = price && tax ? price + tax - (parseFloat(data.discount) || 0) : undefined;
    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...data,
        price,
        totalFee,
        numberOfLessons: data.numberOfLessons ? parseInt(data.numberOfLessons) : undefined
      }
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourses = void 0;
const db_1 = require("../db");
const getCourses = async (req, res) => {
    try {
        const courses = await db_1.prisma.course.findMany({
            include: { packages: true, _count: { select: { enrollments: true } } },
            orderBy: { createdAt: 'asc' }
        });
        return res.json({ success: true, data: courses });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCourses = getCourses;
const createCourse = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.course.count();
        const code = `CRS-${100 + count + 1}`;
        const price = parseFloat(data.price);
        const tax = price * 0.18;
        const totalFee = price + tax - (parseFloat(data.discount) || 0);
        const course = await db_1.prisma.course.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const price = data.price ? parseFloat(data.price) : undefined;
        const tax = price ? price * 0.18 : undefined;
        const totalFee = price && tax ? price + tax - (parseFloat(data.discount) || 0) : undefined;
        const updated = await db_1.prisma.course.update({
            where: { id },
            data: {
                ...data,
                price,
                totalFee,
                numberOfLessons: data.numberOfLessons ? parseInt(data.numberOfLessons) : undefined
            }
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.course.delete({ where: { id } });
        return res.json({ success: true, message: 'Course deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCourse = deleteCourse;

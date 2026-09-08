"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInstructor = exports.updateInstructor = exports.createInstructor = exports.getSmartAllocations = exports.getInstructorById = exports.getInstructors = void 0;
const db_1 = require("../db");
const smartAllocationService_1 = require("../services/smartAllocationService");
const getInstructors = async (req, res) => {
    try {
        const instructors = await db_1.prisma.instructor.findMany({
            include: {
                assignedVehicles: true,
                _count: { select: { assignedStudents: true, lessons: true } }
            },
            orderBy: { rating: 'desc' }
        });
        return res.json({ success: true, data: instructors });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getInstructors = getInstructors;
const getInstructorById = async (req, res) => {
    try {
        const { id } = req.params;
        const instructor = await db_1.prisma.instructor.findFirst({
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
        if (!instructor)
            return res.status(404).json({ success: false, message: 'Instructor not found' });
        return res.json({ success: true, data: instructor });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getInstructorById = getInstructorById;
const getSmartAllocations = async (req, res) => {
    try {
        const recommendations = await smartAllocationService_1.SmartAllocationService.getRecommendations(req.query);
        return res.json({ success: true, data: recommendations });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSmartAllocations = getSmartAllocations;
const createInstructor = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.instructor.count();
        const instructorCode = `INS-${300 + count + 1}`;
        const instructor = await db_1.prisma.instructor.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createInstructor = createInstructor;
const updateInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await db_1.prisma.instructor.update({
            where: { id },
            data: req.body
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateInstructor = updateInstructor;
const deleteInstructor = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.instructor.delete({ where: { id } });
        return res.json({ success: true, message: 'Instructor deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteInstructor = deleteInstructor;

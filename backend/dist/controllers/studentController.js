"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.updateStudent = exports.createStudent = exports.getStudent360 = exports.getStudents = void 0;
const db_1 = require("../db");
const aiAnalyticsService_1 = require("../services/aiAnalyticsService");
const getStudents = async (req, res) => {
    try {
        const { status, search, instructorId, page = '1', limit = '100' } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (instructorId && instructorId !== 'ALL')
            where.assignedInstructorId = String(instructorId);
        if (search) {
            where.OR = [
                { fullName: { contains: String(search) } },
                { phone: { contains: String(search) } },
                { studentCode: { contains: String(search) } },
                { email: { contains: String(search) } },
                { area: { contains: String(search) } },
            ];
        }
        const students = await db_1.prisma.student.findMany({
            where,
            include: {
                assignedInstructor: { select: { id: true, fullName: true, rating: true, phone: true } },
                assignedVehicle: { select: { id: true, registrationNumber: true, model: true, transmission: true } },
                enrollments: { include: { course: true } },
                _count: { select: { attendanceHistory: true, payments: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(String(limit)),
        });
        const total = await db_1.prisma.student.count({ where });
        return res.json({ success: true, data: students, total });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudents = getStudents;
const getStudent360 = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await db_1.prisma.student.findFirst({
            where: { OR: [{ id }, { studentCode: id }] },
            include: {
                assignedInstructor: true,
                assignedVehicle: true,
                enrollments: { include: { course: true, package: true, installments: true } },
                attendanceHistory: { orderBy: { classDate: 'asc' } },
                attendances: {
                    orderBy: { date: 'desc' },
                    include: { instructor: true, vehicle: true }
                },
                lessons: {
                    include: { instructor: true, vehicle: true, attendance: true, progress: { include: { skills: true } } },
                    orderBy: { lessonDate: 'desc' }
                },
                payments: { orderBy: { paymentDate: 'desc' } },
                invoices: { orderBy: { invoiceDate: 'desc' } },
                refunds: { orderBy: { refundDate: 'desc' } },
                tests: { orderBy: { testDate: 'desc' } },
                licenceRecords: { orderBy: { applicationDate: 'desc' } },
                complaints: { include: { comments: true }, orderBy: { createdAt: 'desc' } },
                feedbacks: { orderBy: { createdAt: 'desc' } },
                documents: true,
                renewals: true,
                referralsGiven: true,
            }
        });
        if (!student)
            return res.status(404).json({ success: false, message: 'Student not found' });
        const progressList = student.lessons.map(l => l.progress).filter(Boolean);
        const aiProgressInsights = aiAnalyticsService_1.AiAnalyticsService.analyzeStudentProgress(student.lessons, progressList);
        return res.json({
            success: true,
            data: {
                ...student,
                aiProgressInsights,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudent360 = getStudent360;
const createStudent = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.student.count();
        const studentCode = `STU-${2000 + count + 1}`;
        const student = await db_1.prisma.student.create({
            data: {
                studentCode,
                fullName: data.fullName,
                photo: data.photo || null,
                phone: data.phone,
                whatsappNumber: data.whatsappNumber || data.phone,
                email: data.email || null,
                gender: data.gender || 'Male',
                dob: data.dob ? new Date(data.dob) : null,
                address: data.address || null,
                area: data.area || 'Indiranagar',
                emergencyContactName: data.emergencyContactName || null,
                emergencyContactPhone: data.emergencyContactPhone || null,
                idProofType: data.idProofType || 'AADHAAR',
                idProofNumber: data.idProofNumber || null,
                learnerLicenceNumber: data.learnerLicenceNumber || null,
                learnerLicenceExpiry: data.learnerLicenceExpiry ? new Date(data.learnerLicenceExpiry) : null,
                assignedInstructorId: data.assignedInstructorId || null,
                assignedVehicleId: data.assignedVehicleId || null,
                totalLessons: data.totalLessons ? parseInt(data.totalLessons) : 15,
                remainingLessons: data.totalLessons ? parseInt(data.totalLessons) : 15,
                status: 'ACTIVE',
                notes: data.notes || null,
            }
        });
        return res.status(201).json({ success: true, data: student });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createStudent = createStudent;
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const existing = await db_1.prisma.student.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        if (data.fullName !== undefined && !data.fullName?.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }
        if (data.phone !== undefined && !data.phone?.trim()) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }
        // Never change studentCode or ID
        const updateData = {};
        if (data.fullName !== undefined)
            updateData.fullName = data.fullName.trim();
        if (data.phone !== undefined)
            updateData.phone = data.phone.trim();
        if (data.whatsappNumber !== undefined)
            updateData.whatsappNumber = data.whatsappNumber?.trim() || data.phone?.trim() || null;
        if (data.email !== undefined)
            updateData.email = data.email?.trim() || null;
        if (data.gender !== undefined)
            updateData.gender = data.gender;
        if (data.address !== undefined)
            updateData.address = data.address?.trim() || null;
        if (data.area !== undefined)
            updateData.area = data.area?.trim() || null;
        if (data.location !== undefined)
            updateData.location = data.location?.trim() || null;
        if (data.city !== undefined)
            updateData.city = data.city?.trim() || null;
        if (data.district !== undefined)
            updateData.district = data.district?.trim() || null;
        if (data.state !== undefined)
            updateData.state = data.state?.trim() || 'Tamil Nadu';
        if (data.pincode !== undefined)
            updateData.pincode = data.pincode?.trim() || null;
        if (data.latitude !== undefined)
            updateData.latitude = data.latitude !== null && data.latitude !== '' ? parseFloat(data.latitude) : null;
        if (data.longitude !== undefined)
            updateData.longitude = data.longitude !== null && data.longitude !== '' ? parseFloat(data.longitude) : null;
        if (data.age !== undefined)
            updateData.age = data.age !== null && data.age !== '' ? parseInt(data.age, 10) : null;
        if (data.emergencyContactName !== undefined)
            updateData.emergencyContactName = data.emergencyContactName?.trim() || null;
        if (data.emergencyContactPhone !== undefined)
            updateData.emergencyContactPhone = data.emergencyContactPhone?.trim() || null;
        // Course & Training preferences
        if (data.courseJoined !== undefined)
            updateData.courseJoined = data.courseJoined?.trim() || null;
        if (data.trainingRequirement !== undefined)
            updateData.trainingRequirement = data.trainingRequirement?.trim() || null;
        if (data.classPreference !== undefined)
            updateData.classPreference = data.classPreference?.trim() || null;
        if (data.batch !== undefined)
            updateData.batch = data.batch?.trim() || null;
        if (data.vehicleType !== undefined)
            updateData.vehicleType = data.vehicleType?.trim() || null;
        if (data.licenseStatus !== undefined)
            updateData.licenseStatus = data.licenseStatus?.trim() || null;
        if (data.status !== undefined)
            updateData.status = data.status;
        // Staff & Vehicle allocations
        if (data.assignedInstructorId !== undefined)
            updateData.assignedInstructorId = data.assignedInstructorId || null;
        if (data.assignedVehicleId !== undefined)
            updateData.assignedVehicleId = data.assignedVehicleId || null;
        // Licenses
        if (data.learnerLicenceNumber !== undefined)
            updateData.learnerLicenceNumber = data.learnerLicenceNumber?.trim() || null;
        if (data.drivingLicenceNumber !== undefined)
            updateData.drivingLicenceNumber = data.drivingLicenceNumber?.trim() || null;
        if (data.notes !== undefined)
            updateData.notes = data.notes?.trim() || null;
        // Dates
        if (data.dob !== undefined)
            updateData.dob = data.dob ? new Date(data.dob) : null;
        if (data.joiningDate !== undefined)
            updateData.joiningDate = data.joiningDate ? new Date(data.joiningDate) : null;
        if (data.learnerLicenceExpiry !== undefined)
            updateData.learnerLicenceExpiry = data.learnerLicenceExpiry ? new Date(data.learnerLicenceExpiry) : null;
        if (data.drivingLicenceExpiry !== undefined)
            updateData.drivingLicenceExpiry = data.drivingLicenceExpiry ? new Date(data.drivingLicenceExpiry) : null;
        // Fees & Balance calculation
        const hasTotal = data.totalFees !== undefined;
        const hasPaid = data.paidAmount !== undefined;
        if (hasTotal || hasPaid) {
            const newTotal = hasTotal ? (parseFloat(data.totalFees) || 0) : (existing.totalFees ?? 0);
            const newPaid = hasPaid ? (parseFloat(data.paidAmount) || 0) : (existing.paidAmount ?? 0);
            updateData.totalFees = newTotal;
            updateData.paidAmount = newPaid;
            updateData.balanceAmount = Math.max(0, newTotal - newPaid);
        }
        const updated = await db_1.prisma.student.update({
            where: { id },
            data: updateData,
        });
        // Audit Log entry
        const currentUser = req.user;
        try {
            await db_1.prisma.auditLog.create({
                data: {
                    userId: currentUser?.id || 'SYSTEM',
                    userName: currentUser?.name || 'Staff Member',
                    userRole: currentUser?.role || 'STAFF',
                    action: 'UPDATE',
                    module: 'STUDENTS',
                    recordId: id,
                    recordCode: existing.studentCode,
                    oldValue: JSON.stringify({
                        fullName: existing.fullName,
                        phone: existing.phone,
                        status: existing.status,
                        courseJoined: existing.courseJoined,
                        batch: existing.batch,
                        totalFees: existing.totalFees,
                        paidAmount: existing.paidAmount,
                        balanceAmount: existing.balanceAmount,
                    }),
                    newValue: JSON.stringify({
                        fullName: updated.fullName,
                        phone: updated.phone,
                        status: updated.status,
                        courseJoined: updated.courseJoined,
                        batch: updated.batch,
                        totalFees: updated.totalFees,
                        paidAmount: updated.paidAmount,
                        balanceAmount: updated.balanceAmount,
                    }),
                }
            });
        }
        catch (auditError) {
            console.warn('Could not write student audit log:', auditError);
        }
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateStudent = updateStudent;
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.student.delete({ where: { id } });
        return res.json({ success: true, message: 'Student deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteStudent = deleteStudent;

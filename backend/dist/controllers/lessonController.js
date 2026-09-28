"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLesson = exports.getStudentProgress = exports.getLessonMetrics = exports.completeLesson = exports.scheduleLesson = exports.getLessons = void 0;
const lessonMetricsService_1 = require("../services/lessonMetricsService");
const db_1 = require("../db");
const getLessons = async (req, res) => {
    try {
        const { studentId, instructorId, vehicleId, date, status } = req.query;
        const where = {};
        if (studentId)
            where.studentId = String(studentId);
        if (instructorId)
            where.instructorId = String(instructorId);
        if (vehicleId)
            where.vehicleId = String(vehicleId);
        if (status)
            where.status = String(status);
        if (date) {
            const searchDate = new Date(String(date));
            const startOfDay = new Date(new Date(String(date)).setHours(0, 0, 0, 0));
            const endOfDay = new Date(new Date(String(date)).setHours(23, 59, 59, 999));
            where.lessonDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
        const lessons = await db_1.prisma.lesson.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        studentCode: true,
                        fullName: true,
                        phone: true,
                        photo: true,
                        progressPercentage: true
                    }
                },
                instructor: {
                    select: {
                        id: true,
                        instructorCode: true,
                        fullName: true,
                        phone: true,
                        photo: true,
                        rating: true
                    }
                },
                vehicle: {
                    select: {
                        id: true,
                        vehicleCode: true,
                        registrationNumber: true,
                        make: true,
                        model: true,
                        transmission: true
                    }
                },
                attendance: true,
                progress: true
            },
            orderBy: [
                { lessonDate: 'asc' },
                { startTime: 'asc' }
            ]
        });
        return res.json({ success: true, data: lessons });
    }
    catch (error) {
        console.error('Error fetching lessons:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLessons = getLessons;
const scheduleLesson = async (req, res) => {
    try {
        const { studentId, instructorId, vehicleId, lessonDate, startTime, endTime, durationMinutes, pickupLocation, dropLocation, lessonType, topicCovered, notes } = req.body;
        if (!studentId || !instructorId || !vehicleId || !lessonDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Student, Instructor, Vehicle, Date, and Time slots are required.'
            });
        }
        const parsedDate = new Date(lessonDate);
        const startOfDay = new Date(new Date(lessonDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(lessonDate).setHours(23, 59, 59, 999));
        const instructorConflict = await db_1.prisma.lesson.findFirst({
            where: {
                instructorId,
                lessonDate: { gte: startOfDay, lte: endOfDay },
                startTime,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] }
            }
        });
        if (instructorConflict) {
            return res.status(409).json({
                success: false,
                message: 'The selected instructor is already booked for this time slot.'
            });
        }
        const vehicleConflict = await db_1.prisma.lesson.findFirst({
            where: {
                vehicleId,
                lessonDate: { gte: startOfDay, lte: endOfDay },
                startTime,
                status: { notIn: ['CANCELLED', 'NO_SHOW'] }
            }
        });
        if (vehicleConflict) {
            return res.status(409).json({
                success: false,
                message: 'The selected vehicle is already assigned to another session at this time.'
            });
        }
        const count = await db_1.prisma.lesson.count();
        const lessonCode = `LSN-${String(1000 + count + 1).padStart(4, '0')}`;
        const lesson = await db_1.prisma.lesson.create({
            data: {
                lessonCode,
                studentId,
                instructorId,
                vehicleId,
                lessonDate: parsedDate,
                startTime,
                endTime,
                durationMinutes: durationMinutes ? parseInt(String(durationMinutes)) : 60,
                pickupLocation: pickupLocation || 'Main Training Center',
                dropLocation: dropLocation || 'Main Training Center',
                lessonType: lessonType || 'PRACTICAL',
                topicCovered: topicCovered || 'Steering & Clutch Control',
                notes: notes || null,
                status: 'SCHEDULED',
                instructorCommission: 150,
                commissionPaid: false
            },
            include: {
                student: true,
                instructor: true,
                vehicle: true
            }
        });
        return res.status(201).json({
            success: true,
            message: 'Lesson successfully scheduled',
            data: lesson
        });
    }
    catch (error) {
        console.error('Error scheduling lesson:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.scheduleLesson = scheduleLesson;
const completeLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentStatus = 'PRESENT', instructorStatus = 'PRESENT', startKm, endKm, notes, topicsTrained, score, instructorFeedback } = req.body;
        const lesson = await db_1.prisma.lesson.findUnique({
            where: { id },
            include: { student: true }
        });
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }
        const distanceKm = (startKm && endKm) ? Math.max(0, parseInt(String(endKm)) - parseInt(String(startKm))) : 12;
        const updatedLesson = await db_1.prisma.lesson.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                notes: notes || lesson.notes,
                attendance: {
                    upsert: {
                        create: {
                            studentId: lesson.studentId,
                            studentStatus,
                            instructorStatus,
                            checkInTime: new Date(),
                            checkOutTime: new Date(),
                            startKm: startKm ? parseInt(String(startKm)) : null,
                            endKm: endKm ? parseInt(String(endKm)) : null,
                            distanceKm,
                            notes
                        },
                        update: {
                            studentStatus,
                            instructorStatus,
                            checkOutTime: new Date(),
                            startKm: startKm ? parseInt(String(startKm)) : undefined,
                            endKm: endKm ? parseInt(String(endKm)) : undefined,
                            distanceKm,
                            notes
                        }
                    }
                },
                progress: {
                    upsert: {
                        create: {
                            studentId: lesson.studentId,
                            topicsCovered: topicsTrained || lesson.topicCovered || 'Driving Skills Practice',
                            overallScore: score ? parseInt(String(score)) : 4,
                            instructorNotes: instructorFeedback || 'Good control and confidence demonstrated.'
                        },
                        update: {
                            topicsCovered: topicsTrained || lesson.topicCovered || 'Driving Skills Practice',
                            overallScore: score ? parseInt(String(score)) : 4,
                            instructorNotes: instructorFeedback || 'Good control and confidence demonstrated.'
                        }
                    }
                }
            },
            include: {
                student: true,
                instructor: true,
                vehicle: true,
                attendance: true,
                progress: true
            }
        });
        if (lesson.student) {
            const completed = lesson.student.completedLessons + 1;
            const total = lesson.student.totalLessons || 15;
            const progressPercentage = Math.min(100, Math.round((completed / total) * 100));
            await db_1.prisma.student.update({
                where: { id: lesson.studentId },
                data: {
                    completedLessons: completed,
                    remainingLessons: Math.max(0, total - completed),
                    progressPercentage
                }
            });
        }
        return res.json({
            success: true,
            message: 'Lesson marked as completed and student progress updated',
            data: updatedLesson
        });
    }
    catch (error) {
        console.error('Error completing lesson:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.completeLesson = completeLesson;
const getLessonMetrics = async (req, res) => {
    try {
        const { range, startDate, endDate } = req.query;
        const metrics = await lessonMetricsService_1.LessonMetricsService.getMetrics({ range, startDate, endDate });
        return res.json({ success: true, data: metrics });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLessonMetrics = getLessonMetrics;
const getStudentProgress = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.params.id;
        const progress = await lessonMetricsService_1.LessonMetricsService.getStudentDetailedProgress(studentId);
        if (!progress)
            return res.status(404).json({ success: false, message: 'Student not found.' });
        return res.json({ success: true, data: progress });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudentProgress = getStudentProgress;
const updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { lessonDate, startTime, endTime, status, instructorId, vehicleId, topicCovered, notes } = req.body;
        const existing = await db_1.prisma.lesson.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ success: false, message: 'Lesson not found.' });
        const updateData = {};
        if (status)
            updateData.status = status;
        if (topicCovered !== undefined)
            updateData.topicCovered = topicCovered;
        if (notes !== undefined)
            updateData.notes = notes;
        if (instructorId)
            updateData.instructorId = instructorId;
        if (vehicleId)
            updateData.vehicleId = vehicleId;
        if (lessonDate)
            updateData.lessonDate = new Date(lessonDate);
        if (startTime)
            updateData.startTime = startTime;
        if (endTime)
            updateData.endTime = endTime;
        // If rescheduling, check conflicts
        if ((lessonDate || startTime || instructorId || vehicleId) && (!status || status !== 'CANCELLED')) {
            const checkDate = lessonDate ? new Date(lessonDate) : existing.lessonDate;
            const checkStart = startTime || existing.startTime;
            const checkInst = instructorId || existing.instructorId;
            const checkVeh = vehicleId || existing.vehicleId;
            const startOfDay = new Date(checkDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(checkDate);
            endOfDay.setHours(23, 59, 59, 999);
            const instConflict = await db_1.prisma.lesson.findFirst({
                where: {
                    id: { not: id },
                    instructorId: checkInst,
                    lessonDate: { gte: startOfDay, lte: endOfDay },
                    startTime: checkStart,
                    status: { notIn: ['CANCELLED', 'NO_SHOW'] }
                }
            });
            if (instConflict) {
                return res.status(409).json({ success: false, message: 'Instructor is already booked for this slot.' });
            }
            const vehConflict = await db_1.prisma.lesson.findFirst({
                where: {
                    id: { not: id },
                    vehicleId: checkVeh,
                    lessonDate: { gte: startOfDay, lte: endOfDay },
                    startTime: checkStart,
                    status: { notIn: ['CANCELLED', 'NO_SHOW'] }
                }
            });
            if (vehConflict) {
                return res.status(409).json({ success: false, message: 'Vehicle is already booked for this slot.' });
            }
        }
        const updated = await db_1.prisma.lesson.update({
            where: { id },
            data: updateData,
            include: { student: true, instructor: true, vehicle: true }
        });
        return res.json({ success: true, message: 'Lesson updated successfully.', data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateLesson = updateLesson;

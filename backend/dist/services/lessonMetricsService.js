"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonMetricsService = void 0;
const db_1 = require("../db");
const dateFilterHelper_1 = require("./dateFilterHelper");
class LessonMetricsService {
    static async getMetrics(options = {}) {
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)(options);
        const where = dateFilter ? { lessonDate: dateFilter } : {};
        const [totalScheduled, completedLessons, cancelledLessons, missedLessons, durationSum, studentsList] = await Promise.all([
            db_1.prisma.lesson.count({
                where: {
                    ...where,
                    status: 'SCHEDULED'
                }
            }),
            db_1.prisma.lesson.count({
                where: {
                    ...where,
                    status: 'COMPLETED'
                }
            }),
            db_1.prisma.lesson.count({
                where: {
                    ...where,
                    status: 'CANCELLED'
                }
            }),
            db_1.prisma.lesson.count({
                where: {
                    ...where,
                    status: 'NO_SHOW'
                }
            }),
            db_1.prisma.lesson.aggregate({
                where: {
                    ...where,
                    status: 'COMPLETED'
                },
                _sum: { durationMinutes: true }
            }),
            db_1.prisma.student.findMany({
                where: {
                    status: { in: ['ACTIVE', 'COMPLETED', 'IN_PROGRESS'] }
                },
                select: {
                    id: true,
                    progressPercentage: true,
                    completedLessons: true,
                    totalLessons: true,
                    status: true
                }
            })
        ]);
        // Upcoming lessons: scheduled or confirmed with lessonDate >= today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const upcomingLessons = await db_1.prisma.lesson.count({
            where: {
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
                lessonDate: { gte: startOfToday }
            }
        });
        const totalMinutes = durationSum._sum.durationMinutes || 0;
        const totalDrivingHours = Math.round((totalMinutes / 60) * 10) / 10;
        let totalProgressSum = 0;
        let studentsInProgress = 0;
        let studentsCompleted = 0;
        for (const s of studentsList) {
            const pct = s.progressPercentage || 0;
            totalProgressSum += pct;
            if (pct >= 100 || s.status === 'COMPLETED') {
                studentsCompleted++;
            }
            else if (pct > 0 || s.completedLessons > 0) {
                studentsInProgress++;
            }
        }
        const averageProgress = studentsList.length > 0
            ? Math.round(totalProgressSum / studentsList.length)
            : 0;
        return {
            totalScheduled,
            completedLessons,
            upcomingLessons,
            cancelledLessons,
            missedLessons,
            totalDrivingHours,
            practicalDrivingHours: totalDrivingHours,
            totalPracticalHours: totalDrivingHours,
            averageProgress,
            studentsInProgress,
            studentsCompleted
        };
    }
    static async getStudentDetailedProgress(studentId) {
        const student = await db_1.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                assignedInstructor: {
                    select: { id: true, instructorCode: true, fullName: true, phone: true }
                },
                assignedVehicle: {
                    select: { id: true, vehicleCode: true, registrationNumber: true, model: true }
                },
                enrollments: {
                    include: {
                        course: true
                    },
                    take: 1,
                    orderBy: { enrollmentDate: 'desc' }
                },
                lessons: {
                    orderBy: { lessonDate: 'desc' }
                },
                attendanceRecords: true
            }
        });
        if (!student)
            return null;
        const course = student.enrollments?.[0]?.course;
        const totalRequiredLessons = course?.numberOfLessons || student.totalLessons || 15;
        // Categorize completed lessons into Theory and Practical
        const completedLessonsList = student.lessons.filter(l => l.status === 'COMPLETED');
        const theoryCompleted = completedLessonsList.filter(l => l.lessonType.toUpperCase().includes('THEORY')).length;
        const practicalCompleted = completedLessonsList.filter(l => !l.lessonType.toUpperCase().includes('THEORY')).length;
        // Standard curriculum: 3 theory lessons + rest practical
        const requiredTheory = Math.min(3, Math.floor(totalRequiredLessons * 0.25)) || 1;
        const requiredPractical = Math.max(1, totalRequiredLessons - requiredTheory);
        const theoryProgress = Math.min(100, Math.round((theoryCompleted / requiredTheory) * 100));
        const practicalProgress = Math.min(100, Math.round((practicalCompleted / requiredPractical) * 100));
        const overallProgress = Math.min(100, Math.round((completedLessonsList.length / totalRequiredLessons) * 100));
        // Next scheduled lesson
        const now = new Date();
        const upcomingLessons = student.lessons.filter(l => ['SCHEDULED', 'CONFIRMED'].includes(l.status) && new Date(l.lessonDate) >= now);
        const nextLesson = upcomingLessons[upcomingLessons.length - 1] || null;
        const latestLesson = completedLessonsList[0] || null;
        return {
            studentId: student.id,
            studentCode: student.studentCode,
            fullName: student.fullName,
            phone: student.phone,
            courseName: course?.name || 'Standard 4-Wheeler Driving Course',
            joiningDate: student.joiningDate || student.createdAt,
            totalLessons: totalRequiredLessons,
            completedLessons: completedLessonsList.length,
            remainingLessons: Math.max(0, totalRequiredLessons - completedLessonsList.length),
            attendanceCount: student.attendanceRecords?.length || completedLessonsList.length,
            theoryProgress,
            theoryPercentage: theoryProgress,
            practicalProgress,
            practicalPercentage: practicalProgress,
            practicalHoursCompleted: completedLessonsList.length,
            practicalHoursRequired: totalRequiredLessons,
            overallProgress,
            progressPercentage: overallProgress,
            assignedInstructor: student.assignedInstructor?.fullName || 'Not Assigned',
            assignedVehicle: student.assignedVehicle ? `${student.assignedVehicle.model} (${student.assignedVehicle.registrationNumber})` : 'Not Assigned',
            latestLesson: latestLesson ? {
                lessonCode: latestLesson.lessonCode,
                date: latestLesson.lessonDate,
                topic: latestLesson.topicCovered,
                status: latestLesson.status
            } : null,
            nextLesson: nextLesson ? {
                lessonCode: nextLesson.lessonCode,
                date: nextLesson.lessonDate,
                startTime: nextLesson.startTime,
                endTime: nextLesson.endTime,
                type: nextLesson.lessonType
            } : null
        };
    }
}
exports.LessonMetricsService = LessonMetricsService;

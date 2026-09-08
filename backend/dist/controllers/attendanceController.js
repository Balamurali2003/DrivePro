"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendance = getAttendance;
exports.getAttendanceSummary = getAttendanceSummary;
exports.getTodayAttendance = getTodayAttendance;
exports.getStudentAttendance = getStudentAttendance;
exports.getAttendanceReport = getAttendanceReport;
exports.recordAttendance = recordAttendance;
exports.recordBulkAttendance = recordBulkAttendance;
exports.updateAttendance = updateAttendance;
exports.deleteAttendance = deleteAttendance;
const db_1 = require("../db");
/**
 * Format a Date object to YYYY-MM-DD string
 */
function toDateKey(d) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Normalize date range to full UTC day (00:00:00 to 23:59:59.999)
 */
function getDayBounds(dateStr) {
    let target;
    if (dateStr) {
        target = new Date(dateStr);
        if (isNaN(target.getTime()))
            target = new Date();
    }
    else {
        target = new Date();
    }
    const start = new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999));
    return { start, end, dateObj: target };
}
/**
 * GET /api/attendance
 * List attendance records for a specific date or filters, joining real Students and Classes
 */
async function getAttendance(req, res) {
    try {
        const { date, batch, course, instructorId, vehicleId, status, studentId, search } = req.query;
        const { start, end } = getDayBounds(date ? String(date) : undefined);
        // Build student filter - strictly include active and enrolled ongoing students (exclude completed/cancelled)
        const studentWhere = {};
        if (studentId) {
            studentWhere.id = String(studentId);
        }
        else {
            studentWhere.status = { in: ['ACTIVE', 'ENROLLED', 'TRAINING'] };
        }
        if (batch && String(batch) !== 'ALL') {
            studentWhere.batch = { contains: String(batch) };
        }
        if (course && String(course) !== 'ALL') {
            studentWhere.courseJoined = { contains: String(course) };
        }
        if (search) {
            const q = String(search).trim();
            studentWhere.OR = [
                { fullName: { contains: q } },
                { studentCode: { contains: q } },
                { phone: { contains: q } }
            ];
        }
        // Fetch all matched students
        const students = await db_1.prisma.student.findMany({
            where: studentWhere,
            select: {
                id: true,
                studentCode: true,
                fullName: true,
                phone: true,
                batch: true,
                courseJoined: true,
                vehicleType: true,
                status: true,
                assignedInstructor: {
                    select: { id: true, fullName: true }
                },
                assignedVehicle: {
                    select: { id: true, registrationNumber: true, model: true }
                }
            },
            orderBy: { studentCode: 'asc' }
        });
        // Fetch attendance records for this date window
        const attendances = await db_1.prisma.attendance.findMany({
            where: {
                date: { gte: start, lte: end },
                ...(studentId ? { studentId: String(studentId) } : {})
            },
            include: {
                instructor: { select: { id: true, fullName: true } },
                vehicle: { select: { id: true, registrationNumber: true, model: true } },
                class: { select: { id: true, startTime: true, endTime: true, lessonCode: true } }
            }
        });
        const attMap = new Map();
        for (const a of attendances) {
            attMap.set(a.studentId, a);
        }
        // Fetch scheduled lessons for this day if any
        const lessons = await db_1.prisma.lesson.findMany({
            where: {
                lessonDate: { gte: start, lte: end }
            },
            include: {
                instructor: { select: { id: true, fullName: true } },
                vehicle: { select: { id: true, registrationNumber: true, model: true } }
            }
        });
        const lessonMap = new Map();
        for (const l of lessons) {
            lessonMap.set(l.studentId, l);
        }
        // Combine student list with attendance data
        const records = students.map(st => {
            const existingAtt = attMap.get(st.id);
            const scheduledLesson = lessonMap.get(st.id);
            let resolvedStatus = 'Not Marked';
            if (existingAtt?.status) {
                const s = existingAtt.status.toLowerCase();
                if (s === 'present' || s === 'p')
                    resolvedStatus = 'Present';
                else if (s === 'absent' || s === 'a')
                    resolvedStatus = 'Absent';
                else if (s === 'late')
                    resolvedStatus = 'Late';
                else if (s === 'leave')
                    resolvedStatus = 'Leave';
                else
                    resolvedStatus = existingAtt.status;
            }
            const instructorName = existingAtt?.instructor?.fullName || scheduledLesson?.instructor?.fullName || st.assignedInstructor?.fullName || 'Senior Instructor';
            const vehicleInfo = existingAtt?.vehicle?.registrationNumber || scheduledLesson?.vehicle?.registrationNumber || st.assignedVehicle?.registrationNumber || 'TN-72-TRAINING';
            const classTime = scheduledLesson ? `${scheduledLesson.startTime} - ${scheduledLesson.endTime}` : (st.batch || 'Morning Session');
            return {
                id: existingAtt?.id || `virtual-${st.id}`,
                attendanceCode: existingAtt?.attendanceCode || null,
                studentId: st.id,
                studentCode: st.studentCode,
                studentName: st.fullName,
                phone: st.phone,
                course: st.courseJoined || st.vehicleType || 'LMV',
                batch: st.batch || 'Regular Batch',
                instructorId: existingAtt?.instructorId || scheduledLesson?.instructorId || st.assignedInstructor?.id || null,
                instructorName,
                vehicleId: existingAtt?.vehicleId || scheduledLesson?.vehicleId || st.assignedVehicle?.id || null,
                vehicleInfo,
                classId: existingAtt?.classId || scheduledLesson?.id || null,
                classTime,
                date: existingAtt?.date || start,
                dateString: existingAtt?.dateString || toDateKey(start),
                status: resolvedStatus,
                checkInTime: existingAtt?.checkInTime || null,
                checkOutTime: existingAtt?.checkOutTime || null,
                remarks: existingAtt?.remarks || null,
                markedBy: existingAtt?.markedBy || null,
                isMarked: !!existingAtt
            };
        });
        // Filter by status if requested
        let filteredRecords = records;
        if (status && String(status) !== 'ALL') {
            const targetStatus = String(status).toLowerCase();
            filteredRecords = records.filter(r => r.status.toLowerCase() === targetStatus);
        }
        if (instructorId && String(instructorId) !== 'ALL') {
            filteredRecords = filteredRecords.filter(r => r.instructorId === String(instructorId));
        }
        if (vehicleId && String(vehicleId) !== 'ALL') {
            filteredRecords = filteredRecords.filter(r => r.vehicleId === String(vehicleId));
        }
        res.json({
            success: true,
            data: filteredRecords,
            totalCount: filteredRecords.length,
            date: start.toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * GET /api/attendance/summary
 * KPI summary counters for attendance (Total Students, Present, Absent, Leave, Late, Attendance %, Today's Classes)
 */
async function getAttendanceSummary(req, res) {
    try {
        const { date } = req.query;
        const { start, end } = getDayBounds(date ? String(date) : undefined);
        const totalStudents = await db_1.prisma.student.count({
            where: { status: { in: ['ACTIVE', 'ENROLLED', 'TRAINING'] } }
        });
        const attendances = await db_1.prisma.attendance.findMany({
            where: { date: { gte: start, lte: end } }
        });
        let presentCount = 0;
        let absentCount = 0;
        let leaveCount = 0;
        let lateCount = 0;
        for (const a of attendances) {
            const s = (a.status || '').toLowerCase();
            if (s === 'present' || s === 'p') {
                presentCount++;
            }
            else if (s === 'absent' || s === 'a') {
                absentCount++;
            }
            else if (s === 'leave') {
                leaveCount++;
            }
            else if (s === 'late') {
                lateCount++;
            }
        }
        const markedTotal = presentCount + absentCount + leaveCount + lateCount;
        // Calculate Attendance % strictly ignoring Not Marked: Present / (Present + Absent + Late + Leave) * 100
        const attendancePercentage = markedTotal > 0 ? Math.round((presentCount / markedTotal) * 100) : 0;
        const todaysClasses = await db_1.prisma.lesson.count({
            where: { lessonDate: { gte: start, lte: end } }
        });
        res.json({
            success: true,
            data: {
                totalStudents,
                totalEnrolled: totalStudents,
                presentToday: presentCount,
                absentToday: absentCount,
                leaveToday: leaveCount,
                lateToday: lateCount,
                notMarkedToday: Math.max(0, totalStudents - markedTotal),
                markedTotal,
                attendancePercentage,
                todaysClasses: todaysClasses > 0 ? todaysClasses : totalStudents
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * GET /api/attendance/today
 * Quick helper for today's summary and records
 */
async function getTodayAttendance(req, res) {
    req.query.date = new Date().toISOString().split('T')[0];
    return getAttendance(req, res);
}
/**
 * GET /api/attendance/student/:studentId
 * Get comprehensive attendance history and monthly calendar logs for a student
 */
async function getStudentAttendance(req, res) {
    try {
        const { studentId } = req.params;
        const student = await db_1.prisma.student.findUnique({
            where: { id: studentId },
            select: {
                id: true,
                studentCode: true,
                fullName: true,
                phone: true,
                batch: true,
                courseJoined: true,
                vehicleType: true
            }
        });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const records = await db_1.prisma.attendance.findMany({
            where: { studentId },
            orderBy: { date: 'asc' },
            include: {
                instructor: { select: { fullName: true } },
                vehicle: { select: { registrationNumber: true, model: true } },
                class: { select: { startTime: true, endTime: true } }
            }
        });
        let present = 0;
        let absent = 0;
        let leave = 0;
        let late = 0;
        for (const r of records) {
            const s = (r.status || '').toLowerCase();
            if (s === 'present' || s === 'p')
                present++;
            else if (s === 'absent' || s === 'a')
                absent++;
            else if (s === 'leave')
                leave++;
            else if (s === 'late')
                late++;
        }
        const totalMarked = present + absent + leave + late;
        const attendancePct = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 100) : 0;
        res.json({
            success: true,
            data: {
                student,
                summary: {
                    totalClasses: totalMarked,
                    present,
                    absent,
                    leave,
                    late,
                    attendancePercentage: attendancePct
                },
                history: records
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * GET /api/attendance/report
 * Aggregate attendance statistics by student across a date range
 */
async function getAttendanceReport(req, res) {
    try {
        const { startDate, endDate, batch } = req.query;
        const start = startDate ? new Date(String(startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(String(endDate)) : new Date();
        end.setHours(23, 59, 59, 999);
        const students = await db_1.prisma.student.findMany({
            where: {
                ...(batch && String(batch) !== 'ALL' ? { batch: { contains: String(batch) } } : {})
            },
            select: {
                id: true,
                studentCode: true,
                fullName: true,
                phone: true,
                batch: true,
                courseJoined: true,
                status: true,
                attendances: {
                    where: {
                        date: { gte: start, lte: end }
                    }
                }
            },
            orderBy: { studentCode: 'asc' }
        });
        const report = students.map(st => {
            let present = 0;
            let absent = 0;
            let leave = 0;
            let late = 0;
            for (const a of st.attendances) {
                const s = (a.status || '').toLowerCase();
                if (s === 'present' || s === 'p')
                    present++;
                else if (s === 'absent' || s === 'a')
                    absent++;
                else if (s === 'leave')
                    leave++;
                else if (s === 'late')
                    late++;
            }
            const totalClasses = present + absent + leave + late;
            const attendancePercentage = totalClasses > 0 ? Math.round(((present + late) / totalClasses) * 100) : 0;
            return {
                studentId: st.id,
                studentCode: st.studentCode,
                fullName: st.fullName,
                phone: st.phone,
                batch: st.batch || 'Regular Batch',
                course: st.courseJoined || 'LMV',
                studentStatus: st.status,
                totalClasses,
                present,
                absent,
                leave,
                late,
                attendancePercentage
            };
        });
        res.json({
            success: true,
            data: report,
            startDate: start.toISOString(),
            endDate: end.toISOString()
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * POST /api/attendance
 * Record or update a single attendance entry
 */
async function recordAttendance(req, res) {
    try {
        const { studentId, date, status, checkInTime, checkOutTime, remarks, classId, instructorId, vehicleId, markedBy } = req.body;
        if (!studentId) {
            res.status(400).json({ success: false, message: 'Student ID is required' });
            return;
        }
        const { start, dateObj } = getDayBounds(date);
        const dateStr = toDateKey(dateObj);
        // Look for existing record on this day
        const existing = await db_1.prisma.attendance.findFirst({
            where: {
                studentId,
                date: { gte: start, lte: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) },
                ...(classId ? { classId } : {})
            }
        });
        // If status is 'Not Marked', remove any existing record so it reverts cleanly to Not Marked
        if (status === 'Not Marked') {
            if (existing) {
                await db_1.prisma.attendance.delete({ where: { id: existing.id } });
            }
            res.json({
                success: true,
                message: 'Attendance reset to Not Marked',
                data: null
            });
            return;
        }
        let result;
        if (existing) {
            result = await db_1.prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    status: status || existing.status,
                    checkInTime: checkInTime !== undefined ? checkInTime : existing.checkInTime,
                    checkOutTime: checkOutTime !== undefined ? checkOutTime : existing.checkOutTime,
                    remarks: remarks !== undefined ? remarks : existing.remarks,
                    instructorId: instructorId || existing.instructorId,
                    vehicleId: vehicleId || existing.vehicleId,
                    markedBy: markedBy || existing.markedBy || 'Staff'
                }
            });
        }
        else {
            result = await db_1.prisma.attendance.create({
                data: {
                    attendanceCode: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    studentId,
                    classId: classId || null,
                    instructorId: instructorId || null,
                    vehicleId: vehicleId || null,
                    date: start,
                    dateString: dateStr,
                    status: status || 'Present',
                    checkInTime: checkInTime || (status === 'Present' || status === 'Late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null),
                    checkOutTime: checkOutTime || null,
                    remarks: remarks || null,
                    markedBy: markedBy || 'Front Desk Staff'
                }
            });
        }
        res.json({
            success: true,
            message: 'Attendance recorded successfully',
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * POST /api/attendance/bulk
 * Record attendance for multiple students at once
 */
async function recordBulkAttendance(req, res) {
    try {
        const records = req.body.records || req.body.attendanceRecords;
        const { date, markedBy } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            res.status(400).json({ success: false, message: 'No attendance records provided' });
            return;
        }
        const { start, dateObj } = getDayBounds(date);
        const dateStr = toDateKey(dateObj);
        const saved = [];
        for (const item of records) {
            if (!item.studentId)
                continue;
            const existing = await db_1.prisma.attendance.findFirst({
                where: {
                    studentId: item.studentId,
                    date: { gte: start, lte: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1) },
                    ...(item.classId ? { classId: item.classId } : {})
                }
            });
            if (item.status === 'Not Marked') {
                if (existing) {
                    await db_1.prisma.attendance.delete({ where: { id: existing.id } });
                }
                continue;
            }
            if (existing) {
                const updated = await db_1.prisma.attendance.update({
                    where: { id: existing.id },
                    data: {
                        status: item.status || existing.status,
                        checkInTime: item.checkInTime !== undefined ? item.checkInTime : existing.checkInTime,
                        checkOutTime: item.checkOutTime !== undefined ? item.checkOutTime : existing.checkOutTime,
                        remarks: item.remarks !== undefined ? item.remarks : existing.remarks,
                        markedBy: markedBy || 'Staff'
                    }
                });
                saved.push(updated);
            }
            else {
                const created = await db_1.prisma.attendance.create({
                    data: {
                        attendanceCode: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        studentId: item.studentId,
                        classId: item.classId || null,
                        instructorId: item.instructorId || null,
                        vehicleId: item.vehicleId || null,
                        date: start,
                        dateString: dateStr,
                        status: item.status || 'Present',
                        checkInTime: item.checkInTime || (item.status === 'Present' || item.status === 'Late' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null),
                        checkOutTime: item.checkOutTime || null,
                        remarks: item.remarks || null,
                        markedBy: markedBy || 'Front Desk Staff'
                    }
                });
                saved.push(created);
            }
        }
        res.json({
            success: true,
            message: `Successfully processed ${saved.length} attendance records`,
            count: saved.length,
            data: saved
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * PATCH /api/attendance/:id
 * Update an existing attendance record
 */
async function updateAttendance(req, res) {
    try {
        const { id } = req.params;
        const { status, checkInTime, checkOutTime, remarks, markedBy } = req.body;
        const updated = await db_1.prisma.attendance.update({
            where: { id },
            data: {
                ...(status ? { status } : {}),
                ...(checkInTime !== undefined ? { checkInTime } : {}),
                ...(checkOutTime !== undefined ? { checkOutTime } : {}),
                ...(remarks !== undefined ? { remarks } : {}),
                ...(markedBy ? { markedBy } : {})
            }
        });
        res.json({
            success: true,
            message: 'Attendance updated',
            data: updated
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * DELETE /api/attendance/:id
 * Delete an attendance record
 */
async function deleteAttendance(req, res) {
    try {
        const { id } = req.params;
        await db_1.prisma.attendance.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Attendance record removed'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

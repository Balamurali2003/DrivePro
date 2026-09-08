"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadAssignmentStats = exports.getRtoStats = exports.getFollowupStats = exports.getAttendanceStats = exports.getPaymentStats = exports.getClassStats = exports.getStudentStats = exports.getLeadStats = exports.getDashboardStats = void 0;
const db_1 = require("../db");
function parseDateFilter(period, startStr, endStr) {
    const now = new Date();
    const normalizedPeriod = (period || 'all').toLowerCase().trim();
    if (normalizedPeriod === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { startDate: start, endDate: end, periodLabel: 'Today' };
    }
    if (normalizedPeriod === 'yesterday') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return { startDate: start, endDate: end, periodLabel: 'Yesterday' };
    }
    if (normalizedPeriod === 'last7days' || normalizedPeriod === 'week') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { startDate: start, endDate: now, periodLabel: 'Last 7 Days' };
    }
    if (normalizedPeriod === 'last30days') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { startDate: start, endDate: now, periodLabel: 'Last 30 Days' };
    }
    if (normalizedPeriod === 'month' || normalizedPeriod === 'thismonth') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { startDate: start, endDate: end, periodLabel: 'This Month' };
    }
    if (normalizedPeriod === 'lastmonth') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: start, endDate: end, periodLabel: 'Last Month' };
    }
    if (normalizedPeriod === 'custom' && startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            end.setHours(23, 59, 59, 999);
            return { startDate: start, endDate: end, periodLabel: 'Custom Range' };
        }
    }
    return { periodLabel: 'All Time' };
}
// ---------------------------------------------------------------------------
// 1. Core Computation Engine
// ---------------------------------------------------------------------------
async function computeDashboardMetrics(range) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const { startDate, endDate } = range;
    const leadDateFilter = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : (startDate ? { createdAt: { gte: startDate } } : {});
    const studentDateFilter = startDate && endDate ? { createdAt: { gte: startDate, lte: endDate } } : (startDate ? { createdAt: { gte: startDate } } : {});
    const paymentDateFilter = startDate && endDate ? { paymentDate: { gte: startDate, lte: endDate } } : (startDate ? { paymentDate: { gte: startDate } } : {});
    const attendanceDateFilter = startDate && endDate ? { date: { gte: startDate, lte: endDate } } : (startDate ? { date: { gte: startDate } } : {});
    const followupDateFilter = startDate && endDate ? { followupDate: { gte: startDate, lte: endDate } } : (startDate ? { followupDate: { gte: startDate } } : {});
    // Parallel Database Queries
    const [
    // Leads (Section 3)
    totalLeads, newLeads, contactedLeads, interestedLeads, followupLeads, convertedLeads, notInterestedLeads, callNotAttended, interestedNeedTime, todayComeToJoin, 
    // Lead Raw for Campaign & Source Metrics (Section 4)
    allLeadsForCampaigns, 
    // Students (Section 5)
    totalStudents, activeStudents, newStudentsPeriod, completedStudents, pendingRegistrationLeads, studentsWithBalance, allStudents, 
    // Classes & Attendance (Section 6)
    todayClassesCount, completedClassesCount, upcomingClassesCount, cancelledClassesCount, allAttendanceRecords, 
    // Payments & Revenue (Section 7 & 8)
    todayPaymentsAgg, weekPaymentsAgg, monthPaymentsAgg, totalPaymentsAgg, allPaymentsList, allExpensesList, 
    // Follow-ups (Section 9)
    todayFollowupsCount, upcomingFollowupsCount, overdueFollowupsCount, completedFollowupsCount, leadsWithoutFollowupCount, 
    // RTO (Section 10)
    allLicenceRecords, 
    // Fleet & Instructors
    activeInstructors, totalVehicles, maintenanceVehicles, openComplaintsCount, renewalsDueCount, 
    // Widgets Data
    recentLeads, recentPayments, todaySchedule, overdueFollowups, serviceDueVehicles,] = await Promise.all([
        // Section 3: Leads Counts
        db_1.prisma.lead.count({ where: leadDateFilter }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['New', 'NEW'] } } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['Contacted', 'CONTACTED', 'Contacted - Interested (Need Time)', 'Contacted - Not Interested'] } } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['Interested', 'INTERESTED', 'Contacted - Interested (Need Time)', 'Today Come to Join'] } } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, OR: [{ status: { in: ['Follow-up Scheduled', 'FOLLOW_UP'] } }, { followups: { some: { status: 'SCHEDULED' } } }] } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['Converted', 'CONVERTED'] } } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['Contacted - Not Interested', 'Not Interested', 'Lost', 'LOST'] } } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: 'Call - Not Attended' } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: 'Contacted - Interested (Need Time)' } }),
        db_1.prisma.lead.count({ where: { ...leadDateFilter, status: { in: ['Today Come to Join', 'Expected Today'] } } }),
        // Section 4: Campaigns
        db_1.prisma.lead.findMany({
            where: leadDateFilter,
            select: { id: true, leadCampaign: true, leadSource: true, dataSources: true }
        }),
        // Section 5: Students
        db_1.prisma.student.count(),
        db_1.prisma.student.count({ where: { status: 'ACTIVE' } }),
        db_1.prisma.student.count({ where: studentDateFilter }),
        db_1.prisma.student.count({ where: { status: 'COMPLETED' } }),
        db_1.prisma.lead.count({ where: { status: 'Registration Pending' } }),
        db_1.prisma.student.count({ where: { balanceAmount: { gt: 0 } } }),
        db_1.prisma.student.findMany({
            select: { id: true, courseJoined: true, vehicleType: true, totalFees: true, paidAmount: true, balanceAmount: true, status: true }
        }),
        // Section 6: Classes & Attendance
        db_1.prisma.lesson.count({ where: { lessonDate: { gte: startOfToday, lte: endOfToday } } }),
        db_1.prisma.lesson.count({ where: { status: 'COMPLETED' } }),
        db_1.prisma.lesson.count({ where: { lessonDate: { gt: endOfToday }, status: 'SCHEDULED' } }),
        db_1.prisma.lesson.count({ where: { status: 'CANCELLED' } }),
        db_1.prisma.attendance.findMany({ where: attendanceDateFilter }),
        // Section 7 & 8: Revenue
        db_1.prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentDate: { gte: startOfToday, lte: endOfToday }, paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] } } }),
        db_1.prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentDate: { gte: startOfWeek }, paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] } } }),
        db_1.prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentDate: { gte: startOfMonth }, paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] } } }),
        db_1.prisma.payment.aggregate({ _sum: { amount: true }, where: { paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] } } }),
        db_1.prisma.payment.findMany({ select: { amount: true, paymentDate: true, studentId: true } }),
        db_1.prisma.expense.findMany({ select: { amount: true, expenseDate: true, category: true } }),
        // Section 9: Follow-ups
        db_1.prisma.leadFollowup.count({ where: { followupDate: { gte: startOfToday, lte: endOfToday } } }),
        db_1.prisma.leadFollowup.count({ where: { followupDate: { gt: endOfToday }, status: 'SCHEDULED' } }),
        db_1.prisma.leadFollowup.count({ where: { followupDate: { lt: startOfToday }, status: 'SCHEDULED' } }),
        db_1.prisma.leadFollowup.count({ where: { status: 'COMPLETED' } }),
        db_1.prisma.lead.count({ where: { followups: { none: {} } } }),
        // Section 10: RTO
        db_1.prisma.licenceRecord.findMany(),
        // Fleet & Staff
        db_1.prisma.instructor.count({ where: { status: 'AVAILABLE' } }),
        db_1.prisma.vehicle.count(),
        db_1.prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
        db_1.prisma.complaint.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } }),
        db_1.prisma.renewal.count({ where: { status: 'PENDING' } }),
        // Widgets
        db_1.prisma.lead.findMany({ take: 6, orderBy: { createdAt: 'desc' } }),
        db_1.prisma.payment.findMany({ take: 6, orderBy: { paymentDate: 'desc' }, include: { student: true } }),
        db_1.prisma.lesson.findMany({
            take: 8,
            where: { lessonDate: { gte: startOfToday } },
            include: { student: true, instructor: true, vehicle: true },
            orderBy: { startTime: 'asc' }
        }),
        db_1.prisma.leadFollowup.findMany({
            take: 6,
            where: { status: 'SCHEDULED' },
            include: { lead: true },
            orderBy: { followupDate: 'asc' }
        }),
        db_1.prisma.vehicle.findMany({
            take: 5,
            where: { status: { in: ['AVAILABLE', 'MAINTENANCE'] } },
            orderBy: { nextServiceDate: 'asc' }
        }),
    ]);
    // -------------------------------------------------------------------------
    // Process Section 4: Campaigns & Sources (Show 0 if empty)
    // -------------------------------------------------------------------------
    let smtMetaCount = 0;
    let freeTrialCount = 0;
    let vinayagarCount = 0;
    let smkEnquiryCount = 0;
    let websiteCount = 0;
    let whatsappCount = 0;
    let phoneCount = 0;
    let walkInCount = 0;
    let referralCount = 0;
    let otherCount = 0;
    for (const l of allLeadsForCampaigns) {
        const c = (l.leadCampaign || '').toLowerCase();
        const s = (l.leadSource || '').toLowerCase();
        const d = (l.dataSources || '').toLowerCase();
        if (c.includes('free trial') || c.includes('free driving') || d.includes('free trial')) {
            freeTrialCount++;
        }
        else if (c.includes('vinayagar') || d.includes('vinayagar')) {
            vinayagarCount++;
        }
        else if (c.includes('smk') || c.includes('anniversary') || d.includes('meta (sheet1)')) {
            smtMetaCount++;
        }
        else if (s.includes('sri munis kanna') || s.includes('enquiry') || d.includes('sri munis kanna')) {
            smkEnquiryCount++;
        }
        else if (s.includes('whatsapp')) {
            whatsappCount++;
        }
        else if (s.includes('website') || s.includes('web')) {
            websiteCount++;
        }
        else if (s.includes('phone') || s.includes('call')) {
            phoneCount++;
        }
        else if (s.includes('walk')) {
            walkInCount++;
        }
        else if (s.includes('referral') || s.includes('refer')) {
            referralCount++;
        }
        else {
            otherCount++;
        }
    }
    const campaignMetrics = [
        { campaign: 'SMT Meta Leads', count: smtMetaCount },
        { campaign: 'Free Trial', count: freeTrialCount },
        { campaign: 'Vinayagar Chaturthi Offer', count: vinayagarCount },
        { campaign: 'Sri Munis Kanna Enquiries', count: smkEnquiryCount },
        { campaign: 'WhatsApp', count: whatsappCount },
        { campaign: 'Website', count: websiteCount },
        { campaign: 'Phone', count: phoneCount },
        { campaign: 'Walk-in', count: walkInCount },
        { campaign: 'Referral', count: referralCount },
        { campaign: 'Other', count: otherCount },
    ];
    // -------------------------------------------------------------------------
    // Process Section 5 & 7: Student Financials (Actual Sri Munis Kanna Data)
    // -------------------------------------------------------------------------
    let totalCourseFees = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let partialPaymentsCount = 0;
    let fullyPaidStudentsCount = 0;
    for (const stu of allStudents) {
        const fee = stu.totalFees || 0;
        const paid = stu.paidAmount || 0;
        const bal = stu.balanceAmount !== null && stu.balanceAmount !== undefined ? stu.balanceAmount : (fee - paid);
        totalCourseFees += fee;
        totalPaid += paid;
        totalOutstanding += bal;
        if (bal <= 0) {
            fullyPaidStudentsCount++;
        }
        else if (paid > 0 && bal > 0) {
            partialPaymentsCount++;
        }
    }
    // -------------------------------------------------------------------------
    // Process Section 6: Attendance Metrics
    // -------------------------------------------------------------------------
    const totalAttendanceRecords = allAttendanceRecords.length;
    const presentStudents = allAttendanceRecords.filter(a => a.status === 'P' || (a.status || '').toLowerCase().includes('present')).length;
    const absentStudents = allAttendanceRecords.filter(a => a.status === 'A' || (a.status || '').toLowerCase().includes('absent')).length;
    const leaveStudents = allAttendanceRecords.filter(a => (a.status || '').toLowerCase().includes('leave')).length;
    const lateStudents = allAttendanceRecords.filter(a => (a.status || '').toLowerCase().includes('late')).length;
    const markedAttendanceTotal = presentStudents + absentStudents + leaveStudents + lateStudents;
    const attendancePercentage = markedAttendanceTotal > 0 ? Math.round(((presentStudents + lateStudents) / markedAttendanceTotal) * 100) : 0;
    // -------------------------------------------------------------------------
    // Process Section 8: Revenue Metrics
    // -------------------------------------------------------------------------
    const todayRevenue = todayPaymentsAgg._sum.amount || 0;
    const thisWeekRevenue = weekPaymentsAgg._sum.amount || 0;
    const thisMonthRevenue = monthPaymentsAgg._sum.amount || 0;
    const totalCollected = totalPaid > 0 ? totalPaid : (totalPaymentsAgg._sum.amount || 0);
    const outstandingAmount = totalOutstanding;
    // -------------------------------------------------------------------------
    // Process Section 10: RTO Metrics
    // -------------------------------------------------------------------------
    const totalRtoCandidates = allLicenceRecords.length;
    let llPending = 0;
    let drivingTestScheduled = 0;
    let drivingTestCompleted = 0;
    let licenceReceived = 0;
    let licencePending = 0;
    for (const r of allLicenceRecords) {
        const statusLower = (r.licenseStatus || '').toLowerCase();
        const resultLower = (r.result || '').toLowerCase();
        if (!r.llDate || statusLower === 'pending') {
            llPending++;
        }
        if (r.drivingTestDate && new Date(r.drivingTestDate) >= startOfToday) {
            drivingTestScheduled++;
        }
        if ((r.drivingTestDate && new Date(r.drivingTestDate) < startOfToday) || resultLower === 'passed') {
            drivingTestCompleted++;
        }
        if (r.licenseReceivedDate || statusLower.includes('received') || statusLower.includes('issued')) {
            licenceReceived++;
        }
        else {
            licencePending++;
        }
    }
    // -------------------------------------------------------------------------
    // Process Section 11: Dynamic Charts
    // -------------------------------------------------------------------------
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};
    allPaymentsList.forEach(p => {
        if (p.paymentDate) {
            const d = new Date(p.paymentDate);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: key, year: d.getFullYear(), monthIdx: d.getMonth(), revenue: 0, expense: 0, profit: 0 };
            }
            monthlyMap[key].revenue += p.amount;
        }
    });
    allExpensesList.forEach(e => {
        if (e.expenseDate) {
            const d = new Date(e.expenseDate);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!monthlyMap[key]) {
                monthlyMap[key] = { month: key, year: d.getFullYear(), monthIdx: d.getMonth(), revenue: 0, expense: 0, profit: 0 };
            }
            monthlyMap[key].expense += e.amount;
        }
    });
    Object.values(monthlyMap).forEach(item => {
        item.profit = item.revenue - item.expense;
    });
    const monthlyFinancials = Object.values(monthlyMap).sort((a, b) => (a.year - b.year) || (a.monthIdx - b.monthIdx));
    // Revenue by Course (Aggregated strictly from real Student database records)
    const courseMap = {};
    allStudents.forEach(s => {
        const c = s.courseJoined || s.vehicleType || 'LMV';
        courseMap[c] = (courseMap[c] || 0) + (s.paidAmount || 0);
    });
    const revenueByCourse = Object.entries(courseMap).map(([course, revenue]) => ({ course, revenue }));
    // Lead Funnel (Calculated strictly from real database status records)
    const leadFunnel = [
        { stage: 'Total Inquiries', count: totalLeads },
        { stage: 'Contacted', count: contactedLeads },
        { stage: 'Trial / Need Time', count: interestedNeedTime + freeTrialCount },
        { stage: 'Registered Students', count: totalStudents },
        { stage: 'Licence In Process / Done', count: totalRtoCandidates },
    ];
    const totalExpenseSum = allExpensesList.reduce((acc, curr) => acc + curr.amount, 0);
    return {
        period: range.periodLabel,
        kpi: {
            totalLeads,
            newLeads,
            activeStudents,
            completedStudents,
            todayLessons: todayClassesCount,
            completedLessons: completedClassesCount,
            pendingPaymentsTotal: totalOutstanding,
            monthlyRevenue: totalCollected,
            totalExpenses: totalExpenseSum,
            netProfit: totalCollected - totalExpenseSum,
            activeInstructors,
            totalVehicles,
            availableVehicles: totalVehicles - maintenanceVehicles,
            vehiclesUnderMaintenance: maintenanceVehicles,
            openComplaints: openComplaintsCount,
            renewalsDue: renewalsDueCount,
            attendanceRatePct: attendancePercentage,
        },
        leads: {
            totalLeads,
            newLeads,
            contactedLeads,
            interestedLeads,
            followupLeads,
            convertedLeads,
            notInterestedLeads,
            callNotAttended,
            interestedNeedTime,
            todayComeToJoin,
        },
        campaigns: campaignMetrics,
        students: {
            totalStudents,
            activeStudents,
            newStudents: newStudentsPeriod,
            completedStudents,
            attendingClasses: totalStudents,
            pendingRegistration: pendingRegistrationLeads,
            pendingPayment: studentsWithBalance,
        },
        classes: {
            todayClasses: todayClassesCount > 0 ? todayClassesCount : totalStudents,
            completedClasses: completedClassesCount,
            upcomingClasses: upcomingClassesCount,
            cancelledClasses: cancelledClassesCount,
            presentStudents,
            absentStudents,
            leaveStudents,
            lateStudents,
            attendancePercentage,
        },
        payments: {
            totalCourseFees,
            totalPaid,
            totalOutstanding,
            partialPayments: partialPaymentsCount,
            fullyPaidStudents: fullyPaidStudentsCount,
            overduePayments: studentsWithBalance,
        },
        revenue: {
            todayRevenue,
            thisWeekRevenue,
            thisMonthRevenue,
            totalCollected,
            outstandingAmount,
        },
        followups: {
            todayFollowups: todayFollowupsCount,
            upcomingFollowups: upcomingFollowupsCount,
            overdueFollowups: overdueFollowupsCount,
            completedFollowups: completedFollowupsCount,
            leadsWithoutFollowup: leadsWithoutFollowupCount,
        },
        rto: {
            totalCandidates: totalRtoCandidates,
            llPending,
            drivingTestScheduled,
            drivingTestCompleted,
            licenceReceived,
            licencePending,
        },
        charts: {
            monthlyFinancials,
            revenueByCourse,
            leadFunnel,
            leadsBySource: campaignMetrics.filter(c => c.count > 0),
            attendanceBreakdown: [
                { name: 'Present', count: presentStudents, fill: '#10b981' },
                { name: 'Absent', count: absentStudents, fill: '#f43f5e' },
                { name: 'Leave', count: leaveStudents, fill: '#f59e0b' },
                { name: 'Late', count: lateStudents, fill: '#6366f1' }
            ]
        },
        widgets: {
            todaySchedule,
            overdueFollowups,
            recentLeads,
            recentPayments,
            serviceDueVehicles,
        }
    };
}
// ---------------------------------------------------------------------------
// 2. Exported Controller Handlers
// ---------------------------------------------------------------------------
const getDashboardStats = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;
        const range = parseDateFilter(period ? String(period) : undefined, startDate ? String(startDate) : undefined, endDate ? String(endDate) : undefined);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getLeadStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: { leads: data.leads, campaigns: data.campaigns } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadStats = getLeadStats;
const getStudentStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: data.students });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getStudentStats = getStudentStats;
const getClassStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: data.classes });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getClassStats = getClassStats;
const getPaymentStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: { payments: data.payments, revenue: data.revenue } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPaymentStats = getPaymentStats;
const getAttendanceStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: { classes: data.classes, breakdown: data.charts.attendanceBreakdown } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAttendanceStats = getAttendanceStats;
const getFollowupStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: data.followups });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFollowupStats = getFollowupStats;
const getRtoStats = async (req, res) => {
    try {
        const range = parseDateFilter(req.query.period);
        const data = await computeDashboardMetrics(range);
        return res.json({ success: true, data: data.rto });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRtoStats = getRtoStats;
/**
 * GET /api/dashboard/lead-assignment
 * Real-time Lead Assignment statistics and staff-wise breakdown
 */
const getLeadAssignmentStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        const endOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        const totalLeads = await db_1.prisma.lead.count();
        const assignedLeads = await db_1.prisma.lead.count({ where: { assignedToId: { not: null } } });
        const unassignedLeads = await db_1.prisma.lead.count({ where: { assignedToId: null } });
        const users = await db_1.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                assignedLeads: {
                    select: {
                        id: true,
                        priorityLevel: true,
                        priority: true,
                        followups: {
                            where: {
                                followupDate: { gte: startOfToday, lte: endOfToday }
                            },
                            select: { id: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        const staffBreakdown = users.map(u => {
            const assignedCount = u.assignedLeads.length;
            const highPriorityCount = u.assignedLeads.filter(l => (l.priorityLevel || l.priority || '').toUpperCase() === 'HIGH').length;
            let followupsTodayCount = 0;
            for (const l of u.assignedLeads) {
                followupsTodayCount += (l.followups ? l.followups.length : 0);
            }
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                assignedCount,
                assignedLeads: assignedCount,
                highPriorityCount,
                highPriority: highPriorityCount,
                followupsTodayCount,
                followupsToday: followupsTodayCount
            };
        });
        return res.json({
            success: true,
            data: {
                totalLeads,
                assignedLeads,
                unassignedLeads,
                staffBreakdown
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLeadAssignmentStats = getLeadAssignmentStats;

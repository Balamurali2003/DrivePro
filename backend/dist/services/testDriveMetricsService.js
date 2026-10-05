"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDriveMetricsService = void 0;
const db_1 = require("../db");
const dateFilterHelper_1 = require("./dateFilterHelper");
class TestDriveMetricsService {
    static async getMetrics(options = {}) {
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)(options);
        const where = dateFilter ? { scheduledDate: dateFilter } : {};
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        const totalTestDrives = await db_1.prisma.usedCarTestDrive.count({ where });
        const [todaysTestDrives, upcomingTestDrives, completedTestDrives, cancelledTestDrives, noShowTestDrives, pendingTestDrives, purchasedCount] = await Promise.all([
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    scheduledDate: { gte: startOfToday, lte: endOfToday }
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    scheduledDate: { gte: startOfToday },
                    status: { in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] }
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    ...where,
                    status: 'COMPLETED'
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    ...where,
                    status: 'CANCELLED'
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    ...where,
                    status: 'NO_SHOW'
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    ...where,
                    status: { in: ['REQUESTED', 'SCHEDULED'] }
                }
            }),
            db_1.prisma.usedCarTestDrive.count({
                where: {
                    ...where,
                    status: 'COMPLETED',
                    result: 'PURCHASED'
                }
            })
        ]);
        // Conversion Rate: Converted (Purchased) Test Drives / Completed Test Drives * 100
        const conversionRate = completedTestDrives > 0
            ? Math.round((purchasedCount / completedTestDrives) * 1000) / 10
            : 0;
        return {
            totalTestDrives,
            todaysTestDrives,
            todayTestDrives: todaysTestDrives,
            upcomingTestDrives,
            completedTestDrives,
            cancelledTestDrives,
            noShow: noShowTestDrives,
            noShows: noShowTestDrives,
            pendingTestDrives,
            conversionRate,
            purchasedCount
        };
    }
}
exports.TestDriveMetricsService = TestDriveMetricsService;

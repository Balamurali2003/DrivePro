import { prisma } from '../db';
import { buildDateFilter, DateFilterOptions } from './dateFilterHelper';

export class TestDriveMetricsService {
  public static async getMetrics(options: DateFilterOptions = {}) {
    const dateFilter = buildDateFilter(options);
    const where: any = dateFilter ? { scheduledDate: dateFilter } : {};

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const totalTestDrives = await prisma.usedCarTestDrive.count({ where });

    const [
      todaysTestDrives,
      upcomingTestDrives,
      completedTestDrives,
      cancelledTestDrives,
      noShowTestDrives,
      pendingTestDrives,
      purchasedCount
    ] = await Promise.all([
      prisma.usedCarTestDrive.count({
        where: {
          scheduledDate: { gte: startOfToday, lte: endOfToday }
        }
      }),
      prisma.usedCarTestDrive.count({
        where: {
          scheduledDate: { gte: startOfToday },
          status: { in: ['REQUESTED', 'SCHEDULED', 'CONFIRMED'] }
        }
      }),
      prisma.usedCarTestDrive.count({
        where: {
          ...where,
          status: 'COMPLETED'
        }
      }),
      prisma.usedCarTestDrive.count({
        where: {
          ...where,
          status: 'CANCELLED'
        }
      }),
      prisma.usedCarTestDrive.count({
        where: {
          ...where,
          status: 'NO_SHOW'
        }
      }),
      prisma.usedCarTestDrive.count({
        where: {
          ...where,
          status: { in: ['REQUESTED', 'SCHEDULED'] }
        }
      }),
      prisma.usedCarTestDrive.count({
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

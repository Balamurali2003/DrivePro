import { prisma } from '../db';
import { buildDateFilter, DateFilterOptions } from './dateFilterHelper';

export class RefundMetricsService {
  public static async getMetrics(options: DateFilterOptions = {}) {
    const dateFilter = buildDateFilter(options);
    const where: any = dateFilter ? { requestedAt: dateFilter } : {};

    const [
      totalRefundRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedRefunds,
      requestedAggregate,
      approvedAggregate,
      refundedAggregate
    ] = await Promise.all([
      prisma.refund.count({ where }),
      prisma.refund.count({
        where: {
          ...where,
          status: { in: ['PENDING', 'UNDER_REVIEW'] }
        }
      }),
      prisma.refund.count({
        where: {
          ...where,
          status: { in: ['APPROVED', 'PROCESSING'] }
        }
      }),
      prisma.refund.count({
        where: {
          ...where,
          status: 'REJECTED'
        }
      }),
      prisma.refund.count({
        where: {
          ...where,
          status: 'COMPLETED'
        }
      }),
      prisma.refund.aggregate({
        where,
        _sum: { requestedAmount: true }
      }),
      prisma.refund.aggregate({
        where: {
          ...where,
          status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED'] }
        },
        _sum: { approvedAmount: true }
      }),
      prisma.refund.aggregate({
        where: {
          ...where,
          status: 'COMPLETED'
        },
        _sum: { refundedAmount: true }
      })
    ]);

    const totalRequestedAmount = requestedAggregate._sum.requestedAmount || 0;
    const totalApprovedAmount = approvedAggregate._sum.approvedAmount || 0;
    const totalRefundedAmount = refundedAggregate._sum.refundedAmount || 0;
    const outstandingRefundAmount = Math.max(0, totalApprovedAmount - totalRefundedAmount);

    return {
      totalRefundRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      completedRefunds,
      totalRequestedAmount,
      totalApprovedAmount,
      totalRefundedAmount,
      outstandingRefundAmount
    };
  }
}

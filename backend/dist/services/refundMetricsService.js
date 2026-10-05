"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundMetricsService = void 0;
const db_1 = require("../db");
const dateFilterHelper_1 = require("./dateFilterHelper");
class RefundMetricsService {
    static async getMetrics(options = {}) {
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)(options);
        const where = dateFilter ? { requestedAt: dateFilter } : {};
        const [totalRefundRequests, pendingRequests, approvedRequests, rejectedRequests, completedRefunds, requestedAggregate, approvedAggregate, refundedAggregate] = await Promise.all([
            db_1.prisma.refund.count({ where }),
            db_1.prisma.refund.count({
                where: {
                    ...where,
                    status: { in: ['PENDING', 'UNDER_REVIEW'] }
                }
            }),
            db_1.prisma.refund.count({
                where: {
                    ...where,
                    status: { in: ['APPROVED', 'PROCESSING'] }
                }
            }),
            db_1.prisma.refund.count({
                where: {
                    ...where,
                    status: 'REJECTED'
                }
            }),
            db_1.prisma.refund.count({
                where: {
                    ...where,
                    status: 'COMPLETED'
                }
            }),
            db_1.prisma.refund.aggregate({
                where,
                _sum: { requestedAmount: true }
            }),
            db_1.prisma.refund.aggregate({
                where: {
                    ...where,
                    status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED'] }
                },
                _sum: { approvedAmount: true }
            }),
            db_1.prisma.refund.aggregate({
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
exports.RefundMetricsService = RefundMetricsService;

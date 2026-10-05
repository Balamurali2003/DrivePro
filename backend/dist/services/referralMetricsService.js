"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralMetricsService = void 0;
const db_1 = require("../db");
const dateFilterHelper_1 = require("./dateFilterHelper");
class ReferralMetricsService {
    static async getMetrics(options = {}) {
        const dateFilter = (0, dateFilterHelper_1.buildDateFilter)(options);
        const where = dateFilter ? { referralDate: dateFilter } : {};
        // Dynamic database aggregations
        const [totalReferrals, successfulReferrals, pendingReferrals, earnedAggregate, paidAggregate, approvedAggregate] = await Promise.all([
            db_1.prisma.referral.count({ where }),
            db_1.prisma.referral.count({
                where: {
                    ...where,
                    status: 'CONVERTED'
                }
            }),
            db_1.prisma.referral.count({
                where: {
                    ...where,
                    status: { in: ['PENDING', 'NEW', 'CONTACTED'] }
                }
            }),
            db_1.prisma.referral.aggregate({
                where: {
                    ...where,
                    rewardStatus: { in: ['APPROVED', 'PAID'] }
                },
                _sum: { rewardAmount: true }
            }),
            db_1.prisma.referral.aggregate({
                where: {
                    ...where,
                    rewardStatus: 'PAID'
                },
                _sum: { rewardAmount: true }
            }),
            db_1.prisma.referral.aggregate({
                where: {
                    ...where,
                    rewardStatus: 'APPROVED'
                },
                _sum: { rewardAmount: true }
            })
        ]);
        const totalRewardsEarned = earnedAggregate._sum.rewardAmount || 0;
        const totalRewardsPaid = paidAggregate._sum.rewardAmount || 0;
        const outstandingRewards = approvedAggregate._sum.rewardAmount || 0;
        // Formula: Successful Referrals / Total Referrals * 100
        const conversionRate = totalReferrals > 0
            ? Math.round((successfulReferrals / totalReferrals) * 1000) / 10
            : 0;
        return {
            totalReferrals,
            successfulReferrals,
            pendingReferrals,
            totalRewardsEarned,
            totalRewardsPaid,
            outstandingRewards,
            conversionRate
        };
    }
}
exports.ReferralMetricsService = ReferralMetricsService;

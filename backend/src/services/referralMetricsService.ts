import { prisma } from '../db';
import { buildDateFilter, DateFilterOptions } from './dateFilterHelper';

export class ReferralMetricsService {
  public static async getMetrics(options: DateFilterOptions = {}) {
    const dateFilter = buildDateFilter(options);
    const where: any = dateFilter ? { referralDate: dateFilter } : {};

    // Dynamic database aggregations
    const [
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      earnedAggregate,
      paidAggregate,
      approvedAggregate
    ] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.count({
        where: {
          ...where,
          status: 'CONVERTED'
        }
      }),
      prisma.referral.count({
        where: {
          ...where,
          status: { in: ['PENDING', 'NEW', 'CONTACTED'] }
        }
      }),
      prisma.referral.aggregate({
        where: {
          ...where,
          rewardStatus: { in: ['APPROVED', 'PAID'] }
        },
        _sum: { rewardAmount: true }
      }),
      prisma.referral.aggregate({
        where: {
          ...where,
          rewardStatus: 'PAID'
        },
        _sum: { rewardAmount: true }
      }),
      prisma.referral.aggregate({
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

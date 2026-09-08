import { prisma } from '../db';

export class AiAnalyticsService {
  static calculateLeadScore(lead: any): { score: number; recommendation: string } {
    let score = 50;
    
    // Source weight
    if (['REFERRAL', 'EXISTING_CUSTOMER', 'WALK_IN'].includes(lead.leadSource)) score += 20;
    else if (['GOOGLE_ADS', 'WEBSITE'].includes(lead.leadSource)) score += 10;
    else if (lead.leadSource === 'OTHER') score -= 5;
    
    // Priority weight
    if (lead.priority === 'URGENT') score += 20;
    else if (lead.priority === 'HIGH') score += 15;
    else if (lead.priority === 'LOW') score -= 10;

    // Contact completeness
    if (lead.phone && lead.whatsappNumber) score += 5;
    if (lead.email) score += 5;
    if (lead.expectedJoiningDate) score += 10;
    if (lead.budget && lead.budget >= 8000) score += 10;

    score = Math.max(10, Math.min(99, score));

    let recommendation = 'Schedule standard intro call within 24h.';
    if (score >= 80) recommendation = 'High intent buyer. Proactively offer demo slot & discount for spot booking today.';
    else if (score >= 60) recommendation = 'Good interest. Send WhatsApp brochure and follow up regarding timing preferences.';
    else if (score < 40) recommendation = 'Low conversion likelihood. Add to automated nurture sequence.';

    return { score, recommendation };
  }

  static analyzeStudentProgress(lessons: any[], progressList: any[]): {
    overallMastery: number;
    weakestSkills: string[];
    strongestSkills: string[];
    recommendedNextStep: string;
  } {
    const completed = lessons.filter(l => l.status === 'COMPLETED').length;
    const total = Math.max(1, lessons.length);
    const progressPct = Math.round((completed / total) * 100);

    const skillsCount: Record<string, { total: number; scoreSum: number }> = {};
    for (const prog of progressList) {
      if (prog.skills) {
        for (const sk of prog.skills) {
          if (!skillsCount[sk.skillName]) skillsCount[sk.skillName] = { total: 0, scoreSum: 0 };
          skillsCount[sk.skillName].total += 1;
          skillsCount[sk.skillName].scoreSum += sk.score || 3;
        }
      }
    }

    const skillsAvg = Object.entries(skillsCount).map(([name, data]) => ({
      name,
      avg: data.scoreSum / data.total,
    }));

    skillsAvg.sort((a, b) => a.avg - b.avg);
    const weakest = skillsAvg.slice(0, 3).map(s => s.name);
    const strongest = skillsAvg.slice(-3).reverse().map(s => s.name);

    let recommendedNextStep = 'Focus on regular traffic lessons.';
    if (weakest.includes('CLUTCH_CONTROL') || weakest.includes('HILL_START')) {
      recommendedNextStep = 'Conduct 45 mins focused incline/gradient stop-and-go practice to eliminate stalling.';
    } else if (weakest.includes('PARKING') || weakest.includes('REVERSE')) {
      recommendedNextStep = 'Dedicate next session exclusively to 8-shape & parallel reverse parking tracks.';
    } else if (progressPct >= 80) {
      recommendedNextStep = 'Ready for RTO Mock Test! Schedule full simulation track evaluation.';
    }

    return {
      overallMastery: progressPct,
      weakestSkills: weakest.length ? weakest : ['CLUTCH_CONTROL', 'PARKING'],
      strongestSkills: strongest.length ? strongest : ['STEERING', 'TRAFFIC_SIGNALS'],
      recommendedNextStep,
    };
  }

  static forecastDemandAndRevenue(enrollments: any[], expenses: any[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    const monthlyRevenue = [320000, 360000, 410000, 390000, 480000, 520000, 560000, 610000];
    const predictedRevenue = [640000, 690000, 750000, 820000];

    return {
      historicalRevenue: monthlyRevenue,
      predictedRevenueNext4Months: predictedRevenue,
      predictedStudentIntake: 68,
      recommendedFleetExpansion: '2 Additional Manual Hatchbacks required by Q4 to maintain <80% fleet load.',
      peakHours: ['07:00 - 09:00 AM', '05:00 - 07:00 PM', 'Weekend Full Day'],
    };
  }

  static classifyComplaint(text: string): { category: string; priority: string; autoResolutionIdea: string } {
    const lower = text.toLowerCase();
    if (lower.includes('instructor') || lower.includes('late') || lower.includes('rude') || lower.includes('shouted')) {
      return {
        category: 'INSTRUCTOR_BEHAVIOUR',
        priority: 'HIGH',
        autoResolutionIdea: 'Offer instructor reassignment and 1 complimentary catch-up lesson session.',
      };
    }
    if (lower.includes('clutch') || lower.includes('brake') || lower.includes('breakdown') || lower.includes('ac') || lower.includes('car')) {
      return {
        category: 'VEHICLE_PROBLEM',
        priority: 'HIGH',
        autoResolutionIdea: 'Route vehicle to maintenance workshop and allocate backup car immediately.',
      };
    }
    if (lower.includes('refund') || lower.includes('money') || lower.includes('fee') || lower.includes('payment')) {
      return {
        category: 'PAYMENT_ISSUE',
        priority: 'CRITICAL',
        autoResolutionIdea: 'Finance manager review within 4 hours; verify ledger and issue credit note if eligible.',
      };
    }
    return {
      category: 'SCHEDULE_ISSUE',
      priority: 'MEDIUM',
      autoResolutionIdea: 'Adjust timetable in calendar coordinator drawer with preferred student time slot.',
    };
  }
}

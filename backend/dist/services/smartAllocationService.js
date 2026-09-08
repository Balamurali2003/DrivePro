"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAllocationService = void 0;
const db_1 = require("../db");
class SmartAllocationService {
    static async getRecommendations(params) {
        const instructors = await db_1.prisma.instructor.findMany({
            where: { status: 'AVAILABLE' },
            include: {
                assignedVehicles: true,
                lessons: {
                    where: params.lessonDate ? {
                        lessonDate: new Date(params.lessonDate),
                        status: { in: ['SCHEDULED', 'CONFIRMED', 'STARTED'] }
                    } : undefined
                }
            }
        });
        const vehicles = await db_1.prisma.vehicle.findMany({
            where: { status: 'AVAILABLE' },
            include: {
                lessons: {
                    where: params.lessonDate ? {
                        lessonDate: new Date(params.lessonDate),
                        status: { in: ['SCHEDULED', 'CONFIRMED', 'STARTED'] }
                    } : undefined
                }
            }
        });
        const scoredInstructors = instructors.map(ins => {
            let score = 70;
            let reasons = [];
            // Transmission match
            if (params.transmission && ins.specializations.includes(params.transmission)) {
                score += 15;
                reasons.push(`${params.transmission} certified`);
            }
            // Gender preference match
            if (params.preferredInstructorGender && params.preferredInstructorGender !== 'Any') {
                if (ins.gender.toLowerCase() === params.preferredInstructorGender.toLowerCase()) {
                    score += 15;
                    reasons.push('Gender match');
                }
                else {
                    score -= 20;
                }
            }
            // Area match
            if (params.area && ins.area && ins.area.toLowerCase().includes(params.area.toLowerCase())) {
                score += 10;
                reasons.push(`Operates in ${ins.area}`);
            }
            // Rating bonus
            if (ins.rating >= 4.7) {
                score += 10;
                reasons.push(`Top rated (${ins.rating}⭐)`);
            }
            // Time slot conflict check
            const hasConflict = ins.lessons.some(l => {
                if (!params.startTime || !params.endTime)
                    return false;
                return (params.startTime < l.endTime && params.endTime > l.startTime);
            });
            if (hasConflict) {
                score = 0;
                reasons = ['Conflict with another scheduled lesson'];
            }
            return {
                instructor: ins,
                fitScore: Math.max(0, Math.min(100, score)),
                matchReasons: reasons,
                isAvailable: !hasConflict,
            };
        });
        scoredInstructors.sort((a, b) => b.fitScore - a.fitScore);
        const scoredVehicles = vehicles.map(veh => {
            let score = 70;
            let reasons = [];
            if (params.transmission && veh.transmission.toUpperCase() === params.transmission.toUpperCase()) {
                score += 20;
                reasons.push(`${veh.transmission} Transmission Match`);
            }
            // PUC / Insurance health
            const today = new Date();
            if (new Date(veh.pucExpiry) < today || new Date(veh.insuranceExpiry) < today) {
                score -= 50;
                reasons.push('Document Expiring/Expired');
            }
            else {
                reasons.push('All Documents Valid');
            }
            const hasConflict = veh.lessons.some(l => {
                if (!params.startTime || !params.endTime)
                    return false;
                return (params.startTime < l.endTime && params.endTime > l.startTime);
            });
            if (hasConflict) {
                score = 0;
                reasons = ['Conflict with another scheduled lesson'];
            }
            return {
                vehicle: veh,
                fitScore: Math.max(0, Math.min(100, score)),
                matchReasons: reasons,
                isAvailable: !hasConflict,
            };
        });
        scoredVehicles.sort((a, b) => b.fitScore - a.fitScore);
        return {
            recommendedInstructors: scoredInstructors,
            recommendedVehicles: scoredVehicles,
        };
    }
}
exports.SmartAllocationService = SmartAllocationService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDateFilter = buildDateFilter;
function buildDateFilter(options = {}) {
    const { range = 'all', startDate, endDate } = options;
    if (range === 'custom' && (startDate || endDate)) {
        const filter = {};
        if (startDate) {
            const s = new Date(startDate);
            s.setHours(0, 0, 0, 0);
            filter.gte = s;
        }
        if (endDate) {
            const e = new Date(endDate);
            e.setHours(23, 59, 59, 999);
            filter.lte = e;
        }
        return Object.keys(filter).length > 0 ? filter : undefined;
    }
    const now = new Date();
    switch (range.toLowerCase()) {
        case 'today': {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case 'yesterday': {
            const start = new Date(now);
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setDate(end.getDate() - 1);
            end.setHours(23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case 'this_week': {
            const start = new Date(now);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case 'this_month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        case 'this_year': {
            const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            return { gte: start, lte: end };
        }
        default:
            return undefined;
    }
}

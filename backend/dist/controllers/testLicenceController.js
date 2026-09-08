"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLicenceRecord = exports.getLicences = exports.createTest = exports.getTests = void 0;
const db_1 = require("../db");
const getTests = async (req, res) => {
    try {
        const tests = await db_1.prisma.test.findMany({
            include: {
                student: true,
            },
            orderBy: { testDate: 'desc' }
        });
        return res.json({ success: true, data: tests });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTests = getTests;
const createTest = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.test.count();
        const testCode = `TST-${500 + count + 1}`;
        const test = await db_1.prisma.test.create({
            data: {
                testCode,
                studentId: data.studentId,
                testType: data.testType || 'RTO_TEST',
                testDate: new Date(data.testDate),
                timeSlot: data.timeSlot || '10:00 AM',
                location: data.location || 'RTO Track Koramangala KA-01',
                result: data.result || 'PENDING',
                score: data.score ? parseInt(data.score) : null,
                failureReason: data.failureReason || null,
                nextTestDate: data.nextTestDate ? new Date(data.nextTestDate) : null,
                notes: data.notes || null,
            }
        });
        return res.status(201).json({ success: true, data: test });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTest = createTest;
const getLicences = async (req, res) => {
    try {
        const licences = await db_1.prisma.licenceRecord.findMany({
            include: { student: true },
            orderBy: { applicationDate: 'desc' }
        });
        return res.json({ success: true, data: licences });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLicences = getLicences;
const createLicenceRecord = async (req, res) => {
    try {
        const data = req.body;
        const record = await db_1.prisma.licenceRecord.create({
            data: {
                studentId: data.studentId,
                licenceType: data.licenceType || 'LEARNER_LICENCE',
                applicationNumber: data.applicationNumber || `LL-${Date.now()}`,
                applicationDate: new Date(data.applicationDate || Date.now()),
                testDate: data.testDate ? new Date(data.testDate) : null,
                result: data.result || 'IN_PROCESS',
                licenceNumber: data.licenceNumber || null,
                rtoOffice: data.rtoOffice || 'KA-01 Koramangala',
                issueDate: data.issueDate ? new Date(data.issueDate) : null,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                notes: data.notes || null,
            }
        });
        return res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createLicenceRecord = createLicenceRecord;

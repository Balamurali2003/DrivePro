import { Request, Response } from 'express';
import { prisma } from '../db';

export const getTests = async (req: Request, res: Response) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        student: true,
      },
      orderBy: { testDate: 'desc' }
    });
    return res.json({ success: true, data: tests });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createTest = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.test.count();
    const testCode = `TST-${500 + count + 1}`;

    const test = await prisma.test.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLicences = async (req: Request, res: Response) => {
  try {
    const licences = await prisma.licenceRecord.findMany({
      include: { student: true },
      orderBy: { applicationDate: 'desc' }
    });
    return res.json({ success: true, data: licences });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createLicenceRecord = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const record = await prisma.licenceRecord.create({
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
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
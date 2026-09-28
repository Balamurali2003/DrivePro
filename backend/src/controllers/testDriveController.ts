import { Request, Response } from 'express';
import { prisma } from '../db';
import { TestDriveMetricsService } from '../services/testDriveMetricsService';
import { buildDateFilter } from '../services/dateFilterHelper';

export const getTestDrives = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate, status, carId, search } = req.query as any;
    const dateFilter = buildDateFilter({ range, startDate, endDate });

    const where: any = {};
    if (dateFilter) where.scheduledDate = dateFilter;
    if (status && status !== 'ALL') where.status = status;
    if (carId && carId !== 'ALL') where.carId = carId;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { testDriveCode: { contains: q } },
        { buyerName: { contains: q } },
        { buyerPhone: { contains: q } },
        { salespersonName: { contains: q } },
        { car: { model: { contains: q } } },
        { car: { registrationNumber: { contains: q } } }
      ];
    }

    const testDrives = await prisma.usedCarTestDrive.findMany({
      where,
      include: {
        car: {
          select: {
            id: true,
            carCode: true,
            registrationNumber: true,
            make: true,
            model: true,
            variant: true,
            year: true,
            transmission: true,
            expectedSalePrice: true,
            status: true
          }
        },
        buyerInquiry: true,
        buyerLead: true,
        lead: { select: { id: true, leadCode: true, fullName: true, phone: true } },
        student: { select: { id: true, studentCode: true, fullName: true, phone: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    return res.json({ success: true, count: testDrives.length, data: testDrives });
  } catch (error: any) {
    console.error('Error fetching test drives:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleTestDrive = async (req: Request, res: Response) => {
  try {
    const {
      carId,
      buyerName,
      buyerPhone,
      scheduledDate,
      timeSlot,
      startTime,
      endTime,
      salespersonName,
      salespersonId,
      customerNotes
    } = req.body;

    if (!carId || !buyerName || !buyerPhone || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'Car, customer name, phone, and scheduled date are required.'
      });
    }

    const dateObj = new Date(scheduledDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const slot = startTime && endTime ? `${startTime} - ${endTime}` : (timeSlot || '10:00 AM');
    const staffName = salespersonName || 'Fleet Staff';

    // CONFLICT PREVENTION 1: Check vehicle overlap
    const vehicleConflict = await prisma.usedCarTestDrive.findFirst({
      where: {
        carId,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: slot,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      },
      include: { car: true }
    });

    if (vehicleConflict) {
      return res.status(409).json({
        success: false,
        message: `Vehicle ${vehicleConflict.car.model} (${vehicleConflict.car.registrationNumber}) is already booked during this time (${slot}). Please select a different slot or vehicle.`
      });
    }

    // CONFLICT PREVENTION 2: Check staff overlap
    const staffConflict = await prisma.usedCarTestDrive.findFirst({
      where: {
        salespersonName: staffName,
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: slot,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      }
    });

    if (staffConflict) {
      return res.status(409).json({
        success: false,
        message: `Staff member ${staffName} is already scheduled for another test drive during this time slot (${slot}).`
      });
    }

    // AUTO-CONNECT with CRM
    const cleanPhone = buyerPhone.replace(/\D/g, '').slice(-10);

    const [matchedInquiry, matchedLead, matchedStudent] = await Promise.all([
      prisma.buyerInquiry.findFirst({ where: { phone: { contains: cleanPhone } } }),
      prisma.lead.findFirst({ where: { phone: { contains: cleanPhone } } }),
      prisma.student.findFirst({ where: { phone: { contains: cleanPhone } } })
    ]);

    const count = await prisma.usedCarTestDrive.count();
    const testDriveCode = `TD-${String(100 + count + 1).padStart(4, '0')}`;

    const testDrive = await prisma.usedCarTestDrive.create({
      data: {
        testDriveCode,
        carId,
        buyerInquiryId: matchedInquiry ? matchedInquiry.id : null,
        leadId: matchedLead ? matchedLead.id : null,
        studentId: matchedStudent ? matchedStudent.id : null,
        buyerName,
        buyerPhone,
        scheduledDate: dateObj,
        timeSlot: slot,
        startTime: startTime || null,
        endTime: endTime || null,
        salespersonName: staffName,
        salespersonId: salespersonId || null,
        status: 'SCHEDULED',
        customerNotes: customerNotes || null
      },
      include: {
        car: true,
        buyerInquiry: true,
        lead: true,
        student: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Test drive scheduled successfully.',
      data: testDrive
    });
  } catch (error: any) {
    console.error('Error scheduling test drive:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestDriveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, result, buyerFeedback, customerNotes } = req.body;

    const existing = await prisma.usedCarTestDrive.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Test drive not found.' });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (result) updateData.result = result;
    if (buyerFeedback !== undefined) updateData.buyerFeedback = buyerFeedback;
    if (customerNotes !== undefined) updateData.customerNotes = customerNotes;

    const updated = await prisma.usedCarTestDrive.update({
      where: { id },
      data: updateData,
      include: { car: true, buyerInquiry: true }
    });

    return res.json({
      success: true,
      message: `Test drive updated (Status: ${updated.status}${result ? ', Result: ' + result : ''}).`,
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestDrive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.usedCarTestDrive.delete({ where: { id } });
    return res.json({ success: true, message: 'Test drive deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTestDriveMetrics = async (req: Request, res: Response) => {
  try {
    const { range, startDate, endDate } = req.query as any;
    const metrics = await TestDriveMetricsService.getMetrics({ range, startDate, endDate });
    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

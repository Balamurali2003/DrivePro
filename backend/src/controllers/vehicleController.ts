import { Request, Response } from 'express';
import { prisma } from '../db';
import { ProfitCalculatorService } from '../services/profitCalculatorService';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { status, transmission } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (transmission && transmission !== 'ALL') where.transmission = transmission;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        assignedInstructor: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { lessons: true, maintenanceLogs: true, fuelLogs: true } }
      },
      orderBy: { registrationNumber: 'asc' }
    });
    return res.json({ success: true, data: vehicles });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id }, { vehicleCode: id }, { registrationNumber: id }] },
      include: {
        assignedInstructor: true,
        assignedStudents: true,
        maintenanceLogs: { orderBy: { serviceDate: 'desc' } },
        fuelLogs: { orderBy: { logDate: 'desc' } },
        expenses: { orderBy: { expenseDate: 'desc' } },
        documents: true,
        lessons: {
          include: { student: true, instructor: true, attendance: true },
          orderBy: { lessonDate: 'desc' },
          take: 30,
        }
      }
    });

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const totalFuelCost = vehicle.fuelLogs.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((acc, curr) => acc + curr.cost, 0);
    const totalOtherExpenses = vehicle.expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const costAnalysis = ProfitCalculatorService.calculateVehicleCostPerKm({
      currentKm: vehicle.currentKm,
      lastServiceKm: vehicle.lastServiceKm,
      totalFuelCost,
      totalMaintenanceCost,
      totalOtherExpenses,
    });

    return res.json({
      success: true,
      data: {
        ...vehicle,
        costAnalysis,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.vehicle.count();
    const vehicleCode = `VEH-${400 + count + 1}`;

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleCode,
        registrationNumber: data.registrationNumber.toUpperCase(),
        make: data.make || 'Maruti Suzuki',
        model: data.model || 'Swift VXI',
        year: data.year ? parseInt(data.year) : 2023,
        fuelType: data.fuelType || 'PETROL',
        transmission: data.transmission || 'MANUAL',
        color: data.color || 'White',
        currentKm: data.currentKm ? parseInt(data.currentKm) : 15000,
        fuelEfficiency: data.fuelEfficiency ? parseFloat(data.fuelEfficiency) : 16.5,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : new Date(Date.now() + 86400000 * 200),
        pucExpiry: data.pucExpiry ? new Date(data.pucExpiry) : new Date(Date.now() + 86400000 * 120),
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : new Date(Date.now() + 86400000 * 500),
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : new Date(Date.now() + 86400000 * 60),
        assignedInstructorId: data.assignedInstructorId || null,
        status: 'AVAILABLE',
      }
    });

    return res.status(201).json({ success: true, data: vehicle });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const log = await prisma.vehicleMaintenance.create({
      data: {
        vehicleId: data.vehicleId,
        serviceType: data.serviceType || 'GENERAL_SERVICE',
        serviceDate: new Date(data.serviceDate),
        kmAtService: parseInt(data.kmAtService),
        vendorName: data.vendorName || 'Maruti Authorized Service Hub',
        invoiceNumber: data.invoiceNumber || `SRV-${Date.now()}`,
        cost: parseFloat(data.cost),
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : new Date(Date.now() + 86400000 * 90),
        nextServiceKm: data.nextServiceKm ? parseInt(data.nextServiceKm) : parseInt(data.kmAtService) + 10000,
        notes: data.notes || null,
        status: 'COMPLETED',
      }
    });

    // Update vehicle km and service dates
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        lastServiceDate: new Date(data.serviceDate),
        lastServiceKm: parseInt(data.kmAtService),
        nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : new Date(Date.now() + 86400000 * 90),
        nextServiceKm: data.nextServiceKm ? parseInt(data.nextServiceKm) : parseInt(data.kmAtService) + 10000,
      }
    });

    return res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFuelLog = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const litres = parseFloat(data.litres);
    const pricePerLitre = parseFloat(data.pricePerLitre);
    const totalCost = litres * pricePerLitre;

    const log = await prisma.vehicleFuelLog.create({
      data: {
        vehicleId: data.vehicleId,
        logDate: new Date(data.logDate || Date.now()),
        fuelType: data.fuelType || 'PETROL',
        litres,
        pricePerLitre,
        totalCost,
        odometerKm: parseInt(data.odometerKm),
        fuelStation: data.fuelStation || 'Indian Oil Retail Outlet',
        notes: data.notes || null,
      }
    });

    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { currentKm: parseInt(data.odometerKm) }
    });

    return res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaintenanceLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.vehicleMaintenance.findMany({
      include: { vehicle: true },
      orderBy: { serviceDate: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFuelLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.vehicleFuelLog.findMany({
      include: { vehicle: true },
      orderBy: { logDate: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.vehicle.update({
      where: { id },
      data: req.body
    });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.delete({ where: { id } });
    return res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.getFuelLogs = exports.getMaintenanceLogs = exports.createFuelLog = exports.createMaintenanceLog = exports.createVehicle = exports.getVehicleById = exports.getVehicles = void 0;
const db_1 = require("../db");
const profitCalculatorService_1 = require("../services/profitCalculatorService");
const getVehicles = async (req, res) => {
    try {
        const { status, transmission } = req.query;
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (transmission && transmission !== 'ALL')
            where.transmission = transmission;
        const vehicles = await db_1.prisma.vehicle.findMany({
            where,
            include: {
                assignedInstructor: { select: { id: true, fullName: true, phone: true } },
                _count: { select: { lessons: true, maintenanceLogs: true, fuelLogs: true } }
            },
            orderBy: { registrationNumber: 'asc' }
        });
        return res.json({ success: true, data: vehicles });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVehicles = getVehicles;
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await db_1.prisma.vehicle.findFirst({
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
        if (!vehicle)
            return res.status(404).json({ success: false, message: 'Vehicle not found' });
        const totalFuelCost = vehicle.fuelLogs.reduce((acc, curr) => acc + curr.totalCost, 0);
        const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((acc, curr) => acc + curr.cost, 0);
        const totalOtherExpenses = vehicle.expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const costAnalysis = profitCalculatorService_1.ProfitCalculatorService.calculateVehicleCostPerKm({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getVehicleById = getVehicleById;
const createVehicle = async (req, res) => {
    try {
        const data = req.body;
        const count = await db_1.prisma.vehicle.count();
        const vehicleCode = `VEH-${400 + count + 1}`;
        const vehicle = await db_1.prisma.vehicle.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createVehicle = createVehicle;
const createMaintenanceLog = async (req, res) => {
    try {
        const data = req.body;
        const log = await db_1.prisma.vehicleMaintenance.create({
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
        await db_1.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: {
                lastServiceDate: new Date(data.serviceDate),
                lastServiceKm: parseInt(data.kmAtService),
                nextServiceDate: data.nextServiceDate ? new Date(data.nextServiceDate) : new Date(Date.now() + 86400000 * 90),
                nextServiceKm: data.nextServiceKm ? parseInt(data.nextServiceKm) : parseInt(data.kmAtService) + 10000,
            }
        });
        return res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createMaintenanceLog = createMaintenanceLog;
const createFuelLog = async (req, res) => {
    try {
        const data = req.body;
        const litres = parseFloat(data.litres);
        const pricePerLitre = parseFloat(data.pricePerLitre);
        const totalCost = litres * pricePerLitre;
        const log = await db_1.prisma.vehicleFuelLog.create({
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
        await db_1.prisma.vehicle.update({
            where: { id: data.vehicleId },
            data: { currentKm: parseInt(data.odometerKm) }
        });
        return res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createFuelLog = createFuelLog;
const getMaintenanceLogs = async (req, res) => {
    try {
        const logs = await db_1.prisma.vehicleMaintenance.findMany({
            include: { vehicle: true },
            orderBy: { serviceDate: 'desc' },
            take: 100,
        });
        return res.json({ success: true, data: logs });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMaintenanceLogs = getMaintenanceLogs;
const getFuelLogs = async (req, res) => {
    try {
        const logs = await db_1.prisma.vehicleFuelLog.findMany({
            include: { vehicle: true },
            orderBy: { logDate: 'desc' },
            take: 100,
        });
        return res.json({ success: true, data: logs });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFuelLogs = getFuelLogs;
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await db_1.prisma.vehicle.update({
            where: { id },
            data: req.body
        });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateVehicle = updateVehicle;
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.prisma.vehicle.delete({ where: { id } });
        return res.json({ success: true, message: 'Vehicle deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteVehicle = deleteVehicle;

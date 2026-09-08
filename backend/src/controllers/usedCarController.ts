import { Request, Response } from 'express';
import { prisma } from '../db';
import { ProfitCalculatorService } from '../services/profitCalculatorService';
import fs from 'fs';
import path from 'path';

// Helper to save base64 image data to local disk in backend/uploads/cars
export const saveBase64Image = (dataUrl: string, prefix = 'car'): string => {
  if (!dataUrl) return '';
  // If it's already an uploaded file path or external web URL, return as is
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(__dirname, '../../uploads/cars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    return `/uploads/cars/${filename}`;
  } catch (err) {
    console.error('Error saving base64 image:', err);
    return dataUrl;
  }
};

// GET /api/used-cars (Full inventory with optional filters)
export const getUsedCarInventory = async (req: Request, res: Response) => {
  try {
    const { status, fuelType, transmission, make, brand, model, minBudget, maxBudget, location } = req.query;
    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = { equals: String(status) };
    }
    if (fuelType && fuelType !== 'ALL') {
      where.fuelType = { equals: String(fuelType) };
    }
    if (transmission && transmission !== 'ALL') {
      where.transmission = { equals: String(transmission) };
    }
    
    const brandQuery = brand || make;
    if (brandQuery && brandQuery !== 'ALL') {
      where.make = { contains: String(brandQuery) };
    }
    if (model && model !== 'ALL') {
      where.model = { contains: String(model) };
    }
    if (location && location !== 'ALL') {
      where.location = { contains: String(location) };
    }
    
    if (minBudget || maxBudget) {
      where.expectedSalePrice = {};
      if (minBudget) where.expectedSalePrice.gte = parseFloat(String(minBudget));
      if (maxBudget) where.expectedSalePrice.lte = parseFloat(String(maxBudget));
    }

    const inventory = await prisma.usedCarInventory.findMany({
      where,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        inquiries: { orderBy: { createdAt: 'desc' } },
        expenses: true,
        sale: true,
        _count: { select: { leads: true, testDrives: true, inquiries: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: inventory });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/used-cars/search (Buyer Search with specific rules: AVAILABLE only, budget range, case-insensitive partial model match)
export const searchUsedCars = async (req: Request, res: Response) => {
  try {
    const { 
      minBudget, 
      maxBudget, 
      model, 
      brand, 
      make, 
      fuelType, 
      transmission, 
      year, 
      minKm, 
      maxKm, 
      location,
      status 
    } = req.query;

    const where: any = {};

    // Buyer search should only show AVAILABLE cars by default, unless explicitly requested
    if (status && status !== 'ALL') {
      where.status = { equals: String(status) };
    } else {
      where.status = { equals: 'AVAILABLE' };
    }

    if (fuelType && fuelType !== 'ALL') {
      where.fuelType = { equals: String(fuelType) };
    }
    if (transmission && transmission !== 'ALL') {
      where.transmission = { equals: String(transmission) };
    }
    
    const brandQuery = brand || make;
    if (brandQuery && brandQuery !== 'ALL') {
      where.make = { contains: String(brandQuery) };
    }

    // Model search with case-insensitive partial matching (e.g. "City" finds "Honda City")
    if (model && String(model).trim() !== '' && model !== 'ALL') {
      const cleanModel = String(model).trim();
      where.OR = [
        { model: { contains: cleanModel } },
        { make: { contains: cleanModel } },
        { variant: { contains: cleanModel } },
      ];
    }

    if (year && year !== 'ALL') {
      where.year = { gte: parseInt(String(year)) };
    }

    if (location && location !== 'ALL' && String(location).trim() !== '') {
      where.location = { contains: String(location).trim() };
    }

    // Budget range logic
    if (minBudget || maxBudget) {
      where.expectedSalePrice = {};
      if (minBudget && !isNaN(parseFloat(String(minBudget)))) {
        where.expectedSalePrice.gte = parseFloat(String(minBudget));
      }
      if (maxBudget && !isNaN(parseFloat(String(maxBudget)))) {
        where.expectedSalePrice.lte = parseFloat(String(maxBudget));
      }
    }

    // Kilometers range logic
    if (minKm || maxKm) {
      where.odometerKm = {};
      if (minKm && !isNaN(parseInt(String(minKm)))) {
        where.odometerKm.gte = parseInt(String(minKm));
      }
      if (maxKm && !isNaN(parseInt(String(maxKm)))) {
        where.odometerKm.lte = parseInt(String(maxKm));
      }
    }

    const cars = await prisma.usedCarInventory.findMany({
      where,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        inquiries: true,
        _count: { select: { inquiries: true } }
      },
      orderBy: { expectedSalePrice: 'asc' }
    });

    return res.json({ success: true, data: cars });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/used-cars/stats (Statistics for Seller / Staff Dashboard)
export const getUsedCarStats = async (req: Request, res: Response) => {
  try {
    const totalCars = await prisma.usedCarInventory.count();
    const availableCars = await prisma.usedCarInventory.count({ where: { status: 'AVAILABLE' } });
    const reservedCars = await prisma.usedCarInventory.count({ where: { status: 'RESERVED' } });
    const soldCars = await prisma.usedCarInventory.count({ where: { status: 'SOLD' } });
    const totalBuyerInquiries = await prisma.usedCarBuyerInquiry.count();

    const recentListings = await prisma.usedCarInventory.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { isPrimary: 'desc' }, take: 1 } }
    });

    const recentInquiries = await prisma.usedCarBuyerInquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { usedCar: { select: { id: true, make: true, model: true, registrationNumber: true } } }
    });

    const recentlySold = await prisma.usedCarInventory.findMany({
      where: { status: 'SOLD' },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { images: { orderBy: { isPrimary: 'desc' }, take: 1 } }
    });

    return res.json({
      success: true,
      data: {
        totalCars,
        availableCars,
        reservedCars,
        soldCars,
        totalListings: totalCars,
        totalBuyerInquiries,
        recentListings,
        recentInquiries,
        recentlySold,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/used-cars/:id (Single Car Details)
export const getUsedCarById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const car = await prisma.usedCarInventory.findFirst({
      where: { OR: [{ id }, { carCode: id }, { registrationNumber: id }] },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        inquiries: { orderBy: { createdAt: 'desc' } },
        leads: { orderBy: { createdAt: 'desc' } },
        testDrives: { orderBy: { scheduledDate: 'desc' } },
        expenses: { orderBy: { expenseDate: 'desc' } },
        sale: true,
      }
    });

    if (!car) return res.status(404).json({ success: false, message: 'Used car not found' });

    const profitAnalysis = ProfitCalculatorService.calculateUsedCarProfit({
      purchasePrice: car.purchasePrice,
      salePrice: car.sale ? car.sale.salePrice : car.expectedSalePrice,
      discount: car.sale ? car.sale.discount : 0,
      expenses: car.expenses,
    });

    return res.json({
      success: true,
      data: {
        ...car,
        profitAnalysis,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/used-cars (Add Used Car with Device Images & Seller Info)
export const createUsedCar = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.usedCarInventory.count();
    const carCode = `CAR-${100 + count + 1}`;

    const purchasePrice = parseFloat(data.purchasePrice || 0);
    const expectedSalePrice = parseFloat(data.sellingPrice || data.expectedSalePrice || data.expectedSellingPrice || 500000);
    const minimumPrice = parseFloat(data.minimumPrice || purchasePrice || expectedSalePrice * 0.9);

    // Process images and save base64 uploads to disk
    const processedImages: Array<{ imageUrl: string; imageType: string; isPrimary: boolean }> = [];
    let primaryImageUrl: string | null = null;

    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const img = data.images[i];
        const savedUrl = saveBase64Image(img.imageUrl || img.url, `car_${carCode.toLowerCase()}`);
        const isPrimary = Boolean(img.isPrimary || i === 0);
        processedImages.push({
          imageUrl: savedUrl,
          imageType: img.imageType || 'Front View',
          isPrimary,
        });
        if (isPrimary && !primaryImageUrl) {
          primaryImageUrl = savedUrl;
        }
      }
    }

    if (!primaryImageUrl && processedImages.length > 0) {
      primaryImageUrl = processedImages[0].imageUrl;
      processedImages[0].isPrimary = true;
    }

    if (data.primaryImage) {
      primaryImageUrl = saveBase64Image(data.primaryImage, `car_${carCode.toLowerCase()}`);
    }

    const regNum = (data.registrationNumber || `KA01-TEMP-${Date.now().toString().slice(-4)}`).toUpperCase();

    const car = await prisma.usedCarInventory.create({
      data: {
        carCode,
        registrationNumber: regNum,
        make: data.brand || data.make || 'Honda',
        model: data.model || 'City',
        variant: data.variant || '1.5 V',
        year: data.manufacturingYear ? parseInt(data.manufacturingYear) : (data.year ? parseInt(data.year) : 2021),
        registrationYear: data.registrationYear ? parseInt(data.registrationYear) : null,
        odometerKm: data.kilometers ? parseInt(data.kilometers) : (data.odometerKm ? parseInt(data.odometerKm) : 35000),
        fuelType: data.fuelType || 'Petrol',
        transmission: data.transmission || 'Manual',
        color: data.color || 'White',
        ownersCount: data.owners ? parseInt(data.owners) : (data.ownersCount ? parseInt(data.ownersCount) : 1),
        conditionScore: data.conditionScore ? parseInt(data.conditionScore) : 90,
        purchasePrice,
        expectedSalePrice,
        expectedSellingPrice: expectedSalePrice,
        minimumPrice,
        status: data.status ? String(data.status).toUpperCase() : 'AVAILABLE',
        primaryImage: primaryImageUrl || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800',
        location: data.location || 'Indiranagar, Bengaluru',
        sellerId: data.sellerId || null,
        sellerName: data.sellerName || null,
        sellerPhone: data.sellerPhone || null,
        sellerEmail: data.sellerEmail || null,
        sellerAddress: data.sellerAddress || null,
        carCondition: data.condition || data.carCondition || 'Excellent',
        description: data.description || 'Verified certified vehicle with complete inspection and warranty.',
        notes: data.notes || null,
      }
    });

    // Save image records
    for (const img of processedImages) {
      await prisma.usedCarImage.create({
        data: {
          usedCarId: car.id,
          imageUrl: img.imageUrl,
          imageType: img.imageType,
          isPrimary: img.isPrimary,
        }
      });
    }

    const fullCar = await prisma.usedCarInventory.findUnique({
      where: { id: car.id },
      include: { images: true }
    });

    return res.status(201).json({ success: true, data: fullCar });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/used-cars/:id (Update Car Details, Price, Status & Images)
export const updateUsedCar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.usedCarInventory.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Used car not found' });

    let primaryImageUrl = existing.primaryImage;
    if (data.primaryImage) {
      primaryImageUrl = saveBase64Image(data.primaryImage, `car_${existing.carCode.toLowerCase()}`);
    }

    const updated = await prisma.usedCarInventory.update({
      where: { id },
      data: {
        registrationNumber: data.registrationNumber ? data.registrationNumber.toUpperCase() : undefined,
        make: data.brand || data.make || undefined,
        model: data.model || undefined,
        variant: data.variant !== undefined ? data.variant : undefined,
        year: data.manufacturingYear ? parseInt(data.manufacturingYear) : (data.year ? parseInt(data.year) : undefined),
        registrationYear: data.registrationYear ? parseInt(data.registrationYear) : undefined,
        odometerKm: data.kilometers ? parseInt(data.kilometers) : (data.odometerKm ? parseInt(data.odometerKm) : undefined),
        fuelType: data.fuelType || undefined,
        transmission: data.transmission || undefined,
        color: data.color || undefined,
        ownersCount: data.owners ? parseInt(data.owners) : (data.ownersCount ? parseInt(data.ownersCount) : undefined),
        purchasePrice: data.purchasePrice !== undefined ? parseFloat(data.purchasePrice) : undefined,
        expectedSalePrice: (data.sellingPrice || data.expectedSalePrice) ? parseFloat(data.sellingPrice || data.expectedSalePrice) : undefined,
        expectedSellingPrice: (data.sellingPrice || data.expectedSellingPrice) ? parseFloat(data.sellingPrice || data.expectedSalePrice) : undefined,
        minimumPrice: data.minimumPrice !== undefined ? parseFloat(data.minimumPrice) : undefined,
        status: data.status ? String(data.status).toUpperCase() : undefined,
        location: data.location !== undefined ? data.location : undefined,
        sellerName: data.sellerName !== undefined ? data.sellerName : undefined,
        sellerPhone: data.sellerPhone !== undefined ? data.sellerPhone : undefined,
        sellerEmail: data.sellerEmail !== undefined ? data.sellerEmail : undefined,
        sellerAddress: data.sellerAddress !== undefined ? data.sellerAddress : undefined,
        carCondition: data.condition || data.carCondition || undefined,
        description: data.description !== undefined ? data.description : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        primaryImage: primaryImageUrl,
      },
      include: {
        images: true,
      }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/used-cars/:id
export const deleteUsedCar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.usedCarBuyerInquiry.deleteMany({ where: { usedCarId: id } });
    await prisma.usedCarImage.deleteMany({ where: { usedCarId: id } });
    await prisma.usedCarExpense.deleteMany({ where: { carId: id } });
    await prisma.usedCarTestDrive.deleteMany({ where: { carId: id } });
    await prisma.usedCarLead.deleteMany({ where: { carId: id } });
    await prisma.usedCarInventory.delete({ where: { id } });
    return res.json({ success: true, message: 'Used car removed from inventory' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/used-cars/:id/images
export const getCarImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const images = await prisma.usedCarImage.findMany({
      where: { usedCarId: id },
      orderBy: { isPrimary: 'desc' }
    });
    return res.json({ success: true, data: images });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/used-cars/:id/images (Upload additional photo from device)
export const uploadCarImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl, imageType = 'Front View', isPrimary = false } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL or file data is required' });
    }

    const savedUrl = saveBase64Image(imageUrl, `car_${id.slice(-6)}`);

    if (isPrimary) {
      await prisma.usedCarImage.updateMany({
        where: { usedCarId: id },
        data: { isPrimary: false }
      });
      await prisma.usedCarInventory.update({
        where: { id },
        data: { primaryImage: savedUrl }
      });
    }

    const image = await prisma.usedCarImage.create({
      data: {
        usedCarId: id,
        imageUrl: savedUrl,
        imageType,
        isPrimary: Boolean(isPrimary),
      }
    });

    return res.status(201).json({ success: true, data: image });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/used-cars/images/:imageId/primary (Set Primary / Cover Photo)
export const setPrimaryCarImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const image = await prisma.usedCarImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    await prisma.usedCarImage.updateMany({
      where: { usedCarId: image.usedCarId },
      data: { isPrimary: false }
    });

    const updatedImage = await prisma.usedCarImage.update({
      where: { id: imageId },
      data: { isPrimary: true }
    });

    await prisma.usedCarInventory.update({
      where: { id: image.usedCarId },
      data: { primaryImage: image.imageUrl }
    });

    return res.json({ success: true, data: updatedImage });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/used-cars/images/:imageId
export const deleteCarImage = async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    const image = await prisma.usedCarImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

    await prisma.usedCarImage.delete({ where: { id: imageId } });

    // If deleted image was primary, set next available image as primary
    if (image.isPrimary) {
      const nextImg = await prisma.usedCarImage.findFirst({
        where: { usedCarId: image.usedCarId },
        orderBy: { createdAt: 'desc' }
      });
      if (nextImg) {
        await prisma.usedCarImage.update({
          where: { id: nextImg.id },
          data: { isPrimary: true }
        });
        await prisma.usedCarInventory.update({
          where: { id: image.usedCarId },
          data: { primaryImage: nextImg.imageUrl }
        });
      }
    }

    return res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/used-cars/:id/inquiries (Buyer sends inquiry for specific car)
export const createVehicleInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { buyerName, phone, email, contactMethod = 'WhatsApp', message } = req.body;

    if (!buyerName || !phone) {
      return res.status(400).json({ success: false, message: 'Buyer Name and Phone are required' });
    }

    const car = await prisma.usedCarInventory.findUnique({ where: { id } });
    if (!car) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const inquiryCode = `INQ-${Date.now().toString().slice(-6)}`;

    // Save UsedCarBuyerInquiry
    const inquiry = await prisma.usedCarBuyerInquiry.create({
      data: {
        inquiryCode,
        usedCarId: car.id,
        vehicleModel: `${car.year} ${car.make} ${car.model} (${car.registrationNumber})`,
        vehiclePrice: car.expectedSalePrice,
        buyerName,
        phone,
        email: email || null,
        contactMethod,
        message: message || `Inquiry regarding ${car.make} ${car.model}`,
        status: 'NEW',
      }
    });

    // Also register as CRM Lead in UsedCarLead for unified pipeline
    const leadCode = `UCL-${Date.now().toString().slice(-6)}`;
    await prisma.usedCarLead.create({
      data: {
        leadCode,
        carId: car.id,
        buyerName,
        phone,
        whatsappNumber: contactMethod === 'WhatsApp' ? phone : null,
        email: email || null,
        budget: car.expectedSalePrice,
        preferredVehicle: `${car.make} ${car.model}`,
        source: 'USED_CAR_MARKETPLACE',
        notes: `Buyer inquiry via ${contactMethod}: ${message || ''}`,
        status: 'NEW',
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! Our representative will contact you.',
      data: inquiry
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/used-car-inquiries (Staff views all buyer inquiries)
export const getUsedCarInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await prisma.usedCarBuyerInquiry.findMany({
      include: {
        usedCar: {
          select: {
            id: true,
            make: true,
            model: true,
            variant: true,
            year: true,
            registrationNumber: true,
            expectedSalePrice: true,
            primaryImage: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: inquiries });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Existing buyer inquiries general matching APIs (retained for backward compatibility)
export const getBuyerInquiries = async (req: Request, res: Response) => {
  try {
    const inquiries = await prisma.buyerInquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: inquiries });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBuyerInquiry = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.buyerInquiry.count();
    const inquiryCode = `BI-${100 + count + 1}`;

    const inquiry = await prisma.buyerInquiry.create({
      data: {
        inquiryCode,
        buyerName: data.buyerName,
        phone: data.phone,
        email: data.email || null,
        minBudget: parseFloat(data.minBudget || 200000),
        maxBudget: parseFloat(data.maxBudget || 800000),
        preferredBrand: data.preferredBrand || null,
        preferredModel: data.preferredModel || null,
        preferredYear: data.preferredYear ? parseInt(data.preferredYear) : null,
        fuelType: data.fuelType || 'Any',
        transmission: data.transmission || 'Any',
        notes: data.notes || null,
        status: 'ACTIVE',
      }
    });

    return res.status(201).json({ success: true, data: inquiry });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBuyerInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.buyerInquiry.delete({ where: { id } });
    return res.json({ success: true, message: 'Buyer inquiry deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchingCarsForInquiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquiry = await prisma.buyerInquiry.findUnique({ where: { id } });
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    const min = Math.max(0, (inquiry.minBudget || 0) * 0.85);
    const max = (inquiry.maxBudget || 10000000) * 1.25;

    const where: any = {
      status: 'AVAILABLE',
      expectedSalePrice: {
        gte: min,
        lte: max,
      }
    };

    if (inquiry.fuelType && inquiry.fuelType !== 'Any' && inquiry.fuelType !== 'ALL') {
      where.fuelType = inquiry.fuelType;
    }
    if (inquiry.transmission && inquiry.transmission !== 'Any' && inquiry.transmission !== 'ALL') {
      where.transmission = inquiry.transmission;
    }
    if (inquiry.preferredBrand && inquiry.preferredBrand !== 'Any' && inquiry.preferredBrand !== 'ALL') {
      where.make = { contains: inquiry.preferredBrand };
    }
    if (inquiry.preferredModel && inquiry.preferredModel !== 'Any' && inquiry.preferredModel !== 'ALL') {
      where.OR = [
        { model: { contains: inquiry.preferredModel } },
        { variant: { contains: inquiry.preferredModel } }
      ];
    }

    let matchingCars = await prisma.usedCarInventory.findMany({
      where,
      include: {
        images: { orderBy: { isPrimary: 'desc' } }
      },
      orderBy: { expectedSalePrice: 'asc' }
    });

    if (matchingCars.length === 0) {
      const relaxedWhere: any = {
        status: 'AVAILABLE',
        expectedSalePrice: { gte: min, lte: max }
      };
      if (inquiry.preferredBrand && inquiry.preferredBrand !== 'Any' && inquiry.preferredBrand !== 'ALL') {
        relaxedWhere.make = { contains: inquiry.preferredBrand };
      }
      if (inquiry.preferredModel && inquiry.preferredModel !== 'Any' && inquiry.preferredModel !== 'ALL') {
        relaxedWhere.OR = [
          { model: { contains: inquiry.preferredModel } },
          { variant: { contains: inquiry.preferredModel } }
        ];
      }
      matchingCars = await prisma.usedCarInventory.findMany({
        where: relaxedWhere,
        include: { images: { orderBy: { isPrimary: 'desc' } } },
        orderBy: { expectedSalePrice: 'asc' }
      });
    }

    return res.json({ success: true, data: { inquiry, matchingCars } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Expenses, Leads, Test Drives, Sales
export const createUsedCarExpense = async (req: Request, res: Response) => {
  try {
    const { carId } = req.params;
    const data = req.body;
    const expense = await prisma.usedCarExpense.create({
      data: {
        carId,
        category: data.category || 'DETAILING',
        amount: parseFloat(data.amount || 0),
        vendor: data.vendor || null,
        description: data.description || 'Refurbishment / maintenance expense',
        receiptUrl: data.receiptUrl || null,
      }
    });
    return res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsedCarLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.usedCarLead.findMany({
      include: { car: true, testDrives: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: leads });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUsedCarLead = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.usedCarLead.count();
    const leadCode = `UCL-${100 + count + 1}`;
    const lead = await prisma.usedCarLead.create({
      data: {
        leadCode,
        carId: data.carId || null,
        buyerName: data.buyerName,
        phone: data.phone,
        email: data.email || null,
        location: data.location || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        preferredVehicle: data.preferredVehicle || null,
        financeRequired: Boolean(data.financeRequired),
        source: data.source || 'SHOWROOM',
        status: data.status || 'NEW',
        notes: data.notes || null,
      }
    });
    return res.status(201).json({ success: true, data: lead });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTestDrives = async (req: Request, res: Response) => {
  try {
    const testDrives = await prisma.usedCarTestDrive.findMany({
      include: { car: true, buyerLead: true },
      orderBy: { scheduledDate: 'desc' }
    });
    return res.json({ success: true, data: testDrives });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleTestDrive = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.usedCarTestDrive.count();
    const testDriveCode = `TD-${100 + count + 1}`;
    const testDrive = await prisma.usedCarTestDrive.create({
      data: {
        testDriveCode,
        carId: data.carId,
        buyerLeadId: data.buyerLeadId || null,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        scheduledDate: new Date(data.scheduledDate || Date.now()),
        timeSlot: data.timeSlot || '10:00 AM',
        salespersonName: data.salespersonName || 'Fleet Staff',
        status: 'SCHEDULED',
        customerNotes: data.customerNotes || null,
      }
    });
    return res.status(201).json({ success: true, data: testDrive });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsedCarSales = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.usedCarSale.findMany({
      include: { car: true },
      orderBy: { saleDate: 'desc' }
    });
    return res.json({ success: true, data: sales });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const recordUsedCarSale = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const count = await prisma.usedCarSale.count();
    const saleCode = `UCS-${100 + count + 1}`;

    const car = await prisma.usedCarInventory.findUnique({
      where: { id: data.carId },
      include: { expenses: true }
    });

    if (!car) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const salePrice = parseFloat(data.salePrice);
    const purchaseCost = car.purchasePrice;
    const totalExpenses = car.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCost = purchaseCost + totalExpenses;
    const grossProfit = salePrice - totalCost;
    const profitMarginPct = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

    const sale = await prisma.usedCarSale.create({
      data: {
        saleCode,
        carId: data.carId,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail || null,
        buyerAddress: data.buyerAddress || null,
        salePrice,
        discount: parseFloat(data.discount || 0),
        bookingAmount: parseFloat(data.bookingAmount || 0),
        paidAmount: parseFloat(data.paidAmount || salePrice),
        pendingAmount: parseFloat(data.pendingAmount || 0),
        paymentMode: data.paymentMode || 'BANK_TRANSFER',
        salespersonName: data.salespersonName || 'Manager',
        purchaseCost,
        totalExpenses,
        totalCost,
        grossProfit,
        profitMarginPct,
        notes: data.notes || null,
      }
    });

    // Mark car as SOLD
    await prisma.usedCarInventory.update({
      where: { id: data.carId },
      data: { status: 'SOLD' }
    });

    return res.status(201).json({ success: true, data: sale });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

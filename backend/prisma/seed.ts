import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning previous seed data ---');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.renewal.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.employeeAttendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.usedCarSale.deleteMany();
  await prisma.usedCarExpense.deleteMany();
  await prisma.usedCarTestDrive.deleteMany();
  await prisma.usedCarLead.deleteMany();
  await prisma.usedCarInventory.deleteMany();
  await prisma.licenceRecord.deleteMany();
  await prisma.test.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.complaintComment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentInstallment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lessonSkill.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lessonAttendance.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.vehicleExpense.deleteMany();
  await prisma.vehicleFuelLog.deleteMany();
  await prisma.vehicleMaintenance.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.instructorAvailability.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.coursePackage.deleteMany();
  await prisma.course.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.student.deleteMany();
  await prisma.leadStatusHistory.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.leadFollowup.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log('--- Seeding Roles & Users ---');
  const passwordHash = await bcrypt.hash('drivepro123', 10);

  const roles = [
    { name: 'SUPER_ADMIN', description: 'Complete system access & configuration', permissions: '["*"]' },
    { name: 'OWNER', description: 'Executive owner view, financials & analytics', permissions: '["*"]' },
    { name: 'MANAGER', description: 'Operations, allocations & approvals', permissions: '["view", "create", "edit", "approve", "manage_vehicles", "manage_complaints"]' },
    { name: 'RECEPTIONIST', description: 'Front-desk, inquiries, appointments', permissions: '["view", "create", "edit"]' },
    { name: 'SALES_EXECUTIVE', description: 'Lead conversion & used car sales', permissions: '["view_leads", "manage_leads", "view_used_cars"]' },
    { name: 'INSTRUCTOR', description: 'Lesson logs, attendance & student rating', permissions: '["view_lessons", "update_progress", "mark_attendance"]' },
    { name: 'ACCOUNTANT', description: 'Billing, payments, expenses, P&L', permissions: '["manage_payments", "manage_invoices", "view_reports"]' },
    { name: 'MECHANIC', description: 'Fleet service, maintenance & fuel', permissions: '["manage_vehicles", "manage_maintenance"]' },
    { name: 'STUDENT', description: 'Self-service portal, schedule & progress', permissions: '["view_profile", "view_progress", "view_payments"]' },
  ];

  for (const r of roles) {
    await prisma.role.create({ data: r });
  }

  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@drivepro.com',
      passwordHash,
      name: 'Vikramaditya Roy (Owner)',
      phone: '+91 98450 11223',
      role: 'OWNER',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@drivepro.com',
      passwordHash,
      name: 'Rahul Sharma (Sales Lead)',
      phone: '+91 98801 44556',
      role: 'SALES_EXECUTIVE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    }
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@drivepro.com',
      passwordHash,
      name: 'Pooja Hegde (Operations Manager)',
      phone: '+91 97412 88990',
      role: 'MANAGER',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    }
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: 'accounts@drivepro.com',
      passwordHash,
      name: 'Suresh Menon (Finance & Accounts)',
      phone: '+91 99002 33445',
      role: 'ACCOUNTANT',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    }
  });

  console.log('--- Seeding Courses & Packages ---');
  const coursesData = [
    { code: 'CRS-BEG-4W', name: 'Beginner 4-Wheeler Car Driving Course', description: 'Complete zero-to-hero driving program with RTO assistance, simulation and 15 practical on-road classes.', courseType: 'BEGINNER', transmission: 'MANUAL', price: 8000, discount: 500, taxRate: 18, totalFee: 8850, numberOfLessons: 15, validityDays: 90 },
    { code: 'CRS-AUTO-4W', name: 'Automatic Transmission Mastery', description: 'Stress-free automatic hatchback training for heavy city bumper-to-bumper and highway cruising.', courseType: 'AUTOMATIC', transmission: 'AUTOMATIC', price: 9500, discount: 0, taxRate: 18, totalFee: 11210, numberOfLessons: 15, validityDays: 90 },
    { code: 'CRS-PREM-HIGH', name: 'Premium Highway & Defensive Driving', description: 'Expressway overtakes, night driving, emergency braking, wet road handling and precision parking.', courseType: 'HIGHWAY', transmission: 'BOTH', price: 12000, discount: 1000, taxRate: 18, totalFee: 12980, numberOfLessons: 20, validityDays: 120 },
    { code: 'CRS-REFRESH', name: 'Refresher / Confident City Drive', description: 'Quick 7-day brush up course for licence holders who lack confidence in heavy Bangalore traffic.', courseType: 'REFRESHER', transmission: 'MANUAL', price: 4500, discount: 0, taxRate: 18, totalFee: 5310, numberOfLessons: 7, validityDays: 45 },
    { code: 'CRS-COMBO-2W4W', name: 'Combo Package: Car (LMV) + Two-Wheeler (MCWG)', description: 'Full twin certification training for both geared motorcycle/scooter and 4-wheeler car.', courseType: 'BEGINNER', transmission: 'MANUAL', price: 11500, discount: 1000, taxRate: 18, totalFee: 12390, numberOfLessons: 20, validityDays: 120 },
    { code: 'CRS-TEST-PREP', name: 'RTO Mock Track & Test Guarantee', description: 'Intensive 8-track, H-track and gradient hill-start drill before official RTO Inspector evaluation.', courseType: 'TEST_PREP', transmission: 'MANUAL', price: 3500, discount: 0, taxRate: 18, totalFee: 4130, numberOfLessons: 5, validityDays: 30 },
  ];

  const createdCourses: any[] = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({ data: c });
    createdCourses.push(course);

    await prisma.coursePackage.create({
      data: {
        courseId: course.id,
        name: 'Weekend Morning Batch',
        description: 'Saturday & Sunday 7-9AM exclusive batches with dedicated pickup.',
        bonusLessons: 1,
        price: course.price + 1000,
        totalFee: course.totalFee + 1180,
      }
    });
  }

  console.log('--- Seeding Instructors (10) ---');
  const instructorNames = [
    { name: 'Ramesh Gowda', phone: '+91 98451 22334', gender: 'Male', area: 'Indiranagar', rating: 4.9, exp: 8, spec: '["MANUAL", "HIGHWAY", "DEFENSIVE"]' },
    { name: 'Anand Kumar', phone: '+91 97420 55667', gender: 'Male', area: 'Koramangala', rating: 4.8, exp: 6, spec: '["MANUAL", "AUTOMATIC", "TEST_PREP"]' },
    { name: 'Deepa Srinivas', phone: '+91 99014 77889', gender: 'Female', area: 'Jayanagar', rating: 4.9, exp: 5, spec: '["MANUAL", "AUTOMATIC", "TWO_WHEELER"]' },
    { name: 'Karthik Raja', phone: '+91 98863 11223', gender: 'Male', area: 'Whitefield', rating: 4.7, exp: 4, spec: '["MANUAL", "HIGHWAY"]' },
    { name: 'Mohammed Farhan', phone: '+91 97311 44556', gender: 'Male', area: 'HSR Layout', rating: 4.8, exp: 7, spec: '["MANUAL", "AUTOMATIC", "COMMERCIAL"]' },
    { name: 'Sunita Patil', phone: '+91 99802 66778', gender: 'Female', area: 'Malleshwaram', rating: 4.9, exp: 6, spec: '["AUTOMATIC", "DEFENSIVE", "BEGINNER"]' },
    { name: 'Venkatesh Murthy', phone: '+91 98440 88990', gender: 'Male', area: 'BTM Layout', rating: 4.6, exp: 9, spec: '["MANUAL", "TEST_PREP"]' },
    { name: 'Praveen Nair', phone: '+91 97401 22335', gender: 'Male', area: 'Hebbal', rating: 4.8, exp: 5, spec: '["MANUAL", "HIGHWAY"]' },
    { name: 'Geetha Reddy', phone: '+91 99165 44332', gender: 'Female', area: 'Bannerghatta Road', rating: 4.9, exp: 4, spec: '["MANUAL", "AUTOMATIC"]' },
    { name: 'Manjunath Swamy', phone: '+91 98809 77881', gender: 'Male', area: 'Electronic City', rating: 4.7, exp: 11, spec: '["MANUAL", "COMMERCIAL", "HIGHWAY"]' },
  ];

  const createdInstructors: any[] = [];
  for (let i = 0; i < instructorNames.length; i++) {
    const d = instructorNames[i];
    const user = await prisma.user.create({
      data: {
        email: `instructor${i + 1}@drivepro.com`,
        passwordHash,
        name: d.name,
        phone: d.phone,
        role: 'INSTRUCTOR',
        avatar: `https://images.unsplash.com/photo-${1535713875002 + i * 1000}?w=150`,
      }
    });

    const inst = await prisma.instructor.create({
      data: {
        instructorCode: `INS-${301 + i}`,
        userId: user.id,
        fullName: d.name,
        phone: d.phone,
        email: user.email,
        gender: d.gender,
        area: d.area,
        experienceYears: d.exp,
        drivingLicence: `KA012012000${8450 + i}`,
        licenceExpiry: new Date(Date.now() + 86400000 * 800),
        specializations: d.spec,
        languages: '["English", "Hindi", "Kannada"]',
        baseSalary: 26000 + i * 1000,
        commissionPerLesson: 150,
        rating: d.rating,
        totalReviews: 24 + i * 5,
        status: 'AVAILABLE',
      }
    });
    createdInstructors.push(inst);
  }

  console.log('--- Seeding Vehicles (12) ---');
  const fleetData = [
    { reg: 'KA01MG2041', make: 'Maruti Suzuki', model: 'Swift VXI Dual-Control', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'Pearl Arctic White', km: 14200, eff: 17.2 },
    { reg: 'KA01MG2042', make: 'Maruti Suzuki', model: 'Swift VXI Dual-Control', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'Metallic Magma Grey', km: 16800, eff: 16.8 },
    { reg: 'KA03NB8810', make: 'Hyundai', model: 'Grand i10 Nios AMT (Dual)', year: 2024, fuel: 'PETROL', trans: 'AUTOMATIC', color: 'Polar White', km: 8200, eff: 15.5 },
    { reg: 'KA03NB8811', make: 'Hyundai', model: 'Grand i10 Nios MT (Dual)', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'Titan Grey', km: 21400, eff: 16.0 },
    { reg: 'KA05MH4102', make: 'Maruti Suzuki', model: 'Baleno Delta Dual-Jet', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'Nexa Blue', km: 19500, eff: 18.0 },
    { reg: 'KA05MH4103', make: 'Maruti Suzuki', model: 'WagonR 1.2 LXI CNG', year: 2022, fuel: 'CNG', trans: 'MANUAL', color: 'Silky Silver', km: 34000, eff: 26.5 },
    { reg: 'KA04MJ5520', make: 'Tata', model: 'Altroz XZ Dual-Control', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'High Street Gold', km: 15300, eff: 15.8 },
    { reg: 'KA04MJ5521', make: 'Tata', model: 'Nexon EV Prime', year: 2024, fuel: 'ELECTRIC', trans: 'AUTOMATIC', color: 'Teal Blue', km: 9400, eff: 120.0 },
    { reg: 'KA02ML7731', make: 'Maruti Suzuki', model: 'Brezza ZXI Smart Hybrid', year: 2023, fuel: 'PETROL', trans: 'MANUAL', color: 'Splendid Silver', km: 18700, eff: 16.2 },
    { reg: 'KA02ML7732', make: 'Hyundai', model: 'Creta SX Executive', year: 2022, fuel: 'DIESEL', trans: 'MANUAL', color: 'Phantom Black', km: 28900, eff: 18.5 },
    { reg: 'KA51MA9104', make: 'Honda', model: 'Amaze S CVT', year: 2023, fuel: 'PETROL', trans: 'AUTOMATIC', color: 'Platinum White Pearl', km: 12600, eff: 16.4 },
    { reg: 'KA51MA9105', make: 'Toyota', model: 'Innova Crysta 2.4 VX (Com)', year: 2021, fuel: 'DIESEL', trans: 'MANUAL', color: 'Super White', km: 58000, eff: 12.8 },
  ];

  const createdVehicles: any[] = [];
  for (let i = 0; i < fleetData.length; i++) {
    const f = fleetData[i];
    const veh = await prisma.vehicle.create({
      data: {
        vehicleCode: `VEH-${401 + i}`,
        registrationNumber: f.reg,
        make: f.make,
        model: f.model,
        year: f.year,
        fuelType: f.fuel,
        transmission: f.trans,
        color: f.color,
        currentKm: f.km,
        fuelEfficiency: f.eff,
        insuranceExpiry: new Date(Date.now() + 86400000 * (180 + i * 20)),
        pucExpiry: new Date(Date.now() + 86400000 * (90 + i * 15)),
        fitnessExpiry: new Date(Date.now() + 86400000 * (500 + i * 30)),
        nextServiceDate: new Date(Date.now() + 86400000 * (45 + i * 10)),
        lastServiceKm: f.km - 4500,
        nextServiceKm: f.km + 5500,
        assignedInstructorId: createdInstructors[i % createdInstructors.length].id,
        status: i === 11 ? 'MAINTENANCE' : 'AVAILABLE',
      }
    });
    createdVehicles.push(veh);

    for (let fl = 0; fl < 3; fl++) {
      await prisma.vehicleFuelLog.create({
        data: {
          vehicleId: veh.id,
          logDate: new Date(Date.now() - 86400000 * (fl * 8 + 2)),
          fuelType: f.fuel === 'ELECTRIC' ? 'PETROL' : f.fuel,
          litres: 25.0 + fl * 2,
          pricePerLitre: 102.86,
          totalCost: (25.0 + fl * 2) * 102.86,
          odometerKm: f.km - (3 - fl) * 450,
          fuelStation: 'Indian Oil Retail Outlet - Indiranagar 100ft Road',
        }
      });
    }

    await prisma.vehicleMaintenance.create({
      data: {
        vehicleId: veh.id,
        serviceType: 'GENERAL_SERVICE',
        serviceDate: new Date(Date.now() - 86400000 * 60),
        kmAtService: f.km - 4500,
        vendorName: `${f.make} Authorized Service Hub Bengaluru`,
        invoiceNumber: `SRV-2026-${1000 + i}`,
        cost: 3850 + i * 300,
        nextServiceDate: new Date(Date.now() + 86400000 * 60),
        nextServiceKm: f.km + 5500,
        notes: 'Full synthetic oil change, brake caliper check, dual-pedal linkage adjustment.',
        status: 'COMPLETED',
      }
    });
  }

  console.log('--- Seeding 100 Realistic Leads ---');
  const indianFirstNames = ['Aarav', 'Ananya', 'Rohan', 'Sneha', 'Aditya', 'Pooja', 'Vikram', 'Divya', 'Rahul', 'Neha', 'Sanjay', 'Kavya', 'Nikhil', 'Priyanka', 'Varun', 'Meera', 'Gautam', 'Shreya', 'Abhishek', 'Ritu', 'Karan', 'Deepika', 'Akash', 'Anjali', 'Manish', 'Swati', 'Harish', 'Ishita', 'Arjun', 'Tanvi', 'Siddharth', 'Nandini', 'Pranav', 'Simran', 'Kunal', 'Rashmi', 'Manoj', 'Ayesha', 'Ajay', 'Bhavna'];
  const indianLastNames = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Rao', 'Iyer', 'Nair', 'Hegde', 'Gowda', 'Menon', 'Kulkarni', 'Deshmukh', 'Joshi', 'Bhat', 'Gupta', 'Singh', 'Choudhury', 'Banerjee', 'Agarwal', 'Chatterjee'];
  const bangaloreAreas = ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'BTM Layout', 'Hebbal', 'Electronic City', 'Bellandur', 'Marathahalli', 'Sarjapur Road', 'Yelahanka', 'Rajajinagar'];
  const sources = ['WEBSITE', 'GOOGLE_ADS', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'WALK_IN', 'REFERRAL', 'JUSTDIAL', 'PHONE'];
  const leadStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'TRIAL_SCHEDULED', 'NEGOTIATION', 'REGISTRATION_PENDING', 'CONVERTED', 'NOT_INTERESTED', 'LOST'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  const createdLeads: any[] = [];
  for (let i = 1; i <= 100; i++) {
    const fn = indianFirstNames[i % indianFirstNames.length];
    const ln = indianLastNames[(i * 3) % indianLastNames.length];
    const fullName = `${fn} ${ln}`;
    const area = bangaloreAreas[i % bangaloreAreas.length];
    const source = sources[i % sources.length];
    const status = i <= 40 ? 'CONVERTED' : leadStatuses[i % leadStatuses.length];
    const priority = priorities[i % priorities.length];
    const transmission = i % 3 === 0 ? 'AUTOMATIC' : 'MANUAL';
    const score = 40 + (i * 7) % 55;

    const lead = await prisma.lead.create({
      data: {
        leadCode: `LED-${1000 + i}`,
        fullName,
        phone: `+91 ${98000 + (i * 123) % 1999} ${10000 + (i * 456) % 89999}`,
        whatsappNumber: `+91 ${98000 + (i * 123) % 1999} ${10000 + (i * 456) % 89999}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        age: 18 + (i % 35),
        area,
        address: `#${12 + i}, ${i}th Cross, ${area}, Bengaluru - 5600${10 + (i % 80)}`,
        preferredLanguage: i % 4 === 0 ? 'Kannada' : (i % 3 === 0 ? 'Hindi' : 'English'),
        licenceType: 'LMV (Car)',
        courseInterested: createdCourses[i % createdCourses.length].name,
        packageInterested: 'Standard Practical Course (15 Lessons)',
        transmission,
        preferredTiming: i % 2 === 0 ? 'Morning 7-9AM' : 'Evening 5-7PM',
        budget: 8000 + (i % 5) * 1000,
        expectedJoiningDate: new Date(Date.now() + 86400000 * (i % 15 + 1)),
        leadSource: source,
        campaign: source === 'GOOGLE_ADS' ? 'Bangalore Driving Ads Q3' : (source === 'INSTAGRAM' ? 'LearnDriving Reels' : null),
        assignedToId: salesUser.id,
        priority,
        status,
        aiScore: score,
        aiRecommendation: score > 75 ? 'High conversion intent. Offer spot discount & weekend slot.' : 'Send brochure via WhatsApp and schedule trial.',
        notes: `Inquired about ${transmission} training near ${area}.`,
        createdAt: new Date(Date.now() - 86400000 * (100 - i)),
      }
    });
    createdLeads.push(lead);

    await prisma.leadFollowup.create({
      data: {
        leadId: lead.id,
        userId: salesUser.id,
        activityType: 'CALL',
        followupDate: new Date(Date.now() - 86400000 * (i % 5)),
        time: '11:30 AM',
        notes: `Discussed package pricing for ${lead.courseInterested}. Student is evaluating timings.`,
        outcome: 'CONNECTED_POSITIVE',
        status: i % 2 === 0 ? 'COMPLETED' : 'SCHEDULED',
      }
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        actionType: 'CREATED',
        description: `Lead created from ${lead.leadSource} by Web Inquiry Form`,
        actorName: 'Website System',
      }
    });
  }

  console.log('--- Seeding 40 Full Students (with 360 Profiles) ---');
  const createdStudents: any[] = [];
  for (let i = 1; i <= 40; i++) {
    const l = createdLeads[i - 1];
    const instructor = createdInstructors[i % createdInstructors.length];
    const vehicle = createdVehicles[i % createdVehicles.length];
    const course = createdCourses[i % createdCourses.length];

    const completedLessons = 3 + (i % 12);
    const totalLessons = 15;
    const progressPct = Math.round((completedLessons / totalLessons) * 100);

    const studentUser = await prisma.user.create({
      data: {
        email: `student${i}@drivepro.com`,
        passwordHash,
        name: l.fullName,
        phone: l.phone,
        role: 'STUDENT',
        avatar: `https://images.unsplash.com/photo-${1544005313 + i * 500}?w=150`,
      }
    });

    const student = await prisma.student.create({
      data: {
        studentCode: `STU-${2000 + i}`,
        userId: studentUser.id,
        leadId: l.id,
        fullName: l.fullName,
        photo: studentUser.avatar,
        phone: l.phone,
        whatsappNumber: l.whatsappNumber,
        email: l.email,
        gender: l.gender || 'Male',
        dob: new Date(2002 - (i % 15), (i % 12), (i % 28) + 1),
        address: l.address,
        area: l.area,
        emergencyContactName: `${l.fullName.split(' ')[0]}'s Family Contact`,
        emergencyContactPhone: '+91 98450 99887',
        idProofType: 'AADHAAR',
        idProofNumber: `7483 9102 ${4000 + i}`,
        learnerLicenceNumber: `KA01/LL/2026/00${1200 + i}`,
        learnerLicenceExpiry: new Date(Date.now() + 86400000 * 150),
        drivingLicenceNumber: i % 4 === 0 ? `KA01/DL/2026/00${5400 + i}` : null,
        drivingLicenceExpiry: i % 4 === 0 ? new Date(Date.now() + 86400000 * 7000) : null,
        medicalCertificate: true,
        assignedInstructorId: instructor.id,
        assignedVehicleId: vehicle.id,
        status: i % 5 === 0 ? 'COMPLETED' : (i % 8 === 0 ? 'TEST_SCHEDULED' : 'ACTIVE'),
        progressPercentage: progressPct,
        totalLessons,
        completedLessons,
        remainingLessons: totalLessons - completedLessons,
        notes: `Enrolled for ${course.name}. Assigned to ${instructor.fullName} (${vehicle.registrationNumber}).`,
        createdAt: new Date(Date.now() - 86400000 * (45 - i)),
      }
    });
    createdStudents.push(student);

    const enrollment = await prisma.enrollment.create({
      data: {
        enrollmentCode: `ENR-${5000 + i}`,
        studentId: student.id,
        courseId: course.id,
        enrollmentDate: student.createdAt,
        startDate: student.createdAt,
        totalFee: course.totalFee,
        discount: course.discount,
        taxAmount: course.totalFee * 0.18 / 1.18,
        finalFee: course.totalFee,
        paidAmount: i % 3 === 0 ? course.totalFee : course.totalFee * 0.6,
        pendingAmount: i % 3 === 0 ? 0 : course.totalFee * 0.4,
        totalLessons,
        completedLessons,
        remainingLessons: totalLessons - completedLessons,
        status: 'ACTIVE',
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${String(100 + i).padStart(3, '0')}`,
        studentId: student.id,
        enrollmentId: enrollment.id,
        type: 'INVOICE',
        subtotal: course.price,
        discount: course.discount,
        taxRate: 18,
        taxAmount: course.totalFee * 0.18 / 1.18,
        totalAmount: course.totalFee,
        paidAmount: enrollment.paidAmount,
        balanceAmount: enrollment.pendingAmount,
        invoiceDate: student.createdAt,
        status: enrollment.pendingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID',
        items: JSON.stringify([
          { description: course.name, qty: 1, rate: course.price, tax: course.totalFee * 0.18 / 1.18, amount: course.totalFee }
        ]),
        notes: 'Full practical course registration package.',
      }
    });

    await prisma.payment.create({
      data: {
        paymentCode: `PAY-${7000 + i}`,
        studentId: student.id,
        enrollmentId: enrollment.id,
        invoiceId: invoice.id,
        amount: enrollment.paidAmount,
        paymentDate: student.createdAt,
        paymentMode: i % 2 === 0 ? 'UPI' : 'CARD',
        transactionId: `TXN_UPI_${Date.now() - i * 10000}`,
        paymentStatus: 'PAID',
        receiptNumber: `REC-2026-${100 + i}`,
        notes: 'Registration Advance Fee Received',
      }
    });

    await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        documentType: 'AADHAAR',
        documentName: 'Aadhaar Card Front & Back',
        fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
        status: 'VERIFIED',
      }
    });

    await prisma.feedback.create({
      data: {
        studentId: student.id,
        instructorId: instructor.id,
        instructorRating: 5,
        vehicleRating: 5,
        lessonRating: 5,
        schedulingRating: 4,
        overallRating: 5,
        reviewText: `${instructor.fullName} is extremely patient and taught mirror techniques & clutch biting point brilliantly!`,
        isPublic: true,
      }
    });
  }

  console.log('--- Seeding 150 Lessons & Progress ---');
  const skillNames = [
    'STARTING', 'STOPPING', 'CLUTCH_CONTROL', 'GEAR_SHIFTING', 'STEERING',
    'TURNING', 'MIRRORS', 'INDICATORS', 'PARKING', 'REVERSE',
    'HILL_START', 'TRAFFIC_SIGNALS', 'LANE_CHANGING', 'OVERTAKING',
    'HIGHWAY_DRIVING', 'NIGHT_DRIVING', 'EMERGENCY_BRAKING'
  ];

  for (let i = 1; i <= 150; i++) {
    const student = createdStudents[i % createdStudents.length];
    const instructor = createdInstructors[i % createdInstructors.length];
    const vehicle = createdVehicles[i % createdVehicles.length];
    const isCompleted = i <= 110;
    const lessonDate = isCompleted
      ? new Date(Date.now() - 86400000 * (120 - i))
      : new Date(Date.now() + 86400000 * (i - 110));

    const timeSlots = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'];
    const slot = timeSlots[i % timeSlots.length].split('-');

    const lesson = await prisma.lesson.create({
      data: {
        lessonCode: `LSN-${9000 + i}`,
        studentId: student.id,
        instructorId: instructor.id,
        vehicleId: vehicle.id,
        lessonDate,
        startTime: slot[0],
        endTime: slot[1],
        durationMinutes: 60,
        pickupLocation: `${student.area} Metro Station`,
        dropLocation: `${student.area} Metro Station`,
        lessonType: i % 4 === 0 ? 'HIGHWAY' : 'PRACTICAL',
        topicCovered: `Session #${(i % 15) + 1}: Clutch balance, 3-point turns, reverse S-parking`,
        status: isCompleted ? 'COMPLETED' : (i % 2 === 0 ? 'SCHEDULED' : 'CONFIRMED'),
        instructorCommission: 150,
        commissionPaid: isCompleted,
      }
    });

    if (isCompleted) {
      await prisma.lessonAttendance.create({
        data: {
          lessonId: lesson.id,
          studentId: student.id,
          studentStatus: 'PRESENT',
          instructorStatus: 'PRESENT',
          startKm: vehicle.currentKm - 150 + i,
          endKm: vehicle.currentKm - 150 + i + 14,
          distanceKm: 14.0,
        }
      });

      const prog = await prisma.lessonProgress.create({
        data: {
          lessonId: lesson.id,
          studentId: student.id,
          topicsCovered: lesson.topicCovered || 'Driving Fundamentals',
          overallScore: 4,
          overallSkillLevel: 'PRACTICING',
          instructorNotes: 'Confident clutch engagement; keep maintaining safe 2-second trailing distance.',
        }
      });

      for (let s = 0; s < 5; s++) {
        const skName = skillNames[(i + s) % skillNames.length];
        await prisma.lessonSkill.create({
          data: {
            progressId: prog.id,
            skillName: skName,
            proficiency: 'GOOD',
            score: 4,
          }
        });
      }
    }
  }

  console.log('--- Seeding Complaints (20) ---');
  const complaintCategories = ['INSTRUCTOR_BEHAVIOUR', 'VEHICLE_PROBLEM', 'SCHEDULE_ISSUE', 'PAYMENT_ISSUE', 'PICKUP_ISSUE', 'LESSON_QUALITY'];
  const complaintTitles = [
    'Instructor arrived 15 mins late due to traffic',
    'AC was not cooling properly during afternoon session',
    'Need to reschedule Sunday lesson due to office work',
    'Payment receipt not received on WhatsApp',
    'Instructor changed pickup point on short notice',
    'Clutch pedal was feeling too stiff during hill start',
    'Requesting female instructor for weekend batches',
    'Clarification needed on RTO test fee inclusion in invoice',
  ];

  for (let i = 1; i <= 20; i++) {
    const student = createdStudents[i % createdStudents.length];
    const cat = complaintCategories[i % complaintCategories.length];
    const title = complaintTitles[i % complaintTitles.length];
    const isResolved = i % 2 === 0;

    const comp = await prisma.complaint.create({
      data: {
        ticketCode: `TKT-${601 + i}`,
        studentId: student.id,
        category: cat,
        priority: i % 3 === 0 ? 'HIGH' : 'MEDIUM',
        title: `${title} (#${student.studentCode})`,
        description: `Student raised concern regarding ${title.toLowerCase()}. Immediate follow-up required.`,
        assignedToId: managerUser.id,
        status: isResolved ? 'RESOLVED' : 'IN_PROGRESS',
        resolution: isResolved ? 'Manager contacted student, resolved schedule conflict, and allocated 1 makeup session.' : null,
        resolvedAt: isResolved ? new Date() : null,
      }
    });

    await prisma.complaintComment.create({
      data: {
        complaintId: comp.id,
        authorName: 'Pooja Hegde (Manager)',
        authorRole: 'MANAGER',
        comment: isResolved ? 'Issue resolved after direct telephone conversation with student.' : 'Acknowledged. Coordinating with fleet coordinator for vehicle swap.',
      }
    });
  }

  console.log('--- Seeding Used Car Dealership Module ---');
  const usedCarModels = [
    { reg: 'KA03MG4521', make: 'Maruti Suzuki', model: 'Swift Dzire VXI', year: 2021, km: 38000, fuel: 'PETROL', trans: 'MANUAL', color: 'Magma Grey', buy: 540000, sell: 645000, min: 610000, status: 'AVAILABLE' },
    { reg: 'KA01AK9902', make: 'Honda', model: 'City 1.5 V i-VTEC', year: 2020, km: 45000, fuel: 'PETROL', trans: 'MANUAL', color: 'Radiant Red', buy: 720000, sell: 845000, min: 810000, status: 'AVAILABLE' },
    { reg: 'KA05NE1120', make: 'Hyundai', model: 'Creta 1.5 SX Executive', year: 2022, km: 29000, fuel: 'DIESEL', trans: 'MANUAL', color: 'Polar White', buy: 1150000, sell: 1320000, min: 1280000, status: 'RESERVED' },
    { reg: 'KA04MJ6641', make: 'Maruti Suzuki', model: 'Baleno Alpha 1.2', year: 2022, km: 32000, fuel: 'PETROL', trans: 'AUTOMATIC', color: 'Nexa Blue', buy: 680000, sell: 790000, min: 760000, status: 'AVAILABLE' },
    { reg: 'KA02MH8822', make: 'Tata', model: 'Nexon XZ+ Dual Tone', year: 2021, km: 41000, fuel: 'DIESEL', trans: 'MANUAL', color: 'Calgary White', buy: 810000, sell: 940000, min: 900000, status: 'SOLD' },
    { reg: 'KA51MD3310', make: 'Hyundai', model: 'Grand i10 Sportz', year: 2019, km: 52000, fuel: 'PETROL', trans: 'MANUAL', color: 'Typhoon Silver', buy: 390000, sell: 475000, min: 450000, status: 'SOLD' },
    { reg: 'KA03NB2204', make: 'Maruti Suzuki', model: 'Ertiga ZXI Smart Hybrid', year: 2022, km: 36000, fuel: 'PETROL', trans: 'MANUAL', color: 'Pearl Metallic Auburn', buy: 890000, sell: 1040000, min: 990000, status: 'AVAILABLE' },
    { reg: 'KA01ML4490', make: 'Honda', model: 'Jazz V CVT Automatic', year: 2020, km: 39000, fuel: 'PETROL', trans: 'AUTOMATIC', color: 'Modern Steel', buy: 590000, sell: 690000, min: 660000, status: 'TEST_DRIVE' },
    { reg: 'KA04MN7711', make: 'Kia', model: 'Seltos HTX 1.5 Petrol', year: 2021, km: 34000, fuel: 'PETROL', trans: 'MANUAL', color: 'Gravity Grey', buy: 1080000, sell: 1240000, min: 1190000, status: 'SOLD' },
    { reg: 'KA05MM1009', make: 'Volkswagen', model: 'Polo 1.0 TSI Highline Plus', year: 2021, km: 28000, fuel: 'PETROL', trans: 'MANUAL', color: 'Flash Red', buy: 710000, sell: 830000, min: 795000, status: 'AVAILABLE' },
  ];

  const createdCars: any[] = [];
  for (let i = 0; i < usedCarModels.length; i++) {
    const c = usedCarModels[i];
    const car = await prisma.usedCarInventory.create({
      data: {
        carCode: `CAR-${101 + i}`,
        registrationNumber: c.reg,
        make: c.make,
        model: c.model,
        year: c.year,
        odometerKm: c.km,
        fuelType: c.fuel,
        transmission: c.trans,
        color: c.color,
        ownersCount: 1,
        conditionScore: 86 + (i % 10),
        purchasePrice: c.buy,
        expectedSalePrice: c.sell,
        minimumPrice: c.min,
        status: c.status,
        insuranceExpiry: new Date(Date.now() + 86400000 * 240),
        pucExpiry: new Date(Date.now() + 86400000 * 180),
        notes: 'Verified single-owner vehicle with complete service history & clean engine compression check.',
      }
    });
    createdCars.push(car);

    await prisma.usedCarExpense.create({
      data: {
        carId: car.id,
        category: 'REPAIR',
        amount: 8500,
        vendor: 'SpeedZone Detailing & Mechanic Hub',
        description: '3M 5-Step Polishing, ceramic coat top-up, AC foam disinfectant, wiper blade replacement.',
      }
    });

    await prisma.usedCarExpense.create({
      data: {
        carId: car.id,
        category: 'DOCUMENTATION',
        amount: 2500,
        vendor: 'RTO Consultant Koramangala',
        description: 'NOC verification and RTO Form 29/30 hypothecation clearance.',
      }
    });

    if (c.status === 'SOLD') {
      const discount = 15000;
      const salePrice = c.sell - discount;
      const totalCost = c.buy + 8500 + 2500;
      const grossProfit = salePrice - totalCost;
      const profitMarginPct = Math.round((grossProfit / totalCost) * 1000) / 10;

      await prisma.usedCarSale.create({
        data: {
          saleCode: `UCS-${401 + i}`,
          carId: car.id,
          buyerName: `Venkatesh Prasad (${c.model} Buyer)`,
          buyerPhone: '+91 98455 77889',
          buyerEmail: 'vprasad.buyer@example.com',
          salePrice,
          discount,
          bookingAmount: 50000,
          paidAmount: salePrice,
          pendingAmount: 0,
          paymentMode: 'BANK_TRANSFER',
          salespersonId: salesUser.id,
          salespersonName: 'Rahul Sharma (Sales)',
          purchaseCost: c.buy,
          totalRepairs: 8500,
          totalExpenses: 2500,
          totalCost,
          grossProfit,
          profitMarginPct,
          notes: 'Customer financed via HDFC Car Loan. Full disbursement received.',
        }
      });
    }
  }

  console.log('--- Seeding Used Car Leads & Test Drives ---');
  for (let i = 1; i <= 15; i++) {
    const car = createdCars[i % createdCars.length];
    const uLead = await prisma.usedCarLead.create({
      data: {
        leadCode: `UCL-${200 + i}`,
        carId: car.id,
        buyerName: `${indianFirstNames[i]} ${indianLastNames[i]}`,
        phone: `+91 97412 ${30000 + i * 111}`,
        email: `buyer${i}@example.com`,
        location: bangaloreAreas[i % bangaloreAreas.length],
        budget: car.expectedSalePrice,
        preferredVehicle: `${car.make} ${car.model}`,
        financeRequired: i % 2 === 0,
        source: i % 3 === 0 ? 'CARWALE' : (i % 2 === 0 ? 'OLX' : 'WEBSITE'),
        status: i % 2 === 0 ? 'TEST_DRIVE_SCHEDULED' : 'NEW',
      }
    });

    await prisma.usedCarTestDrive.create({
      data: {
        testDriveCode: `UTD-${300 + i}`,
        carId: car.id,
        buyerLeadId: uLead.id,
        buyerName: uLead.buyerName,
        buyerPhone: uLead.phone,
        scheduledDate: new Date(Date.now() + 86400000 * (i % 5 + 1)),
        timeSlot: '04:00 PM - 05:00 PM',
        salespersonName: 'Rahul Sharma (Sales)',
        status: 'SCHEDULED',
      }
    });
  }

  console.log('--- Seeding Expenses & Notifications ---');
  const expenseCategories = [
    { cat: 'RENT', amt: 65000, desc: 'Indiranagar Driving School Main Office Rent (August 2026)' },
    { cat: 'SALARY', amt: 185000, desc: 'Instructor & Staff Monthly Payroll Disbursement' },
    { cat: 'ELECTRICITY', amt: 7800, desc: 'BESCOM Commercial Office Electricity Bill' },
    { cat: 'ADVERTISING', amt: 28000, desc: 'Google Search Ads & Meta Driving School Campaigns' },
    { cat: 'SOFTWARE', amt: 4500, desc: 'Cloud Server, SMS Gateway & WhatsApp API credits' },
    { cat: 'STATIONERY', amt: 3200, desc: 'RTO Learner Guidebooks, Student Passbooks & L-plates' },
  ];

  for (let i = 0; i < expenseCategories.length; i++) {
    const e = expenseCategories[i];
    await prisma.expense.create({
      data: {
        expenseCode: `EXP-${1001 + i}`,
        category: e.cat,
        amount: e.amt,
        department: 'ADMINISTRATION',
        vendorName: 'Direct Vendor',
        paymentMode: 'BANK_TRANSFER',
        description: e.desc,
      }
    });
  }

  const sampleNotifications = [
    { type: 'NEW_LEAD', title: 'New High-Score Lead', message: 'Sneha Sharma requested Morning Automatic Hatchback trial at Indiranagar (AI Score: 92%).', link: '/leads' },
    { type: 'VEHICLE_SERVICE_DUE', title: 'Service Due in 7 Days', message: 'Swift KA01MG2041 is due for 15,000 KM general maintenance service.', link: '/vehicles' },
    { type: 'PUC_EXPIRY', title: 'PUC Renewal Alert', message: 'Baleno KA05MH4102 emission test certificate expires in 12 days.', link: '/renewals' },
    { type: 'PAYMENT_OVERDUE', title: 'Installment Due Reminder', message: 'Student STU-2004 has installment balance of ₹3,500 due today.', link: '/payments' },
    { type: 'TEST_TOMORROW', title: 'RTO Driving Test Tomorrow', message: '3 students (STU-2008, STU-2012, STU-2015) scheduled for KA-01 Koramangala Track.', link: '/tests' },
  ];

  for (const n of sampleNotifications) {
    await prisma.notification.create({
      data: {
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        severity: n.type.includes('DUE') || n.type.includes('EXPIRY') ? 'WARNING' : 'INFO',
        isRead: false,
      }
    });
  }

  const defaultSettings = [
    { key: 'SCHOOL_NAME', value: 'Sri Munis Kanna Driving School & Academy Bengaluru', category: 'BUSINESS' },
    { key: 'GSTIN', value: '29ABCDE1234F1Z5', category: 'BILLING' },
    { key: 'CURRENCY_SYMBOL', value: '₹', category: 'BILLING' },
    { key: 'OFFICE_ADDRESS', value: '#482, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038', category: 'BUSINESS' },
    { key: 'CONTACT_PHONE', value: '+91 80 4123 9900', category: 'BUSINESS' },
    { key: 'DEFAULT_LESSON_DURATION_MINS', value: '60', category: 'GENERAL' },
    { key: 'ENABLE_AI_LEAD_SCORING', value: 'true', category: 'AI' },
    { key: 'ENABLE_AUTO_CONFLICT_GUARD', value: 'true', category: 'GENERAL' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value },
    });
  }

  console.log('====================================================');
  console.log(' DrivePro CRM & ERP Database Seeded Successfully!');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

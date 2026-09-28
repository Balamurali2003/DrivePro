import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrateDataToMySQL() {
  console.log('================================================================');
  console.log(' STARTING DATA MIGRATION: SQLite/PostgreSQL -> MySQL');
  console.log('================================================================\n');

  const exportPath = path.join(__dirname, '../prisma/sqlite_data_export.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`Export file not found at ${exportPath}. Please ensure sqlite_data_export.json exists.`);
    process.exit(1);
  }

  const data: Record<string, any[]> = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

  try {
    // 1. Roles
    if (data.roles?.length) {
      console.log(`Migrating ${data.roles.length} roles to MySQL...`);
      for (const r of data.roles) {
        await prisma.role.upsert({
          where: { id: r.id },
          create: { ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) },
          update: { ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) },
        });
      }
    }

    // 2. Users
    if (data.users?.length) {
      console.log(`Migrating ${data.users.length} users to MySQL...`);
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          create: { ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) },
          update: { ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) },
        });
      }
    }

    // 3. Settings
    if (data.settings?.length) {
      console.log(`Migrating ${data.settings.length} settings to MySQL...`);
      for (const s of data.settings) {
        await prisma.setting.upsert({
          where: { key: s.key },
          create: { ...s, updatedAt: new Date(s.updatedAt) },
          update: { ...s, updatedAt: new Date(s.updatedAt) },
        });
      }
    }

    // 4. Campaigns
    if (data.campaigns?.length) {
      console.log(`Migrating ${data.campaigns.length} campaigns to MySQL...`);
      for (const c of data.campaigns) {
        await prisma.campaign.upsert({
          where: { id: c.id },
          create: { ...c, startDate: new Date(c.startDate), endDate: c.endDate ? new Date(c.endDate) : null, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) },
          update: { ...c, startDate: new Date(c.startDate), endDate: c.endDate ? new Date(c.endDate) : null, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) },
        });
      }
    }

    // 5. Courses & Course Packages
    if (data.courses?.length) {
      console.log(`Migrating ${data.courses.length} courses to MySQL...`);
      for (const c of data.courses) {
        await prisma.course.upsert({
          where: { id: c.id },
          create: { ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) },
          update: { ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) },
        });
      }
    }
    if (data.coursePackages?.length) {
      console.log(`Migrating ${data.coursePackages.length} course packages to MySQL...`);
      for (const cp of data.coursePackages) {
        await prisma.coursePackage.upsert({
          where: { id: cp.id },
          create: { ...cp, createdAt: new Date(cp.createdAt), updatedAt: new Date(cp.updatedAt) },
          update: { ...cp, createdAt: new Date(cp.createdAt), updatedAt: new Date(cp.updatedAt) },
        });
      }
    }

    // 6. Instructors & Availabilities
    if (data.instructors?.length) {
      console.log(`Migrating ${data.instructors.length} instructors to MySQL...`);
      for (const inst of data.instructors) {
        await prisma.instructor.upsert({
          where: { id: inst.id },
          create: { ...inst, joiningDate: new Date(inst.joiningDate), licenceExpiry: new Date(inst.licenceExpiry), createdAt: new Date(inst.createdAt), updatedAt: new Date(inst.updatedAt) },
          update: { ...inst, joiningDate: new Date(inst.joiningDate), licenceExpiry: new Date(inst.licenceExpiry), createdAt: new Date(inst.createdAt), updatedAt: new Date(inst.updatedAt) },
        });
      }
    }
    if (data.instructorAvailabilities?.length) {
      for (const ia of data.instructorAvailabilities) {
        await prisma.instructorAvailability.upsert({
          where: { id: ia.id },
          create: ia,
          update: ia,
        });
      }
    }

    // 7. Vehicles, Maintenance, Fuel Logs
    if (data.vehicles?.length) {
      console.log(`Migrating ${data.vehicles.length} vehicles to MySQL...`);
      for (const v of data.vehicles) {
        await prisma.vehicle.upsert({
          where: { id: v.id },
          create: {
            ...v,
            purchaseDate: v.purchaseDate ? new Date(v.purchaseDate) : null,
            insuranceExpiry: new Date(v.insuranceExpiry),
            pucExpiry: new Date(v.pucExpiry),
            fitnessExpiry: new Date(v.fitnessExpiry),
            lastServiceDate: v.lastServiceDate ? new Date(v.lastServiceDate) : null,
            nextServiceDate: new Date(v.nextServiceDate),
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          },
          update: {
            ...v,
            purchaseDate: v.purchaseDate ? new Date(v.purchaseDate) : null,
            insuranceExpiry: new Date(v.insuranceExpiry),
            pucExpiry: new Date(v.pucExpiry),
            fitnessExpiry: new Date(v.fitnessExpiry),
            lastServiceDate: v.lastServiceDate ? new Date(v.lastServiceDate) : null,
            nextServiceDate: new Date(v.nextServiceDate),
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          },
        });
      }
    }
    if (data.vehicleMaintenances?.length) {
      for (const vm of data.vehicleMaintenances) {
        await prisma.vehicleMaintenance.upsert({
          where: { id: vm.id },
          create: { ...vm, serviceDate: new Date(vm.serviceDate), nextServiceDate: vm.nextServiceDate ? new Date(vm.nextServiceDate) : null, createdAt: new Date(vm.createdAt), updatedAt: new Date(vm.updatedAt) },
          update: { ...vm, serviceDate: new Date(vm.serviceDate), nextServiceDate: vm.nextServiceDate ? new Date(vm.nextServiceDate) : null, createdAt: new Date(vm.createdAt), updatedAt: new Date(vm.updatedAt) },
        });
      }
    }
    if (data.vehicleFuelLogs?.length) {
      for (const vf of data.vehicleFuelLogs) {
        await prisma.vehicleFuelLog.upsert({
          where: { id: vf.id },
          create: { ...vf, logDate: new Date(vf.logDate), createdAt: new Date(vf.createdAt), updatedAt: new Date(vf.updatedAt) },
          update: { ...vf, logDate: new Date(vf.logDate), createdAt: new Date(vf.createdAt), updatedAt: new Date(vf.updatedAt) },
        });
      }
    }

    // 8. Leads
    if (data.leads?.length) {
      console.log(`Migrating ${data.leads.length} leads to MySQL...`);
      for (const l of data.leads) {
        await prisma.lead.upsert({
          where: { id: l.id },
          create: {
            ...l,
            expectedJoiningDate: l.expectedJoiningDate ? new Date(l.expectedJoiningDate) : null,
            lastCommunicationAt: l.lastCommunicationAt ? new Date(l.lastCommunicationAt) : null,
            nextFollowUpAt: l.nextFollowUpAt ? new Date(l.nextFollowUpAt) : null,
            expectedJoinDate: l.expectedJoinDate ? new Date(l.expectedJoinDate) : null,
            priorityUpdatedAt: new Date(l.priorityUpdatedAt || l.createdAt),
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          },
          update: {
            ...l,
            expectedJoiningDate: l.expectedJoiningDate ? new Date(l.expectedJoiningDate) : null,
            lastCommunicationAt: l.lastCommunicationAt ? new Date(l.lastCommunicationAt) : null,
            nextFollowUpAt: l.nextFollowUpAt ? new Date(l.nextFollowUpAt) : null,
            expectedJoinDate: l.expectedJoinDate ? new Date(l.expectedJoinDate) : null,
            priorityUpdatedAt: new Date(l.priorityUpdatedAt || l.createdAt),
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          },
        });
      }
    }

    // 9. Students & Attendance
    if (data.students?.length) {
      console.log(`Migrating ${data.students.length} students to MySQL...`);
      for (const st of data.students) {
        await prisma.student.upsert({
          where: { id: st.id },
          create: {
            ...st,
            dob: st.dob ? new Date(st.dob) : null,
            learnerLicenceExpiry: st.learnerLicenceExpiry ? new Date(st.learnerLicenceExpiry) : null,
            drivingLicenceExpiry: st.drivingLicenceExpiry ? new Date(st.drivingLicenceExpiry) : null,
            joiningDate: st.joiningDate ? new Date(st.joiningDate) : null,
            createdAt: new Date(st.createdAt),
            updatedAt: new Date(st.updatedAt),
          },
          update: {
            ...st,
            dob: st.dob ? new Date(st.dob) : null,
            learnerLicenceExpiry: st.learnerLicenceExpiry ? new Date(st.learnerLicenceExpiry) : null,
            drivingLicenceExpiry: st.drivingLicenceExpiry ? new Date(st.drivingLicenceExpiry) : null,
            joiningDate: st.joiningDate ? new Date(st.joiningDate) : null,
            createdAt: new Date(st.createdAt),
            updatedAt: new Date(st.updatedAt),
          },
        });
      }
    }
    if (data.studentAttendanceRecords?.length) {
      for (const sar of data.studentAttendanceRecords) {
        await prisma.studentAttendanceRecord.upsert({
          where: { id: sar.id },
          create: { ...sar, classDate: new Date(sar.classDate), createdAt: new Date(sar.createdAt) },
          update: { ...sar, classDate: new Date(sar.classDate), createdAt: new Date(sar.createdAt) },
        });
      }
    }

    // 10. Lessons, Progress, Attendance
    if (data.lessons?.length) {
      console.log(`Migrating ${data.lessons.length} lessons to MySQL...`);
      for (const les of data.lessons) {
        await prisma.lesson.upsert({
          where: { id: les.id },
          create: { ...les, lessonDate: new Date(les.lessonDate), createdAt: new Date(les.createdAt), updatedAt: new Date(les.updatedAt) },
          update: { ...les, lessonDate: new Date(les.lessonDate), createdAt: new Date(les.createdAt), updatedAt: new Date(les.updatedAt) },
        });
      }
    }
    if (data.attendances?.length) {
      for (const att of data.attendances) {
        await prisma.attendance.upsert({
          where: { id: att.id },
          create: { ...att, date: new Date(att.date), createdAt: new Date(att.createdAt), updatedAt: new Date(att.updatedAt) },
          update: { ...att, date: new Date(att.date), createdAt: new Date(att.createdAt), updatedAt: new Date(att.updatedAt) },
        });
      }
    }
    if (data.lessonAttendances?.length) {
      for (const la of data.lessonAttendances) {
        await prisma.lessonAttendance.upsert({
          where: { id: la.id },
          create: { ...la, checkInTime: la.checkInTime ? new Date(la.checkInTime) : null, checkOutTime: la.checkOutTime ? new Date(la.checkOutTime) : null, createdAt: new Date(la.createdAt), updatedAt: new Date(la.updatedAt) },
          update: { ...la, checkInTime: la.checkInTime ? new Date(la.checkInTime) : null, checkOutTime: la.checkOutTime ? new Date(la.checkOutTime) : null, createdAt: new Date(la.createdAt), updatedAt: new Date(la.updatedAt) },
        });
      }
    }
    if (data.lessonProgresses?.length) {
      for (const lp of data.lessonProgresses) {
        await prisma.lessonProgress.upsert({
          where: { id: lp.id },
          create: { ...lp, createdAt: new Date(lp.createdAt), updatedAt: new Date(lp.updatedAt) },
          update: { ...lp, createdAt: new Date(lp.createdAt), updatedAt: new Date(lp.updatedAt) },
        });
      }
    }

    // 11. Payments, Invoices, Refunds
    if (data.payments?.length) {
      console.log(`Migrating ${data.payments.length} payments to MySQL...`);
      for (const p of data.payments) {
        await prisma.payment.upsert({
          where: { id: p.id },
          create: { ...p, paymentDate: new Date(p.paymentDate), dueDate: p.dueDate ? new Date(p.dueDate) : null, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) },
          update: { ...p, paymentDate: new Date(p.paymentDate), dueDate: p.dueDate ? new Date(p.dueDate) : null, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) },
        });
      }
    }
    if (data.invoices?.length) {
      console.log(`Migrating ${data.invoices.length} invoices to MySQL...`);
      for (const inv of data.invoices) {
        await prisma.invoice.upsert({
          where: { id: inv.id },
          create: { ...inv, invoiceDate: new Date(inv.invoiceDate), dueDate: inv.dueDate ? new Date(inv.dueDate) : null, createdAt: new Date(inv.createdAt), updatedAt: new Date(inv.updatedAt) },
          update: { ...inv, invoiceDate: new Date(inv.invoiceDate), dueDate: inv.dueDate ? new Date(inv.dueDate) : null, createdAt: new Date(inv.createdAt), updatedAt: new Date(inv.updatedAt) },
        });
      }
    }
    if (data.refunds?.length) {
      for (const ref of data.refunds) {
        await prisma.refund.upsert({
          where: { id: ref.id },
          create: { ...ref, requestedAt: new Date(ref.requestedAt), approvedAt: ref.approvedAt ? new Date(ref.approvedAt) : null, processedAt: ref.processedAt ? new Date(ref.processedAt) : null, refundDate: new Date(ref.refundDate), createdAt: new Date(ref.createdAt), updatedAt: new Date(ref.updatedAt) },
          update: { ...ref, requestedAt: new Date(ref.requestedAt), approvedAt: ref.approvedAt ? new Date(ref.approvedAt) : null, processedAt: ref.processedAt ? new Date(ref.processedAt) : null, refundDate: new Date(ref.refundDate), createdAt: new Date(ref.createdAt), updatedAt: new Date(ref.updatedAt) },
        });
      }
    }

    // 12. Used Car Showroom
    if (data.usedCarInventories?.length) {
      console.log(`Migrating ${data.usedCarInventories.length} used cars to MySQL...`);
      for (const uc of data.usedCarInventories) {
        await prisma.usedCarInventory.upsert({
          where: { id: uc.id },
          create: { ...uc, insuranceExpiry: uc.insuranceExpiry ? new Date(uc.insuranceExpiry) : null, pucExpiry: uc.pucExpiry ? new Date(uc.pucExpiry) : null, createdAt: new Date(uc.createdAt), updatedAt: new Date(uc.updatedAt) },
          update: { ...uc, insuranceExpiry: uc.insuranceExpiry ? new Date(uc.insuranceExpiry) : null, pucExpiry: uc.pucExpiry ? new Date(uc.pucExpiry) : null, createdAt: new Date(uc.createdAt), updatedAt: new Date(uc.updatedAt) },
        });
      }
    }
    if (data.usedCarImages?.length) {
      for (const uci of data.usedCarImages) {
        await prisma.usedCarImage.upsert({
          where: { id: uci.id },
          create: { ...uci, createdAt: new Date(uci.createdAt), updatedAt: new Date(uci.updatedAt) },
          update: { ...uci, createdAt: new Date(uci.createdAt), updatedAt: new Date(uci.updatedAt) },
        });
      }
    }
    if (data.usedCarLeads?.length) {
      for (const ucl of data.usedCarLeads) {
        await prisma.usedCarLead.upsert({
          where: { id: ucl.id },
          create: { ...ucl, createdAt: new Date(ucl.createdAt), updatedAt: new Date(ucl.updatedAt) },
          update: { ...ucl, createdAt: new Date(ucl.createdAt), updatedAt: new Date(ucl.updatedAt) },
        });
      }
    }
    if (data.usedCarTestDrives?.length) {
      for (const uct of data.usedCarTestDrives) {
        await prisma.usedCarTestDrive.upsert({
          where: { id: uct.id },
          create: { ...uct, scheduledDate: new Date(uct.scheduledDate), createdAt: new Date(uct.createdAt), updatedAt: new Date(uct.updatedAt) },
          update: { ...uct, scheduledDate: new Date(uct.scheduledDate), createdAt: new Date(uct.createdAt), updatedAt: new Date(uct.updatedAt) },
        });
      }
    }
    if (data.usedCarSales?.length) {
      for (const ucs of data.usedCarSales) {
        await prisma.usedCarSale.upsert({
          where: { id: ucs.id },
          create: { ...ucs, saleDate: new Date(ucs.saleDate), deliveryDate: ucs.deliveryDate ? new Date(ucs.deliveryDate) : null, createdAt: new Date(ucs.createdAt), updatedAt: new Date(ucs.updatedAt) },
          update: { ...ucs, saleDate: new Date(ucs.saleDate), deliveryDate: ucs.deliveryDate ? new Date(ucs.deliveryDate) : null, createdAt: new Date(ucs.createdAt), updatedAt: new Date(ucs.updatedAt) },
        });
      }
    }

    // 13. WhatsApp Conversations & Messages
    if (data.whatsAppConversations?.length) {
      console.log(`Migrating ${data.whatsAppConversations.length} WhatsApp conversations to MySQL...`);
      for (const wac of data.whatsAppConversations) {
        await prisma.whatsAppConversation.upsert({
          where: { id: wac.id },
          create: { ...wac, lastMessageAt: wac.lastMessageAt ? new Date(wac.lastMessageAt) : null, createdAt: new Date(wac.createdAt), updatedAt: new Date(wac.updatedAt) },
          update: { ...wac, lastMessageAt: wac.lastMessageAt ? new Date(wac.lastMessageAt) : null, createdAt: new Date(wac.createdAt), updatedAt: new Date(wac.updatedAt) },
        });
      }
    }
    if (data.whatsAppMessages?.length) {
      console.log(`Migrating ${data.whatsAppMessages.length} WhatsApp messages to MySQL...`);
      for (const wam of data.whatsAppMessages) {
        await prisma.whatsAppMessage.upsert({
          where: { id: wam.id },
          create: { ...wam, sentAt: wam.sentAt ? new Date(wam.sentAt) : null, deliveredAt: wam.deliveredAt ? new Date(wam.deliveredAt) : null, readAt: wam.readAt ? new Date(wam.readAt) : null, failedAt: wam.failedAt ? new Date(wam.failedAt) : null, createdAt: new Date(wam.createdAt) },
          update: { ...wam, sentAt: wam.sentAt ? new Date(wam.sentAt) : null, deliveredAt: wam.deliveredAt ? new Date(wam.deliveredAt) : null, readAt: wam.readAt ? new Date(wam.readAt) : null, failedAt: wam.failedAt ? new Date(wam.failedAt) : null, createdAt: new Date(wam.createdAt) },
        });
      }
    }

    console.log('\n================================================================');
    console.log(' MYSQL DATA MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('MySQL Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDataToMySQL();

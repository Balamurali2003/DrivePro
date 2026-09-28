import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function exportAllData() {
  console.log('--- Exporting all data from SQLite database ---');
  
  const data: Record<string, any[]> = {};

  try {
    data.users = await prisma.user.findMany();
    data.roles = await prisma.role.findMany();
    data.leads = await prisma.lead.findMany();
    data.leadLocationHistories = await prisma.leadLocationHistory.findMany();
    data.leadImportHistories = await prisma.leadImportHistory.findMany();
    data.leadFollowups = await prisma.leadFollowup.findMany();
    data.leadActivities = await prisma.leadActivity.findMany();
    data.leadStatusHistories = await prisma.leadStatusHistory.findMany();
    data.students = await prisma.student.findMany();
    data.studentAttendanceRecords = await prisma.studentAttendanceRecord.findMany();
    data.studentDocuments = await prisma.studentDocument.findMany();
    data.courses = await prisma.course.findMany();
    data.coursePackages = await prisma.coursePackage.findMany();
    data.enrollments = await prisma.enrollment.findMany();
    data.instructors = await prisma.instructor.findMany();
    data.instructorAvailabilities = await prisma.instructorAvailability.findMany();
    data.vehicles = await prisma.vehicle.findMany();
    data.vehicleDocuments = await prisma.vehicleDocument.findMany();
    data.vehicleMaintenances = await prisma.vehicleMaintenance.findMany();
    data.vehicleFuelLogs = await prisma.vehicleFuelLog.findMany();
    data.vehicleExpenses = await prisma.vehicleExpense.findMany();
    data.lessons = await prisma.lesson.findMany();
    data.attendances = await prisma.attendance.findMany();
    data.lessonAttendances = await prisma.lessonAttendance.findMany();
    data.lessonProgresses = await prisma.lessonProgress.findMany();
    data.lessonSkills = await prisma.lessonSkill.findMany();
    data.payments = await prisma.payment.findMany();
    data.paymentInstallments = await prisma.paymentInstallment.findMany();
    data.invoices = await prisma.invoice.findMany();
    data.refunds = await prisma.refund.findMany();
    data.complaints = await prisma.complaint.findMany();
    data.complaintComments = await prisma.complaintComment.findMany();
    data.feedbacks = await prisma.feedback.findMany();
    data.tests = await prisma.test.findMany();
    data.licenceRecords = await prisma.licenceRecord.findMany();
    data.usedCarInventories = await prisma.usedCarInventory.findMany();
    data.usedCarLeads = await prisma.usedCarLead.findMany();
    data.usedCarTestDrives = await prisma.usedCarTestDrive.findMany();
    data.usedCarExpenses = await prisma.usedCarExpense.findMany();
    data.usedCarSales = await prisma.usedCarSale.findMany();
    data.expenses = await prisma.expense.findMany();
    data.employees = await prisma.employee.findMany();
    data.employeeAttendances = await prisma.employeeAttendance.findMany();
    data.commissions = await prisma.commission.findMany();
    data.referrals = await prisma.referral.findMany();
    data.referralRewards = await prisma.referralReward.findMany();
    data.campaigns = await prisma.campaign.findMany();
    data.renewals = await prisma.renewal.findMany();
    data.notifications = await prisma.notification.findMany();
    data.auditLogs = await prisma.auditLog.findMany();
    data.settings = await prisma.setting.findMany();
    data.leadCommunications = await prisma.leadCommunication.findMany();
    data.usedCarImages = await prisma.usedCarImage.findMany();
    data.buyerInquiries = await prisma.buyerInquiry.findMany();
    data.usedCarBuyerInquiries = await prisma.usedCarBuyerInquiry.findMany();
    data.whatsAppConversations = await prisma.whatsAppConversation.findMany();
    data.whatsAppMessages = await prisma.whatsAppMessage.findMany();
    data.whatsAppWebhookEvents = await prisma.whatsAppWebhookEvent.findMany();
    data.whatsAppBroadcasts = await prisma.whatsAppBroadcast.findMany();
    data.whatsAppBroadcastRecipients = await prisma.whatsAppBroadcastRecipient.findMany();

    const exportPath = path.join(__dirname, '../prisma/sqlite_data_export.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Successfully exported all tables to: ${exportPath}`);
    for (const [table, rows] of Object.entries(data)) {
      if (rows.length > 0) {
        console.log(`- ${table}: ${rows.length} record(s)`);
      }
    }
  } catch (err) {
    console.error('Export failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData();

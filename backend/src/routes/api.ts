import * as refCtrl from '../controllers/referralController';
import * as campCtrl from '../controllers/campaignController';
import * as refundCtrl from '../controllers/refundController';
import * as expCtrl from '../controllers/expenseController';
import * as tdCtrl from '../controllers/testDriveController';
import { WhatsAppWebhookController } from '../controllers/whatsappWebhookController';
import { WhatsAppController } from '../controllers/whatsappController';
import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as dashCtrl from '../controllers/dashboardController';
import * as leadCtrl from '../controllers/leadController';
import * as followCtrl from '../controllers/followupController';
import * as commCtrl from '../controllers/communicationController';
import * as studentCtrl from '../controllers/studentController';
import * as courseCtrl from '../controllers/courseController';
import * as enrollCtrl from '../controllers/enrollmentController';
import * as lessonCtrl from '../controllers/lessonController';
import * as instCtrl from '../controllers/instructorController';
import * as vehCtrl from '../controllers/vehicleController';
import * as payCtrl from '../controllers/paymentController';
import * as compCtrl from '../controllers/complaintController';
import * as testCtrl from '../controllers/testLicenceController';
import * as usedCarCtrl from '../controllers/usedCarController';
import * as attCtrl from '../controllers/attendanceController';
import * as repCtrl from '../controllers/reportsAnalyticsController';
import * as aiCtrl from '../controllers/aiController';
import * as miscCtrl from '../controllers/miscController';
import { logAudit } from '../middleware/audit';

const router = Router();

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authCtrl.getCurrentUser);
router.get('/auth/roles', authCtrl.getRoles);
router.get('/auth/users', authCtrl.getUsers);

// Dashboard
router.get('/dashboard/stats', dashCtrl.getDashboardStats);
router.get('/dashboard/leads', dashCtrl.getLeadStats);
router.get('/dashboard/lead-assignment', dashCtrl.getLeadAssignmentStats);
router.get('/dashboard/students', dashCtrl.getStudentStats);
router.get('/dashboard/classes', dashCtrl.getClassStats);
router.get('/dashboard/payments', dashCtrl.getPaymentStats);
router.get('/dashboard/attendance', dashCtrl.getAttendanceStats);
router.get('/dashboard/followups', dashCtrl.getFollowupStats);
router.get('/dashboard/rto', dashCtrl.getRtoStats);

// Leads Import & Template
router.get('/leads/import-template', leadCtrl.getLeadImportTemplate);
router.get('/leads/import-history', leadCtrl.getLeadImportHistory);
router.post('/leads/import', logAudit('IMPORT', 'LEADS'), leadCtrl.importLeads);
router.post('/leads/reset', logAudit('RESET_DATA', 'LEADS'), leadCtrl.resetLeadsData);

// Leads
router.get('/leads', leadCtrl.getLeads);
router.get('/leads/map', leadCtrl.getLeadsMap);
router.get('/leads/sources', leadCtrl.getLeadSources);
router.get('/leads/territories', leadCtrl.getLeadTerritories);
router.get('/leads/campaigns', leadCtrl.getLeadCampaigns);
router.get('/leads/locations', leadCtrl.getLeadLocations);
router.patch('/leads/:id/status', logAudit('UPDATE_STATUS', 'LEADS'), leadCtrl.updateLeadStatus);
router.get('/leads/:id', leadCtrl.getLeadById);
router.post('/leads', logAudit('CREATE', 'LEADS'), leadCtrl.createLead);
router.put('/leads/:id', logAudit('UPDATE', 'LEADS'), leadCtrl.updateLead);
router.patch('/leads/:id', logAudit('UPDATE', 'LEADS'), leadCtrl.updateLead);
router.delete('/leads/:id', logAudit('DELETE', 'LEADS'), leadCtrl.deleteLead);
router.post('/leads/:id/convert', logAudit('CONVERT_TO_STUDENT', 'LEADS'), leadCtrl.convertLeadToStudent);

// Attendance & Daily Training Operations
router.get('/attendance', attCtrl.getAttendance);
router.get('/attendance/students', attCtrl.getAttendance);
router.get('/attendance/today', attCtrl.getTodayAttendance);
router.get('/attendance/summary', attCtrl.getAttendanceSummary);
router.get('/attendance/report', attCtrl.getAttendanceReport);
router.get('/attendance/student/:studentId', attCtrl.getStudentAttendance);
router.post('/attendance', logAudit('RECORD_ATTENDANCE', 'ATTENDANCE'), attCtrl.recordAttendance);
router.post('/attendance/bulk', logAudit('BULK_ATTENDANCE', 'ATTENDANCE'), attCtrl.recordBulkAttendance);
router.post('/attendance/clear', logAudit('CLEAR_ATTENDANCE', 'ATTENDANCE'), attCtrl.clearAttendance);
router.patch('/attendance/:id', logAudit('UPDATE_ATTENDANCE', 'ATTENDANCE'), attCtrl.updateAttendance);
router.delete('/attendance/:id', logAudit('DELETE_ATTENDANCE', 'ATTENDANCE'), attCtrl.deleteAttendance);

// Lead Communications
router.get('/leads/:id/communications', leadCtrl.getLeadCommunications);
router.post('/leads/:id/communications', logAudit('CREATE_COMMUNICATION', 'LEADS'), leadCtrl.createLeadCommunication);
router.patch('/leads/:id/communications/:communicationId', logAudit('UPDATE_COMMUNICATION', 'LEADS'), leadCtrl.updateLeadCommunication);
router.delete('/leads/:id/communications/:communicationId', logAudit('DELETE_COMMUNICATION', 'LEADS'), leadCtrl.deleteLeadCommunication);

// Follow-ups & Communications
router.get('/followups', followCtrl.getFollowups);
router.post('/followups', logAudit('CREATE', 'FOLLOWUPS'), followCtrl.createFollowup);
router.put('/followups/:id', logAudit('UPDATE', 'FOLLOWUPS'), followCtrl.updateFollowup);
router.get('/communications', commCtrl.getCommunications);
router.post('/communications/send', logAudit('SEND_MESSAGE', 'COMMUNICATIONS'), commCtrl.sendCommunication);

// Students
router.get('/students', studentCtrl.getStudents);
router.get('/students/:id', studentCtrl.getStudent360);
router.post('/students', logAudit('CREATE', 'STUDENTS'), studentCtrl.createStudent);
router.put('/students/:id', logAudit('UPDATE', 'STUDENTS'), studentCtrl.updateStudent);
router.patch('/students/:id', logAudit('UPDATE', 'STUDENTS'), studentCtrl.updateStudent);
router.delete('/students/:id', logAudit('DELETE', 'STUDENTS'), studentCtrl.deleteStudent);

// Courses & Enrollments
router.get('/courses', courseCtrl.getCourses);
router.post('/courses', logAudit('CREATE', 'COURSES'), courseCtrl.createCourse);
router.put('/courses/:id', logAudit('UPDATE', 'COURSES'), courseCtrl.updateCourse);
router.delete('/courses/:id', logAudit('DELETE', 'COURSES'), courseCtrl.deleteCourse);
router.get('/enrollments', enrollCtrl.getEnrollments);
router.post('/enrollments', logAudit('CREATE', 'ENROLLMENTS'), enrollCtrl.createEnrollment);

// Lessons & Scheduling
router.get('/lessons/metrics', lessonCtrl.getLessonMetrics);
router.get('/lessons/student/:studentId/progress', lessonCtrl.getStudentProgress);
router.get('/lessons', lessonCtrl.getLessons);
router.post('/lessons/schedule', logAudit('SCHEDULE', 'LESSONS'), lessonCtrl.scheduleLesson);
router.put('/lessons/:id', logAudit('UPDATE', 'LESSONS'), lessonCtrl.updateLesson);
router.post('/lessons/:id/complete', logAudit('COMPLETE', 'LESSONS'), lessonCtrl.completeLesson);

// Instructors
router.get('/instructors', instCtrl.getInstructors);
router.get('/instructors/recommendations', instCtrl.getSmartAllocations);
router.get('/instructors/:id', instCtrl.getInstructorById);
router.post('/instructors', logAudit('CREATE', 'INSTRUCTORS'), instCtrl.createInstructor);
router.put('/instructors/:id', logAudit('UPDATE', 'INSTRUCTORS'), instCtrl.updateInstructor);
router.delete('/instructors/:id', logAudit('DELETE', 'INSTRUCTORS'), instCtrl.deleteInstructor);

// Vehicles & Fleet
router.get('/vehicles', vehCtrl.getVehicles);
router.get('/vehicles/:id', vehCtrl.getVehicleById);
router.post('/vehicles', logAudit('CREATE', 'VEHICLES'), vehCtrl.createVehicle);
router.put('/vehicles/:id', logAudit('UPDATE', 'VEHICLES'), vehCtrl.updateVehicle);
router.delete('/vehicles/:id', logAudit('DELETE', 'VEHICLES'), vehCtrl.deleteVehicle);
router.get('/maintenance', vehCtrl.getMaintenanceLogs);
router.post('/maintenance', logAudit('CREATE', 'MAINTENANCE'), vehCtrl.createMaintenanceLog);
router.get('/fuel', vehCtrl.getFuelLogs);
router.post('/fuel', logAudit('CREATE', 'FUEL'), vehCtrl.createFuelLog);

// Billing, Invoices & Refunds
router.get('/payments', payCtrl.getPayments);
router.post('/payments', logAudit('CREATE', 'PAYMENTS'), payCtrl.recordPayment);
router.get('/invoices', payCtrl.getInvoices);
router.post('/invoices', logAudit('CREATE', 'INVOICES'), payCtrl.createInvoice);
// Refund Requests Hub
router.get('/refunds/metrics', refundCtrl.getRefundMetrics);
router.get('/refunds', refundCtrl.getRefunds);
router.post('/refunds', logAudit('CREATE', 'REFUNDS'), refundCtrl.createRefund);
router.patch('/refunds/:id/status', logAudit('UPDATE_STATUS', 'REFUNDS'), refundCtrl.updateRefundStatus);

// Complaints & Reviews
router.get('/complaints', compCtrl.getComplaints);
router.post('/complaints', logAudit('CREATE', 'COMPLAINTS'), compCtrl.createComplaint);
router.put('/complaints/:id', logAudit('UPDATE', 'COMPLAINTS'), compCtrl.updateComplaint);
router.post('/complaints/:id/comments', logAudit('COMMENT', 'COMPLAINTS'), compCtrl.addComplaintComment);
router.get('/feedbacks', compCtrl.getFeedbacks);

// Tests & Licences
router.get('/tests', testCtrl.getTests);
router.post('/tests', logAudit('CREATE', 'TESTS'), testCtrl.createTest);
router.get('/licences', testCtrl.getLicences);
router.post('/licences', logAudit('CREATE', 'LICENCES'), testCtrl.createLicenceRecord);

// Used Car Dealership & Buyer Search
router.get('/used-cars', usedCarCtrl.getUsedCarInventory);
router.get('/used-cars/search', usedCarCtrl.searchUsedCars);
router.get('/used-cars/stats', usedCarCtrl.getUsedCarStats);
router.get('/used-cars/:id', usedCarCtrl.getUsedCarById);
router.post('/used-cars', logAudit('CREATE', 'USED_CARS'), usedCarCtrl.createUsedCar);
router.put('/used-cars/:id', logAudit('UPDATE', 'USED_CARS'), usedCarCtrl.updateUsedCar);
router.delete('/used-cars/:id', logAudit('DELETE', 'USED_CARS'), usedCarCtrl.deleteUsedCar);

// Used Car Images
router.get('/used-cars/:id/images', usedCarCtrl.getCarImages);
router.post('/used-cars/:id/images', logAudit('UPLOAD_IMAGE', 'USED_CARS'), usedCarCtrl.uploadCarImage);
router.put('/used-cars/images/:imageId/primary', logAudit('SET_PRIMARY_IMAGE', 'USED_CARS'), usedCarCtrl.setPrimaryCarImage);
router.delete('/used-cars/images/:imageId', logAudit('DELETE_IMAGE', 'USED_CARS'), usedCarCtrl.deleteCarImage);

// Buyer Inquiries & Vehicle Inquiries
router.post('/used-cars/:id/inquiries', logAudit('CREATE_INQUIRY', 'USED_CARS'), usedCarCtrl.createVehicleInquiry);
router.get('/used-car-inquiries', usedCarCtrl.getUsedCarInquiries);
router.get('/buyer-inquiries', usedCarCtrl.getBuyerInquiries);
router.post('/buyer-inquiries', logAudit('CREATE', 'BUYER_INQUIRY'), usedCarCtrl.createBuyerInquiry);
router.delete('/buyer-inquiries/:id', logAudit('DELETE', 'BUYER_INQUIRY'), usedCarCtrl.deleteBuyerInquiry);
router.get('/buyer-inquiries/:id/matching', usedCarCtrl.getMatchingCarsForInquiry);

// Used Car Leads & Test Drives
router.post('/used-cars/:id/expenses', logAudit('CREATE_EXPENSE', 'USED_CARS'), usedCarCtrl.createUsedCarExpense);
router.get('/used-car-leads', usedCarCtrl.getUsedCarLeads);
router.post('/used-car-leads', logAudit('CREATE_LEAD', 'USED_CARS'), usedCarCtrl.createUsedCarLead);
// Test Drives Calendar Hub
router.get('/test-drives/metrics', tdCtrl.getTestDriveMetrics);
router.get('/test-drives', tdCtrl.getTestDrives);
router.post('/test-drives', logAudit('SCHEDULE_TEST_DRIVE', 'USED_CARS'), tdCtrl.scheduleTestDrive);
router.patch('/test-drives/:id/status', logAudit('UPDATE_STATUS', 'USED_CARS'), tdCtrl.updateTestDriveStatus);
router.delete('/test-drives/:id', logAudit('DELETE', 'USED_CARS'), tdCtrl.deleteTestDrive);
router.get('/used-car-sales', usedCarCtrl.getUsedCarSales);
router.post('/used-car-sales', logAudit('SALE', 'USED_CARS'), usedCarCtrl.recordUsedCarSale);

// Reports & BI Analytics
router.get('/reports', repCtrl.getReports);
router.get('/analytics', repCtrl.getAdvancedAnalytics);
router.get('/ai/insights', aiCtrl.getAiInsights);

// Misc
// Operating Expenses Hub
router.get('/expenses/metrics', expCtrl.getExpenseMetrics);
router.get('/expenses', expCtrl.getExpenses);
router.post('/expenses', logAudit('CREATE', 'EXPENSES'), expCtrl.createExpense);
router.put('/expenses/:id', logAudit('UPDATE', 'EXPENSES'), expCtrl.updateExpense);
router.delete('/expenses/:id', logAudit('DELETE', 'EXPENSES'), expCtrl.deleteExpense);
router.get('/employees', miscCtrl.getEmployees);
router.get('/commissions', miscCtrl.getCommissions);
// Marketing Campaigns Hub
router.get('/campaigns/metrics', campCtrl.getCampaignMetrics);
router.get('/campaigns', campCtrl.getCampaigns);
router.get('/campaigns/:id', campCtrl.getCampaignById);
router.post('/campaigns', logAudit('CREATE', 'CAMPAIGNS'), campCtrl.createCampaign);
router.patch('/campaigns/:id', logAudit('UPDATE', 'CAMPAIGNS'), campCtrl.updateCampaign);
router.delete('/campaigns/:id', logAudit('DELETE', 'CAMPAIGNS'), campCtrl.deleteCampaign);
// Referral Rewards Management
router.get('/referrals/metrics', refCtrl.getReferralMetrics);
router.get('/referrals', refCtrl.getReferrals);
router.post('/referrals', logAudit('CREATE', 'REFERRALS'), refCtrl.createReferral);
router.patch('/referrals/:id/approve-reward', logAudit('APPROVE_REWARD', 'REFERRALS'), refCtrl.approveReward);
router.patch('/referrals/:id/mark-paid', logAudit('PAY_REWARD', 'REFERRALS'), refCtrl.markRewardPaid);
router.patch('/referrals/:id/cancel', logAudit('CANCEL', 'REFERRALS'), refCtrl.cancelReferral);
router.patch('/referrals/:id', logAudit('UPDATE', 'REFERRALS'), refCtrl.updateReferral);
router.get('/renewals', miscCtrl.getRenewals);
router.get('/notifications', miscCtrl.getNotifications);
router.put('/notifications/:id/read', miscCtrl.markNotificationRead);
router.get('/audit-logs', miscCtrl.getAuditLogs);
router.get('/settings', miscCtrl.getSettings);
router.post('/settings', logAudit('UPDATE', 'SETTINGS'), miscCtrl.updateSetting);


// ==========================================
// WhatsApp Business API Webhook & Two-Way Center
// ==========================================
router.get('/whatsapp/webhook', WhatsAppWebhookController.verifyWebhook);
router.post('/whatsapp/webhook', WhatsAppWebhookController.handleWebhook);

router.get('/whatsapp/config', WhatsAppController.getConfigStatus);
router.get('/whatsapp/conversations', WhatsAppController.getConversations);
router.get('/whatsapp/conversations/:id', WhatsAppController.getConversationById);
router.get('/whatsapp/conversations/:id/messages', WhatsAppController.getConversationMessages);
router.post('/whatsapp/conversations/:id/messages', logAudit('WHATSAPP_SEND', 'COMMUNICATIONS'), WhatsAppController.sendMessage);
router.patch('/whatsapp/conversations/:id/read', WhatsAppController.markConversationRead);
router.patch('/whatsapp/conversations/:id/resolve', WhatsAppController.resolveConversation);
router.post('/whatsapp/bulk-send', logAudit('WHATSAPP_BULK_SEND', 'COMMUNICATIONS'), WhatsAppController.sendBulkMessages);
router.get('/whatsapp/broadcasts', WhatsAppController.getBroadcasts);
router.get('/whatsapp/broadcasts/:id', WhatsAppController.getBroadcastById);

export default router;

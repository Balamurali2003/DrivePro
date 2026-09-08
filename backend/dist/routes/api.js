"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCtrl = __importStar(require("../controllers/authController"));
const dashCtrl = __importStar(require("../controllers/dashboardController"));
const leadCtrl = __importStar(require("../controllers/leadController"));
const followCtrl = __importStar(require("../controllers/followupController"));
const commCtrl = __importStar(require("../controllers/communicationController"));
const studentCtrl = __importStar(require("../controllers/studentController"));
const courseCtrl = __importStar(require("../controllers/courseController"));
const enrollCtrl = __importStar(require("../controllers/enrollmentController"));
const lessonCtrl = __importStar(require("../controllers/lessonController"));
const instCtrl = __importStar(require("../controllers/instructorController"));
const vehCtrl = __importStar(require("../controllers/vehicleController"));
const payCtrl = __importStar(require("../controllers/paymentController"));
const compCtrl = __importStar(require("../controllers/complaintController"));
const testCtrl = __importStar(require("../controllers/testLicenceController"));
const usedCarCtrl = __importStar(require("../controllers/usedCarController"));
const attCtrl = __importStar(require("../controllers/attendanceController"));
const repCtrl = __importStar(require("../controllers/reportsAnalyticsController"));
const aiCtrl = __importStar(require("../controllers/aiController"));
const miscCtrl = __importStar(require("../controllers/miscController"));
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
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
router.post('/leads/import', (0, audit_1.logAudit)('IMPORT', 'LEADS'), leadCtrl.importLeads);
// Leads
router.get('/leads', leadCtrl.getLeads);
router.get('/leads/map', leadCtrl.getLeadsMap);
router.get('/leads/sources', leadCtrl.getLeadSources);
router.get('/leads/territories', leadCtrl.getLeadTerritories);
router.get('/leads/campaigns', leadCtrl.getLeadCampaigns);
router.get('/leads/locations', leadCtrl.getLeadLocations);
router.patch('/leads/:id/status', (0, audit_1.logAudit)('UPDATE_STATUS', 'LEADS'), leadCtrl.updateLeadStatus);
router.get('/leads/:id', leadCtrl.getLeadById);
router.post('/leads', (0, audit_1.logAudit)('CREATE', 'LEADS'), leadCtrl.createLead);
router.put('/leads/:id', (0, audit_1.logAudit)('UPDATE', 'LEADS'), leadCtrl.updateLead);
router.patch('/leads/:id', (0, audit_1.logAudit)('UPDATE', 'LEADS'), leadCtrl.updateLead);
router.delete('/leads/:id', (0, audit_1.logAudit)('DELETE', 'LEADS'), leadCtrl.deleteLead);
router.post('/leads/:id/convert', (0, audit_1.logAudit)('CONVERT_TO_STUDENT', 'LEADS'), leadCtrl.convertLeadToStudent);
// Attendance & Daily Training Operations
router.get('/attendance', attCtrl.getAttendance);
router.get('/attendance/today', attCtrl.getTodayAttendance);
router.get('/attendance/summary', attCtrl.getAttendanceSummary);
router.get('/attendance/report', attCtrl.getAttendanceReport);
router.get('/attendance/student/:studentId', attCtrl.getStudentAttendance);
router.post('/attendance', (0, audit_1.logAudit)('RECORD_ATTENDANCE', 'ATTENDANCE'), attCtrl.recordAttendance);
router.post('/attendance/bulk', (0, audit_1.logAudit)('BULK_ATTENDANCE', 'ATTENDANCE'), attCtrl.recordBulkAttendance);
router.patch('/attendance/:id', (0, audit_1.logAudit)('UPDATE_ATTENDANCE', 'ATTENDANCE'), attCtrl.updateAttendance);
router.delete('/attendance/:id', (0, audit_1.logAudit)('DELETE_ATTENDANCE', 'ATTENDANCE'), attCtrl.deleteAttendance);
// Lead Communications
router.get('/leads/:id/communications', leadCtrl.getLeadCommunications);
router.post('/leads/:id/communications', (0, audit_1.logAudit)('CREATE_COMMUNICATION', 'LEADS'), leadCtrl.createLeadCommunication);
router.patch('/leads/:id/communications/:communicationId', (0, audit_1.logAudit)('UPDATE_COMMUNICATION', 'LEADS'), leadCtrl.updateLeadCommunication);
router.delete('/leads/:id/communications/:communicationId', (0, audit_1.logAudit)('DELETE_COMMUNICATION', 'LEADS'), leadCtrl.deleteLeadCommunication);
// Follow-ups & Communications
router.get('/followups', followCtrl.getFollowups);
router.post('/followups', (0, audit_1.logAudit)('CREATE', 'FOLLOWUPS'), followCtrl.createFollowup);
router.put('/followups/:id', (0, audit_1.logAudit)('UPDATE', 'FOLLOWUPS'), followCtrl.updateFollowup);
router.get('/communications', commCtrl.getCommunications);
router.post('/communications/send', (0, audit_1.logAudit)('SEND_MESSAGE', 'COMMUNICATIONS'), commCtrl.sendCommunication);
// Students
router.get('/students', studentCtrl.getStudents);
router.get('/students/:id', studentCtrl.getStudent360);
router.post('/students', (0, audit_1.logAudit)('CREATE', 'STUDENTS'), studentCtrl.createStudent);
router.put('/students/:id', (0, audit_1.logAudit)('UPDATE', 'STUDENTS'), studentCtrl.updateStudent);
router.patch('/students/:id', (0, audit_1.logAudit)('UPDATE', 'STUDENTS'), studentCtrl.updateStudent);
router.delete('/students/:id', (0, audit_1.logAudit)('DELETE', 'STUDENTS'), studentCtrl.deleteStudent);
// Courses & Enrollments
router.get('/courses', courseCtrl.getCourses);
router.post('/courses', (0, audit_1.logAudit)('CREATE', 'COURSES'), courseCtrl.createCourse);
router.put('/courses/:id', (0, audit_1.logAudit)('UPDATE', 'COURSES'), courseCtrl.updateCourse);
router.delete('/courses/:id', (0, audit_1.logAudit)('DELETE', 'COURSES'), courseCtrl.deleteCourse);
router.get('/enrollments', enrollCtrl.getEnrollments);
router.post('/enrollments', (0, audit_1.logAudit)('CREATE', 'ENROLLMENTS'), enrollCtrl.createEnrollment);
// Lessons & Scheduling
router.get('/lessons', lessonCtrl.getLessons);
router.post('/lessons/schedule', (0, audit_1.logAudit)('SCHEDULE', 'LESSONS'), lessonCtrl.scheduleLesson);
router.post('/lessons/:id/complete', (0, audit_1.logAudit)('COMPLETE', 'LESSONS'), lessonCtrl.completeLesson);
// Instructors
router.get('/instructors', instCtrl.getInstructors);
router.get('/instructors/recommendations', instCtrl.getSmartAllocations);
router.get('/instructors/:id', instCtrl.getInstructorById);
router.post('/instructors', (0, audit_1.logAudit)('CREATE', 'INSTRUCTORS'), instCtrl.createInstructor);
router.put('/instructors/:id', (0, audit_1.logAudit)('UPDATE', 'INSTRUCTORS'), instCtrl.updateInstructor);
router.delete('/instructors/:id', (0, audit_1.logAudit)('DELETE', 'INSTRUCTORS'), instCtrl.deleteInstructor);
// Vehicles & Fleet
router.get('/vehicles', vehCtrl.getVehicles);
router.get('/vehicles/:id', vehCtrl.getVehicleById);
router.post('/vehicles', (0, audit_1.logAudit)('CREATE', 'VEHICLES'), vehCtrl.createVehicle);
router.put('/vehicles/:id', (0, audit_1.logAudit)('UPDATE', 'VEHICLES'), vehCtrl.updateVehicle);
router.delete('/vehicles/:id', (0, audit_1.logAudit)('DELETE', 'VEHICLES'), vehCtrl.deleteVehicle);
router.get('/maintenance', vehCtrl.getMaintenanceLogs);
router.post('/maintenance', (0, audit_1.logAudit)('CREATE', 'MAINTENANCE'), vehCtrl.createMaintenanceLog);
router.get('/fuel', vehCtrl.getFuelLogs);
router.post('/fuel', (0, audit_1.logAudit)('CREATE', 'FUEL'), vehCtrl.createFuelLog);
// Billing, Invoices & Refunds
router.get('/payments', payCtrl.getPayments);
router.post('/payments', (0, audit_1.logAudit)('CREATE', 'PAYMENTS'), payCtrl.recordPayment);
router.get('/invoices', payCtrl.getInvoices);
router.post('/invoices', (0, audit_1.logAudit)('CREATE', 'INVOICES'), payCtrl.createInvoice);
router.get('/refunds', payCtrl.getRefunds);
router.post('/refunds', (0, audit_1.logAudit)('CREATE', 'REFUNDS'), payCtrl.createRefund);
// Complaints & Reviews
router.get('/complaints', compCtrl.getComplaints);
router.post('/complaints', (0, audit_1.logAudit)('CREATE', 'COMPLAINTS'), compCtrl.createComplaint);
router.put('/complaints/:id', (0, audit_1.logAudit)('UPDATE', 'COMPLAINTS'), compCtrl.updateComplaint);
router.post('/complaints/:id/comments', (0, audit_1.logAudit)('COMMENT', 'COMPLAINTS'), compCtrl.addComplaintComment);
router.get('/feedbacks', compCtrl.getFeedbacks);
// Tests & Licences
router.get('/tests', testCtrl.getTests);
router.post('/tests', (0, audit_1.logAudit)('CREATE', 'TESTS'), testCtrl.createTest);
router.get('/licences', testCtrl.getLicences);
router.post('/licences', (0, audit_1.logAudit)('CREATE', 'LICENCES'), testCtrl.createLicenceRecord);
// Used Car Dealership & Buyer Search
router.get('/used-cars', usedCarCtrl.getUsedCarInventory);
router.get('/used-cars/search', usedCarCtrl.searchUsedCars);
router.get('/used-cars/stats', usedCarCtrl.getUsedCarStats);
router.get('/used-cars/:id', usedCarCtrl.getUsedCarById);
router.post('/used-cars', (0, audit_1.logAudit)('CREATE', 'USED_CARS'), usedCarCtrl.createUsedCar);
router.put('/used-cars/:id', (0, audit_1.logAudit)('UPDATE', 'USED_CARS'), usedCarCtrl.updateUsedCar);
router.delete('/used-cars/:id', (0, audit_1.logAudit)('DELETE', 'USED_CARS'), usedCarCtrl.deleteUsedCar);
// Used Car Images
router.get('/used-cars/:id/images', usedCarCtrl.getCarImages);
router.post('/used-cars/:id/images', (0, audit_1.logAudit)('UPLOAD_IMAGE', 'USED_CARS'), usedCarCtrl.uploadCarImage);
router.put('/used-cars/images/:imageId/primary', (0, audit_1.logAudit)('SET_PRIMARY_IMAGE', 'USED_CARS'), usedCarCtrl.setPrimaryCarImage);
router.delete('/used-cars/images/:imageId', (0, audit_1.logAudit)('DELETE_IMAGE', 'USED_CARS'), usedCarCtrl.deleteCarImage);
// Buyer Inquiries & Vehicle Inquiries
router.post('/used-cars/:id/inquiries', (0, audit_1.logAudit)('CREATE_INQUIRY', 'USED_CARS'), usedCarCtrl.createVehicleInquiry);
router.get('/used-car-inquiries', usedCarCtrl.getUsedCarInquiries);
router.get('/buyer-inquiries', usedCarCtrl.getBuyerInquiries);
router.post('/buyer-inquiries', (0, audit_1.logAudit)('CREATE', 'BUYER_INQUIRY'), usedCarCtrl.createBuyerInquiry);
router.delete('/buyer-inquiries/:id', (0, audit_1.logAudit)('DELETE', 'BUYER_INQUIRY'), usedCarCtrl.deleteBuyerInquiry);
router.get('/buyer-inquiries/:id/matching', usedCarCtrl.getMatchingCarsForInquiry);
// Used Car Leads & Test Drives
router.post('/used-cars/:id/expenses', (0, audit_1.logAudit)('CREATE_EXPENSE', 'USED_CARS'), usedCarCtrl.createUsedCarExpense);
router.get('/used-car-leads', usedCarCtrl.getUsedCarLeads);
router.post('/used-car-leads', (0, audit_1.logAudit)('CREATE_LEAD', 'USED_CARS'), usedCarCtrl.createUsedCarLead);
router.get('/test-drives', usedCarCtrl.getTestDrives);
router.post('/test-drives', (0, audit_1.logAudit)('SCHEDULE_TEST_DRIVE', 'USED_CARS'), usedCarCtrl.scheduleTestDrive);
router.get('/used-car-sales', usedCarCtrl.getUsedCarSales);
router.post('/used-car-sales', (0, audit_1.logAudit)('SALE', 'USED_CARS'), usedCarCtrl.recordUsedCarSale);
// Reports & BI Analytics
router.get('/reports', repCtrl.getReports);
router.get('/analytics', repCtrl.getAdvancedAnalytics);
router.get('/ai/insights', aiCtrl.getAiInsights);
// Misc
router.get('/expenses', miscCtrl.getExpenses);
router.post('/expenses', (0, audit_1.logAudit)('CREATE', 'EXPENSES'), miscCtrl.createExpense);
router.get('/employees', miscCtrl.getEmployees);
router.get('/commissions', miscCtrl.getCommissions);
router.get('/campaigns', miscCtrl.getCampaigns);
router.get('/referrals', miscCtrl.getReferrals);
router.get('/renewals', miscCtrl.getRenewals);
router.get('/notifications', miscCtrl.getNotifications);
router.put('/notifications/:id/read', miscCtrl.markNotificationRead);
router.get('/audit-logs', miscCtrl.getAuditLogs);
router.get('/settings', miscCtrl.getSettings);
router.post('/settings', (0, audit_1.logAudit)('UPDATE', 'SETTINGS'), miscCtrl.updateSetting);
exports.default = router;

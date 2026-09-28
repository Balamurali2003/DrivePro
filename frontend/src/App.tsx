import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { CommunicationsPage } from './pages/CommunicationsPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { CoursesPage } from './pages/CoursesPage';
import { EnrollmentsPage } from './pages/EnrollmentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { InstructorsPage } from './pages/InstructorsPage';
import { InstructorDetailPage } from './pages/InstructorDetailPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { FuelPage } from './pages/FuelPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TestsLicencesPage } from './pages/TestsLicencesPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TerritoryMapPage } from './pages/TerritoryMapPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { UsedCarsPage } from './pages/UsedCarsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AttendancePage } from './pages/AttendancePage';

// 6 Core Enhanced & Database-Connected Modules
import { ReferralRewardsPage } from './pages/ReferralRewardsPage';
import { MarketingCampaignsPage } from './pages/MarketingCampaignsPage';
import { LessonsProgressPage } from './pages/LessonsProgressPage';
import { RefundRequestsPage } from './pages/RefundRequestsPage';
import { OperatingExpensesPage } from './pages/OperatingExpensesPage';
import { TestDriveCalendarPage } from './pages/TestDriveCalendarPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="map" element={<TerritoryMapPage />} />
        <Route path="ai-assistant" element={<AiAssistantPage />} />
        
        {/* Leads & Admissions CRM */}
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="communications" element={<CommunicationsPage />} />
        
        {/* Referral Rewards (Supports both /referral-rewards and legacy /referrals) */}
        <Route path="referral-rewards" element={<ReferralRewardsPage />} />
        <Route path="referrals" element={<ReferralRewardsPage />} />

        {/* Marketing Campaigns (Supports both /marketing-campaigns and legacy /campaigns) */}
        <Route path="marketing-campaigns" element={<MarketingCampaignsPage />} />
        <Route path="campaigns" element={<MarketingCampaignsPage />} />

        {/* Student & Training Ops */}
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="calendar" element={<CalendarPage />} />

        {/* Lessons & Progress (Supports both /lessons-progress and legacy /lessons) */}
        <Route path="lessons-progress" element={<LessonsProgressPage />} />
        <Route path="lessons" element={<LessonsProgressPage />} />

        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="instructors/:id" element={<InstructorDetailPage />} />
        <Route path="tests" element={<TestsLicencesPage />} />
        <Route path="licences" element={<TestsLicencesPage />} />

        {/* Fleet & Vehicles */}
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="fuel" element={<FuelPage />} />
        <Route path="renewals" element={<VehiclesPage />} />

        {/* Finance & ERP */}
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="invoices" element={<PaymentsPage />} />

        {/* Refund Requests (Supports both /refund-requests and legacy /refunds) */}
        <Route path="refund-requests" element={<RefundRequestsPage />} />
        <Route path="refunds" element={<RefundRequestsPage />} />

        {/* Operating Expenses (Supports both /operating-expenses and legacy /expenses) */}
        <Route path="operating-expenses" element={<OperatingExpensesPage />} />
        <Route path="expenses" element={<OperatingExpensesPage />} />

        <Route path="commissions" element={<InstructorsPage />} />

        {/* Used Car Dealership */}
        <Route path="used-cars" element={<UsedCarsPage />} />
        <Route path="used-car-leads" element={<UsedCarsPage />} />

        {/* Test Drive Calendar (Supports both /test-drive-calendar and legacy /test-drives) */}
        <Route path="test-drive-calendar" element={<TestDriveCalendarPage />} />
        <Route path="test-drives" element={<TestDriveCalendarPage />} />

        <Route path="used-car-sales" element={<UsedCarsPage />} />

        {/* Customer Support & Quality */}
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="feedback" element={<ComplaintsPage />} />
        <Route path="documents" element={<StudentsPage />} />

        {/* BI Analytics & Management */}
        <Route path="reports" element={<ReportsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="employees" element={<InstructorsPage />} />
        <Route path="roles" element={<SettingsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

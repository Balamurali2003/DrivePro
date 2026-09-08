const API_BASE = '/api';

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('drivepro_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.statusText}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),
  getRoles: () => apiRequest('/auth/roles'),
  getUsers: () => apiRequest('/auth/users'),

  // Dashboard
  getDashboardStats: (params?: Record<string, any>) => apiRequest(`/dashboard/stats${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeadStats: (params?: Record<string, any>) => apiRequest(`/dashboard/leads${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeadAssignmentStats: () => apiRequest('/dashboard/lead-assignment'),
  getStudentStats: (params?: Record<string, any>) => apiRequest(`/dashboard/students${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getClassStats: (params?: Record<string, any>) => apiRequest(`/dashboard/classes${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getPaymentStats: (params?: Record<string, any>) => apiRequest(`/dashboard/payments${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getAttendanceStats: (params?: Record<string, any>) => apiRequest(`/dashboard/attendance${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getFollowupStats: (params?: Record<string, any>) => apiRequest(`/dashboard/followups${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getRtoStats: (params?: Record<string, any>) => apiRequest(`/dashboard/rto${params ? '?' + new URLSearchParams(params).toString() : ''}`),

  // Leads
  getLeads: (params?: Record<string, any>) => apiRequest(`/leads?${new URLSearchParams(params)}`),
  getLeadsMap: (params?: Record<string, any>) => apiRequest(`/leads/map${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getLeadSources: () => apiRequest('/leads/sources'),
  getLeadTerritories: () => apiRequest('/leads/territories'),
  getLeadCampaigns: () => apiRequest('/leads/campaigns'),
  getLeadLocations: () => apiRequest('/leads/locations'),
  getLeadById: (id: string) => apiRequest(`/leads/${id}`),
  createLead: (data: any) => apiRequest('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) => apiRequest(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  patchLead: (id: string, data: any) => apiRequest(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateLeadStatus: (id: string, data: any) => apiRequest(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id: string) => apiRequest(`/leads/${id}`, { method: 'DELETE' }),
  convertLead: (id: string, data: any) => apiRequest(`/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(data) }),
  importLeads: (data: any) => apiRequest('/leads/import', { method: 'POST', body: JSON.stringify(data) }),
  resetLeadsData: () => apiRequest('/leads/reset', { method: 'POST' }),
  getLeadImportHistory: () => apiRequest('/leads/import-history'),
  downloadImportTemplateUrl: '/api/leads/import-template',

  // Attendance & Daily Operations
  getAttendance: (params?: Record<string, any>) => apiRequest(`/attendance${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getAttendanceToday: () => apiRequest('/attendance/today'),
  getAttendanceSummary: (date?: string) => apiRequest(`/attendance/summary${date ? '?date=' + date : ''}`),
  getAttendanceReport: (params?: Record<string, any>) => apiRequest(`/attendance/report${params ? '?' + new URLSearchParams(params).toString() : ''}`),
  getStudentAttendance: (studentId: string) => apiRequest(`/attendance/student/${studentId}`),
  recordAttendance: (data: any) => apiRequest('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  recordBulkAttendance: (data: any) => apiRequest('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  clearAttendance: (data: { date: string; studentIds?: string[] }) => apiRequest('/attendance/clear', { method: 'POST', body: JSON.stringify(data) }),
  updateAttendance: (id: string, data: any) => apiRequest(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAttendance: (id: string) => apiRequest(`/attendance/${id}`, { method: 'DELETE' }),

  // Lead Communications
  getLeadCommunications: (id: string, params?: Record<string, any>) => apiRequest(`/leads/${id}/communications${params ? `?${new URLSearchParams(params)}` : ''}`),
  createLeadCommunication: (id: string, data: any) => apiRequest(`/leads/${id}/communications`, { method: 'POST', body: JSON.stringify(data) }),
  updateLeadCommunication: (id: string, commId: string, data: any) => apiRequest(`/leads/${id}/communications/${commId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLeadCommunication: (id: string, commId: string) => apiRequest(`/leads/${id}/communications/${commId}`, { method: 'DELETE' }),

  // Followups & Communications
  getFollowups: (params?: Record<string, any>) => apiRequest(`/followups?${new URLSearchParams(params)}`),
  createFollowup: (data: any) => apiRequest('/followups', { method: 'POST', body: JSON.stringify(data) }),
  updateFollowup: (id: string, data: any) => apiRequest(`/followups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCommunications: () => apiRequest('/communications'),
  sendCommunication: (data: any) => apiRequest('/communications/send', { method: 'POST', body: JSON.stringify(data) }),

  // Students
  getStudents: (params?: Record<string, any>) => apiRequest(`/students?${new URLSearchParams(params)}`),
  getStudent360: (id: string) => apiRequest(`/students/${id}`),
  createStudent: (data: any) => apiRequest('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => apiRequest(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  patchStudent: (id: string, data: any) => apiRequest(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => apiRequest(`/students/${id}`, { method: 'DELETE' }),

  // Courses & Enrollments
  getCourses: () => apiRequest('/courses'),
  createCourse: (data: any) => apiRequest('/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: any) => apiRequest(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),
  getEnrollments: () => apiRequest('/enrollments'),
  createEnrollment: (data: any) => apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(data) }),

  // Lessons
  getLessons: (params?: Record<string, any>) => apiRequest(`/lessons?${new URLSearchParams(params)}`),
  scheduleLesson: (data: any) => apiRequest('/lessons/schedule', { method: 'POST', body: JSON.stringify(data) }),
  completeLesson: (id: string, data: any) => apiRequest(`/lessons/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  // Instructors
  getInstructors: () => apiRequest('/instructors'),
  getInstructorById: (id: string) => apiRequest(`/instructors/${id}`),
  getSmartAllocations: (params?: Record<string, any>) => apiRequest(`/instructors/recommendations?${new URLSearchParams(params)}`),
  createInstructor: (data: any) => apiRequest('/instructors', { method: 'POST', body: JSON.stringify(data) }),
  updateInstructor: (id: string, data: any) => apiRequest(`/instructors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInstructor: (id: string) => apiRequest(`/instructors/${id}`, { method: 'DELETE' }),

  // Vehicles & Fleet
  getVehicles: (params?: Record<string, any>) => apiRequest(`/vehicles?${new URLSearchParams(params)}`),
  getVehicleById: (id: string) => apiRequest(`/vehicles/${id}`),
  createVehicle: (data: any) => apiRequest('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: string, data: any) => apiRequest(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: string) => apiRequest(`/vehicles/${id}`, { method: 'DELETE' }),
  getMaintenance: () => apiRequest('/maintenance'),
  createMaintenance: (data: any) => apiRequest('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  getFuelLogs: () => apiRequest('/fuel'),
  createFuelLog: (data: any) => apiRequest('/fuel', { method: 'POST', body: JSON.stringify(data) }),

  // Billing
  getPayments: (params?: Record<string, any>) => apiRequest(`/payments?${new URLSearchParams(params)}`),
  recordPayment: (data: any) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getInvoices: () => apiRequest('/invoices'),
  createInvoice: (data: any) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  getRefunds: () => apiRequest('/refunds'),
  createRefund: (data: any) => apiRequest('/refunds', { method: 'POST', body: JSON.stringify(data) }),

  // Complaints & Reviews
  getComplaints: (params?: Record<string, any>) => apiRequest(`/complaints?${new URLSearchParams(params)}`),
  createComplaint: (data: any) => apiRequest('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: string, data: any) => apiRequest(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addComplaintComment: (id: string, data: any) => apiRequest(`/complaints/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  getFeedbacks: () => apiRequest('/feedbacks'),

  // Tests & Licences
  getTests: () => apiRequest('/tests'),
  createTest: (data: any) => apiRequest('/tests', { method: 'POST', body: JSON.stringify(data) }),
  getLicences: () => apiRequest('/licences'),
  createLicence: (data: any) => apiRequest('/licences', { method: 'POST', body: JSON.stringify(data) }),

  // Used Cars
  getUsedCars: (params?: Record<string, any>) => apiRequest(`/used-cars?${new URLSearchParams(params)}`),
  searchUsedCars: (params?: Record<string, any>) => apiRequest(`/used-cars/search?${new URLSearchParams(params)}`),
  getUsedCarStats: () => apiRequest('/used-cars/stats'),
  getUsedCarById: (id: string) => apiRequest(`/used-cars/${id}`),
  createUsedCar: (data: any) => apiRequest('/used-cars', { method: 'POST', body: JSON.stringify(data) }),
  updateUsedCar: (id: string, data: any) => apiRequest(`/used-cars/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUsedCar: (id: string) => apiRequest(`/used-cars/${id}`, { method: 'DELETE' }),

  // Used Car Images
  getCarImages: (id: string) => apiRequest(`/used-cars/${id}/images`),
  uploadCarImage: (id: string, data: any) => apiRequest(`/used-cars/${id}/images`, { method: 'POST', body: JSON.stringify(data) }),
  setPrimaryCarImage: (imageId: string) => apiRequest(`/used-cars/images/${imageId}/primary`, { method: 'PUT' }),
  deleteCarImage: (imageId: string) => apiRequest(`/used-cars/images/${imageId}`, { method: 'DELETE' }),

  // Vehicle Inquiries for Specific Cars
  createVehicleInquiry: (carId: string, data: any) => apiRequest(`/used-cars/${carId}/inquiries`, { method: 'POST', body: JSON.stringify(data) }),
  getUsedCarInquiries: () => apiRequest('/used-car-inquiries'),

  // Buyer Inquiries & Matching (General)
  getBuyerInquiries: () => apiRequest('/buyer-inquiries'),
  createBuyerInquiry: (data: any) => apiRequest('/buyer-inquiries', { method: 'POST', body: JSON.stringify(data) }),
  deleteBuyerInquiry: (id: string) => apiRequest(`/buyer-inquiries/${id}`, { method: 'DELETE' }),
  getMatchingCarsForInquiry: (id: string) => apiRequest(`/buyer-inquiries/${id}/matching`),

  // Used Car Leads & Test Drives
  createUsedCarExpense: (carId: string, data: any) => apiRequest(`/used-cars/${carId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  getUsedCarLeads: () => apiRequest('/used-car-leads'),
  createUsedCarLead: (data: any) => apiRequest('/used-car-leads', { method: 'POST', body: JSON.stringify(data) }),
  getTestDrives: () => apiRequest('/test-drives'),
  scheduleTestDrive: (data: any) => apiRequest('/test-drives', { method: 'POST', body: JSON.stringify(data) }),
  getUsedCarSales: () => apiRequest('/used-car-sales'),
  recordUsedCarSale: (data: any) => apiRequest('/used-car-sales', { method: 'POST', body: JSON.stringify(data) }),

  // Reports, Analytics & AI
  getReports: () => apiRequest('/reports'),
  getAnalytics: () => apiRequest('/analytics'),
  getAiInsights: () => apiRequest('/ai/insights'),

  // Misc
  getExpenses: () => apiRequest('/expenses'),
  createExpense: (data: any) => apiRequest('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  getEmployees: () => apiRequest('/employees'),
  getCommissions: () => apiRequest('/commissions'),
  getCampaigns: () => apiRequest('/campaigns'),
  getReferrals: () => apiRequest('/referrals'),
  getRenewals: () => apiRequest('/renewals'),
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  getAuditLogs: () => apiRequest('/audit-logs'),
  getSettings: () => apiRequest('/settings'),
  updateSetting: (data: any) => apiRequest('/settings', { method: 'POST', body: JSON.stringify(data) }),
};

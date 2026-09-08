export type Role =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'SALES_EXECUTIVE'
  | 'INSTRUCTOR'
  | 'ACCOUNTANT'
  | 'MECHANIC'
  | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  instructorProfile?: any;
  studentProfile?: any;
  employeeProfile?: any;
}

export interface LeadCommunication {
  id: string;
  communicationCode: string;
  leadId: string;
  communicationType: string;
  direction: 'Outgoing' | 'Incoming';
  speakingWithType?: string;
  speakingWithName?: string;
  subject?: string;
  notes: string;
  communicationDate: string;
  communicationTime?: string;
  nextFollowupDate?: string;
  nextFollowupTime?: string;
  staffMember: string;
  createdBy?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  leadCode: string;
  leadSequence?: number;
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  gender?: string;
  age?: number;
  address?: string;
  area?: string;
  preferredLanguage?: string;
  licenceType?: string;
  courseInterested?: string;
  packageInterested?: string;
  trainingRequirement: 'Licence Only' | 'Driving Only' | 'Both Licence + Driving';
  classPreference: 'Weekend Class' | 'Weekdays Class';
  transmission: 'MANUAL' | 'AUTOMATIC' | 'BOTH';
  preferredTiming?: string;
  preferredInstructorGender?: string;
  preferredLocation?: string;
  budget?: number;
  expectedJoiningDate?: string;
  leadSource: string;
  campaign?: string;
  leadCampaign?: string;
  dataSources?: string;
  location?: string;
  originalLocation?: string;
  normalizedLocation?: string;
  latitude?: number;
  longitude?: number;
  batch?: string;
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string;
  priorityScore?: number;
  priorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  priorityReasons?: string;
  priorityUpdatedAt?: string;
  currentLocation?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  locationHistory?: Array<{
    id: string;
    oldLocation?: string;
    newLocation?: string;
    oldLatitude?: number;
    oldLongitude?: number;
    newLatitude?: number;
    newLongitude?: number;
    changedBy?: string;
    changedAt: string;
  }>;
  status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'TRIAL_SCHEDULED' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' | 'Call - Not Attended' | 'Contacted - Not Interested' | 'Contacted - Interested (Need Time)' | 'Today Come to Join' | 'Expected Today' | string;
  aiScore: number;
  aiRecommendation?: string;
  notes?: string;
  lastCommunicationAt?: string;
  nextFollowUpAt?: string;
  expectedJoinDate?: string;
  notInterestedReason?: string;
  createdAt: string;
  updatedAt: string;
  followups?: any[];
  communications?: LeadCommunication[];
  activities?: any[];
  _count?: { communications?: number; followups?: number };
}

export interface AttendanceRecord {
  id: string;
  attendanceCode?: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  phone: string;
  course: string;
  batch: string;
  instructorId?: string;
  instructorName: string;
  vehicleId?: string;
  vehicleInfo: string;
  classId?: string;
  classTime: string;
  date: string;
  dateString: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Late' | 'Not Marked' | string;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  markedBy?: string;
  isMarked?: boolean;
}

export interface AttendanceSummary {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  leaveToday: number;
  lateToday: number;
  notMarkedToday: number;
  markedTotal: number;
  attendancePercentage: number;
  todaysClasses: number;
}

export interface Student {
  id: string;
  studentCode: string;
  leadId?: string;
  fullName: string;
  photo?: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  gender: string;
  age?: number;
  dob?: string;
  bloodGroup?: string;
  address?: string;
  area: string;
  location?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  assignedInstructorId?: string;
  assignedInstructor?: { id: string; fullName: string; rating: number; phone: string };
  assignedVehicleId?: string;
  assignedVehicle?: { id: string; registrationNumber: string; model: string; transmission: string };
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  progressPercentage: number;
  batch?: string;
  licenseStatus?: string;
  vehicleType?: string;
  courseJoined?: string;
  trainingRequirement?: string;
  classPreference?: string;
  joiningDate?: string;
  totalFees?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentDate?: string;
  paymentMode?: string;
  receiptNumber?: string;
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED' | 'INACTIVE' | 'CANCELLED' | string;
  createdAt: string;
  enrollments?: any[];
  _count?: { attendanceHistory?: number; payments?: number };
  attendanceHistory?: Array<{ id: string; classDate: string; dateString: string; status: string }>;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  courseType: string;
  transmission: 'MANUAL' | 'AUTOMATIC' | 'BOTH';
  price: number;
  discount: number;
  taxRate: number;
  totalFee: number;
  numberOfLessons: number;
  validityDays: number;
  description?: string;
  status: string;
}

export interface Instructor {
  id: string;
  instructorCode: string;
  fullName: string;
  photo?: string;
  phone: string;
  email?: string;
  gender: string;
  address?: string;
  area: string;
  experienceYears: number;
  drivingLicence: string;
  licenceExpiry: string;
  specializations: string;
  languages: string;
  baseSalary: number;
  commissionPerLesson: number;
  rating: number;
  totalReviews: number;
  status: 'AVAILABLE' | 'ON_LEAVE' | 'INACTIVE';
  assignedVehicles?: any[];
  _count?: { assignedStudents: number; lessons: number };
}

export interface Vehicle {
  id: string;
  vehicleCode: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  transmission: 'MANUAL' | 'AUTOMATIC';
  color: string;
  currentKm: number;
  fuelEfficiency: number;
  insuranceExpiry?: string;
  pucExpiry?: string;
  fitnessExpiry?: string;
  lastServiceKm?: number;
  nextServiceKm?: number;
  assignedInstructorId?: string;
  assignedInstructor?: { id: string; fullName: string };
  status: 'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

export interface Lesson {
  id: string;
  lessonCode: string;
  studentId: string;
  student: Student;
  instructorId: string;
  instructor: Instructor;
  vehicleId: string;
  vehicle: Vehicle;
  lessonNumber: number;
  lessonDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  lessonType: 'PRACTICAL' | 'THEORY' | 'SIMULATOR' | 'TEST_PREP';
  pickupLocation?: string;
  dropLocation?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'NO_SHOW';
  attendance?: any;
  progress?: any;
}

export interface UsedCarImage {
  id: string;
  usedCarId: string;
  imageUrl: string;
  imageType: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface UsedCar {
  id: string;
  carCode: string;
  registrationNumber: string;
  make: string;
  brand?: string;
  model: string;
  variant?: string;
  year: number;
  manufacturingYear?: number;
  registrationYear?: number;
  odometerKm: number;
  kilometers?: number;
  fuelType: string;
  transmission: string;
  color: string;
  ownersCount: number;
  owners?: number;
  conditionScore?: number;
  purchasePrice: number;
  expectedSalePrice: number;
  expectedSellingPrice?: number;
  sellingPrice?: number;
  minimumPrice: number;
  status: 'AVAILABLE' | 'RESERVED' | 'UNDER_NEGOTIATION' | 'SOLD' | 'INACTIVE' | string;
  primaryImage?: string;
  location?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerAddress?: string;
  carCondition?: string;
  condition?: string;
  description?: string;
  notes?: string;
  images?: UsedCarImage[];
  inquiries?: UsedCarBuyerInquiry[];
  expenses?: any[];
  sale?: any;
  leads?: any[];
  testDrives?: any[];
  profitAnalysis?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsedCarBuyerInquiry {
  id: string;
  inquiryCode: string;
  usedCarId?: string;
  usedCar?: {
    id: string;
    make: string;
    model: string;
    variant?: string;
    year: number;
    registrationNumber: string;
    expectedSalePrice: number;
    primaryImage?: string;
    status: string;
  };
  vehicleModel?: string;
  vehiclePrice?: number;
  buyerName: string;
  phone: string;
  email?: string;
  contactMethod: string;
  message?: string;
  status: string;
  createdAt: string;
}

export interface UsedCarStats {
  totalCars: number;
  availableCars: number;
  reservedCars: number;
  soldCars: number;
  totalListings: number;
  totalBuyerInquiries: number;
  recentListings: UsedCar[];
  recentInquiries: UsedCarBuyerInquiry[];
  recentlySold: UsedCar[];
}

export interface BuyerInquiry {
  id: string;
  inquiryCode: string;
  buyerName: string;
  phone: string;
  email?: string;
  minBudget: number;
  maxBudget: number;
  preferredBrand?: string;
  preferredModel?: string;
  preferredYear?: number;
  fuelType?: string;
  transmission?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface LeadImportHistory {
  id: string;
  fileName: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  importedBy: string;
  importedAt: string;
}

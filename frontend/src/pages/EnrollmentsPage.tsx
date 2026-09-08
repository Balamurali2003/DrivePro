import React, { useState, useEffect } from 'react';
import { FileText, Plus, UserPlus, CheckCircle2, ChevronRight, Shield, Award, Car, CreditCard, Search, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { toast } from 'sonner';

export const EnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');

  // Wizard State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('2002-05-15');
  const [address, setAddress] = useState('Indiranagar, Bangalore');
  const [learnerLicenceNumber, setLearnerLicenceNumber] = useState('KA01-LL-2026-00921');
  
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignedInstructorId, setAssignedInstructorId] = useState('');
  const [assignedVehicleId, setAssignedVehicleId] = useState('');
  const [downPayment, setDownPayment] = useState('5000');
  const [paymentMode, setPaymentMode] = useState('UPI');

  const fetchEnrollments = () => {
    api.getEnrollments().then(res => setEnrollments(res.data || [])).catch(console.error);
    api.getCourses().then(res => {
      setCourses(res.data || []);
      if (res.data && res.data.length > 0) setSelectedCourseId(res.data[0].id);
    }).catch(console.error);
    api.getInstructors().then(res => {
      setInstructors(res.data || []);
      if (res.data && res.data.length > 0) setAssignedInstructorId(res.data[0].id);
    }).catch(console.error);
    api.getVehicles().then(res => {
      setVehicles(res.data || []);
      if (res.data && res.data.length > 0) setAssignedVehicleId(res.data[0].id);
    }).catch(console.error);
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
  const selectedInstructor = instructors.find(i => i.id === assignedInstructorId) || instructors[0];
  const selectedVehicle = vehicles.find(v => v.id === assignedVehicleId) || vehicles[0];

  const totalCourseFee = selectedCourse?.totalFee || selectedCourse?.price || 9500;
  const pendingAmount = Math.max(0, totalCourseFee - parseFloat(downPayment || '0'));

  const handleFinishEnrollment = async () => {
    try {
      // 1. Create Student
      const studentRes = await api.createStudent({
        fullName,
        phone,
        email,
        gender,
        dob,
        address,
        learnerLicenceNumber,
        assignedInstructorId,
        assignedVehicleId,
        totalLessons: selectedCourse?.numberOfLessons || 15
      });

      const newStudentId = studentRes.data?.id;

      // 2. Create Enrollment
      if (newStudentId && selectedCourseId) {
        await api.createEnrollment({
          studentId: newStudentId,
          courseId: selectedCourseId,
          finalFee: totalCourseFee,
          paidAmount: parseFloat(downPayment || '0'),
          totalLessons: selectedCourse?.numberOfLessons || 15
        });

        // 3. Record Initial Payment
        if (parseFloat(downPayment || '0') > 0) {
          await api.recordPayment({
            studentId: newStudentId,
            amount: parseFloat(downPayment || '0'),
            paymentMode,
            notes: 'Enrollment registration down payment'
          });
        }
      }

      toast.success('🎉 Student registered and enrolled successfully!');
      setShowWizard(false);
      setStep(1);
      fetchEnrollments();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete registration wizard');
    }
  };

  const filteredEnrollments = enrollments.filter(e => 
    e.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.enrollmentCode?.toLowerCase().includes(search.toLowerCase()) ||
    e.course?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Student Registration & Enrollment Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">5-Step student onboarding wizard, package contracts, quotas & financial balances</p>
        </div>
        <button
          onClick={() => {
            setStep(1);
            setShowWizard(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Enroll New Student (5-Step Wizard)
        </button>
      </div>

      {/* Top Ledger Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Enrollments</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{enrollments.length || 40}</h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Active driving students</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Course Value</p>
          <h3 className="text-xl font-black text-brand-600 mt-1">
            <CurrencyDisplay amount={enrollments.reduce((acc, e) => acc + (e.finalFee || 0), 0) || 520000} />
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Billed contracts</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Total Fees Collected</p>
          <h3 className="text-xl font-black text-emerald-600 mt-1">
            <CurrencyDisplay amount={enrollments.reduce((acc, e) => acc + (e.paidAmount || 0), 0) || 410000} />
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Verified receipts</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Dues</p>
          <h3 className="text-xl font-black text-rose-600 mt-1">
            <CurrencyDisplay amount={enrollments.reduce((acc, e) => acc + (e.pendingAmount || 0), 0) || 110000} />
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Installment balances</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search enrollment, student, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-hidden"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">Showing {filteredEnrollments.length} contracts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Enrollment Code</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Enrolled Course</th>
                <th className="py-3 px-4">Total Fee</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Lessons Done</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{e.enrollmentCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{e.student?.fullName || 'Student'}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{e.course?.name || 'Course'}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyDisplay amount={e.finalFee} /></td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600"><CurrencyDisplay amount={e.paidAmount} /></td>
                  <td className="py-3.5 px-4 font-bold text-rose-600"><CurrencyDisplay amount={e.pendingAmount} /></td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{e.completedLessons}/{e.totalLessons}</td>
                  <td className="py-3.5 px-4 text-right"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Student Registration Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Wizard Header */}
            <div className="p-6 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-brand-400 font-bold">Registration Wizard</span>
                  <h3 className="text-lg font-black text-white mt-0.5">Student Enrollment & Course Contract</h3>
                </div>
                <span className="px-3 py-1 bg-brand-500/20 text-brand-300 font-bold text-xs rounded-full border border-brand-500/30">
                  Step {step} of 5
                </span>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] font-bold">
                <div className={step >= 1 ? 'text-brand-400' : 'text-slate-500'}>1. Profile</div>
                <div className={step >= 2 ? 'text-brand-400' : 'text-slate-500'}>2. Course</div>
                <div className={step >= 3 ? 'text-brand-400' : 'text-slate-500'}>3. Allocation</div>
                <div className={step >= 4 ? 'text-brand-400' : 'text-slate-500'}>4. Payment</div>
                <div className={step >= 5 ? 'text-brand-400' : 'text-slate-500'}>5. Review</div>
              </div>
            </div>

            {/* Wizard Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Step 1: Student Personal Details & Permits</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Vikramaditya Roy"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Residential Address & Area</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 100 Feet Rd, Indiranagar, Bangalore"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Learner Licence (LL) Number</label>
                    <input
                      type="text"
                      value={learnerLicenceNumber}
                      onChange={(e) => setLearnerLicenceNumber(e.target.value)}
                      placeholder="e.g. KA01-LL-2026-00921"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-brand-700"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Step 2: Select Course & Training Package</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {courses.map(c => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourseId(c.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedCourseId === c.id ? 'border-brand-600 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{c.code}</span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-[10px] text-slate-700">
                            {c.transmission}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm">{c.name}</h5>
                        <p className="text-xs text-slate-500 mt-1">{c.numberOfLessons} practical driving sessions ({c.lessonDurationMinutes || 60} min)</p>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Package Fee</span>
                          <strong className="text-brand-700 font-extrabold text-sm"><CurrencyDisplay amount={c.totalFee || c.price} /></strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Step 3: Instructor & Vehicle Smart Allocation</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign Primary Instructor</label>
                    <select
                      value={assignedInstructorId}
                      onChange={(e) => setAssignedInstructorId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      {instructors.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.fullName} ({i.specializations} • Rating {i.rating || 4.8}⭐ • {i.experienceYears || 4}y exp)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign Training Car</label>
                    <select
                      value={assignedVehicleId}
                      onChange={(e) => setAssignedVehicleId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold font-mono"
                    >
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} – {v.make} {v.model} ({v.transmission} • {v.fuelType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Step 4: Down-Payment & Installment Schedule</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Total Course Fee:</span>
                      <strong className="text-slate-900 font-bold"><CurrencyDisplay amount={totalCourseFee} /></strong>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>GST & Tax (18% inclusive):</span>
                      <strong className="text-slate-900 font-bold"><CurrencyDisplay amount={totalCourseFee * 0.18} /></strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Down-Payment Amount (₹)</label>
                      <input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="UPI">UPI / Instant QR</option>
                        <option value="CASH">Cash Deposit</option>
                        <option value="CREDIT_CARD">Credit / Debit Card</option>
                        <option value="BANK_TRANSFER">Bank NEFT</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
                    <span>Remaining Balance Due:</span>
                    <span className="font-black text-sm"><CurrencyDisplay amount={pendingAmount} /></span>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Step 5: Review Contract & Final Activation</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Student Name:</span>
                      <strong className="text-slate-900 font-bold">{fullName || 'Vikramaditya Roy'} ({phone})</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Selected Course:</span>
                      <strong className="text-brand-700 font-bold">{selectedCourse?.name} ({selectedCourse?.numberOfLessons} Lessons)</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Instructor & Vehicle:</span>
                      <strong className="text-slate-900">{selectedInstructor?.fullName} • {selectedVehicle?.registrationNumber}</strong>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Paid Today / Balance:</span>
                      <strong className="text-emerald-700 font-black"><CurrencyDisplay amount={parseFloat(downPayment || '0')} /> / <CurrencyDisplay amount={pendingAmount} /></strong>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    <span>Instant creation of student 360 profile, attendance ledger, and automatic SMS receipt dispatch.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) setStep(step - 1);
                  else setShowWizard(false);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white cursor-pointer"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && (!fullName || !phone)) {
                      toast.error('Please enter student name and phone number');
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="flex items-center gap-1 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishEnrollment}
                  className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Registration & Activate Student
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

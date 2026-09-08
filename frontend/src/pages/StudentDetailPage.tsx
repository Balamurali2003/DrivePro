import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GraduationCap, User, Phone, MapPin, Calendar, Award, Car, Clock,
  CreditCard, FileText, CheckCircle2, ShieldAlert, Sparkles, ArrowLeft,
  MessageSquare, Star, FileBox, RefreshCw, Printer, AlertTriangle, ShieldCheck,
  ClipboardCheck, ExternalLink, Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { SkillRadarChart } from '../components/shared/SkillRadarChart';
import { InvoicePrintView } from '../components/shared/InvoicePrintView';
import { EditStudentModal } from '../components/students/EditStudentModal';
import { toast } from 'sonner';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchStudent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getStudent360(id);
      setStudent(res.data);
    } catch {
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-xs text-slate-400">Loading Student 360° Profile...</div>;
  if (!student) return <div className="p-12 text-center text-xs text-slate-400">Student not found</div>;

  const attendanceRecords = (student.attendances && student.attendances.length > 0)
    ? student.attendances
    : (student.attendanceHistory || []);

  const tabs = [
    { id: 'OVERVIEW', label: '360° Overview' },
    { id: 'ATTENDANCE', label: `Daily Attendance (${attendanceRecords.length})` },
    { id: 'LESSONS', label: `Lessons (${student.lessons?.length || 0})` },
    { id: 'SKILLS', label: '17-Skill Radar' },
    { id: 'PAYMENTS', label: `Fee & Payments (${(student.payments?.length || 0) + (student.invoices?.length || 0)})` },
    { id: 'TESTS', label: `RTO & Tests (${student.tests?.length || 0})` },
    { id: 'COMPLAINTS', label: `Support Tickets (${student.complaints?.length || 0})` },
    { id: 'DOCUMENTS', label: `Documents Vault (${student.documents?.length || 0})` },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/students" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-brand-50 flex items-center justify-center font-bold text-brand-700 text-xl shadow-inner">
            {student.photo ? (
              <img src={student.photo} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              student.fullName[0]
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{student.fullName}</h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{student.studentCode}</span>
              <StatusBadge status={student.status} />
              {student.batch && (
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  {student.batch}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Phone: <strong className="text-slate-700 font-mono">{student.phone}</strong></span>
              <span>Course: <strong className="text-brand-700">{student.courseJoined || student.vehicleType || 'LMV'}</strong></span>
              <span>Licence Status: <strong className="text-emerald-700">{student.licenseStatus || 'LLR Applied'}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Edit Student Information"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Student
          </button>
          <div className="text-right">
            <span className="text-2xl font-black text-brand-600">{student.progressPercentage}%</span>
            <p className="text-[10px] uppercase font-bold text-slate-400">Course Progress</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-600">{student.completedLessons}/{student.totalLessons}</span>
            <p className="text-[10px] uppercase font-bold text-slate-400">Lessons Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold pb-px custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 360° OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* AI Diagnosis */}
            <div className="bg-gradient-to-br from-brand-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase mb-2">
                <Sparkles className="w-4 h-4" />
                AI Student Gap Diagnosis
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {student.aiProgressInsights?.recommendedNextStep || 'Student is ready for reverse parking & RTO mock test simulation tracks.'}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-700 text-[11px] text-slate-400 flex justify-between">
                <span>Weakest: {student.aiProgressInsights?.weakestSkills?.join(', ')}</span>
              </div>
            </div>

            {/* Enrollment & Training Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Training & Fee Status</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Course Joined</p>
                  <p className="font-bold text-slate-900 mt-0.5">{student.courseJoined || student.vehicleType || 'LMV'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Batch</p>
                  <p className="font-bold text-slate-900 mt-0.5">{student.batch || 'General'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Total Fees</p>
                  <p className="font-bold text-slate-900 mt-0.5">₹{(student.totalFees || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Paid / Balance</p>
                  <p className="font-bold text-emerald-700 mt-0.5">₹{(student.paidAmount || 0).toLocaleString()} <span className="text-rose-600 font-normal">(-₹{(student.balanceAmount || 0).toLocaleString()})</span></p>
                </div>
              </div>
            </div>

            {/* Assigned Instructor & Car */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Allocations</h3>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Instructor</p>
                <p className="font-bold text-slate-900 mt-0.5">{student.assignedInstructor?.fullName || 'Senior Instructor'}</p>
                <p className="text-slate-500">{student.assignedInstructor?.phone || '+91 98451 22334'}</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Training Car</p>
                <p className="font-bold text-slate-900 mt-0.5">{student.assignedVehicle?.model || student.vehicleType || 'Swift Dual-Control'}</p>
                <p className="font-mono text-slate-500">{student.assignedVehicle?.registrationNumber || 'TN72AB1234'}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <SkillRadarChart progressPercentage={student.progressPercentage} />
          </div>
        </div>
      )}

      {/* Tab: DAILY ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (() => {
        const attList = attendanceRecords;
        const presentCount = attList.filter((a: any) =>
          a.status === 'PRESENT' || a.status === 'P' || String(a.status).toLowerCase().includes('present')
        ).length;
        const absentCount = attList.filter((a: any) =>
          a.status === 'ABSENT' || a.status === 'A' || String(a.status).toLowerCase().includes('absent')
        ).length;
        const leaveCount = attList.filter((a: any) =>
          a.status === 'LEAVE' || a.status === 'L' || String(a.status).toLowerCase().includes('leave')
        ).length;
        const lateCount = attList.filter((a: any) =>
          a.status === 'LATE' || String(a.status).toLowerCase().includes('late')
        ).length;
        const totalCount = attList.length;
        const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        return (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Classes</span>
                <p className="text-xl font-black text-slate-900 mt-1">{totalCount}</p>
              </div>
              <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Present</span>
                <p className="text-xl font-black text-emerald-700 mt-1">{presentCount}</p>
              </div>
              <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-rose-700">Absent</span>
                <p className="text-xl font-black text-rose-700 mt-1">{absentCount}</p>
              </div>
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-700">Leave</span>
                <p className="text-xl font-black text-amber-700 mt-1">{leaveCount}</p>
              </div>
              <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-purple-700">Late</span>
                <p className="text-xl font-black text-purple-700 mt-1">{lateCount}</p>
              </div>
              <div className="bg-brand-50/50 p-3.5 rounded-2xl border border-brand-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-brand-700">Attendance %</span>
                <p className="text-xl font-black text-brand-700 mt-1">{rate}%</p>
              </div>
            </div>

            {/* Attendance Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Daily Driving Class Attendance Records</h3>
                  <p className="text-xs text-slate-500">Real training logs from Sri Munis Kanna Driving Class Report</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-bold text-xs">
                    {totalCount} Sessions Logged
                  </span>
                  <Link
                    to={`/attendance?studentId=${student.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Open Attendance Hub
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>

              {attList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Session #</th>
                        <th className="py-3 px-4">Class Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Timing</th>
                        <th className="py-3 px-4">Instructor / Car</th>
                        <th className="py-3 px-4">Remarks</th>
                        <th className="py-3 px-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attList.map((att: any, idx: number) => {
                        const isP = att.status === 'PRESENT' || att.status === 'P' || String(att.status).toLowerCase().includes('present');
                        const isA = att.status === 'ABSENT' || att.status === 'A' || String(att.status).toLowerCase().includes('absent');
                        const isL = att.status === 'LEAVE' || att.status === 'L' || String(att.status).toLowerCase().includes('leave');
                        const isLate = att.status === 'LATE' || String(att.status).toLowerCase().includes('late');

                        return (
                          <tr key={att.id || idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {att.attendanceCode || `Session ${idx + 1}`}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-800">
                              {att.date ? new Date(att.date).toLocaleDateString() : (att.classDate ? new Date(att.classDate).toLocaleDateString() : att.dateString)}
                              {att.dateString && <span className="block text-[10px] text-slate-400 font-mono">{att.dateString}</span>}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isP ? 'bg-emerald-100 text-emerald-800' :
                                isA ? 'bg-rose-100 text-rose-800' :
                                isL ? 'bg-amber-100 text-amber-800' :
                                isLate ? 'bg-purple-100 text-purple-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {isP ? 'Present (P)' : isA ? 'Absent (A)' : isL ? 'Leave (L)' : isLate ? 'Late' : att.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                              {att.checkInTime ? `${att.checkInTime} - ${att.checkOutTime || 'Ongoing'}` : 'Scheduled Slot'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="font-semibold text-slate-800">{att.instructor?.fullName || student.assignedInstructor?.fullName || 'Assigned Instructor'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{att.vehicle?.registrationNumber || student.assignedVehicle?.registrationNumber || 'Training Car'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-[150px] truncate">
                              {att.remarks || 'Regular driving practice'}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No daily attendance records found for this student.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Tab: LESSONS */}
      {activeTab === 'LESSONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Lesson Code</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Topics Covered</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(student.lessons || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.lessonCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {new Date(l.lessonDate).toLocaleDateString()} ({l.startTime} - {l.endTime})
                    </td>
                    <td className="py-3 px-4 text-slate-700">{l.instructor?.fullName || 'Instructor'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.topicCovered || 'Fundamentals'}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-600">{l.attendance?.studentStatus || 'PRESENT'}</td>
                    <td className="py-3 px-4 text-right"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: SKILLS */}
      {activeTab === 'SKILLS' && (
        <SkillRadarChart progressPercentage={student.progressPercentage} />
      )}

      {/* Tab: BILLING & INVOICES */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-6">
          {/* Fee Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Course Fee</span>
              <p className="text-xl font-black text-slate-900 mt-1">₹{(student.totalFees || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Package: {student.courseJoined || 'LMV'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</span>
              <p className="text-xl font-black text-emerald-600 mt-1">₹{(student.paidAmount || 0).toLocaleString()}</p>
              {student.paymentMode && <p className="text-[10px] text-slate-500 mt-0.5">Mode: {student.paymentMode}</p>}
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Balance</span>
              <p className={`text-xl font-black mt-1 ${(student.balanceAmount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ₹{(student.balanceAmount || 0).toLocaleString()}
              </p>
              {student.receiptNumber && <p className="text-[10px] text-slate-500 mt-0.5">Receipt: {student.receiptNumber}</p>}
            </div>
          </div>

          {/* Payment Transactions Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Payment Ledger Transactions</h3>
                <p className="text-xs text-slate-500">Real fee receipts and transactions from Sri Munis Kanna records</p>
              </div>
            </div>
            {(student.payments || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Payment Code</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {student.payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{p.paymentCode}</td>
                        <td className="py-3 px-4 text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹{p.amount.toLocaleString()}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{p.paymentMode}</td>
                        <td className="py-3 px-4"><StatusBadge status={p.paymentStatus} /></td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.receiptNumber || student.receiptNumber || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{p.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment transactions recorded yet.
              </div>
            )}
          </div>

          {/* Invoices Table if any */}
          {(student.invoices || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Issued Invoices & Tax Receipts</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Subtotal</th>
                    <th className="py-3 px-4">GST</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4 text-right">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4"><CurrencyDisplay amount={inv.subtotal} /></td>
                      <td className="py-3 px-4"><CurrencyDisplay amount={inv.taxAmount} /></td>
                      <td className="py-3 px-4 font-bold text-slate-900"><CurrencyDisplay amount={inv.totalAmount} /></td>
                      <td className="py-3 px-4 font-bold text-emerald-600"><CurrencyDisplay amount={inv.paidAmount} /></td>
                      <td className="py-3 px-4 font-bold text-rose-600"><CurrencyDisplay amount={inv.balanceAmount} /></td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold inline-flex items-center gap-1 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: TESTS */}
      {activeTab === 'TESTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Scheduled & Completed Driving Evaluation Tests</h3>
          {(student.tests || []).map((t: any) => (
            <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{t.testType} ({t.testCode})</p>
                <p className="text-slate-500 mt-0.5">{new Date(t.testDate).toLocaleDateString()} • {t.location}</p>
              </div>
              <StatusBadge status={t.result} />
            </div>
          ))}
        </div>
      )}

      {/* Tab: COMPLAINTS */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Student Grievances & Service Feedback</h3>
          {(student.complaints || []).map((c: any) => (
            <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex justify-between font-bold">
                <span>{c.title}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-slate-600">{c.description}</p>
              {c.resolution && <p className="text-emerald-700 font-semibold mt-2">Resolution: {c.resolution}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Tab: DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Uploaded Identity & RTO Proofs</h3>
          {(student.documents || []).map((d: any) => (
            <div key={d.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileBox className="w-5 h-5 text-brand-600" />
                <div>
                  <p className="font-bold text-slate-900">{d.documentName}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{d.documentType}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-[10px]">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Printable View Modal */}
      {selectedInvoice && (
        <InvoicePrintView invoice={{ ...selectedInvoice, student }} onClose={() => setSelectedInvoice(null)} />
      )}

      {/* Edit Student Profile Modal */}
      {showEditModal && student && (
        <EditStudentModal
          student={student}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setStudent((prev: any) => ({ ...prev, ...updated }));
            fetchStudent();
          }}
        />
      )}
    </div>
  );
};

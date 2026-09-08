import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  UserCheck, Calendar, Clock, Search, CheckCircle2, XCircle, AlertCircle,
  Clock3, Users, ChevronLeft, ChevronRight, RefreshCw, Eye,
  Car, User, Phone, LogIn, LogOut, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { AttendanceRecord, AttendanceSummary } from '../types';
import { toast } from 'sonner';

/**
 * Format date string to DD/MM/YYYY
 */
function formatDateDDMMYYYY(dateStrOrObj?: string | Date | null): string {
  if (!dateStrOrObj) return '-';
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return String(dateStrOrObj);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format current time to 12-hour AM/PM string (e.g. 09:15 AM)
 */
function formatCurrentTime12h(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export const AttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  // Default selected date = TODAY
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active view tab: 'DAILY' | 'REPORT' | 'CALENDAR'
  const [activeTab, setActiveTab] = useState<'DAILY' | 'REPORT' | 'CALENDAR'>('DAILY');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);

  // Data states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalStudents: 0,
    totalEnrolled: 0,
    presentToday: 0,
    absentToday: 0,
    leaveToday: 0,
    lateToday: 0,
    notMarkedToday: 0,
    markedTotal: 0,
    attendancePercentage: 0,
    todaysClasses: 0
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('ALL');

  // Metadata dropdowns
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);

  // Attendance Report state
  const [reportStartDate, setReportStartDate] = useState<string>(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState<string>(todayStr);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);

  // Calendar View state
  const [selectedCalendarStudent, setSelectedCalendarStudent] = useState<string>(initialStudentId || '');
  const [studentCalendarData, setStudentCalendarData] = useState<any | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);

  // Load instructors and vehicles on mount
  useEffect(() => {
    Promise.all([
      api.getInstructors().catch(() => ({ data: [] })),
      api.getVehicles().catch(() => ({ data: [] }))
    ]).then(([instRes, vehRes]) => {
      if (instRes?.data) setInstructorsList(instRes.data);
      if (vehRes?.data) setVehiclesList(vehRes.data);
    });
  }, []);

  // Fetch summary separately or alongside attendance
  const loadSummary = async (dateToFetch: string = selectedDate) => {
    try {
      const sumRes = await api.getAttendanceSummary(dateToFetch);
      if (sumRes?.data) {
        setSummary(sumRes.data);
      }
    } catch {}
  };

  // Fetch daily attendance records & summary whenever selectedDate changes
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [recRes, sumRes] = await Promise.all([
        api.getAttendance({
          date: selectedDate
        }),
        api.getAttendanceSummary(selectedDate)
      ]);

      if (recRes?.data) setRecords(recRes.data);
      if (sumRes?.data) setSummary(sumRes.data);
    } catch (err: any) {
      toast.error('Failed to load attendance data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Handle Date Navigation
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Available filters options derived from current records
  const availableBatches = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.batch) set.add(r.batch); });
    return Array.from(set);
  }, [records]);

  const availableCourses = useMemo(() => {
    const set = new Set<string>();
    records.forEach(r => { if (r.course) set.add(r.course); });
    return Array.from(set);
  }, [records]);

  // Client-side filtering for fast instant responsiveness
  const displayRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Search Query (Name, ID, Mobile)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesCode = r.studentCode.toLowerCase().includes(q);
        const matchesPhone = r.phone.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesPhone) return false;
      }

      // 2. Batch filter
      if (selectedBatch !== 'ALL' && r.batch !== selectedBatch) {
        return false;
      }

      // 3. Course filter
      if (selectedCourse !== 'ALL' && r.course !== selectedCourse) {
        return false;
      }

      // 4. Instructor filter
      if (selectedInstructor !== 'ALL' && r.instructorId !== selectedInstructor) {
        return false;
      }

      // 5. Vehicle filter
      if (selectedVehicle !== 'ALL' && r.vehicleId !== selectedVehicle) {
        return false;
      }

      // 6. Status filter
      if (selectedStatus !== 'ALL') {
        const target = selectedStatus.toLowerCase();
        if (r.status.toLowerCase() !== target) return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedBatch, selectedCourse, selectedInstructor, selectedVehicle, selectedStatus]);

  // Attendance Status Change (Instant database persistence)
  const handleStatusChange = async (record: AttendanceRecord, newStatus: string) => {
    try {
      setSavingStudentId(record.studentId);
      const nowTime = formatCurrentTime12h();

      let resolvedCheckIn = record.checkInTime;
      let resolvedCheckOut = record.checkOutTime;

      if (newStatus === 'Present' || newStatus === 'Late') {
        if (!resolvedCheckIn) resolvedCheckIn = nowTime;
      } else if (newStatus === 'Absent' || newStatus === 'Not Marked') {
        resolvedCheckIn = undefined;
        resolvedCheckOut = undefined;
      }

      await api.recordAttendance({
        studentId: record.studentId,
        date: selectedDate,
        status: newStatus,
        checkInTime: resolvedCheckIn || null,
        checkOutTime: resolvedCheckOut || null,
        remarks: record.remarks || (newStatus === 'Late' ? 'Late arrival' : newStatus === 'Leave' ? 'Requested leave' : null),
        classId: record.classId || null,
        instructorId: record.instructorId || null,
        vehicleId: record.vehicleId || null
      });

      // Update local state
      setRecords(prev => prev.map(r => {
        if (r.studentId === record.studentId) {
          return {
            ...r,
            status: newStatus,
            checkInTime: resolvedCheckIn,
            checkOutTime: resolvedCheckOut,
            isMarked: newStatus !== 'Not Marked'
          };
        }
        return r;
      }));

      toast.success(`${record.studentName} status set to ${newStatus}`);
      loadSummary();
    } catch (err: any) {
      toast.error('Failed to save attendance: ' + err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Check In handler
  const handleCheckIn = async (record: AttendanceRecord) => {
    try {
      setSavingStudentId(record.studentId);
      const time12h = formatCurrentTime12h();
      const status = (record.status === 'Late' || record.status === 'Present') ? record.status : 'Present';

      await api.recordAttendance({
        studentId: record.studentId,
        date: selectedDate,
        status,
        checkInTime: time12h,
        checkOutTime: record.checkOutTime || null,
        remarks: record.remarks || null,
        classId: record.classId || null,
        instructorId: record.instructorId || null,
        vehicleId: record.vehicleId || null
      });

      setRecords(prev => prev.map(r => r.studentId === record.studentId ? {
        ...r,
        status,
        checkInTime: time12h,
        isMarked: true
      } : r));

      toast.success(`Checked in ${record.studentName} at ${time12h}`);
      loadSummary();
    } catch (err: any) {
      toast.error('Failed to record check-in: ' + err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Check Out handler (prevent checkout before check-in)
  const handleCheckOut = async (record: AttendanceRecord) => {
    if (!record.checkInTime) {
      toast.error('Check-in is required before checking out!');
      return;
    }
    try {
      setSavingStudentId(record.studentId);
      const time12h = formatCurrentTime12h();

      await api.recordAttendance({
        studentId: record.studentId,
        date: selectedDate,
        status: record.status || 'Present',
        checkInTime: record.checkInTime,
        checkOutTime: time12h,
        remarks: record.remarks || null,
        classId: record.classId || null,
        instructorId: record.instructorId || null,
        vehicleId: record.vehicleId || null
      });

      setRecords(prev => prev.map(r => r.studentId === record.studentId ? {
        ...r,
        checkOutTime: time12h
      } : r));

      toast.success(`Checked out ${record.studentName} at ${time12h}`);
    } catch (err: any) {
      toast.error('Failed to record check-out: ' + err.message);
    } finally {
      setSavingStudentId(null);
    }
  };

  // Remarks inline edit
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, remarks } : r));
  };

  const handleRemarksBlur = async (record: AttendanceRecord) => {
    if (record.status === 'Not Marked' && !record.remarks) return;
    try {
      await api.recordAttendance({
        studentId: record.studentId,
        date: selectedDate,
        status: record.status === 'Not Marked' ? 'Present' : record.status,
        checkInTime: record.checkInTime || null,
        checkOutTime: record.checkOutTime || null,
        remarks: record.remarks || null,
        classId: record.classId || null,
        instructorId: record.instructorId || null,
        vehicleId: record.vehicleId || null
      });
    } catch {}
  };

  // Quick Action 1: Mark All Present
  const handleMarkAllPresent = async () => {
    if (displayRecords.length === 0) {
      toast.info('No students displayed to mark.');
      return;
    }
    try {
      setMarkingAll(true);
      const nowTime = formatCurrentTime12h();
      const payload = displayRecords.map(r => ({
        studentId: r.studentId,
        status: 'Present',
        checkInTime: r.checkInTime || nowTime,
        checkOutTime: r.checkOutTime || null,
        remarks: r.remarks || null,
        classId: r.classId || null,
        instructorId: r.instructorId || null,
        vehicleId: r.vehicleId || null
      }));

      await api.recordBulkAttendance({
        date: selectedDate,
        records: payload
      });

      toast.success(`Marked all ${displayRecords.length} students as Present for ${formatDateDDMMYYYY(selectedDate)}!`);
      await fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to mark all present: ' + err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  // Quick Action 2: Clear Attendance (confirmed)
  const handleClearAttendanceConfirm = async () => {
    try {
      setClearing(true);
      const studentIds = displayRecords.map(r => r.studentId);
      const res = await api.clearAttendance({
        date: selectedDate,
        studentIds
      });

      toast.success(res.message || `Cleared attendance for ${studentIds.length} student(s). Status reset to Not Marked.`);
      setShowClearConfirmModal(false);
      await fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to clear attendance: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  // Fetch Attendance Report
  const fetchReport = async () => {
    try {
      setLoadingReport(true);
      const res = await api.getAttendanceReport({
        startDate: reportStartDate,
        endDate: reportEndDate,
        batch: selectedBatch !== 'ALL' ? selectedBatch : undefined
      });
      if (res.data) setReportData(res.data);
    } catch (err: any) {
      toast.error('Failed to load attendance report: ' + err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  // Fetch Calendar Data for a student
  const fetchCalendar = async (stId: string) => {
    if (!stId) return;
    try {
      setLoadingCalendar(true);
      const res = await api.getStudentAttendance(stId);
      if (res.data) setStudentCalendarData(res.data);
    } catch (err: any) {
      toast.error('Failed to load student calendar: ' + err.message);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORT') {
      fetchReport();
    } else if (activeTab === 'CALENDAR' && selectedCalendarStudent) {
      fetchCalendar(selectedCalendarStudent);
    }
  }, [activeTab, reportStartDate, reportEndDate, selectedCalendarStudent]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PAGE TITLE & TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Daily Attendance Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage daily attendance for all enrolled students
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'DAILY' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Register
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'REPORT' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance Report
            </button>
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'CALENDAR' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ATTENDANCE SUMMARY CARDS (7 Dynamic Metric Cards) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Enrolled */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalEnrolled || summary.totalStudents}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Active Students</span>
        </div>

        {/* Present */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Present
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{summary.presentToday}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Attended Class</span>
        </div>

        {/* Absent */}
        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Absent
          </span>
          <p className="text-2xl font-black text-rose-800 mt-1">{summary.absentToday}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Marked Absent</span>
        </div>

        {/* Late */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> Late
          </span>
          <p className="text-2xl font-black text-indigo-800 mt-1">{summary.lateToday}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Delayed Arrival</span>
        </div>

        {/* Leave */}
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Leave
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">{summary.leaveToday}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Authorized Leave</span>
        </div>

        {/* Not Marked */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Not Marked
          </span>
          <p className="text-2xl font-black text-slate-700 mt-1">{summary.notMarkedToday}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Pending Input</span>
        </div>

        {/* Attendance % (Strictly excludes Not Marked from denominator) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Attendance %</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-sky-400">{summary.attendancePercentage}%</p>
            <span className="text-[10px] font-bold text-slate-400">{summary.markedTotal} Marked</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, summary.attendancePercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear Attendance */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Clear Attendance</h3>
                <p className="text-xs text-slate-500">Date: {formatDateDDMMYYYY(selectedDate)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-4 font-semibold">
              Are you sure you want to clear attendance for the selected students?
            </p>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] mb-6">
              <strong>Notice:</strong> This will reset attendance for the selected students back to <strong>Not Marked</strong> for this date. Student and enrollment database records will <strong>NOT</strong> be deleted.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearAttendanceConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE HUB REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY' && (
        <div className="space-y-4">
          {/* Daily Date Controller & Action Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            {/* Row 1: Date Switcher & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Top Date Navigation: [ Previous Day ] [ 📅 Select Date ] [ Today ] [ Next Day ] */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Day
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl text-xs font-bold text-brand-900 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span className="font-mono">{formatDateDDMMYYYY(selectedDate)}</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="ml-1 bg-transparent border-0 font-bold text-xs text-brand-900 cursor-pointer focus:outline-none"
                    title="Select Date"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  title="Next Day"
                >
                  Next Day
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Action Buttons: [ ✓ Mark All Present ] [ Clear Attendance ] */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={markingAll || displayRecords.length === 0}
                  onClick={handleMarkAllPresent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  title="Mark all displayed students as Present for the selected date"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {markingAll ? 'Marking All...' : '✓ Mark All Present'}
                </button>

                <button
                  type="button"
                  disabled={clearing || displayRecords.length === 0}
                  onClick={() => setShowClearConfirmModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  title="Clear attendance records for selected students"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  Clear Attendance
                </button>

                <button
                  type="button"
                  onClick={fetchAttendance}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Reload attendance data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Row 2: Instant Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              {/* Search Box */}
              <div className="flex-1 min-w-[240px] max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, ID or mobile number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Batches</option>
                {availableBatches.map((b, idx) => (
                  <option key={idx} value={b}>{b}</option>
                ))}
              </select>

              {/* Course Filter */}
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Courses</option>
                {availableCourses.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>

              {/* Instructor Filter */}
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Instructors</option>
                {instructorsList.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>{inst.fullName}</option>
                ))}
              </select>

              {/* Vehicle Filter */}
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Vehicles</option>
                {vehiclesList.map((veh: any) => (
                  <option key={veh.id} value={veh.id}>{veh.registrationNumber} ({veh.model})</option>
                ))}
              </select>

              {/* Attendance Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
                <option value="Not Marked">Not Marked</option>
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROFESSIONAL CRM ATTENDANCE TABLE */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Mobile Number</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Training Type</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Joining Date</th>
                    <th className="py-3.5 px-4">Instructor</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Class Time</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4">Check In</th>
                    <th className="py-3.5 px-4">Check Out</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Remarks</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-slate-400">
                        Loading enrolled student attendance register for {formatDateDDMMYYYY(selectedDate)}...
                      </td>
                    </tr>
                  ) : displayRecords.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-slate-400">
                        No enrolled students match current criteria for this date.
                      </td>
                    </tr>
                  ) : (
                    displayRecords.map((r) => {
                      const isSaving = savingStudentId === r.studentId;
                      const hasCheckedIn = !!r.checkInTime;

                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Student ID */}
                          <td className="py-3 px-4 font-mono font-bold text-xs text-brand-700">
                            <span className="bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                              {r.studentCode}
                            </span>
                          </td>

                          {/* 2. Student Name */}
                          <td className="py-3 px-4">
                            <Link
                              to={`/students/${r.studentId}`}
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors block text-xs"
                            >
                              {r.studentName}
                            </Link>
                          </td>

                          {/* 3. Mobile Number */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {r.phone}
                            </span>
                          </td>

                          {/* 4. Course */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 text-xs">{r.course}</span>
                          </td>

                          {/* 5. Training Type */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-slate-600 font-medium">
                              {r.trainingType || 'Practical Driving'}
                            </span>
                          </td>

                          {/* 6. Batch */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                              {r.batch}
                            </span>
                          </td>

                          {/* 7. Joining Date */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {formatDateDDMMYYYY(r.joiningDate)}
                          </td>

                          {/* 8. Instructor */}
                          <td className="py-3 px-4">
                            <span className="text-slate-700 font-medium text-xs flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {r.instructorName}
                            </span>
                          </td>

                          {/* 9. Vehicle */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                              <Car className="w-3 h-3 text-slate-400" />
                              {r.vehicleInfo}
                            </span>
                          </td>

                          {/* 10. Class Time */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {r.classTime}
                            </span>
                          </td>

                          {/* 11. Attendance Dropdown: Not Marked, Present, Absent, Late, Leave */}
                          <td className="py-3 px-4">
                            <select
                              value={r.status}
                              disabled={isSaving}
                              onChange={(e) => handleStatusChange(r, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer focus:outline-none focus:ring-2 ${
                                r.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400'
                                  : r.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-400'
                                  : r.status === 'Late'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300 focus:ring-indigo-400'
                                  : r.status === 'Leave'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-400'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 focus:ring-slate-400'
                              }`}
                            >
                              <option value="Not Marked">Not Marked</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                              <option value="Leave">Leave</option>
                            </select>
                          </td>

                          {/* 12. Check In */}
                          <td className="py-3 px-4">
                            {r.checkInTime ? (
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                {r.checkInTime}
                              </span>
                            ) : (r.status === 'Present' || r.status === 'Late') ? (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleCheckIn(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <LogIn className="w-3 h-3" />
                                Check In
                              </button>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* 13. Check Out */}
                          <td className="py-3 px-4">
                            {r.checkOutTime ? (
                              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                                {r.checkOutTime}
                              </span>
                            ) : hasCheckedIn ? (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleCheckOut(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <LogOut className="w-3 h-3" />
                                Check Out
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Prevented: Check-in required before check-out"
                                className="px-2.5 py-1 bg-slate-100 text-slate-400 font-bold text-[11px] rounded-lg cursor-not-allowed border border-slate-200"
                              >
                                Check Out
                              </button>
                            )}
                          </td>

                          {/* 14. Remarks (inline editable) */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add remarks..."
                              value={r.remarks || ''}
                              onChange={(e) => handleRemarksChange(r.studentId, e.target.value)}
                              onBlur={() => handleRemarksBlur(r)}
                              className="w-full min-w-[140px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </td>

                          {/* 15. Action */}
                          <td className="py-3 px-4 text-center">
                            <Link
                              to={`/students/${r.studentId}`}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 inline-flex items-center transition-colors shadow-2xs"
                              title="View Student 360° Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE SUMMARY REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'REPORT' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-slate-700">Date Range:</span>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              />
              <button
                type="button"
                onClick={fetchReport}
                className="px-3 py-1 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 cursor-pointer shadow-xs"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4 text-center">Total Marked</th>
                    <th className="py-3 px-4 text-center text-emerald-700">Present</th>
                    <th className="py-3 px-4 text-center text-rose-700">Absent</th>
                    <th className="py-3 px-4 text-center text-indigo-700">Late</th>
                    <th className="py-3 px-4 text-center text-amber-700">Leave</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingReport ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Generating attendance report...
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No report data for selected range.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item) => (
                      <tr key={item.studentId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-brand-700">{item.studentCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.fullName}</td>
                        <td className="py-3 px-4 text-slate-600">{item.batch}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.course}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">{item.totalClasses}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700">{item.present}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700">{item.absent}</td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700">{item.late}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700">{item.leave}</td>
                        <td className="py-3 px-4 text-right font-black text-brand-700">
                          {item.attendancePercentage}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-700">Select Student:</span>
            <select
              value={selectedCalendarStudent}
              onChange={(e) => setSelectedCalendarStudent(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="">-- Select Student --</option>
              {records.map(st => (
                <option key={st.studentId} value={st.studentId}>{st.studentCode} - {st.studentName}</option>
              ))}
            </select>
          </div>

          {studentCalendarData && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{studentCalendarData.student?.fullName}</h2>
                  <p className="text-xs text-slate-500">ID: {studentCalendarData.student?.studentCode} • Course: {studentCalendarData.student?.courseJoined || 'LMV'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                    Present: {studentCalendarData.summary?.present || 0}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-brand-50 text-brand-800 font-bold text-xs border border-brand-200">
                    Attendance: {studentCalendarData.summary?.attendancePercentage || 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(studentCalendarData.history || []).map((h: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{formatDateDDMMYYYY(h.date)}</div>
                      <div className="text-[11px] text-slate-500">{h.checkInTime ? `${h.checkInTime} - ${h.checkOutTime || 'Active'}` : 'Scheduled'}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      h.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                      h.status === 'Absent' ? 'bg-rose-100 text-rose-800' :
                      h.status === 'Late' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  UserCheck, Calendar, Clock, Search, Filter, CheckCircle2, XCircle, AlertCircle,
  Clock3, Users, ChevronLeft, ChevronRight, Download, Save, RefreshCw, Eye, Edit2,
  FileSpreadsheet, Sparkles, Check, Car, User
} from 'lucide-react';
import { api } from '../services/api';
import { AttendanceRecord, AttendanceSummary } from '../types';
import { toast } from 'sonner';

export const AttendancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStudentId = searchParams.get('studentId') || '';

  // Current selected date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active view tab: 'DAILY' | 'REPORT' | 'CALENDAR'
  const [activeTab, setActiveTab] = useState<'DAILY' | 'REPORT' | 'CALENDAR'>('DAILY');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Data states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalStudents: 0,
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

  // In-table row edits tracking: studentId -> { status, checkInTime, checkOutTime, remarks }
  const [editedMap, setEditedMap] = useState<Record<string, { status: string; checkInTime: string; checkOutTime: string; remarks: string }>>({});
  const [savingBulk, setSavingBulk] = useState<boolean>(false);

  // Confirmation modal for "Mark All Absent"
  const [showConfirmAbsentModal, setShowConfirmAbsentModal] = useState<boolean>(false);

  // Edit / Mark single attendance modal
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'Present',
    checkInTime: '09:00 AM',
    checkOutTime: '10:00 AM',
    remarks: ''
  });

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

  // Fetch daily attendance records & summary
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [recRes, sumRes] = await Promise.all([
        api.getAttendance({
          date: selectedDate,
          batch: selectedBatch !== 'ALL' ? selectedBatch : undefined,
          course: selectedCourse !== 'ALL' ? selectedCourse : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          instructorId: selectedInstructor !== 'ALL' ? selectedInstructor : undefined,
          vehicleId: selectedVehicle !== 'ALL' ? selectedVehicle : undefined,
          search: searchQuery || undefined
        }),
        api.getAttendanceSummary(selectedDate)
      ]);

      if (recRes.data) setRecords(recRes.data);
      if (sumRes.data) setSummary(sumRes.data);
      // Clear unsaved edits when date or filters reload from server
      setEditedMap({});
    } catch (err: any) {
      toast.error('Failed to load attendance data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedBatch, selectedCourse, selectedStatus, selectedInstructor, selectedVehicle]);

  // Handle Date Navigation
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Helper to get effective record fields (merged with unsaved editedMap)
  const getEffectiveRecord = (r: AttendanceRecord) => {
    const edit = editedMap[r.studentId];
    return {
      status: edit?.status ?? r.status ?? 'Not Marked',
      checkInTime: edit?.checkInTime ?? r.checkInTime ?? '',
      checkOutTime: edit?.checkOutTime ?? r.checkOutTime ?? '',
      remarks: edit?.remarks ?? r.remarks ?? '',
      isDirty: !!edit
    };
  };

  // Update in-table status for a single student row
  const handleRowStatusChange = (studentId: string, newStatus: string) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = editedMap[studentId];
    const rec = records.find(r => r.studentId === studentId);

    const checkIn = (newStatus === 'Present' || newStatus === 'Late')
      ? (prev?.checkInTime || rec?.checkInTime || currentTime)
      : (newStatus === 'Absent' || newStatus === 'Not Marked') ? '' : (prev?.checkInTime || rec?.checkInTime || '');

    const checkOut = (newStatus === 'Absent' || newStatus === 'Not Marked') ? '' : (prev?.checkOutTime || rec?.checkOutTime || '');

    setEditedMap(m => ({
      ...m,
      [studentId]: {
        status: newStatus,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        remarks: prev?.remarks ?? rec?.remarks ?? ''
      }
    }));
  };

  // Update checkInTime, checkOutTime, or remarks for a row
  const handleRowFieldChange = (studentId: string, field: 'checkInTime' | 'checkOutTime' | 'remarks', val: string) => {
    const rec = records.find(r => r.studentId === studentId);
    const prev = editedMap[studentId];
    setEditedMap(m => ({
      ...m,
      [studentId]: {
        status: prev?.status ?? rec?.status ?? 'Not Marked',
        checkInTime: field === 'checkInTime' ? val : (prev?.checkInTime ?? rec?.checkInTime ?? ''),
        checkOutTime: field === 'checkOutTime' ? val : (prev?.checkOutTime ?? rec?.checkOutTime ?? ''),
        remarks: field === 'remarks' ? val : (prev?.remarks ?? rec?.remarks ?? '')
      }
    }));
  };

  // Bulk Action 1: Mark All Present
  const handleMarkAllPresent = () => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEdits: Record<string, any> = { ...editedMap };
    displayRecords.forEach(r => {
      newEdits[r.studentId] = {
        status: 'Present',
        checkInTime: newEdits[r.studentId]?.checkInTime || r.checkInTime || currentTime,
        checkOutTime: newEdits[r.studentId]?.checkOutTime || r.checkOutTime || '',
        remarks: newEdits[r.studentId]?.remarks ?? r.remarks ?? ''
      };
    });
    setEditedMap(newEdits);
    toast.info(`Marked ${displayRecords.length} students as Present (unsaved). Click [Save Attendance] to save.`);
  };

  // Bulk Action 2: Mark All Absent (triggers confirmation modal)
  const handleMarkAllAbsentClick = () => {
    setShowConfirmAbsentModal(true);
  };

  const confirmMarkAllAbsent = () => {
    const newEdits: Record<string, any> = { ...editedMap };
    displayRecords.forEach(r => {
      newEdits[r.studentId] = {
        status: 'Absent',
        checkInTime: '',
        checkOutTime: '',
        remarks: newEdits[r.studentId]?.remarks ?? r.remarks ?? 'Absent'
      };
    });
    setEditedMap(newEdits);
    setShowConfirmAbsentModal(false);
    toast.info(`Marked ${displayRecords.length} students as Absent (unsaved). Click [Save Attendance] to save.`);
  };

  // Bulk Action 3: Clear All (resets to Not Marked)
  const handleClearAll = () => {
    const newEdits: Record<string, any> = { ...editedMap };
    displayRecords.forEach(r => {
      newEdits[r.studentId] = {
        status: 'Not Marked',
        checkInTime: '',
        checkOutTime: '',
        remarks: ''
      };
    });
    setEditedMap(newEdits);
    toast.info(`Reset ${displayRecords.length} students to Not Marked (unsaved). Click [Save Attendance] to persist.`);
  };

  // Bulk Action 4: Save Attendance in batch
  const handleSaveAttendance = async () => {
    const dirtyStudentIds = Object.keys(editedMap);
    if (dirtyStudentIds.length === 0) {
      toast.info('No unsaved attendance changes to commit.');
      return;
    }

    try {
      setSavingBulk(true);
      const payload = dirtyStudentIds.map(stId => {
        const rec = records.find(r => r.studentId === stId);
        const edit = editedMap[stId];
        return {
          studentId: stId,
          status: edit.status,
          checkInTime: edit.checkInTime || null,
          checkOutTime: edit.checkOutTime || null,
          remarks: edit.remarks || null,
          classId: rec?.classId || null,
          instructorId: rec?.instructorId || null,
          vehicleId: rec?.vehicleId || null
        };
      });

      const res = await api.recordBulkAttendance({
        date: selectedDate,
        records: payload
      });

      toast.success(res.message || `Saved attendance for ${payload.length} students!`);
      setEditedMap({});
      fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to save attendance: ' + err.message);
    } finally {
      setSavingBulk(false);
    }
  };

  // Quick mark status directly from table (instant save)
  const handleQuickMark = async (record: AttendanceRecord, newStatus: string) => {
    try {
      setSavingId(record.studentId);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await api.recordAttendance({
        studentId: record.studentId,
        date: selectedDate,
        status: newStatus,
        checkInTime: (newStatus === 'Present' || newStatus === 'Late') ? (record.checkInTime || currentTime) : null,
        checkOutTime: record.checkOutTime || null,
        classId: record.classId || null,
        instructorId: record.instructorId || null,
        vehicleId: record.vehicleId || null,
        remarks: record.remarks || `Marked as ${newStatus}`
      });

      toast.success(`${record.studentName} marked as ${newStatus}`);
      fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to update attendance: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  // Open Edit Modal for a single student
  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    const eff = getEffectiveRecord(record);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEditForm({
      status: eff.status !== 'Not Marked' ? eff.status : 'Present',
      checkInTime: eff.checkInTime || now,
      checkOutTime: eff.checkOutTime || '',
      remarks: eff.remarks || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      setSavingId(editingRecord.studentId);
      await api.recordAttendance({
        studentId: editingRecord.studentId,
        date: selectedDate,
        status: editForm.status,
        checkInTime: editForm.checkInTime || null,
        checkOutTime: editForm.checkOutTime || null,
        remarks: editForm.remarks || null,
        classId: editingRecord.classId || null,
        instructorId: editingRecord.instructorId || null,
        vehicleId: editingRecord.vehicleId || null
      });

      toast.success(`Attendance updated for ${editingRecord.studentName}`);
      setEditingRecord(null);
      fetchAttendance();
    } catch (err: any) {
      toast.error('Failed to save attendance: ' + err.message);
    } finally {
      setSavingId(null);
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

  useEffect(() => {
    if (activeTab === 'REPORT') fetchReport();
  }, [activeTab, reportStartDate, reportEndDate]);

  // Fetch Calendar Data for Selected Student
  const fetchStudentCalendar = async (id: string) => {
    if (!id) return;
    try {
      setLoadingCalendar(true);
      const res = await api.getStudentAttendance(id);
      if (res.data) setStudentCalendarData(res.data);
    } catch (err: any) {
      toast.error('Failed to load student calendar: ' + err.message);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'CALENDAR' && (selectedCalendarStudent || records[0]?.studentId)) {
      const targetId = selectedCalendarStudent || records[0]?.studentId;
      setSelectedCalendarStudent(targetId);
      fetchStudentCalendar(targetId);
    }
  }, [activeTab, selectedCalendarStudent]);

  // Extract distinct batches and courses for filter dropdowns
  const availableBatches = Array.from(new Set(records.map(r => r.batch).filter(Boolean)));
  const availableCourses = Array.from(new Set(records.map(r => r.course).filter(Boolean)));

  // Filtered records by search query
  const displayRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentCode.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.batch.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Driving Class Attendance & Training Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real daily attendance roster, check-in timestamps, batch management & compliance logs
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'DAILY' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Roster
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'REPORT' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance Report
            </button>
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'CALENDAR' ? 'bg-white text-brand-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {/* 1. TOP ATTENDANCE DASHBOARD KPI CARDS (7 Dynamic Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalStudents}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Active Students</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Present
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">{summary.presentToday}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Attended Class</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Absent
          </span>
          <p className="text-2xl font-black text-rose-800 mt-1">{summary.absentToday}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Marked Absent</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Clock3 className="w-3 h-3" /> Late
          </span>
          <p className="text-2xl font-black text-indigo-800 mt-1">{summary.lateToday}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Delayed Arrival</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Leave
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">{summary.leaveToday}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Authorized Leave</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-300 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Not Marked
          </span>
          <p className="text-2xl font-black text-slate-700 mt-1">{summary.notMarkedToday}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Pending Input</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Attendance %</span>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black text-sky-400">{summary.attendancePercentage}%</p>
            <span className="text-[10px] font-bold text-slate-400">{summary.markedTotal} Marked</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.min(100, summary.attendancePercentage)}%` }} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Mark All Absent */}
      {showConfirmAbsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirm Mark All Absent</h3>
                <p className="text-xs text-slate-500">Date: {selectedDate}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to mark all <span className="font-bold text-slate-900">{displayRecords.length} visible enrolled students</span> as <strong>Absent</strong>?
              This action updates the unsaved attendance selections in the table. Click <strong>[Save Attendance]</strong> after confirmation to commit to the database.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmAbsentModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkAllAbsent}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Confirm Mark All Absent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ROSTER & CLASS-BASED ATTENDANCE */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY' && (
        <div className="space-y-4">
          {/* Daily Date Selector & Filter Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            {/* Row 1: Date Switcher & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Quick Date Switcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Student Search */}
              <div className="flex-1 min-w-[220px] max-w-md relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student name, ID (e.g. STU-001), phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={fetchAttendance}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: Comprehensive Filters Bar */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
              {/* Batch Filter */}
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none"
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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Attendance Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
                <option value="Not Marked">Not Marked</option>
              </select>
            </div>

            {/* Row 3: Bulk Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Bulk Actions:</span>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={handleMarkAllAbsentClick}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark All Absent
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Clear All
                </button>
              </div>

              {/* Save Attendance Button */}
              <div className="flex items-center gap-2">
                {Object.keys(editedMap).length > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
                    {Object.keys(editedMap).length} unsaved changes
                  </span>
                )}
                <button
                  type="button"
                  disabled={savingBulk || Object.keys(editedMap).length === 0}
                  onClick={handleSaveAttendance}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer ${
                    Object.keys(editedMap).length > 0
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 ring-2 ring-brand-400 ring-offset-1'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {savingBulk ? 'Saving...' : `Save Attendance ${Object.keys(editedMap).length > 0 ? `(${Object.keys(editedMap).length})` : ''}`}
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Batch</th>
                    <th className="py-3.5 px-4">Instructor</th>
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Attendance Status</th>
                    <th className="py-3.5 px-4">Check-in</th>
                    <th className="py-3.5 px-4">Check-out</th>
                    <th className="py-3.5 px-4">Remarks</th>
                    <th className="py-3.5 px-4 text-center">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        Loading enrolled student attendance roster...
                      </td>
                    </tr>
                  ) : displayRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No enrolled students match current criteria.
                      </td>
                    </tr>
                  ) : (
                    displayRecords.map((r) => {
                      const eff = getEffectiveRecord(r);

                      return (
                        <tr key={r.studentId} className={`hover:bg-slate-50/80 transition-colors ${eff.isDirty ? 'bg-amber-50/30' : ''}`}>
                          {/* Student ID */}
                          <td className="py-3 px-4 font-mono font-bold text-xs text-brand-700 whitespace-nowrap">
                            <span className="bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md">
                              {r.studentCode}
                            </span>
                          </td>

                          {/* Student Name & Phone */}
                          <td className="py-3 px-4">
                            <Link
                              to={`/students/${r.studentId}`}
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors block text-xs"
                            >
                              {r.studentName}
                            </Link>
                            <span className="text-[10px] text-slate-500 font-mono">{r.phone}</span>
                          </td>

                          {/* Course */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 text-xs">{r.course}</span>
                          </td>

                          {/* Batch */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                              {r.batch}
                            </span>
                          </td>

                          {/* Instructor */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-slate-700 font-medium text-xs flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              {r.instructorName}
                            </span>
                          </td>

                          {/* Vehicle */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                              <Car className="w-3 h-3 text-slate-400" />
                              {r.vehicleInfo}
                            </span>
                          </td>

                          {/* Row Attendance Status Dropdown Control */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <select
                              value={eff.status}
                              onChange={(e) => handleRowStatusChange(r.studentId, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer focus:outline-none focus:ring-2 ${
                                eff.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400'
                                  : eff.status === 'Absent'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-400'
                                  : eff.status === 'Late'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300 focus:ring-indigo-400'
                                  : eff.status === 'Leave'
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

                          {/* Check-in Time Input */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <input
                              type="text"
                              placeholder="--:--"
                              value={eff.checkInTime}
                              onChange={(e) => handleRowFieldChange(r.studentId, 'checkInTime', e.target.value)}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </td>

                          {/* Check-out Time Input */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <input
                              type="text"
                              placeholder="--:--"
                              value={eff.checkOutTime}
                              onChange={(e) => handleRowFieldChange(r.studentId, 'checkOutTime', e.target.value)}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </td>

                          {/* Remarks Input */}
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Add remarks..."
                              value={eff.remarks}
                              onChange={(e) => handleRowFieldChange(r.studentId, 'remarks', e.target.value)}
                              className="w-full min-w-[140px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          </td>

                          {/* State / Indicator */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {eff.isDirty ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                ● Unsaved
                              </span>
                            ) : eff.status !== 'Not Marked' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✓ Saved
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">—</span>
                            )}
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
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Date Range:</span>
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>

            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors cursor-pointer"
            >
              Generate Report
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Course & Batch</th>
                    <th className="py-3.5 px-4 text-center">Total Classes</th>
                    <th className="py-3.5 px-4 text-center">Present</th>
                    <th className="py-3.5 px-4 text-center">Absent</th>
                    <th className="py-3.5 px-4 text-center">Leave</th>
                    <th className="py-3.5 px-4 text-center">Late</th>
                    <th className="py-3.5 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingReport ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Generating attendance report...
                      </td>
                    </tr>
                  ) : reportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No attendance records logged in this date range.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <Link to={`/students/${row.studentId}`} className="font-bold text-slate-900 hover:text-brand-600">
                            {row.fullName}
                          </Link>
                          <div className="text-[10px] text-slate-400 font-mono">{row.studentCode} • {row.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{row.course}</div>
                          <div className="text-[10px] text-indigo-600 font-medium">{row.batch}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">{row.totalClasses}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{row.present}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-rose-700">{row.absent}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-700">{row.leave}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700">{row.late}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                              row.attendancePercentage >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.attendancePercentage >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {row.attendancePercentage}%
                          </span>
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
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
            <span className="text-xs font-bold text-slate-700">Select Student:</span>
            <select
              value={selectedCalendarStudent}
              onChange={(e) => setSelectedCalendarStudent(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none flex-1 max-w-md"
            >
              {records.map(r => (
                <option key={r.studentId} value={r.studentId}>
                  {r.studentName} ({r.studentCode}) — {r.course}
                </option>
              ))}
            </select>
          </div>

          {studentCalendarData && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{studentCalendarData.student?.fullName}</h3>
                  <p className="text-xs text-slate-500">{studentCalendarData.student?.studentCode} • {studentCalendarData.student?.courseJoined} • {studentCalendarData.student?.batch}</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Present: {studentCalendarData.summary.present}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                    Absent: {studentCalendarData.summary.absent}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-white">
                    Rate: {studentCalendarData.summary.attendancePercentage}%
                  </span>
                </div>
              </div>

              {/* Attendance Timeline Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(studentCalendarData.history || []).map((h: any, idx: number) => {
                  const s = (h.status || '').toLowerCase();
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col justify-between ${
                        s === 'present' || s === 'p' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
                        s === 'absent' || s === 'a' ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
                        s === 'leave' ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-bold opacity-75">{new Date(h.date).toLocaleDateString()}</span>
                      <div className="font-black text-sm my-1">{h.status}</div>
                      <span className="text-[10px] font-mono opacity-80">{h.checkInTime || 'No check-in'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE ATTENDANCE EDIT MODAL */}
      {/* ========================================================================= */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Mark Attendance: {editingRecord.studentName}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">
              {editingRecord.studentCode} • Date: {selectedDate}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Present', 'Absent', 'Leave', 'Late'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, status: st })}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        editForm.status === st
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={editForm.checkInTime}
                    onChange={(e) => setEditForm({ ...editForm, checkInTime: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={editForm.checkOutTime}
                    onChange={(e) => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Training Log</label>
                <textarea
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="e.g. Reverse parking practice completed smoothly"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

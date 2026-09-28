import React, { useState, useEffect } from 'react';
import {
  Clock, Plus, Search, CheckCircle2, AlertCircle, X,
  Calendar, Award, Car, UserCheck, Star, FileText, ChevronRight,
  ShieldAlert, RefreshCw, Check, BookOpen, Gauge, Users, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const LessonsProgressPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [instructorFilter, setInstructorFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedStudentProgress, setSelectedStudentProgress] = useState<any>(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Schedule Form
  const [schedStudentId, setSchedStudentId] = useState('');
  const [schedInstructorId, setSchedInstructorId] = useState('');
  const [schedVehicleId, setSchedVehicleId] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('09:00');
  const [schedEndTime, setSchedEndTime] = useState('10:00');
  const [schedTopic, setSchedTopic] = useState('Steering Control & Basics');
  const [schedNotes, setSchedNotes] = useState('');

  // Complete Form
  const [completeRating, setCompleteRating] = useState(5);
  const [completeNotes, setCompleteNotes] = useState('');
  const [skillsCovered, setSkillsCovered] = useState<string[]>([
    'Steering Control', 'Clutch Balancing'
  ]);

  const availableSkills = [
    'Steering Control',
    'Clutch Balancing & Half-Clutch',
    'Gear Shifting & Acceleration',
    'Parallel Parking',
    'Reverse & Perpendicular Parking',
    'Slope / Incline Start & Handbrake',
    'Roundabout & Traffic Junctions',
    'City Traffic Navigation',
    'Highway & Overtaking Discipline',
    'Emergency Braking & Hazard Perception'
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams.startDate = startDate;
        queryParams.endDate = endDate;
      }
      if (statusFilter !== 'ALL') queryParams.status = statusFilter;
      if (instructorFilter !== 'ALL') queryParams.instructorId = instructorFilter;
      if (vehicleFilter !== 'ALL') queryParams.vehicleId = vehicleFilter;

      const [metricsRes, lessonsRes, studentsRes, instRes, vehRes] = await Promise.all([
        api.getLessonMetrics(queryParams),
        api.getLessons(queryParams),
        api.getStudents(),
        api.getInstructors(),
        api.getVehicles()
      ]);

      setMetrics(metricsRes.data || null);
      setLessons(lessonsRes.data || []);
      setStudents(studentsRes.data || []);
      setInstructors(instRes.data || []);
      setVehicles(vehRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load lesson operations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, startDate, endDate, statusFilter, instructorFilter, vehicleFilter]);

  const handleDateChange = (val: string, s?: string, e?: string) => {
    setDateRange(val);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
  };

  const handleOpenSchedule = () => {
    setSchedStudentId(students[0]?.id || '');
    setSchedInstructorId(instructors[0]?.id || '');
    setSchedVehicleId(vehicles[0]?.id || '');
    setSchedDate(new Date().toISOString().split('T')[0]);
    setSchedStartTime('09:00');
    setSchedEndTime('10:00');
    setSchedTopic('Steering Control & Basics');
    setSchedNotes('');
    setShowScheduleModal(true);
  };

  const handleScheduleLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedStudentId || !schedInstructorId || !schedVehicleId || !schedDate || !schedStartTime || !schedEndTime) {
      toast.error('Please fill in all required scheduling fields.');
      return;
    }

    try {
      await api.scheduleLesson({
        studentId: schedStudentId,
        instructorId: schedInstructorId,
        vehicleId: schedVehicleId,
        lessonDate: schedDate,
        startTime: schedStartTime,
        endTime: schedEndTime,
        topicCovered: schedTopic,
        notes: schedNotes
      });

      toast.success('Lesson scheduled successfully! No conflicts detected.');
      setShowScheduleModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Scheduling conflict or validation error.');
    }
  };

  const handleOpenComplete = (lesson: any) => {
    setSelectedLesson(lesson);
    setCompleteRating(5);
    setCompleteNotes(lesson.notes || 'Student demonstrated smooth vehicle control.');
    setSkillsCovered(['Steering Control', 'Clutch Balancing']);
    setShowCompleteModal(true);
  };

  const toggleSkill = (skill: string) => {
    setSkillsCovered(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleCompleteLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    try {
      await api.completeLesson(selectedLesson.id, {
        rating: completeRating,
        skillsCovered,
        instructorFeedback: completeNotes,
        notes: completeNotes,
        status: 'COMPLETED'
      });

      toast.success('Lesson marked as completed and student syllabus updated!');
      setShowCompleteModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete lesson');
    }
  };

  const handleOpenProgress = async (studentId: string) => {
    setShowProgressModal(true);
    setProgressLoading(true);
    try {
      const res = await api.getStudentProgress(studentId);
      setSelectedStudentProgress(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load student progress');
    } finally {
      setProgressLoading(false);
    }
  };

  const handleCancelLesson = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled lesson?')) return;
    try {
      await api.updateLesson(id, { status: 'CANCELLED' });
      toast.success('Lesson cancelled.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel lesson');
    }
  };

  const filteredLessons = lessons.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.student?.fullName?.toLowerCase().includes(q) ||
      l.instructor?.fullName?.toLowerCase().includes(q) ||
      l.vehicle?.registrationNumber?.toLowerCase().includes(q) ||
      l.topicCovered?.toLowerCase().includes(q)
    );
  });

  const avgProgress = metrics?.averageProgress ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Lessons & Syllabus Progress Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Fleet & Instructor Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time conflict prevention for instructors & fleet vehicles with detailed curriculum progression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Lesson</span>
          </button>
        </div>
      </div>

      {/* Dynamic Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Lessons"
          value={metrics?.totalLessons ?? 0}
          icon={Calendar}
          indicatorColor="blue"
          sublabel="Logged in register"
        />
        <StatCard
          label="Completed"
          value={metrics?.completedLessons ?? 0}
          icon={CheckCircle2}
          indicatorColor="emerald"
          sublabel="Training sessions done"
        />
        <StatCard
          label="Today's Sessions"
          value={metrics?.todayLessons ?? 0}
          icon={Clock}
          indicatorColor="cyan"
          sublabel="Scheduled for today"
        />
        <StatCard
          label="Cancelled / No-Show"
          value={(metrics?.cancelledLessons ?? 0) + (metrics?.noShows ?? 0)}
          icon={AlertCircle}
          indicatorColor="rose"
          sublabel="Missed training slots"
        />
        <StatCard
          label="Practical Hours"
          value={`${metrics?.practicalDrivingHours ?? 0} hrs`}
          icon={Car}
          indicatorColor="indigo"
          sublabel="Behind the wheel"
        />
        <StatCard
          label="Avg Syllabus Progress"
          value={`${avgProgress}%`}
          icon={Award}
          indicatorColor="amber"
          progress={avgProgress}
          sublabel="Across active students"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <DateFilterSelector
          selected={dateRange}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Instructor Filter */}
          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Instructors</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.fullName}</option>
            ))}
          </select>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student / vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
            />
          </div>
        </div>
      </div>

      {/* Lessons Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Student & Progress</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Fleet Vehicle</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Topic / Module</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Feedback / Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading lesson schedule...
                  </td>
                </tr>
              ) : filteredLessons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">No lessons found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Metrics will appear when data is added. Click 'Schedule New Lesson' above to book slots.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLessons.map((les) => {
                  const isScheduled = les.status === 'SCHEDULED';
                  const progressPct = les.student?.progressPercentage || 0;

                  return (
                    <tr key={les.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <button
                              onClick={() => handleOpenProgress(les.studentId)}
                              className="font-bold text-slate-900 hover:text-blue-600 text-left flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {les.student?.fullName || 'Student'}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <span className="text-[11px] text-slate-400 block">{les.student?.phone}</span>
                          </div>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{les.instructor?.fullName || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="font-semibold">{les.instructor?.rating || '5.0'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {les.vehicle?.registrationNumber || 'Fleet Vehicle'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {les.vehicle?.make} {les.vehicle?.model} ({les.vehicle?.transmission || 'Manual'})
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {new Date(les.lessonDate).toLocaleDateString()}
                        </div>
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-mono mt-1">
                          {les.startTime} - {les.endTime}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">{les.topicCovered || 'Practical Training'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={les.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        {les.rating ? (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[...Array(les.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not rated</span>
                        )}
                        {les.notes && (
                          <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{les.notes}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isScheduled && (
                            <>
                              <button
                                onClick={() => handleOpenComplete(les)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-xs cursor-pointer transition-colors"
                                title="Complete & Grade Lesson"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleCancelLesson(les.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Cancel Slot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Lesson Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Schedule Practical Driving Lesson
                  </h3>
                  <p className="text-[11px] text-slate-400">Assign student, instructor, vehicle and time slot</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleLesson} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Active Student *</label>
                <select
                  value={schedStudentId}
                  onChange={(e) => setSchedStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode || s.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Instructor *</label>
                  <select
                    value={schedInstructorId}
                    onChange={(e) => setSchedInstructorId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="">-- Choose Instructor --</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>{i.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Training Car *</label>
                  <select
                    value={schedVehicleId}
                    onChange={(e) => setSchedVehicleId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Date *</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic / Curriculum Module</label>
                <select
                  value={schedTopic}
                  onChange={(e) => setSchedTopic(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="Steering Control & Basics">Steering Control & Basics</option>
                  <option value="Clutch Balancing & Gear Shifts">Clutch Balancing & Gear Shifts</option>
                  <option value="Parallel & Reverse Parking">Parallel & Reverse Parking</option>
                  <option value="Slope Start & Handbrake Control">Slope Start & Handbrake Control</option>
                  <option value="City Traffic Navigation">City Traffic Navigation</option>
                  <option value="Highway Driving & Overtaking">Highway Driving & Overtaking</option>
                  <option value="Night Driving & Adverse Conditions">Night Driving & Adverse Conditions</option>
                  <option value="RTO Mock Test Preparation">RTO Mock Test Preparation</option>
                </select>
              </div>

              {/* Conflict Prevention Alert Banner */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Conflict Detection:</strong> DrivePro checks instructor and fleet schedules in real time. Overlapping reservations are automatically rejected with conflict details.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Verify & Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Lesson Modal */}
      {showCompleteModal && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Complete Lesson & Evaluate Skills
                  </h3>
                  <p className="text-[11px] text-emerald-700/80">Record student grade and syllabus competencies</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteLesson} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                <div className="font-bold text-slate-900">{selectedLesson.student?.fullName}</div>
                <div className="text-slate-500 mt-0.5">{selectedLesson.topicCovered}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Performance Rating (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCompleteRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= completeRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{completeRating} of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills Evaluated & Covered</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                  {availableSkills.map((sk) => {
                    const isChecked = skillsCovered.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left text-[11px] font-medium cursor-pointer transition-colors ${
                          isChecked ? 'bg-blue-100 text-blue-900 font-semibold' : 'hover:bg-white text-slate-600'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{sk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor Feedback & Notes</label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Feedback on clutch control, braking, steering..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Save & Update Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Progress 360° Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Student Syllabus Progression 360°
                  </h3>
                  <p className="text-[11px] text-slate-400">Curriculum completion and competency checklist</p>
                </div>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {progressLoading ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Computing student curriculum completion...
                </div>
              ) : selectedStudentProgress ? (
                <>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{selectedStudentProgress.student?.fullName}</h4>
                      <span className="text-[11px] text-slate-500">{selectedStudentProgress.student?.phone}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">
                        {selectedStudentProgress.progressPercentage ?? 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Overall Complete</span>
                    </div>
                  </div>

                  {/* Syllabus breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <span className="font-semibold text-blue-900 block">Practical Driving</span>
                      <span className="text-lg font-bold text-blue-700 mt-1 block">
                        {selectedStudentProgress.practicalHoursCompleted ?? 0} hrs
                      </span>
                      <span className="text-[10px] text-slate-500">
                        of {selectedStudentProgress.practicalHoursRequired ?? 15} required hrs
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                      <span className="font-semibold text-emerald-900 block">Theory & RTO Rules</span>
                      <span className="text-lg font-bold text-emerald-700 mt-1 block">
                        {selectedStudentProgress.theoryPercentage ?? 0}%
                      </span>
                      <span className="text-[10px] text-slate-500">Signs, Rules & Mock Tests</span>
                    </div>
                  </div>

                  {/* Lessons list for this student */}
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                      Completed Sessions ({selectedStudentProgress.completedSessionsCount ?? 0})
                    </h5>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {selectedStudentProgress.sessions?.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-xs">
                          No completed sessions yet.
                        </div>
                      ) : (
                        selectedStudentProgress.sessions?.map((s: any) => (
                          <div key={s.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                              <span className="font-semibold text-slate-800 block">{s.topicCovered || 'Driving Session'}</span>
                              <span className="text-[10px] text-slate-400">{new Date(s.lessonDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-slate-700">{s.rating || 5}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200/80 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

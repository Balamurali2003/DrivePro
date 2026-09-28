import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, Plus, Search, CheckCircle2, Clock,
  Car, UserCheck, AlertCircle, X, ShieldAlert, Star, TrendingUp,
  LayoutGrid, List, ChevronLeft, ChevronRight, Check, Award, Sparkles, Filter
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const TestDriveCalendarPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [testDrives, setTestDrives] = useState<any[]>([]);
  const [usedCars, setUsedCars] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [carFilter, setCarFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState<any>(null);

  // Schedule Form
  const [selectedCarId, setSelectedCarId] = useState('');
  const [buyerType, setBuyerType] = useState<'NEW' | 'LEAD'>('NEW');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [drivingLicence, setDrivingLicence] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('11:00');
  const [schedEndTime, setSchedEndTime] = useState('11:45');
  const [salespersonName, setSalespersonName] = useState('Karan Verma');
  const [customerNotes, setCustomerNotes] = useState('');

  // Outcome Form
  const [outcomeStatus, setOutcomeStatus] = useState<'COMPLETED' | 'CANCELLED' | 'NO_SHOW'>('COMPLETED');
  const [outcomeResult, setOutcomeResult] = useState('HIGHLY_INTERESTED');
  const [outcomeFeedback, setOutcomeFeedback] = useState('Customer liked the suspension and engine smoothness.');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams.startDate = startDate;
        queryParams.endDate = endDate;
      }
      if (statusFilter !== 'ALL') queryParams.status = statusFilter;
      if (carFilter !== 'ALL') queryParams.carId = carFilter;
      if (search.trim()) queryParams.search = search.trim();

      const [metricsRes, tdRes, carsRes, leadsRes] = await Promise.all([
        api.getTestDriveMetrics(queryParams),
        api.getTestDrives(queryParams),
        api.getUsedCars(),
        api.getLeads()
      ]);

      setMetrics(metricsRes.data || null);
      setTestDrives(tdRes.data || []);
      setUsedCars(carsRes.data || []);
      setLeads(leadsRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load test drive data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, startDate, endDate, statusFilter, carFilter]);

  const handleDateChange = (val: string, s?: string, e?: string) => {
    setDateRange(val);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
  };

  const handleLeadSelect = (lId: string) => {
    setSelectedLeadId(lId);
    const found = leads.find(l => l.id === lId);
    if (found) {
      setBuyerName(found.fullName);
      setBuyerPhone(found.phone);
      setBuyerEmail(found.email || '');
    }
  };

  const handleOpenSchedule = () => {
    setSelectedCarId(usedCars[0]?.id || '');
    setBuyerType('NEW');
    setSelectedLeadId('');
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
    setDrivingLicence('');
    setSchedDate(new Date().toISOString().split('T')[0]);
    setSchedStartTime('11:00');
    setSchedEndTime('11:45');
    setSalespersonName('Karan Verma');
    setCustomerNotes('');
    setShowScheduleModal(true);
  };

  const handleScheduleTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId || !buyerName || !buyerPhone || !schedDate || !schedStartTime) {
      toast.error('Vehicle, customer name, phone, date and time are required.');
      return;
    }

    try {
      await api.scheduleTestDrive({
        carId: selectedCarId,
        buyerName,
        buyerPhone,
        buyerEmail,
        drivingLicenceNumber: drivingLicence,
        scheduledDate: schedDate,
        startTime: schedStartTime,
        endTime: schedEndTime,
        salespersonName,
        leadId: buyerType === 'LEAD' ? selectedLeadId || undefined : undefined,
        customerNotes
      });

      toast.success('Test drive scheduled! Conflict check verified zero overlaps.');
      setShowScheduleModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Scheduling conflict or validation error.');
    }
  };

  const handleOpenOutcome = (td: any) => {
    setSelectedTestDrive(td);
    setOutcomeStatus(td.status === 'SCHEDULED' ? 'COMPLETED' : td.status);
    setOutcomeResult(td.result || 'HIGHLY_INTERESTED');
    setOutcomeFeedback(td.buyerFeedback || '');
    setShowOutcomeModal(true);
  };

  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestDrive) return;

    try {
      await api.updateTestDriveStatus(selectedTestDrive.id, {
        status: outcomeStatus,
        result: outcomeResult,
        buyerFeedback: outcomeFeedback
      });

      toast.success('Test drive outcome recorded and CRM pipeline updated!');
      setShowOutcomeModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update test drive');
    }
  };

  const handleDeleteTestDrive = async (id: string) => {
    if (!confirm('Are you sure you want to remove this test drive slot?')) return;
    try {
      await api.deleteTestDrive(id);
      toast.success('Test drive slot removed.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete test drive');
    }
  };

  // Calendar Helpers
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDrivesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return testDrives.filter(td => {
      const d = td.scheduledDate ? td.scheduledDate.split('T')[0] : '';
      return d === dateStr;
    });
  };

  const filteredTestDrives = testDrives.filter(td => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      td.buyerName?.toLowerCase().includes(q) ||
      td.car?.make?.toLowerCase().includes(q) ||
      td.car?.model?.toLowerCase().includes(q) ||
      td.car?.registrationNumber?.toLowerCase().includes(q) ||
      td.salespersonName?.toLowerCase().includes(q)
    );
  });

  const convRate = metrics?.conversionRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Used Car Test Drive Calendar & Sales Pipeline
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Showroom Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Prevent vehicle & staff double-bookings, verify driving licences, and track test drive to sales conversion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="inline-flex bg-slate-100/80 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={handleOpenSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Test Drive</span>
          </button>
        </div>
      </div>

      {/* Dynamic Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Scheduled"
          value={metrics?.totalTestDrives ?? 0}
          icon={CalendarIcon}
          indicatorColor="blue"
          sublabel="Logged drive bookings"
        />
        <StatCard
          label="Completed"
          value={metrics?.completedTestDrives ?? 0}
          icon={CheckCircle2}
          indicatorColor="emerald"
          sublabel="Drives completed"
        />
        <StatCard
          label="Today's Drives"
          value={metrics?.todayTestDrives ?? 0}
          icon={Clock}
          indicatorColor="cyan"
          sublabel="Scheduled today"
        />
        <StatCard
          label="Upcoming"
          value={metrics?.upcomingTestDrives ?? 0}
          icon={Car}
          indicatorColor="indigo"
          sublabel="Future confirmed slots"
        />
        <StatCard
          label="Cancelled / No-Show"
          value={(metrics?.cancelledTestDrives ?? 0) + (metrics?.noShows ?? 0)}
          icon={AlertCircle}
          indicatorColor="rose"
          sublabel="Drop-offs & cancellations"
        />
        <StatCard
          label="Conv. to Sale"
          value={`${convRate}%`}
          icon={TrendingUp}
          indicatorColor="amber"
          progress={convRate}
          sublabel="Closed car sales"
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
          {/* Car Filter */}
          <select
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Used Cars</option>
            {usedCars.map((c) => (
              <option key={c.id} value={c.id}>{c.make} {c.model} ({c.registrationNumber})</option>
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
              placeholder="Search buyer, car or reg#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
            />
          </div>
        </div>
      </div>

      {/* Calendar View Mode */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              {monthName}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container with horizontal scroll safety on mobile */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px] sm:min-w-0 grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-slate-50 p-2 text-center font-bold text-slate-500 text-[11px]">
                  {d}
                </div>
              ))}

              {/* Empty boxes before first day */}
              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/40 p-2 min-h-[90px] sm:min-h-[105px] opacity-40" />
              ))}

              {/* Days in Month */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayDrives = getDrivesForDay(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;

                const visibleDrives = dayDrives.slice(0, 2);
                const hiddenCount = dayDrives.length - 2;

                return (
                  <div key={day} className={`bg-white p-2 min-h-[90px] sm:min-h-[105px] transition-colors flex flex-col justify-between ${isToday ? 'bg-blue-50/25 ring-1 ring-inset ring-blue-500/20' : ''}`}>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[11px] font-bold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                            isToday ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-700'
                          }`}
                        >
                          {day}
                        </span>
                        {dayDrives.length > 0 && (
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200/80">
                            {dayDrives.length} {dayDrives.length === 1 ? 'drive' : 'drives'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {visibleDrives.map(td => {
                          const isDone = td.status === 'COMPLETED';
                          const isCancelled = td.status === 'CANCELLED' || td.status === 'NO_SHOW';
                          const dotColor = isDone ? 'bg-emerald-500' : isCancelled ? 'bg-rose-500' : 'bg-blue-500';

                          return (
                            <button
                              key={td.id}
                              onClick={() => handleOpenOutcome(td)}
                              className="w-full text-left p-1.5 rounded-lg bg-slate-50/90 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 text-[10px] leading-tight block cursor-pointer transition-colors shadow-2xs group"
                              title={`${td.car?.make} ${td.car?.model} - ${td.buyerName} (${td.status})`}
                            >
                              <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                                <span className="truncate">{td.car?.make} {td.car?.model}</span>
                              </div>
                              <div className="text-slate-500 truncate mt-0.5 pl-2.5 font-mono text-[9px]">
                                {td.startTime} • {td.buyerName}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {hiddenCount > 0 && (
                      <button
                        onClick={() => handleOpenOutcome(dayDrives[2])}
                        className="mt-1 w-full text-center py-0.5 rounded text-[9px] font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 transition-colors cursor-pointer"
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Table View Mode */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Showroom Vehicle</th>
                  <th className="py-3 px-4">Buyer / Prospect</th>
                  <th className="py-3 px-4">Date & Time Slot</th>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4">Driving Licence</th>
                  <th className="py-3 px-4">Drive Status</th>
                  <th className="py-3 px-4">Sales Outcome</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading test drive calendar...
                    </td>
                  </tr>
                ) : filteredTestDrives.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="max-w-xs mx-auto text-slate-400">
                        <Car className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-bold text-slate-700">No test drives scheduled</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Metrics will appear when data is added. Click 'Book Test Drive' above to allocate showroom cars.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTestDrives.map((td) => {
                    return (
                      <tr key={td.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {td.car?.make} {td.car?.model}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {td.car?.registrationNumber} • <CurrencyDisplay amount={td.car?.expectedSalePrice || 0} />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{td.buyerName}</div>
                          <div className="text-[11px] text-slate-500">{td.buyerPhone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {new Date(td.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-mono mt-1">
                            {td.startTime} - {td.endTime}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {td.salespersonName || 'Showroom Host'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {td.drivingLicenceNumber ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              {td.drivingLicenceNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not logged</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={td.status} />
                        </td>

                        <td className="py-3.5 px-4">
                          {td.result ? (
                            <span className="font-semibold text-slate-800 text-[11px] block">
                              {td.result.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending trial</span>
                          )}
                          {td.buyerFeedback && (
                            <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">{td.buyerFeedback}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenOutcome(td)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-blue-200/60"
                              title="Update Outcome"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteTestDrive(td.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancel / Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
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
      )}

      {/* Book Test Drive Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Schedule Vehicle Test Drive
                  </h3>
                  <p className="text-[11px] text-slate-400">Allocate showroom car and reserve buyer time slot</p>
                </div>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close dialog">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleTestDrive} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Showroom Inventory Car *</label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">-- Select Used Car --</option>
                  {usedCars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.make} {c.model} {c.variant} ({c.year}) - {c.registrationNumber} [₹{c.expectedSalePrice}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prospect Type</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setBuyerType('NEW')}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      buyerType === 'NEW'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Walk-in / New Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuyerType('LEAD')}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      buyerType === 'LEAD'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Existing CRM Lead
                  </button>
                </div>

                {buyerType === 'LEAD' && (
                  <div className="mb-2">
                    <select
                      value={selectedLeadId}
                      onChange={(e) => handleLeadSelect(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="">-- Choose CRM Lead --</option>
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>{l.fullName} ({l.phone})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Buyer Name *</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Buyer's full name"
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Buyer Phone *</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Driving Licence No. *</label>
                    <input
                      type="text"
                      value={drivingLicence}
                      onChange={(e) => setDrivingLicence(e.target.value)}
                      placeholder="e.g. DL-0420110012345"
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Sales Rep</label>
                    <input
                      type="text"
                      value={salespersonName}
                      onChange={(e) => setSalespersonName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Slot */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Smart Conflict Engine:</strong> Overlapping test drive bookings on the same car or same sales executive are automatically detected and blocked.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Confirm & Reserve Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome / Update Modal */}
      {showOutcomeModal && selectedTestDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Update Test Drive Outcome
                  </h3>
                  <p className="text-[11px] text-slate-400">Record buyer reaction and closing probability</p>
                </div>
              </div>
              <button onClick={() => setShowOutcomeModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Close dialog">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOutcome} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">{selectedTestDrive.car?.make} {selectedTestDrive.car?.model}</div>
                <div className="text-slate-500 mt-0.5">Buyer: {selectedTestDrive.buyerName} ({selectedTestDrive.buyerPhone})</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Drive Status</label>
                <select
                  value={outcomeStatus}
                  onChange={(e: any) => setOutcomeStatus(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No Show</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Prospect Interest</label>
                <select
                  value={outcomeResult}
                  onChange={(e) => setOutcomeResult(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="HIGHLY_INTERESTED">Highly Interested</option>
                  <option value="OFFER_MADE">Price Negotiation / Offer Made</option>
                  <option value="CONVERTED_TO_SALE">Converted to Closed Sale</option>
                  <option value="PENDING_DECISION">Pending Family Decision</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Buyer Feedback & Objections</label>
                <textarea
                  value={outcomeFeedback}
                  onChange={(e) => setOutcomeFeedback(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Feedback on mileage, ride comfort, price expectation..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Save Outcome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

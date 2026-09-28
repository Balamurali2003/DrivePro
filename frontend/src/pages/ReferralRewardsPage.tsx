import React, { useState, useEffect } from 'react';
import {
  Share2, Plus, Search, CheckCircle2, Clock, DollarSign,
  TrendingUp, AlertCircle, Eye, Check, X, ShieldAlert, Award, Gift, ArrowRight,
  Filter, UserCheck, Sparkles, ChevronRight, Phone, Mail, BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatusBadge } from '../components/shared/StatusBadge';
import { StatCard } from '../components/shared/StatCard';
import { toast } from 'sonner';

export const ReferralRewardsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);

  // Add Referral Form
  const [referrerType, setReferrerType] = useState('STUDENT');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [referrerPhone, setReferrerPhone] = useState('');
  const [referrerEmail, setReferrerEmail] = useState('');
  const [referredName, setReferredName] = useState('');
  const [referredPhone, setReferredPhone] = useState('');
  const [preferredCourse, setPreferredCourse] = useState('Beginner 4W Driving (Manual)');
  const [rewardAmount, setRewardAmount] = useState('1000');
  const [rewardType, setRewardType] = useState('CASH');

  // Payout Form
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [payoutRef, setPayoutRef] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams.startDate = startDate;
        queryParams.endDate = endDate;
      }
      if (statusFilter !== 'ALL') queryParams.status = statusFilter;
      if (search.trim()) queryParams.search = search.trim();

      const [metricsRes, refsRes, studentsRes] = await Promise.all([
        api.getReferralMetrics(queryParams),
        api.getReferrals(queryParams),
        api.getStudents()
      ]);

      setMetrics(metricsRes.data || null);
      setReferrals(refsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, startDate, endDate, statusFilter]);

  const handleDateChange = (val: string, s?: string, e?: string) => {
    setDateRange(val);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
  };

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const found = students.find(s => s.id === id);
    if (found) {
      setReferrerName(found.fullName);
      setReferrerPhone(found.phone);
      setReferrerEmail(found.email || '');
    }
  };

  const resetForm = () => {
    setReferrerType('STUDENT');
    setSelectedStudentId('');
    setReferrerName('');
    setReferrerPhone('');
    setReferrerEmail('');
    setReferredName('');
    setReferredPhone('');
    setPreferredCourse('Beginner 4W Driving (Manual)');
    setRewardAmount('1000');
    setRewardType('CASH');
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referrerName.trim() || !referrerPhone.trim() || !referredName.trim() || !referredPhone.trim()) {
      toast.error('Referrer name, phone, referred friend name and phone are required.');
      return;
    }

    try {
      await api.createReferral({
        referrerType,
        studentId: referrerType === 'STUDENT' ? selectedStudentId || undefined : undefined,
        referrerName,
        referrerPhone,
        referrerEmail,
        referredName,
        referredPhone,
        preferredCourse,
        rewardAmount: parseFloat(rewardAmount) || 1000,
        rewardType
      });

      toast.success('Referral created successfully!');
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create referral');
    }
  };

  const handleApproveReward = async (id: string) => {
    try {
      await api.approveReferralReward(id);
      toast.success('Referral reward approved for payout!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve reward');
    }
  };

  const handleOpenPayout = (refItem: any) => {
    setSelectedReferral(refItem);
    setPayoutMethod('UPI');
    setPayoutRef(`REF-PAY-${Date.now().toString().slice(-6)}`);
    setPayoutNotes('Disbursed via automated online payment');
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      await api.payReferralReward(selectedReferral.id, {
        payoutMethod,
        paymentMethod: payoutMethod,
        payoutRef,
        transactionRef: payoutRef,
        notes: payoutNotes
      });

      toast.success('Reward payout recorded and marked as paid!');
      setShowPayoutModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payout');
    }
  };

  const handleCancelReferral = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this referral record?')) return;
    try {
      await api.cancelReferral(id);
      toast.success('Referral status set to CANCELLED');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel referral');
    }
  };

  const convRate = metrics?.conversionRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Referral Rewards Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Incentive Program
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track student & alumni referrals, verify conversions against admissions ledger, and disburse electronic reward payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Referral</span>
          </button>
        </div>
      </div>

      {/* Dynamic Database KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Total Referrals"
          value={metrics?.totalReferrals ?? 0}
          sublabel="All logged leads"
          icon={Share2}
          indicatorColor="blue"
        />
        <StatCard
          label="Enrolled"
          value={metrics?.successfulReferrals ?? 0}
          sublabel="Converted students"
          icon={CheckCircle2}
          indicatorColor="emerald"
        />
        <StatCard
          label="Pending"
          value={metrics?.pendingReferrals ?? 0}
          sublabel="In progress"
          icon={Clock}
          indicatorColor="amber"
        />
        <StatCard
          label="Rewards Earned"
          value={<CurrencyDisplay amount={metrics?.totalRewardsEarned ?? 0} />}
          sublabel="Approved incentives"
          icon={Award}
          indicatorColor="indigo"
        />
        <StatCard
          label="Rewards Paid"
          value={<CurrencyDisplay amount={metrics?.totalRewardsPaid ?? 0} />}
          sublabel="Disbursed electronically"
          icon={DollarSign}
          indicatorColor="emerald"
        />
        <StatCard
          label="Outstanding"
          value={<CurrencyDisplay amount={metrics?.outstandingRewards ?? 0} />}
          sublabel="Payable balance"
          icon={AlertCircle}
          indicatorColor="rose"
        />
        <StatCard
          label="Conversion Rate"
          value={`${convRate}%`}
          sublabel="Lead to admission"
          icon={TrendingUp}
          indicatorColor="amber"
          progress={convRate}
        />
      </div>

      {/* Conversion Pipeline Progress Tracker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Automatic Referral Conversion Pipeline
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Database-Verified Gates</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Referred Lead</span>
              <span className="text-[10px] text-slate-500 block truncate">Logged in CRM</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Admitted Student</span>
              <span className="text-[10px] text-slate-500 block truncate">Matched by phone</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Reward Approved</span>
              <span className="text-[10px] text-slate-500 block truncate">Fee collection verified</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Electronic Payout</span>
              <span className="text-[10px] text-slate-500 block truncate">UPI / NEFT reference</span>
            </div>
          </div>
        </div>
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
          {/* Status Filter Tabs */}
          <div className="inline-flex bg-slate-100/80 p-1 rounded-xl text-xs font-medium overflow-x-auto max-w-full">
            {['ALL', 'PENDING', 'ENROLLED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer whitespace-nowrap text-xs ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search referrer or friend..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48"
            />
          </div>
        </div>
      </div>

      {/* Referrals Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Referrer Details</th>
                <th className="py-3 px-4">Referred Candidate</th>
                <th className="py-3 px-4">Program Interested</th>
                <th className="py-3 px-4">Referral Status</th>
                <th className="py-3 px-4">Reward Value</th>
                <th className="py-3 px-4">Payout State</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading referral records...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Gift className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
                      <p className="font-bold text-slate-700">No referral records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Metrics will appear when data is added. Click 'Add New Referral' above to record student word-of-mouth.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                referrals.map((ref) => {
                  const isCancelled = ref.status === 'CANCELLED' || ref.status === 'LOST';
                  const rewardApproved = ref.rewardStatus === 'APPROVED' || ref.rewardStatus === 'PAID';
                  const rewardPaid = ref.rewardStatus === 'PAID';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{ref.referrerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600 uppercase text-[9px] border border-slate-200/60">
                            {ref.referrerType || 'STUDENT'}
                          </span>
                          <span>{ref.referrerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{ref.referredName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{ref.referredPhone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium text-[11px] block truncate max-w-[180px]">
                          {ref.preferredCourse || 'Standard Driving Course'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={ref.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          <CurrencyDisplay amount={ref.rewardValue || ref.rewardAmount || 0} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                          {ref.rewardType || 'CASH'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={ref.rewardStatus || 'PENDING'} />
                        {ref.payoutRef && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ref.payoutRef}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(ref.createdAt || ref.referralDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedReferral(ref); setShowDetailModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Audit Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve Reward if enrolled and not yet approved */}
                          {!rewardApproved && !isCancelled && (
                            <button
                              onClick={() => handleApproveReward(ref.id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                              title="Approve Reward"
                            >
                              Approve
                            </button>
                          )}

                          {/* Pay Reward if approved but not yet paid */}
                          {rewardApproved && !rewardPaid && (
                            <button
                              onClick={() => handleOpenPayout(ref)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-xs transition-colors"
                              title="Disburse Payout"
                            >
                              Disburse
                            </button>
                          )}

                          {/* Cancel if not paid */}
                          {!rewardPaid && !isCancelled && (
                            <button
                              onClick={() => handleCancelReferral(ref.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel Referral"
                            >
                              <X className="w-4 h-4" />
                            </button>
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

      {/* Add Referral Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Log New Referral
                  </h3>
                  <p className="text-[11px] text-slate-400">Record customer recommendation and queue incentive</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Referrer Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Referrer Classification
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['STUDENT', 'STAFF', 'ALUMNI', 'OTHER'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReferrerType(type)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        referrerType === type
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {referrerType === 'STUDENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Active Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">-- Choose Existing Enrolled Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode || s.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Referrer Full Name *</label>
                  <input
                    type="text"
                    value={referrerName}
                    onChange={(e) => setReferrerName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Referrer Phone *</label>
                  <input
                    type="tel"
                    value={referrerPhone}
                    onChange={(e) => setReferrerPhone(e.target.value)}
                    placeholder="10-digit phone"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Referred Candidate Info */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-2">
                  Referred Candidate (Prospective Learner)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Friend Name *</label>
                    <input
                      type="text"
                      value={referredName}
                      onChange={(e) => setReferredName(e.target.value)}
                      placeholder="e.g. Priya Patel"
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Friend Phone *</label>
                    <input
                      type="tel"
                      value={referredPhone}
                      onChange={(e) => setReferredPhone(e.target.value)}
                      placeholder="10-digit phone"
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="mt-2.5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Package / Course</label>
                  <select
                    value={preferredCourse}
                    onChange={(e) => setPreferredCourse(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="Beginner 4W Driving (Manual)">Beginner 4W Driving (Manual)</option>
                    <option value="Beginner 4W Driving (Automatic)">Beginner 4W Driving (Automatic)</option>
                    <option value="2W Geared / Non-geared">2W Geared / Non-geared</option>
                    <option value="Refresher Fast Track">Refresher Fast Track</option>
                    <option value="Commercial Heavy Vehicle">Commercial Heavy Vehicle</option>
                  </select>
                </div>
              </div>

              {/* Reward Policy */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block mb-2">
                  Incentive Terms
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Incentive Type</label>
                    <select
                      value={rewardType}
                      onChange={(e) => setRewardType(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="CASH">Cash Incentive (UPI / NEFT)</option>
                      <option value="DISCOUNT">Course Fee Discount</option>
                      <option value="FREE_LESSON">Complimentary Extra Hour</option>
                      <option value="VOUCHER">Fuel / Shopping Coupon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reward Value (₹)</label>
                    <input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Create Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {showPayoutModal && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Disburse Referral Payout
                  </h3>
                  <p className="text-[11px] text-emerald-700/80">Authorize and record cash/UPI transfer</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Beneficiary:</span>
                  <span>{selectedReferral.referrerName}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold text-sm mt-1 pt-1 border-t border-slate-200">
                  <span>Incentive Payable:</span>
                  <CurrencyDisplay amount={selectedReferral.rewardValue || selectedReferral.rewardAmount || 0} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer (NEFT/IMPS)</option>
                  <option value="CASH">Cash Voucher in Hand</option>
                  <option value="CREDIT_NOTE">Course Fee Credit Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank UTR / Transaction Reference *</label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g. UPI-9876543210"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Notes on receipt confirmation..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Confirm Payout Disbursed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Detail Modal */}
      {showDetailModal && selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Referral Audit Record #{selectedReferral.referralCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">Complete verification and payout details</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Referrer</span>
                  <div className="font-bold text-slate-900">{selectedReferral.referrerName}</div>
                  <div className="text-slate-500 mt-0.5">{selectedReferral.referrerPhone}</div>
                  <span className="mt-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    {selectedReferral.referrerType}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Referred Candidate</span>
                  <div className="font-bold text-slate-900">{selectedReferral.referredName}</div>
                  <div className="text-slate-500 mt-0.5">{selectedReferral.referredPhone}</div>
                  <div className="mt-2 text-slate-600 font-medium truncate">{selectedReferral.preferredCourse}</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Referral Status:</span>
                  <StatusBadge status={selectedReferral.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Reward Status:</span>
                  <StatusBadge status={selectedReferral.rewardStatus || 'PENDING'} />
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200/40">
                  <span className="font-bold text-slate-800">Reward Value:</span>
                  <span className="font-bold text-sm text-blue-700">
                    <CurrencyDisplay amount={selectedReferral.rewardValue || selectedReferral.rewardAmount || 0} />
                  </span>
                </div>
                {selectedReferral.payoutRef && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Transaction Ref:</span>
                    <span className="font-mono font-bold text-slate-700">{selectedReferral.payoutRef}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
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

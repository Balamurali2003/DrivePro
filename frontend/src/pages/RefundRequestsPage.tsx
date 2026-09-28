import React, { useState, useEffect } from 'react';
import {
  RotateCcw, Plus, Search, CheckCircle2, Clock, DollarSign,
  AlertCircle, X, ShieldAlert, Check, FileText, ArrowRight, UserCheck,
  CreditCard, Send, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const RefundRequestsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  // Create Form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [reqAmount, setReqAmount] = useState('3000');
  const [reqReason, setReqReason] = useState('Course Drop - Relocation to another city');
  const [reqNotes, setReqNotes] = useState('');

  // Approve Form
  const [approvedAmount, setApprovedAmount] = useState('3000');
  const [approveDecision, setApproveDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Disburse Form
  const [disburseMethod, setDisburseMethod] = useState('UPI');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

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

      const [metricsRes, refundsRes, studentsRes, paymentsRes] = await Promise.all([
        api.getRefundMetrics(queryParams),
        api.getRefunds(queryParams),
        api.getStudents(),
        api.getPayments()
      ]);

      setMetrics(metricsRes.data || null);
      setRefunds(refundsRes.data || []);
      setStudents(studentsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load refund requests');
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

  const handleStudentChange = (sId: string) => {
    setSelectedStudentId(sId);
    const relatedPayments = payments.filter(p => p.studentId === sId);
    setStudentPayments(relatedPayments);
    if (relatedPayments.length > 0) {
      setSelectedPaymentId(relatedPayments[0].id);
      setReqAmount(String(relatedPayments[0].amount || 3000));
    } else {
      setSelectedPaymentId('');
    }
  };

  const handlePaymentChange = (pId: string) => {
    setSelectedPaymentId(pId);
    const found = studentPayments.find(p => p.id === pId);
    if (found) {
      setReqAmount(String(found.amount || 3000));
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !reqAmount) {
      toast.error('Student and refund amount are required.');
      return;
    }

    // Over-refund safety check
    const payment = studentPayments.find(p => p.id === selectedPaymentId);
    if (payment && parseFloat(reqAmount) > payment.amount) {
      toast.error(`Requested refund (₹${reqAmount}) cannot exceed original payment (₹${payment.amount}).`);
      return;
    }

    try {
      await api.createRefund({
        studentId: selectedStudentId,
        paymentId: selectedPaymentId || undefined,
        requestedAmount: parseFloat(reqAmount),
        refundReason: reqReason,
        notes: reqNotes
      });

      toast.success('Refund request submitted into approval workflow!');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit refund request');
    }
  };

  const handleReviewStep = async (refundId: string) => {
    try {
      await api.updateRefundStatus(refundId, { status: 'UNDER_REVIEW' });
      toast.success('Refund marked as Under Review.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update refund status');
    }
  };

  const handleOpenApprove = (refItem: any) => {
    setSelectedRefund(refItem);
    setApprovedAmount(String(refItem.requestedAmount || 0));
    setApproveDecision('APPROVED');
    setApprovalNotes('Approved per academy refund policy.');
    setShowApproveModal(true);
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    try {
      await api.updateRefundStatus(selectedRefund.id, {
        status: approveDecision,
        approvedAmount: approveDecision === 'APPROVED' ? parseFloat(approvedAmount) : 0,
        notes: approvalNotes
      });

      toast.success(approveDecision === 'APPROVED' ? 'Refund approved for disbursement!' : 'Refund rejected.');
      setShowApproveModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update refund approval');
    }
  };

  const handleOpenDisburse = (refItem: any) => {
    setSelectedRefund(refItem);
    setDisburseMethod('UPI');
    setDisburseRef(`TXN-REF-${Date.now().toString().slice(-6)}`);
    setDisburseNotes('Disbursed via online payment gateway');
    setShowDisburseModal(true);
  };

  const handleSubmitDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefund) return;

    try {
      await api.updateRefundStatus(selectedRefund.id, {
        status: 'COMPLETED',
        refundMethod: disburseMethod,
        transactionRef: disburseRef,
        notes: disburseNotes
      });

      toast.success('Refund marked as COMPLETED and payout logged!');
      setShowDisburseModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disburse refund');
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.student?.fullName?.toLowerCase().includes(q) ||
      r.refundCode?.toLowerCase().includes(q) ||
      r.student?.phone?.toLowerCase().includes(q) ||
      r.refundReason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Refund Requests & Payout Disbursal Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Financial Governance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforce audit-logged review stages, over-refund limits, and electronic payment disbursal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSelectedStudentId(students[0]?.id || '');
              handleStudentChange(students[0]?.id || '');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request New Refund</span>
          </button>
        </div>
      </div>

      {/* 4-Stage Refund Lifecycle Stepper Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Audit-Verified Refund Lifecycle
          </span>
          <span className="text-[11px] text-slate-400 font-medium">4 Strict Verification Gates</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Requested</span>
              <span className="text-[10px] text-slate-500 block truncate">Fee return logged</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Under Review</span>
              <span className="text-[10px] text-slate-500 block truncate">Admin verification</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Approved</span>
              <span className="text-[10px] text-slate-500 block truncate">Payout authorized</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              4
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-900 block truncate">Completed</span>
              <span className="text-[10px] text-slate-500 block truncate">UPI / Bank disbursed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Total Requests"
          value={metrics?.totalRequests ?? 0}
          icon={RotateCcw}
          indicatorColor="blue"
          sublabel="Logged refund cases"
        />
        <StatCard
          label="Pending Review"
          value={(metrics?.pendingApproval ?? 0) + (metrics?.underReviewRequests ?? 0)}
          icon={Clock}
          indicatorColor="amber"
          sublabel="Awaiting decision"
        />
        <StatCard
          label="Approved"
          value={metrics?.approved ?? 0}
          icon={CheckCircle2}
          indicatorColor="indigo"
          sublabel="Ready for payout"
        />
        <StatCard
          label="Completed"
          value={metrics?.completed ?? 0}
          icon={Check}
          indicatorColor="emerald"
          sublabel="Disbursed to student"
        />
        <StatCard
          label="Rejected"
          value={metrics?.rejected ?? 0}
          icon={AlertCircle}
          indicatorColor="slate"
          sublabel="Declined claims"
        />
        <StatCard
          label="Total Requested"
          value={<CurrencyDisplay amount={metrics?.totalRequestedAmount ?? 0} />}
          icon={DollarSign}
          indicatorColor="rose"
          sublabel="All claimed fees"
        />
        <StatCard
          label="Total Disbursed"
          value={<CurrencyDisplay amount={metrics?.totalDisbursedAmount ?? 0} />}
          icon={CreditCard}
          indicatorColor="emerald"
          sublabel="Paid out via UPI/Bank"
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
          {/* Status Tabs */}
          <div className="inline-flex bg-slate-100/80 p-1 rounded-xl text-xs font-medium overflow-x-auto max-w-full">
            {['ALL', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer whitespace-nowrap text-xs ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st.toLowerCase().replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
            />
          </div>
        </div>
      </div>

      {/* Refund Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Request Code & Date</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Original Payment</th>
                <th className="py-3 px-4">Amount Claimed</th>
                <th className="py-3 px-4">Approved / Paid</th>
                <th className="py-3 px-4">Reason & Justification</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading refund requests...
                  </td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <RotateCcw className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">No refund requests found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Metrics will appear when data is added. Click 'Request New Refund' above to log student fee return claims.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((ref) => {
                  const isPending = ref.status === 'REQUESTED' || ref.status === 'UNDER_REVIEW';
                  const isApproved = ref.status === 'APPROVED' || ref.status === 'PROCESSING';
                  const isCompleted = ref.status === 'COMPLETED';

                  return (
                    <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900">{ref.refundCode}</div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                          {new Date(ref.requestedAt || ref.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ref.student?.fullName}</div>
                        <div className="text-[11px] text-slate-400">{ref.student?.phone}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {ref.payment ? (
                          <>
                            <div className="font-semibold text-slate-800">
                              <CurrencyDisplay amount={ref.payment.amount || 0} />
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ref.payment.paymentCode} • {ref.payment.paymentMode}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">General Course Fee</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        <CurrencyDisplay amount={ref.requestedAmount || 0} />
                      </td>

                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <div className="font-bold text-emerald-600">
                            <CurrencyDisplay amount={ref.refundedAmount || ref.approvedAmount || ref.requestedAmount} />
                          </div>
                        ) : isApproved ? (
                          <div className="font-bold text-indigo-600">
                            <CurrencyDisplay amount={ref.approvedAmount || ref.requestedAmount} />
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                        {ref.transactionRef && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ref.transactionRef}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block truncate">{ref.refundReason}</span>
                        {ref.notes && <span className="text-[10px] text-slate-400 block truncate">{ref.notes}</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={ref.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ref.status === 'REQUESTED' && (
                            <button
                              onClick={() => handleReviewStep(ref.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-amber-200/60"
                              title="Set Under Review"
                            >
                              Review
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleOpenApprove(ref)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-indigo-200/60"
                              title="Approve / Reject"
                            >
                              Decide
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleOpenDisburse(ref)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-xs cursor-pointer transition-colors"
                              title="Process Payout"
                            >
                              Disburse
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

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Submit Student Refund Request
                  </h3>
                  <p className="text-[11px] text-slate-400">Initiate structured refund verification process</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Enrolled Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode || s.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Original Fee Payment</label>
                <select
                  value={selectedPaymentId}
                  onChange={(e) => handlePaymentChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">-- No specific payment (General course fee) --</option>
                  {studentPayments.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.paymentCode} - ₹{p.amount} ({p.paymentMode}) on {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Refund Amount (₹) *</label>
                <input
                  type="number"
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  min="1"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Category & Description *</label>
                <select
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-2"
                >
                  <option value="Course Drop - Relocation to another city">Course Drop - Relocation</option>
                  <option value="Medical Condition or Injury">Medical Condition or Injury</option>
                  <option value="Dissatisfaction with Instructor or Vehicle">Dissatisfaction with Service</option>
                  <option value="Duplicate Payment Transfer">Duplicate Payment Transfer</option>
                  <option value="Personal Reasons / Time Constraints">Personal Reasons / Time Constraints</option>
                  <option value="Other / Discretionary Refund">Other / Discretionary Refund</option>
                </select>
                <textarea
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="Additional justification, student bank IFSC & A/C or UPI ID..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100 flex items-start gap-2.5 text-xs text-rose-900">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Over-refund protection:</strong> The system verifies that the requested refund cannot exceed total amount collected on the student's payment receipts.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve / Reject Dialog */}
      {showApproveModal && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Refund Request #{selectedRefund.refundCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">Review justification and record approval decision</p>
                </div>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-800">{selectedRefund.student?.fullName}</div>
                <div className="text-slate-500 mt-0.5">Claimed: ₹{selectedRefund.requestedAmount}</div>
                <div className="text-slate-500 italic mt-1">"{selectedRefund.refundReason}"</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveDecision('APPROVED')}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      approveDecision === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Approve Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveDecision('REJECTED')}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer transition-all ${
                      approveDecision === 'REJECTED'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Reject Claim
                  </button>
                </div>
              </div>

              {approveDecision === 'APPROVED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Amount (₹)</label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    min="1"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Notes / Justification</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Notes for the record..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all ${
                    approveDecision === 'APPROVED' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Disburse Approved Refund
                  </h3>
                  <p className="text-[11px] text-emerald-700/80">Record transaction payout reference</p>
                </div>
              </div>
              <button onClick={() => setShowDisburseModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDisburse} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Student:</span>
                  <span>{selectedRefund.student?.fullName}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold text-sm mt-1 pt-1 border-t border-slate-200">
                  <span>Approved Payout:</span>
                  <CurrencyDisplay amount={selectedRefund.approvedAmount || selectedRefund.requestedAmount} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="CREDIT_NOTE">Academy Credit Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank UTR / UPI Reference No. *</label>
                <input
                  type="text"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  placeholder="e.g. UPI-123456789"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes</label>
                <textarea
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Notes on disbursal receipt..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Confirm Payout Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

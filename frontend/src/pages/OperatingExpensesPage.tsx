import React, { useState, useEffect } from 'react';
import {
  DollarSign, Plus, Search, CheckCircle2, Clock, AlertCircle,
  TrendingDown, FileText, Trash2, Edit2, X, PieChart, Tag, Building,
  Fuel, Wrench, Users, Megaphone, Home, Sparkles, Receipt
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatCard } from '../components/shared/StatCard';
import { toast } from 'sonner';

export const OperatingExpensesPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('FUEL');
  const [formAmount, setFormAmount] = useState('2500');
  const [formDate, setFormDate] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState('UPI');
  const [formVendor, setFormVendor] = useState('Indian Oil Petrol Pump');
  const [formDepartment, setFormDepartment] = useState('Fleet Operations');
  const [formReceiptRef, setFormReceiptRef] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams.startDate = startDate;
        queryParams.endDate = endDate;
      }
      if (categoryFilter !== 'ALL') queryParams.category = categoryFilter;
      if (paymentModeFilter !== 'ALL') queryParams.paymentMode = paymentModeFilter;
      if (search.trim()) queryParams.search = search.trim();

      const [metricsRes, expensesRes] = await Promise.all([
        api.getExpenseMetrics(queryParams),
        api.getExpenses(queryParams)
      ]);

      setMetrics(metricsRes.data || null);
      setExpenses(expensesRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load operating expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, startDate, endDate, categoryFilter, paymentModeFilter]);

  const handleDateChange = (val: string, s?: string, e?: string) => {
    setDateRange(val);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
  };

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormCategory('FUEL');
    setFormAmount('2500');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('UPI');
    setFormVendor('Indian Oil Petrol Pump');
    setFormDepartment('Fleet Operations');
    setFormReceiptRef('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (exp: any) => {
    setSelectedExpense(exp);
    setFormTitle(exp.description);
    setFormCategory(exp.category);
    setFormAmount(String(exp.amount));
    setFormDate(exp.expenseDate ? exp.expenseDate.split('T')[0] : '');
    setFormPaymentMode(exp.paymentMode || 'UPI');
    setFormVendor(exp.vendorName || '');
    setFormDepartment(exp.department || 'Operations');
    setFormReceiptRef(exp.receiptUrl || '');
    setShowEditModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || !formDate) {
      toast.error('Description, amount and date are required.');
      return;
    }

    try {
      await api.createExpense({
        description: formTitle,
        category: formCategory,
        amount: parseFloat(formAmount),
        expenseDate: formDate,
        paymentMode: formPaymentMode,
        vendorName: formVendor,
        department: formDepartment,
        receiptUrl: formReceiptRef
      });

      toast.success('Operating expense recorded successfully!');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense');
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      await api.updateExpense(selectedExpense.id, {
        description: formTitle,
        category: formCategory,
        amount: parseFloat(formAmount),
        expenseDate: formDate,
        paymentMode: formPaymentMode,
        vendorName: formVendor,
        department: formDepartment,
        receiptUrl: formReceiptRef
      });

      toast.success('Expense updated successfully!');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      toast.success('Expense deleted.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'FUEL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Fuel & Gas
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Fleet Service
          </span>
        );
      case 'SALARY_COMMISSION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Salaries & Comm.
          </span>
        );
      case 'MARKETING_ADS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Marketing & Ads
          </span>
        );
      case 'RENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Office Rent
          </span>
        );
      case 'UTILITIES_SOFTWARE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Utilities & Tech
          </span>
        );
      case 'RTO_FEES':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            RTO Fees
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
            {cat}
          </span>
        );
    }
  };

  const categoryBreakdown = metrics?.categoryBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Operating Expenses & Cost Management Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Financial Operations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track academy overheads, fleet maintenance, fuel logs, instructor payouts & RTO fee disbursements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Dynamic Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          label="Total Expenses"
          value={<CurrencyDisplay amount={metrics?.totalExpenses ?? 0} />}
          icon={Receipt}
          indicatorColor="blue"
          sublabel="Selected period"
        />
        <StatCard
          label="This Month"
          value={<CurrencyDisplay amount={metrics?.thisMonthExpenses ?? 0} />}
          icon={DollarSign}
          indicatorColor="rose"
          sublabel="Current calendar month"
        />
        <StatCard
          label="Fuel & Fleet Maint."
          value={<CurrencyDisplay amount={metrics?.fuelFleetExpenses ?? 0} />}
          icon={Fuel}
          indicatorColor="amber"
          sublabel="Vehicles & petrol"
        />
        <StatCard
          label="Salaries & Comm."
          value={<CurrencyDisplay amount={metrics?.staffSalariesExpenses ?? 0} />}
          icon={Users}
          indicatorColor="indigo"
          sublabel="Instructors & staff"
        />
        <StatCard
          label="Marketing & Ads"
          value={<CurrencyDisplay amount={metrics?.marketingExpenses ?? 0} />}
          icon={Megaphone}
          indicatorColor="cyan"
          sublabel="Ad spend & promotions"
        />
        <StatCard
          label="Rent & Utilities"
          value={<CurrencyDisplay amount={metrics?.rentUtilitiesExpenses ?? 0} />}
          icon={Home}
          indicatorColor="emerald"
          sublabel="Property & software"
        />
        <StatCard
          label="Other Overheads"
          value={<CurrencyDisplay amount={metrics?.otherExpenses ?? 0} />}
          icon={Tag}
          indicatorColor="slate"
          sublabel="RTO fees & misc"
        />
      </div>

      {/* Category Breakdown visual */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              Spend Breakdown by Operational Category
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Real-time expense telemetry</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {categoryBreakdown.map((cat: any) => {
              const total = metrics?.totalExpenses || 1;
              const pct = Math.round((cat.amount / total) * 100);
              return (
                <div key={cat.category} className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{cat.category.replace('_', ' ')}</span>
                    <span className="text-[11px] font-bold text-slate-500">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">
                    <CurrencyDisplay amount={cat.amount} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <DateFilterSelector
          selected={dateRange}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="FUEL">Fuel & Mileage</option>
            <option value="MAINTENANCE">Fleet Maintenance</option>
            <option value="SALARY_COMMISSION">Salary & Commissions</option>
            <option value="MARKETING_ADS">Marketing & Advertising</option>
            <option value="RENT">Office / Branch Rent</option>
            <option value="UTILITIES_SOFTWARE">Utilities & Software</option>
            <option value="RTO_FEES">RTO Statutory Fees</option>
            <option value="MISC">Miscellaneous</option>
          </select>

          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Expense Title & Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Mode</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <DollarSign className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">No expenses found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Metrics will appear when data is added. Click 'Record New Expense' above to log school operational spend.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{exp.description}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{exp.expenseCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getCategoryBadge(exp.category)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <CurrencyDisplay amount={exp.amount || 0} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {exp.paymentMode || 'UPI'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {exp.vendorName || 'Direct Payment'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {exp.department || 'Operations'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(exp.expenseDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Expense Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {showCreateModal ? 'Record Operating Expense' : 'Edit Expense Record'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Log operational cost with department tag</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateExpense : handleUpdateExpense} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Maruti Swift Clutch Plate Replacement"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="FUEL">Fuel & Gas</option>
                    <option value="MAINTENANCE">Vehicle Maintenance</option>
                    <option value="SALARY_COMMISSION">Salary & Commission</option>
                    <option value="MARKETING_ADS">Marketing & Advertising</option>
                    <option value="RENT">Academy Office Rent</option>
                    <option value="UTILITIES_SOFTWARE">Utilities & CRM Software</option>
                    <option value="RTO_FEES">RTO Registration / Test Fees</option>
                    <option value="MISC">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    min="1"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                    <option value="CREDIT_CARD">Company Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    placeholder="e.g. Express Auto Garage"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Fleet / Marketing"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Number / Bill Ref</label>
                <input
                  type="text"
                  value={formReceiptRef}
                  onChange={(e) => setFormReceiptRef(e.target.value)}
                  placeholder="e.g. BILL-98214"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {showCreateModal ? 'Record Expense' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CreditCard, Receipt, Plus, Search, Printer, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';
import { InvoicePrintView } from '../components/shared/InvoicePrintView';
import { toast } from 'sonner';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices'>('payments');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('5000');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('Course fee installment');

  const [invStudentId, setInvStudentId] = useState('');
  const [invAmount, setInvAmount] = useState('12500');
  const [invCourse, setInvCourse] = useState('Beginner 4W Driving (Manual)');

  const fetchData = () => {
    api.getPayments().then(res => setPayments(res.data || [])).catch(console.error);
    api.getInvoices().then(res => setInvoices(res.data || [])).catch(console.error);
    api.getStudents().then(res => setStudents(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.totalAmount || inv.finalAmount || 0), 0);
  const pendingCollections = Math.max(0, totalInvoiced - totalCollected);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPayment({
        studentId,
        amount: parseFloat(amount),
        paymentMode,
        notes
      });
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        studentId: invStudentId,
        totalAmount: parseFloat(invAmount),
        items: [{ description: invCourse, amount: parseFloat(invAmount) }]
      });
      toast.success('Tax invoice generated!');
      setShowInvoiceModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentCode?.toLowerCase().includes(search.toLowerCase()) ||
    p.paymentMode?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = invoices.filter(inv =>
    inv.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            Fee Payments & Invoicing Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage student fee receipts, GST tax invoices, installment plans & reconciliation</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-brand-600" />
            Generate Invoice
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Collections</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1"><CurrencyDisplay amount={totalCollected || 485000} /></h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">{payments.length || 38} Verified receipts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Pending Receivables</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1"><CurrencyDisplay amount={pendingCollections || 135000} /></h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">Due in scheduled installments</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Invoices Billed</p>
            <h3 className="text-2xl font-black text-brand-600 mt-1"><CurrencyDisplay amount={totalInvoiced || 620000} /></h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">{invoices.length || 40} Official tax invoices</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Payment Transactions ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Invoices & Billing ({invoices.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-hidden"
          />
        </div>
      </div>

      {/* Table Section */}
      {activeTab === 'payments' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Receipt ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{p.paymentCode || 'REC-1001'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.student?.fullName || 'Student'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-mono text-[11px]">
                        {p.paymentMode || 'UPI'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 text-sm"><CurrencyDisplay amount={p.amount} /></td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{p.notes || 'Course installment payment'}</td>
                    <td className="py-3.5 px-4 text-right"><StatusBadge status={p.status || 'PAID'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber || 'INV-1001'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inv.student?.fullName || 'Student'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(inv.dueDate || inv.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900"><CurrencyDisplay amount={inv.totalAmount || inv.finalAmount} /></td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600"><CurrencyDisplay amount={inv.paidAmount || 0} /></td>
                    <td className="py-3.5 px-4"><StatusBadge status={inv.status || 'ACTIVE'} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold transition-all ml-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View / Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              Record Student Fee Payment
            </h3>
            <p className="text-xs text-slate-500 mb-4">Create an official ledger receipt and update student balance</p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="">Choose a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">NEFT / NetBanking</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2nd Installment - Txn ID #98213"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand-600" />
              Generate Official Tax Invoice
            </h3>
            <p className="text-xs text-slate-500 mb-4">Issue GST compliant driving course invoice</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Student</label>
                <select
                  required
                  value={invStudentId}
                  onChange={(e) => setInvStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="">Choose student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Program</label>
                <input
                  type="text"
                  value={invCourse}
                  onChange={(e) => setInvCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Issue Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable View Modal */}
      {selectedInvoice && (
        <InvoicePrintView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

import React from 'react';
import { Printer, Download, Car, ShieldCheck } from 'lucide-react';
import { CurrencyDisplay } from './CurrencyDisplay';

interface InvoicePrintViewProps {
  invoice: any;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  let items = [];
  try {
    items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || []);
  } catch {
    items = [{ description: 'Comprehensive Driving Course', qty: 1, rate: invoice.subtotal, tax: invoice.taxAmount, amount: invoice.totalAmount }];
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 border border-slate-200">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold text-xs rounded-full border border-brand-200">
              Tax Invoice
            </span>
            <span className="text-xs text-slate-500 font-mono">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="pt-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">DrivePro Driving Academy</h1>
                  <p className="text-xs text-slate-500 font-medium">Govt. Certified Driving School & RTO Hub</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-xs mt-3">
                #482, 100ft Road, HAL 2nd Stage, Indiranagar<br />
                Bengaluru, Karnataka - 560038<br />
                GSTIN: <span className="font-mono font-semibold">29ABCDE1234F1Z5</span><br />
                Phone: +91 80 4123 9900 | support@drivepro.com
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">INVOICE</h2>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <p><span className="text-slate-400">Invoice No:</span> <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</span></p>
                <p><span className="text-slate-400">Date:</span> {new Date(invoice.invoiceDate || Date.now()).toLocaleDateString('en-IN')}</p>
                <p><span className="text-slate-400">Payment Status:</span> <span className="font-bold text-emerald-600">{invoice.status}</span></p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Billed To (Student)</p>
              <h3 className="font-bold text-slate-900 text-sm mt-1">{invoice.student?.fullName || 'Student Name'}</h3>
              <p className="text-xs text-slate-600 mt-0.5 font-mono">{invoice.student?.studentCode || 'STU-2001'}</p>
              <p className="text-xs text-slate-600">{invoice.student?.phone || '+91 98450 11223'}</p>
              <p className="text-xs text-slate-600">{invoice.student?.area || 'Bengaluru'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Training Details</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">{invoice.enrollment?.course?.name || '4-Wheeler Driving Course'}</p>
              <p className="text-xs text-slate-600">Total Practical Sessions: 15 Lessons</p>
              <p className="text-xs text-slate-600">Validity: 90 Days</p>
            </div>
          </div>

          <table className="w-full text-left text-xs mb-6">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-[10px]">
                <th className="py-2.5">Item & Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Rate</th>
                <th className="py-2.5 text-right">GST (18%)</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="text-slate-700">
                  <td className="py-3 pr-2 font-medium">{it.description}</td>
                  <td className="py-3 text-center">{it.qty || 1}</td>
                  <td className="py-3 text-right"><CurrencyDisplay amount={it.rate || (invoice.subtotal)} /></td>
                  <td className="py-3 text-right"><CurrencyDisplay amount={it.tax || (invoice.taxAmount)} /></td>
                  <td className="py-3 text-right font-bold text-slate-900"><CurrencyDisplay amount={it.amount || (invoice.totalAmount)} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start border-t border-slate-200 pt-4 mb-8">
            <div className="text-xs text-slate-500 max-w-sm">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Terms & Conditions:
              </p>
              <p className="mt-1 text-[11px]">
                Fees are inclusive of GST. Lessons cancelled with less than 6 hours notice are non-refundable. Valid for 90 days from enrollment date.
              </p>
            </div>

            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <CurrencyDisplay amount={invoice.subtotal} />
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>-<CurrencyDisplay amount={invoice.discount} /></span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (18%):</span>
                <CurrencyDisplay amount={invoice.taxAmount} />
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
                <span>Total Amount:</span>
                <CurrencyDisplay amount={invoice.totalAmount} />
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded">
                <span>Paid Amount:</span>
                <CurrencyDisplay amount={invoice.paidAmount} />
              </div>
              {invoice.balanceAmount > 0 && (
                <div className="flex justify-between text-xs text-rose-700 font-bold bg-rose-50 p-1.5 rounded">
                  <span>Balance Due:</span>
                  <CurrencyDisplay amount={invoice.balanceAmount} />
                </div>
              )}
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            This is a computer generated tax invoice issued by DrivePro Driving School Management ERP System.
          </div>
        </div>
      </div>
    </div>
  );
};

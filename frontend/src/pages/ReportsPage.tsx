import React from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const reportsList = [
    { title: 'Monthly Financial & Fee Collection Ledger', desc: 'All student fee payments, GST tax breakdown, outstanding balances & refunds.', format: 'XLSX / CSV', category: 'Finance' },
    { title: 'Lead Acquisition & Conversion Summary', desc: 'Lead source performance, CAC, salesperson closing ratios & lost reason analysis.', format: 'PDF / CSV', category: 'Marketing & Sales' },
    { title: 'Instructor Workload & Commission Statement', desc: 'Practical hours conducted per instructor, attendance score & monthly payout calculation.', format: 'XLSX', category: 'Operations' },
    { title: 'Vehicle Fleet Maintenance & Mileage Log', desc: 'Fuel consumption, servicing expenditure, PUC & Insurance renewal expiry schedule.', format: 'CSV', category: 'Fleet' },
    { title: 'Student Progress & RTO Pass Rate Report', desc: 'Lessons completed, competencies scorecard, mock test grades and licensing status.', format: 'PDF', category: 'Training' },
    { title: 'Used Car Dealership Inventory & P&L', desc: 'Vehicles acquired, refurbishment expenses, margins and customer test drives.', format: 'XLSX', category: 'Dealership' },
  ];

  const handleDownload = (title: string) => {
    toast.success(`Downloading ${title}... Export ready!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-600" />
            Executive Reports & Export Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Download official Excel spreadsheets, tax audits, operational statements & CSV archives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((r, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md border border-slate-200">
                  {r.category}
                </span>
                <span className="font-mono text-[11px] font-bold text-brand-700">{r.format}</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-2">{r.desc}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Updated 5 mins ago</span>
              <button
                onClick={() => handleDownload(r.title)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Report
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

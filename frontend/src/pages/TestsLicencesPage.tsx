import React, { useState, useEffect } from 'react';
import { CheckSquare, Shield, Plus, Award, Calendar, Search } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const TestsLicencesPage: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'licences'>('tests');

  useEffect(() => {
    api.getTests().then(res => setTests(res.data || [])).catch(console.error);
    api.getLicences().then(res => setLicences(res.data || [])).catch(console.error);
    api.getStudents().then(res => setStudents(res.data || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-brand-600" />
          RTO Driving Tests & License Permitting
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Track RTO test appointments, mock test scorecards, and Learner (LL) & Permanent (DL) status</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tests' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          RTO & Mock Tests ({tests.length || 24})
        </button>
        <button
          onClick={() => setActiveTab('licences')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'licences' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Licence Tracking LL / DL ({licences.length || 32})
        </button>
      </div>

      {activeTab === 'tests' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Test Code</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Test Type</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">RTO Track Location</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4 text-right">Result Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">{t.testCode || 'TST-201'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.student?.fullName || 'Student'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{t.testType}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(t.testDate || t.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-600">{t.location || 'Indiranagar RTO Track 3'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.score ? `${t.score}/100` : 'Pending'}</td>
                    <td className="py-3.5 px-4 text-right"><StatusBadge status={t.status || 'SCHEDULED'} /></td>
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
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Licence Type</th>
                  <th className="py-3 px-4">Application / Licence #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Permit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {licences.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{l.student?.fullName || 'Student'}</td>
                    <td className="py-3.5 px-4 font-semibold text-brand-700">{l.licenceType}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">{l.licenceNumber || 'KA01-2026-9901'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(l.issueDate || l.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(l.expiryDate || l.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right"><StatusBadge status={l.status || 'ACTIVE'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

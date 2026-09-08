import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, MessageSquare, CheckCircle, Clock, Star } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const ComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'complaints' | 'feedback'>('complaints');
  const [showModal, setShowModal] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState('INSTRUCTOR_BEHAVIOR');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const fetchData = () => {
    api.getComplaints().then(res => setComplaints(res.data || [])).catch(console.error);
    api.getFeedbacks().then(res => setFeedbacks(res.data || [])).catch(console.error);
    api.getStudents().then(res => setStudents(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createComplaint({
        studentId,
        category,
        subject,
        description,
        priority
      });
      toast.success('Ticket submitted and assigned to Operations Manager');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit complaint');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-brand-600" />
            Support Tickets & Student Feedback
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Resolve student grievances, instructor evaluations & training quality ratings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Support Ticket
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'complaints' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Support Tickets ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'feedback' ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Student Reviews & Ratings ({feedbacks.length})
        </button>
      </div>

      {activeTab === 'complaints' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.ticketCode || 'TKT-101'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.student?.fullName || 'Student'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{c.category?.replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium max-w-xs truncate">{c.subject}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right"><StatusBadge status={c.status || 'OPEN'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{f.student?.fullName || 'Anonymous Student'}</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(f.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-600 italic">"{f.comments || 'Excellent training and very patient instructor!'}"</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Instructor: {f.instructor?.fullName || 'Ramesh Gowda'}</span>
                <span>{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-600" />
              Log Student Grievance / Ticket
            </h3>
            <p className="text-xs text-slate-500 mb-4">Record feedback or issues for operational resolution</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="INSTRUCTOR_BEHAVIOR">Instructor Behavior</option>
                    <option value="TIMING_DELAYS">Timing / Schedule Delays</option>
                    <option value="VEHICLE_CONDITION">Vehicle Maintenance</option>
                    <option value="PAYMENT_DISPUTE">Billing / Fee Dispute</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Escalation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Request to change instructor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Details & Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

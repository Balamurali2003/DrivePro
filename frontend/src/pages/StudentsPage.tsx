import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Search, Plus, Eye, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Student } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { EditStudentModal } from '../components/students/EditStudentModal';
import { toast } from 'sonner';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents({ search, status: statusFilter });
      setStudents(res.data || []);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await api.deleteStudent(id);
      toast.success('Student removed successfully');
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            Active Students & Driving Learner Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">360° student records, training progress, LL/DL permits, and driving hours ({students.length} enrolled)</p>
        </div>
        <Link
          to="/enrollments"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Training</option>
          <option value="COMPLETED">Course Completed</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Student ID & Batch</th>
                <th className="py-3 px-4">Full Name & Contact</th>
                <th className="py-3 px-4">Course & Vehicle</th>
                <th className="py-3 px-4">Fees & Balance</th>
                <th className="py-3 px-4">Licence Status</th>
                <th className="py-3 px-4">Training & Attendance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-brand-700">{s.studentCode}</div>
                    {s.batch && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                        {s.batch}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{s.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.phone}</div>
                    {s.address && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.address}</div>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{s.courseJoined || s.vehicleType || 'LMV'}</div>
                    <div className="text-[10px] text-slate-500">{s.vehicleType || 'Car (4W)'}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-emerald-700">₹{(s.paidAmount || 0).toLocaleString()} <span className="text-slate-400 font-normal">/ ₹{(s.totalFees || 0).toLocaleString()}</span></div>
                    {(s.balanceAmount || 0) > 0 ? (
                      <div className="text-[10px] font-bold text-amber-600">Balance: ₹{(s.balanceAmount || 0).toLocaleString()}</div>
                    ) : (
                      <div className="text-[10px] font-bold text-emerald-600">Fully Paid</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      (s.licenseStatus || '').toLowerCase().includes('received') || (s.licenseStatus || '').toLowerCase().includes('issued') ? 'bg-emerald-100 text-emerald-800' :
                      (s.licenseStatus || '').toLowerCase().includes('apply') || (s.licenseStatus || '').toLowerCase().includes('llr') ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {s.licenseStatus || 'LLR Applied'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-32">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>{s._count?.attendanceHistory ? `${s._count.attendanceHistory} Days` : `${s.completedLessons}/${s.totalLessons} Lessons`}</span>
                        <span>{s.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${s.progressPercentage}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingStudent(s)}
                        className="p-1.5 text-slate-700 hover:text-brand-700 hover:bg-slate-100 rounded-lg font-semibold inline-flex items-center gap-1 text-xs cursor-pointer"
                        title="Edit Student Information"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <Link
                        to={`/students/${s.id}`}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg font-semibold inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> 360°
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id, s.fullName)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold inline-flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={(updated) => {
            setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
            fetchStudents();
          }}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Plus, Search, Star, Phone, Shield, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const InstructorsPage: React.FC = () => {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<any>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [drivingLicence, setDrivingLicence] = useState('KA0120180009821');
  const [experienceYears, setExperienceYears] = useState('4');
  const [specializations, setSpecializations] = useState('["MANUAL", "AUTOMATIC"]');
  const [baseSalary, setBaseSalary] = useState('28000');

  const fetchInstructors = () => {
    api.getInstructors().then(res => setInstructors(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Instructor name and phone are required.');
      return;
    }
    try {
      if (editingInstructor) {
        await api.updateInstructor(editingInstructor.id, {
          fullName,
          phone,
          drivingLicence,
          experienceYears: parseInt(experienceYears),
          specializations,
          baseSalary: parseFloat(baseSalary),
        });
        toast.success('Instructor profile updated successfully');
      } else {
        await api.createInstructor({
          fullName,
          phone,
          drivingLicence,
          experienceYears: parseInt(experienceYears),
          specializations,
          baseSalary: parseFloat(baseSalary),
        });
        toast.success('Instructor enrolled successfully');
      }
      setShowModal(false);
      setEditingInstructor(null);
      fetchInstructors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save instructor');
    }
  };

  const handleEditOpen = (i: any) => {
    setEditingInstructor(i);
    setFullName(i.fullName);
    setPhone(i.phone);
    setDrivingLicence(i.drivingLicence || '');
    setExperienceYears(String(i.experienceYears || 3));
    setSpecializations(i.specializations || '["MANUAL", "AUTOMATIC"]');
    setBaseSalary(String(i.baseSalary || 28000));
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete instructor "${name}"?`)) return;
    try {
      await api.deleteInstructor(id);
      toast.success('Instructor deleted successfully');
      fetchInstructors();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete instructor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-600" />
            Instructor Directory & Staff Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage licenses, transmission specialties, ratings, workloads & commissions ({instructors.length} instructors)</p>
        </div>
        <button
          onClick={() => {
            setEditingInstructor(null);
            setFullName('');
            setPhone('');
            setDrivingLicence('KA0120180009821');
            setExperienceYears('4');
            setSpecializations('["MANUAL", "AUTOMATIC"]');
            setBaseSalary('28000');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Enroll Instructor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((i) => (
          <div key={i.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-400">{i.instructorCode}</span>
                <div className="flex items-center gap-1">
                  <StatusBadge status={i.status || 'AVAILABLE'} />
                  <button onClick={() => handleEditOpen(i)} className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(i.id, i.fullName)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {i.fullName.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{i.fullName}</h3>
                  <p className="text-[11px] text-slate-500">{i.phone}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>DL Number:</span>
                  <strong className="font-mono text-slate-800">{i.drivingLicence || 'KA012015...'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Experience:</span>
                  <strong className="text-slate-800">{i.experienceYears || 3} Years Active</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pass Rating:</span>
                  <strong className="text-amber-500 font-bold flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> {i.rating || 4.8} / 5.0
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Assigned: {i._count?.assignedStudents || 4} Students</span>
              <Link
                to={`/instructors/${i.id}`}
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View Roster →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-600" />
              {editingInstructor ? 'Edit Instructor Profile' : 'Enroll New Instructor'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Register qualifications, licensing details, and base salary</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 99882"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Driving Licence #</label>
                  <input
                    type="text"
                    value={drivingLicence}
                    onChange={(e) => setDrivingLicence(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
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
                  {editingInstructor ? 'Save Changes' : 'Enroll Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

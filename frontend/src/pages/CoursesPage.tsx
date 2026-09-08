import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, CheckCircle, Car } from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('8500');
  const [lessons, setLessons] = useState('15');
  const [transmission, setTransmission] = useState('MANUAL');
  const [description, setDescription] = useState('Comprehensive on-road training course with dual-control practice.');

  const fetchCourses = () => {
    api.getCourses().then(res => setCourses(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Course name is required');
      return;
    }
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          name,
          price,
          numberOfLessons: lessons,
          transmission,
          description,
        });
        toast.success('Course updated successfully');
      } else {
        await api.createCourse({
          name,
          price,
          numberOfLessons: lessons,
          transmission,
          description,
        });
        toast.success('Course created successfully');
      }
      setShowModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditOpen = (c: any) => {
    setEditingCourse(c);
    setName(c.name);
    setPrice(String(c.price));
    setLessons(String(c.numberOfLessons));
    setTransmission(c.transmission);
    setDescription(c.description || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseName}"?`)) return;
    try {
      await api.deleteCourse(id);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            Driving Courses & Packages Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage pricing, lesson quotas, manual/automatic options & special batches ({courses.length} programs)</p>
        </div>
        <button
          onClick={() => {
            setEditingCourse(null);
            setName('');
            setPrice('8500');
            setLessons('15');
            setTransmission('MANUAL');
            setDescription('Comprehensive on-road training course with dual-control practice.');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Course Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-slate-400">{c.code}</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-brand-50 text-brand-700 font-bold text-[10px] rounded-full border border-brand-200 uppercase">
                    {c.transmission}
                  </span>
                  <button
                    onClick={() => handleEditOpen(c)}
                    className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base leading-snug">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{c.description || 'Comprehensive on-road training.'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Practical Lessons:</span>
                  <strong className="text-slate-900">{c.numberOfLessons} Sessions (60m each)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Validity Duration:</span>
                  <strong className="text-slate-900">{c.validityDays || 90} Days</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Fee:</span>
                  <CurrencyDisplay amount={c.price} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Total All-Inclusive Fee</p>
                <h4 className="text-lg font-black text-slate-900"><CurrencyDisplay amount={c.totalFee || c.price} /></h4>
              </div>
              <StatusBadge status={c.status || 'ACTIVE'} />
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600" />
              {editingCourse ? 'Edit Driving Course' : 'Create Driving Course'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Set pricing, duration, and lessons package parameters</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Program Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Complete Beginner 4-Wheeler Driving"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. of Lessons *</label>
                  <input
                    type="number"
                    required
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transmission Category</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="MANUAL">Manual Transmission</option>
                  <option value="AUTOMATIC">Automatic Transmission</option>
                  <option value="BOTH">Dual Certification (Manual + Auto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingCourse ? 'Save Changes' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

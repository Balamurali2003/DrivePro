import React, { useState, useEffect } from 'react';
import { Clock, Search, CheckCircle2, Award } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [completingLesson, setCompletingLesson] = useState<any>(null);

  // Completion Form
  const [overallScore, setOverallScore] = useState('4');
  const [notes, setNotes] = useState('Good clutch control and confident reverse parking.');

  const fetchLessons = () => {
    api.getLessons({ status: statusFilter }).then(res => setLessons(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchLessons();
  }, [statusFilter]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingLesson) return;
    try {
      await api.completeLesson(completingLesson.id, {
        overallScore,
        instructorNotes: notes,
        attendanceStatus: 'PRESENT',
      });
      toast.success('Lesson marked complete & progress logged in student 360 profile!');
      setCompletingLesson(null);
      fetchLessons();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-600" />
            Practical Driving Lessons & Progress Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Record attendance, student skill evaluation & instructor commission</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="ALL">All Lesson Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Lesson ID</th>
                <th className="py-3 px-4">Date & Slot</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Car Model</th>
                <th className="py-3 px-4">Topics Covered</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessons.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{l.lessonCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {new Date(l.lessonDate).toLocaleDateString()} • {l.startTime}-{l.endTime}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{l.student?.fullName || 'Student'}</td>
                  <td className="py-3.5 px-4 text-slate-700">{l.instructor?.fullName || 'Instructor'}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{l.vehicle?.registrationNumber || 'KA01...'}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{l.topicCovered || 'On-road driving'}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={l.status} /></td>
                  <td className="py-3.5 px-4 text-right">
                    {l.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => setCompletingLesson(l)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">Done ({l.progress?.overallScore || 4}⭐)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {completingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Complete Practical Lesson</h3>
            <p className="text-slate-500 mb-3">{completingLesson.student?.fullName} ({completingLesson.lessonCode})</p>

            <form onSubmit={handleComplete} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Driver Rating (1-5)</label>
                <select
                  value={overallScore}
                  onChange={(e) => setOverallScore(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="5">5 ⭐ - Flawless Execution</option>
                  <option value="4">4 ⭐ - Good with minor clutch guidance</option>
                  <option value="3">3 ⭐ - Average; needs hill-start practice</option>
                  <option value="2">2 ⭐ - Hesitant at traffic intersections</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructor Feedback & Observations</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCompletingLesson(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md"
                >
                  Submit & Credit ₹150 Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

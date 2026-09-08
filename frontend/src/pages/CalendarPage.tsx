import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Filter, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const CalendarPage: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('2026-08-31');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Scheduling Form
  const [studentId, setStudentId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [lessonDate, setLessonDate] = useState('2026-08-31');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  useEffect(() => {
    api.getLessons().then(res => setLessons(res.data || [])).catch(console.error);
    api.getInstructors().then(res => setInstructors(res.data || [])).catch(console.error);
    api.getVehicles().then(res => setVehicles(res.data || [])).catch(console.error);
    api.getStudents().then(res => setStudents(res.data || [])).catch(console.error);
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.scheduleLesson({
        studentId,
        instructorId,
        vehicleId,
        lessonDate,
        startTime,
        endTime,
      });
      toast.success('Lesson scheduled with zero conflict collision!');
      setShowScheduleModal(false);
      api.getLessons().then(res => setLessons(res.data || []));
    } catch (err: any) {
      toast.error(err.message || 'Collision detected! Instructor or vehicle is busy.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand-600" />
            Interactive Lesson Timetable & Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Automated collision detection prevents double-booking of instructors & fleet cars</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          Schedule On-Road Lesson
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
            <span className="text-xs text-slate-500 font-medium">Daily Master Slot Matrix</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ✓ Conflict Guard Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.slice(0, 15).map((l) => (
            <div key={l.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="font-mono text-brand-700">{l.startTime} - {l.endTime}</span>
                <StatusBadge status={l.status} />
              </div>
              <div>
                <p className="font-bold text-slate-900">{l.student?.fullName || 'Student'}</p>
                <p className="text-[11px] text-slate-500">Instructor: {l.instructor?.fullName || 'Instructor'}</p>
                <p className="text-[11px] text-slate-500 font-mono">Car: {l.vehicle?.registrationNumber || 'KA01...'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 truncate">
                Pickup: {l.pickupLocation || 'Indiranagar Metro'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Lesson Modal with Conflict Guard */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-xs animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Schedule Driving Lesson</h3>
            <p className="text-slate-500 text-[11px] mb-4">Auto-validates instructor & vehicle calendar slots</p>

            <form onSubmit={handleSchedule} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="">Select Enrolled Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.studentCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Instructor *</label>
                <select
                  required
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((ins) => (
                    <option key={ins.id} value={ins.id}>{ins.fullName} ({ins.rating}⭐)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Training Vehicle *</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model} - {v.transmission})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={lessonDate}
                    onChange={(e) => setLessonDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="08:00"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl font-medium font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-md"
                >
                  Verify & Book Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Star, Phone, MapPin, Calendar, Clock, ArrowLeft, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';

export const InstructorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.getInstructorById(id).then(res => setInstructor(res.data)).catch(console.error);
    }
  }, [id]);

  if (!instructor) return <div className="p-8 text-center text-xs text-slate-400">Loading Instructor Profile...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/instructors" className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">{instructor.fullName} ({instructor.instructorCode})</h1>
          <p className="text-xs text-slate-500">{instructor.area} Hub • {instructor.experienceYears} Years Driving Faculty</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Faculty Overview</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Rating:</span> <strong className="text-amber-600 font-bold">{instructor.rating} ⭐</strong></div>
            <div className="flex justify-between"><span className="text-slate-400">Driving Licence:</span> <span className="font-mono font-bold text-slate-800">{instructor.drivingLicence}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Base Salary:</span> <CurrencyDisplay amount={instructor.baseSalary} /></div>
            <div className="flex justify-between"><span className="text-slate-400">Commission Rate:</span> <CurrencyDisplay amount={instructor.commissionPerLesson} />/lesson</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Completed & Scheduled Lessons</h3>
          <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
            {(instructor.lessons || []).map((l: any) => (
              <div key={l.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{l.student?.fullName || 'Student'}</p>
                  <p className="text-slate-500 mt-0.5">{new Date(l.lessonDate).toLocaleDateString()} ({l.startTime} - {l.endTime})</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

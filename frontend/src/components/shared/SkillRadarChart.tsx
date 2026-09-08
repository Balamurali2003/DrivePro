import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, AlertCircle, Award } from 'lucide-react';

interface SkillItem {
  name: string;
  score: number;
  proficiency: string;
}

interface SkillRadarProps {
  skills?: SkillItem[];
  progressPercentage?: number;
}

const defaultSkills: SkillItem[] = [
  { name: 'Clutch Control', score: 4, proficiency: 'GOOD' },
  { name: 'Gear Shifting', score: 5, proficiency: 'EXCELLENT' },
  { name: 'Steering & Turns', score: 4, proficiency: 'GOOD' },
  { name: 'Mirror & Signals', score: 5, proficiency: 'EXCELLENT' },
  { name: 'Reverse Parking', score: 3, proficiency: 'PRACTICING' },
  { name: 'Hill Start', score: 3, proficiency: 'PRACTICING' },
  { name: 'Lane Changing', score: 4, proficiency: 'GOOD' },
  { name: 'Traffic Signals', score: 5, proficiency: 'EXCELLENT' },
];

export const SkillRadarChart: React.FC<SkillRadarProps> = ({ skills = defaultSkills, progressPercentage = 65 }) => {
  const chartData = skills.map(s => ({
    subject: s.name,
    score: s.score * 20, // out of 100
    fullMark: 100,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-600" />
            17-Skill Driving Competency Radar
          </h3>
          <p className="text-xs text-slate-500">Real-time driver capability breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-brand-600">{progressPercentage}%</span>
          <p className="text-[10px] uppercase font-bold text-slate-400">Course Mastery</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
            <Radar name="Student Proficiency" dataKey="score" stroke="#0284c7" fill="#38bdf8" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Key Skills Checklist</h4>
        <div className="grid grid-cols-2 gap-2">
          {skills.map((sk, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <span className="font-medium text-slate-700">{sk.name}</span>
              <span className="flex items-center gap-1">
                {sk.score >= 4 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="font-semibold text-slate-800">{sk.score}/5</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, User, GraduationCap, Car, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [leadsRes, studentsRes, vehRes, usedCarRes] = await Promise.all([
          api.getLeads({ search: query, limit: 4 }),
          api.getStudents({ search: query, limit: 4 }),
          api.getVehicles({ search: query }),
          api.getUsedCars({ search: query }),
        ]);

        const combined = [
          ...(leadsRes.data || []).map((l: any) => ({ ...l, itemType: 'LEAD', title: l.fullName, code: l.leadCode, path: `/leads` })),
          ...(studentsRes.data || []).map((s: any) => ({ ...s, itemType: 'STUDENT', title: s.fullName, code: s.studentCode, path: `/students/${s.id}` })),
          ...(vehRes.data || []).slice(0, 3).map((v: any) => ({ ...v, itemType: 'VEHICLE', title: `${v.registrationNumber} (${v.model})`, code: v.vehicleCode, path: `/vehicles/${v.id}` })),
          ...(usedCarRes.data || []).slice(0, 3).map((c: any) => ({ ...c, itemType: 'USED_CAR', title: `${c.make} ${c.model} (${c.registrationNumber})`, code: c.carCode, path: `/used-cars/${c.id}` })),
        ];

        setResults(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-brand-600" />
          <input
            type="text"
            placeholder="Type student name, lead ID, vehicle registration number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching directory records...</div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  navigate(r.path);
                  onClose();
                }}
                className="p-3 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs">
                    {r.itemType === 'LEAD' ? <User className="w-4 h-4 text-blue-600" /> :
                     r.itemType === 'STUDENT' ? <GraduationCap className="w-4 h-4 text-emerald-600" /> :
                     r.itemType === 'VEHICLE' ? <Car className="w-4 h-4 text-amber-600" /> : <Car className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{r.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{r.code} • {r.area || r.transmission || r.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {r.itemType}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))
          ) : query ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching records found for "{query}"</div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Quick search anything across Leads, Students, Instructors, Fleet, Billing & Used Cars.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

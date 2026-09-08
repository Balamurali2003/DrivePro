import React from 'react';
import { MapPin, Navigation, Car, Users, CheckCircle, Compass, RefreshCw } from 'lucide-react';
import { InteractiveMap } from '../components/shared/InteractiveMap';

export const TerritoryMapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-brand-600" />
            Live Territory Radar & GPS Lead Map
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time geolocation mapping of current student inquiries & training applicants across Tirunelveli district
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS Connected</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            Tirunelveli Region
          </span>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <InteractiveMap />
    </div>
  );
};

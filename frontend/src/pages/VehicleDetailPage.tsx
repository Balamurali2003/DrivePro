import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Car, Wrench, Fuel, ShieldAlert, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.getVehicleById(id).then(res => setVehicle(res.data)).catch(console.error);
    }
  }, [id]);

  if (!vehicle) return <div className="p-8 text-center text-xs text-slate-400">Loading Vehicle Records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/vehicles" className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">{vehicle.make} {vehicle.model} ({vehicle.registrationNumber})</h1>
          <p className="text-xs text-slate-500">{vehicle.fuelType} • {vehicle.transmission} • {vehicle.currentKm.toLocaleString()} KM Total Run</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">RTO Compliance & Fitness</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-slate-400">Insurance Expiry:</span> <span className="font-bold text-slate-800">{new Date(vehicle.insuranceExpiry).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">PUC Emission Expiry:</span> <span className="font-bold text-slate-800">{new Date(vehicle.pucExpiry).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">RTO Fitness Expiry:</span> <span className="font-bold text-slate-800">{new Date(vehicle.fitnessExpiry).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Assigned Driver:</span> <span className="font-bold text-brand-600">{vehicle.assignedInstructor?.fullName || 'Unassigned'}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Service Maintenance Logs</h3>
          <div className="space-y-3">
            {(vehicle.maintenanceLogs || []).map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{m.serviceType} ({m.invoiceNumber})</p>
                  <p className="text-slate-500 mt-0.5">{m.notes} • Vendor: {m.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900"><CurrencyDisplay amount={m.cost} /></p>
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

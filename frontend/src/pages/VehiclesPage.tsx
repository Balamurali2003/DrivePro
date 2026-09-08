import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Search, Wrench, Fuel, Shield, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('Maruti Suzuki');
  const [model, setModel] = useState('Swift VXI (Dual-Control)');
  const [year, setYear] = useState('2023');
  const [fuelType, setFuelType] = useState('PETROL');
  const [transmission, setTransmission] = useState('MANUAL');
  const [currentKm, setCurrentKm] = useState('14500');

  const fetchVehicles = () => {
    api.getVehicles().then(res => setVehicles(res.data || [])).catch(console.error);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNumber.trim() || !model.trim()) {
      toast.error('Registration number and vehicle model are required.');
      return;
    }
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, {
          registrationNumber,
          make,
          model,
          year: parseInt(year),
          fuelType,
          transmission,
          currentKm: parseInt(currentKm),
        });
        toast.success('Vehicle updated successfully');
      } else {
        await api.createVehicle({
          registrationNumber,
          make,
          model,
          year: parseInt(year),
          fuelType,
          transmission,
          currentKm: parseInt(currentKm),
          color: 'White',
        });
        toast.success('Vehicle added to fleet successfully');
      }
      setShowModal(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vehicle');
    }
  };

  const handleEditOpen = (v: any) => {
    setEditingVehicle(v);
    setRegistrationNumber(v.registrationNumber);
    setMake(v.make);
    setModel(v.model);
    setYear(String(v.year || 2023));
    setFuelType(v.fuelType || 'PETROL');
    setTransmission(v.transmission || 'MANUAL');
    setCurrentKm(String(v.currentKm || 15000));
    setShowModal(true);
  };

  const handleDelete = async (id: string, reg: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle "${reg}" from fleet?`)) return;
    try {
      await api.deleteVehicle(id);
      toast.success('Vehicle deleted from fleet');
      fetchVehicles();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Car className="w-6 h-6 text-brand-600" />
            Vehicle Fleet & Maintenance Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage dual-control training cars, insurance renewals, PUC & fitness ({vehicles.length} cars)</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setRegistrationNumber('');
            setMake('Maruti Suzuki');
            setModel('Swift VXI (Dual-Control)');
            setYear('2023');
            setFuelType('PETROL');
            setTransmission('MANUAL');
            setCurrentKm('14500');
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Fleet Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-brand-700">{v.registrationNumber}</span>
                <div className="flex items-center gap-1">
                  <StatusBadge status={v.status || 'AVAILABLE'} />
                  <button onClick={() => handleEditOpen(v)} className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-50 rounded cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(v.id, v.registrationNumber)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-extrabold text-slate-900 text-base">{v.year} {v.make} {v.model}</h3>
              
              <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Transmission:</span>
                  <strong className="text-slate-900 font-bold">{v.transmission} • {v.fuelType}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Current Odometer:</span>
                  <strong className="font-mono text-slate-900">{v.currentKm?.toLocaleString()} km</strong>
                </div>
                <div className="flex justify-between">
                  <span>Assigned Instructor:</span>
                  <strong className="text-brand-700">{v.assignedInstructor?.fullName || 'Shared Pool'}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Dual-Control Fitted
              </span>
              <Link to={`/vehicles/${v.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                Health Log →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Car className="w-5 h-5 text-brand-600" />
              {editingVehicle ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Register dual-control training vehicle</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number *</label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KA01-MG-2041"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g. Maruti Suzuki"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Swift VXI Dual"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATIC">Automatic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Odometer (km)</label>
                <input
                  type="number"
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
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
                  {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

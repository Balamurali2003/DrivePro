import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, CreditCard, BookOpen, Calendar, Shield, AlertCircle } from 'lucide-react';
import { Student } from '../../types';
import { api } from '../../services/api';
import { toast } from 'sonner';

interface EditStudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: Student) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    fullName: student.fullName || '',
    phone: student.phone || '',
    whatsappNumber: student.whatsappNumber || student.phone || '',
    email: student.email || '',
    gender: student.gender || 'Male',
    age: student.age ? String(student.age) : '',
    address: student.address || '',
    area: student.area || '',
    location: student.location || student.area || '',
    city: student.city || 'Tirunelveli',
    district: student.district || 'Tirunelveli',
    state: student.state || 'Tamil Nadu',
    pincode: student.pincode || '',
    latitude: student.latitude !== undefined && student.latitude !== null ? String(student.latitude) : '',
    longitude: student.longitude !== undefined && student.longitude !== null ? String(student.longitude) : '',
    emergencyContactName: student.emergencyContactName || '',
    emergencyContactPhone: student.emergencyContactPhone || '',
    courseJoined: student.courseJoined || 'LMV Driving',
    trainingRequirement: student.trainingRequirement || 'Both Licence + Driving',
    classPreference: student.classPreference || 'Weekend Class',
    batch: student.batch || 'Morning',
    vehicleType: student.vehicleType || 'Car (4W)',
    licenseStatus: student.licenseStatus || 'LLR Applied',
    status: student.status || 'ACTIVE',
    joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '',
    assignedInstructorId: student.assignedInstructorId || '',
    assignedVehicleId: student.assignedVehicleId || '',
    totalFees: student.totalFees !== undefined && student.totalFees !== null ? String(student.totalFees) : '8500',
    paidAmount: student.paidAmount !== undefined && student.paidAmount !== null ? String(student.paidAmount) : '0',
    notes: student.notes || '',
  });

  const [instructors, setInstructors] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: student.fullName || '',
        phone: student.phone || '',
        whatsappNumber: student.whatsappNumber || student.phone || '',
        email: student.email || '',
        gender: student.gender || 'Male',
        age: student.age ? String(student.age) : '',
        address: student.address || '',
        area: student.area || '',
        location: student.location || student.area || '',
        city: student.city || 'Tirunelveli',
        district: student.district || 'Tirunelveli',
        state: student.state || 'Tamil Nadu',
        pincode: student.pincode || '',
        latitude: student.latitude !== undefined && student.latitude !== null ? String(student.latitude) : '',
        longitude: student.longitude !== undefined && student.longitude !== null ? String(student.longitude) : '',
        emergencyContactName: student.emergencyContactName || '',
        emergencyContactPhone: student.emergencyContactPhone || '',
        courseJoined: student.courseJoined || 'LMV Driving',
        trainingRequirement: student.trainingRequirement || 'Both Licence + Driving',
        classPreference: student.classPreference || 'Weekend Class',
        batch: student.batch || 'Morning',
        vehicleType: student.vehicleType || 'Car (4W)',
        licenseStatus: student.licenseStatus || 'LLR Applied',
        status: student.status || 'ACTIVE',
        joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '',
        assignedInstructorId: student.assignedInstructorId || '',
        assignedVehicleId: student.assignedVehicleId || '',
        totalFees: student.totalFees !== undefined && student.totalFees !== null ? String(student.totalFees) : '8500',
        paidAmount: student.paidAmount !== undefined && student.paidAmount !== null ? String(student.paidAmount) : '0',
        notes: student.notes || '',
      });

      api.getInstructors().then(r => setInstructors(r.data || [])).catch(() => {});
      api.getVehicles().then(r => setVehicles(r.data || [])).catch(() => {});
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  // Live balance calculation
  const totalNum = parseFloat(formData.totalFees) || 0;
  const paidNum = parseFloat(formData.paidAmount) || 0;
  const liveBalance = Math.max(0, totalNum - paidNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Student full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Student phone number is required');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        whatsappNumber: formData.whatsappNumber.trim() || formData.phone.trim(),
        email: formData.email.trim() || null,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : null,
        address: formData.address.trim() || null,
        area: formData.area.trim() || formData.location.trim() || null,
        location: formData.location.trim() || formData.area.trim() || null,
        city: formData.city.trim() || 'Tirunelveli',
        district: formData.district.trim() || 'Tirunelveli',
        state: formData.state.trim() || 'Tamil Nadu',
        pincode: formData.pincode.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        emergencyContactName: formData.emergencyContactName.trim() || null,
        emergencyContactPhone: formData.emergencyContactPhone.trim() || null,
        courseJoined: formData.courseJoined.trim() || null,
        trainingRequirement: formData.trainingRequirement,
        classPreference: formData.classPreference,
        batch: formData.batch,
        vehicleType: formData.vehicleType,
        licenseStatus: formData.licenseStatus,
        status: formData.status,
        joiningDate: formData.joiningDate ? formData.joiningDate : null,
        assignedInstructorId: formData.assignedInstructorId || null,
        assignedVehicleId: formData.assignedVehicleId || null,
        totalFees: totalNum,
        paidAmount: paidNum,
        balanceAmount: liveBalance,
        notes: formData.notes.trim() || null,
      };

      const res = await api.patchStudent(student.id, payload);
      toast.success(`Student profile for ${res.data.fullName} [${student.studentCode}] updated successfully!`);
      onSaved(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update student profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Edit Student Profile
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                  {student.studentCode}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Update enrolled student details, preferences, fees, and allocations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
          {/* Section 1: Personal & Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
              <User className="w-4 h-4 text-brand-600" />
              <span>Personal & Contact Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student ID (Read-only)</label>
                <input
                  type="text"
                  disabled
                  value={student.studentCode}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono font-bold cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="16"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  placeholder="Parent / Spouse Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  placeholder="+91 98400 12345"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Course, Training & Student Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span>Course & Training Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Joined *</label>
                <input
                  type="text"
                  required
                  value={formData.courseJoined}
                  onChange={(e) => setFormData({ ...formData, courseJoined: e.target.value })}
                  placeholder="e.g. 4-Wheeler Car Training"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Training Requirement</label>
                <select
                  value={formData.trainingRequirement}
                  onChange={(e) => setFormData({ ...formData, trainingRequirement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="Both Licence + Driving">Both Licence + Driving</option>
                  <option value="Driving Only">Driving Only</option>
                  <option value="Licence Only">Licence Only</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Preference</label>
                <select
                  value={formData.classPreference}
                  onChange={(e) => setFormData({ ...formData, classPreference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  <option value="Weekend Class">Weekend Class</option>
                  <option value="Weekdays Class">Weekdays Class</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch</label>
                <select
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Morning">🌅 Morning</option>
                  <option value="Evening">🌇 Evening</option>
                  <option value="Weekend">📅 Weekend</option>
                  <option value="Fast Track">⚡ Fast Track</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="Car (4W)">🚗 Car (4W)</option>
                  <option value="Two Wheeler (2W)">🏍️ Two Wheeler (2W)</option>
                  <option value="Heavy Commercial">🚛 Heavy Commercial</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">License Status</label>
                <select
                  value={formData.licenseStatus}
                  onChange={(e) => setFormData({ ...formData, licenseStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="LLR Applied">LLR Applied</option>
                  <option value="LLR Issued">LLR Issued</option>
                  <option value="DL Test Pending">DL Test Pending</option>
                  <option value="DL Issued">DL Issued</option>
                  <option value="LMV Issued">LMV Issued</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-brand-700"
                >
                  <option value="ACTIVE">ACTIVE (In Training)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ON_HOLD">ON HOLD</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Instructor</label>
                <select
                  value={formData.assignedInstructorId}
                  onChange={(e) => setFormData({ ...formData, assignedInstructorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="">⚡ Auto / Unassigned</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Vehicle</label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                >
                  <option value="">⚡ Auto / Unassigned</option>
                  {vehicles.map(veh => (
                    <option key={veh.id} value={veh.id}>
                      {veh.model} ({veh.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Location & Geocoding */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Location & Service Area</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Door No, Street Name, Landmark..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value, area: e.target.value })}
                  placeholder="e.g. Palayamkottai, Vannarpettai"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Tirunelveli"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Tirunelveli"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Tamil Nadu"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="627002"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fees & Live Balance Calculation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-slate-900 font-extrabold text-sm">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Fees & Payment Balance</span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Agreed Fees (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.totalFees}
                    onChange={(e) => setFormData({ ...formData, totalFees: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Calculated Balance (₹)</label>
                  <div className={`px-3 py-2 rounded-xl font-mono font-black text-sm flex items-center justify-between border ${
                    liveBalance > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  }`}>
                    <span>₹{liveBalance.toLocaleString()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {liveBalance > 0 ? 'Pending' : 'Fully Paid'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Live Balance Formula: <code className="bg-slate-200 px-1 rounded text-[10px]">Total Fees - Paid Amount</code>. Editing these values directly updates the student record without generating duplicate payment transactions.
              </p>
            </div>
          </div>

          {/* Section 5: Internal Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Student / Instructor Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal remarks on learning pace, shift preferences..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Student Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

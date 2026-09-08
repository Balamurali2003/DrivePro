import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, PhoneCall, UserPlus, ArrowLeft, 
  History, MessageCircle, Mail, Users, Clock, Calendar, X,
  UserCheck, ChevronDown, Edit2, Trash2, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/shared/StatusBadge';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [showCommModal, setShowCommModal] = useState(false);
  const [editingCommId, setEditingCommId] = useState<string | null>(null);
  const [commFilterSpeakingWith, setCommFilterSpeakingWith] = useState('ALL');
  const [commFilterType, setCommFilterType] = useState('ALL');
  const [commFilterDirection, setCommFilterDirection] = useState('ALL');
  const [commSearchTerm, setCommSearchTerm] = useState('');
  const [commForm, setCommForm] = useState({
    speakingWithType: 'Client / Lead',
    speakingWithName: '',
    communicationType: 'Phone Call',
    direction: 'Outgoing',
    subject: '',
    notes: '',
    communicationDate: new Date().toISOString().split('T')[0],
    communicationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    nextFollowupDate: '',
    nextFollowupTime: '11:00 AM',
    staffMember: '',
  });
  const navigate = useNavigate();

  const fetchLead = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getLeadById(id);
      setLead(res.data);
    } catch {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    api.getUsers().then(res => {
      if (res.data) setStaffUsers(res.data.filter((u: any) => u.role !== 'STUDENT'));
    }).catch(console.error);
  }, [id]);

  const openAddCommModal = () => {
    setEditingCommId(null);
    setCommForm({
      speakingWithType: 'Client / Lead',
      speakingWithName: lead?.fullName || '',
      communicationType: 'Phone Call',
      direction: 'Outgoing',
      subject: '',
      notes: '',
      communicationDate: new Date().toISOString().split('T')[0],
      communicationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nextFollowupDate: '',
      nextFollowupTime: '11:00 AM',
      staffMember: user?.name || 'Receptionist / Staff',
    });
    setShowCommModal(true);
  };

  const handleSpeakingWithTypeChange = (type: string) => {
    setCommForm(prev => ({
      ...prev,
      speakingWithType: type,
      speakingWithName: type === 'Client / Lead' ? (lead?.fullName || '') : (prev.speakingWithType === 'Client / Lead' ? '' : prev.speakingWithName),
    }));
  };

  const handleStartEditComm = (c: any) => {
    setEditingCommId(c.id);
    setCommForm({
      speakingWithType: c.speakingWithType || 'Client / Lead',
      speakingWithName: c.speakingWithName || lead?.fullName || '',
      communicationType: c.communicationType,
      direction: c.direction as any,
      subject: c.subject || '',
      notes: c.notes,
      communicationDate: new Date(c.communicationDate).toISOString().split('T')[0],
      communicationTime: c.communicationTime || '10:30 AM',
      nextFollowupDate: c.nextFollowupDate ? new Date(c.nextFollowupDate).toISOString().split('T')[0] : '',
      nextFollowupTime: c.nextFollowupTime || '11:00 AM',
      staffMember: c.staffMember || user?.name || 'Staff',
    });
    setShowCommModal(true);
  };

  const handleDeleteComm = async (commId: string) => {
    if (!lead) return;
    if (!window.confirm('Are you sure you want to delete this communication record?')) return;
    try {
      await api.deleteLeadCommunication(lead.id, commId);
      toast.success('Communication record deleted successfully');
      fetchLead();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete communication record');
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !commForm.notes.trim()) {
      toast.error('Discussion notes are required.');
      return;
    }
    try {
      if (editingCommId) {
        await api.updateLeadCommunication(lead.id, editingCommId, commForm);
        toast.success('Communication updated successfully');
      } else {
        await api.createLeadCommunication(lead.id, commForm);
        toast.success('Communication logged successfully');
      }
      setShowCommModal(false);
      setEditingCommId(null);
      fetchLead();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save communication');
    }
  };

  const handleConvert = async () => {
    try {
      const res = await api.convertLead(lead.id, {
        totalFee: 8850,
        paidAmount: 5000,
        paymentMode: 'UPI',
      });
      toast.success('Lead converted to Registered Student STU-2001!');
      navigate(`/students/${res.data.student.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Loading Lead Profile...</div>;
  if (!lead) return <div className="p-8 text-center text-xs text-slate-400">Lead not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/leads" className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">{lead.fullName}</h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{lead.leadCode}</span>
              <StatusBadge status={lead.status} />
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {lead.trainingRequirement || 'Both Licence + Driving'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                📅 {lead.classPreference || 'Weekend Class'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Inquired on {new Date(lead.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-brand-600" />
            + Log Communication
          </button>
          {lead.status !== 'CONVERTED' ? (
            <button
              onClick={handleConvert}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              1-Click Convert to Student
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs">
              ✓ Enrolled Student
            </span>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2">Candidate Specifications</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Mobile Phone:</span>
              <strong className="text-slate-900 font-mono">{lead.phone}</strong>
            </div>
            <div className="flex justify-between">
              <span>Email Address:</span>
              <strong className="text-slate-900">{lead.email || 'None provided'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Training Requirement:</span>
              <strong className="text-indigo-700 font-bold">{lead.trainingRequirement || 'Both Licence + Driving'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Class Preference:</span>
              <strong className="text-purple-700 font-bold">{lead.classPreference || 'Weekend Class'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Preferred Gearbox:</span>
              <strong className="text-slate-900 font-bold">{lead.transmission}</strong>
            </div>
            <div className="flex justify-between">
              <span>Area / Branch:</span>
              <strong className="text-slate-900">{lead.area}</strong>
            </div>
            <div className="flex justify-between">
              <span>Source:</span>
              <strong className="text-slate-900">{lead.leadSource}</strong>
            </div>
            <div className="flex justify-between">
              <span>Budget:</span>
              <CurrencyDisplay amount={lead.budget || 8500} />
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span>Assigned Staff:</span>
              <strong className={lead.assignedTo ? "text-indigo-700 font-bold" : "text-amber-600 font-bold"}>
                {lead.assignedTo ? `${lead.assignedTo.name}` : '⚡ Unassigned'}
              </strong>
            </div>
          </div>
        </div>

        {/* AI Score & Recommendation */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Conversion Propensity
              </h3>
              <span className={`text-sm font-black ${lead.aiScore > 75 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {lead.aiScore}%
              </span>
            </div>
            <p className="text-xs text-slate-600 bg-amber-50/60 p-3 rounded-2xl border border-amber-200 font-medium">
              💡 <strong>AI Guidance:</strong> {lead.aiRecommendation || 'Follow up with trial booking slot and fee breakdown.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Assigned Staff:</span>
              {lead.assignedTo ? (
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                  👤 {lead.assignedTo.name} ({lead.assignedTo.role?.replace('_', ' ')})
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  ⚡ Unassigned
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Reassign to:</label>
              <div className="relative flex-1">
                <select
                  value={lead.assignedToId || lead.assignedTo?.id || ''}
                  onChange={async (e) => {
                    const newId = e.target.value;
                    try {
                      await api.patchLead(lead.id, { assignedToId: newId || null });
                      const assignedUser = staffUsers.find(u => u.id === newId);
                      toast.success(`Lead reassigned to ${assignedUser ? assignedUser.name : 'Unassigned'}`);
                      setLead((prev: any) => ({
                        ...prev,
                        assignedToId: newId || null,
                        assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email, role: assignedUser.role } : null
                      }));
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to reassign lead');
                    }
                  }}
                  className="w-full text-xs font-bold py-1.5 pl-2.5 pr-6 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">⚡ Unassigned</option>
                  {staffUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Next Followup Card */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-5 text-white shadow-md shadow-brand-500/20 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-full">
              Follow-up Status
            </span>
            <h3 className="text-lg font-black mt-2">Next Scheduled Action</h3>
            <p className="text-xs text-brand-100 mt-1">
              {lead.followups && lead.followups[0] ? lead.followups[0].notes : 'No scheduled follow-up pending. Log a call or message.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
            <span>Date: {lead.followups && lead.followups[0] ? new Date(lead.followups[0].followupDate).toLocaleDateString() : 'Not Set'}</span>
            <button
              onClick={() => setShowCommModal(true)}
              className="px-3 py-1 bg-white text-brand-700 rounded-xl font-extrabold hover:bg-brand-50 cursor-pointer"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {/* COMMUNICATION HISTORY TIMELINE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600" />
              Communication History Timeline
            </h3>
            <p className="text-xs text-slate-500">Chronological activity log of calls, WhatsApp chats, SMS, emails & meetings</p>
          </div>
          <button
            onClick={openAddCommModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            + Add Communication
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600 text-[11px]">Speaking With:</span>
            <select
              value={commFilterSpeakingWith}
              onChange={(e) => setCommFilterSpeakingWith(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Relationships</option>
              <option value="Client / Lead">Client / Lead</option>
              <option value="Parent">Parent</option>
              <option value="Spouse">Spouse</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Friend">Friend</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600 text-[11px]">Type:</span>
            <select
              value={commFilterType}
              onChange={(e) => setCommFilterType(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Types</option>
              <option value="Phone Call">📞 Phone Call</option>
              <option value="WhatsApp Message">💬 WhatsApp</option>
              <option value="SMS">📱 SMS</option>
              <option value="Email">✉️ Email</option>
              <option value="Direct Meeting">👥 Direct Meeting</option>
              <option value="Other">📝 Other</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-bold text-slate-600 text-[11px]">Direction:</span>
            <select
              value={commFilterDirection}
              onChange={(e) => setCommFilterDirection(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All</option>
              <option value="Outgoing">Outgoing</option>
              <option value="Incoming">Incoming</option>
            </select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              value={commSearchTerm}
              onChange={(e) => setCommSearchTerm(e.target.value)}
              placeholder="Search notes or person..."
              className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        {(() => {
          const comms = lead.communications || [];
          const filtered = comms.filter((c: any) => {
            if (commFilterSpeakingWith !== 'ALL' && (c.speakingWithType || 'Client / Lead') !== commFilterSpeakingWith) return false;
            if (commFilterType !== 'ALL' && c.communicationType !== commFilterType) return false;
            if (commFilterDirection !== 'ALL' && c.direction !== commFilterDirection) return false;
            if (commSearchTerm.trim()) {
              const q = commSearchTerm.toLowerCase();
              const matchNotes = c.notes?.toLowerCase().includes(q);
              const matchSubject = c.subject?.toLowerCase().includes(q);
              const matchName = (c.speakingWithName || '').toLowerCase().includes(q);
              const matchStaff = c.staffMember?.toLowerCase().includes(q);
              if (!matchNotes && !matchSubject && !matchName && !matchStaff) return false;
            }
            return true;
          });

          if (comms.length === 0) {
            return (
              <div className="text-center py-8 text-slate-400 text-xs">
                No communication history logged for this client yet. Click "+ Add Communication" to record one.
              </div>
            );
          }

          if (filtered.length === 0) {
            return (
              <div className="text-center py-8 text-slate-400 text-xs">
                No communication records match the selected filters.
              </div>
            );
          }

          return (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filtered.map((c: any) => (
                <div key={c.id} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 hover:bg-slate-50/90 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          {c.communicationType === 'Phone Call' && <PhoneCall className="w-3.5 h-3.5 text-brand-600" />}
                          {c.communicationType === 'WhatsApp Message' && <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
                          {c.communicationType === 'Email' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                          {c.communicationType === 'Direct Meeting' && <Users className="w-3.5 h-3.5 text-purple-600" />}
                          {c.communicationType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.direction === 'Incoming' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.direction === 'Incoming' ? '↙ Incoming' : '↗ Outgoing'}
                        </span>

                        {/* Speaking With Display */}
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-[11px] flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-600" />
                          Speaking With: <strong className="font-extrabold">{c.speakingWithType || 'Client / Lead'}</strong> — {c.speakingWithName || lead.fullName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(c.communicationDate).toLocaleDateString()} {c.communicationTime ? `• ${c.communicationTime}` : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditComm(c)}
                            className="p-1 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Edit Communication"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteComm(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Delete Communication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {c.subject && (
                      <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        Topic: {c.subject}
                      </div>
                    )}

                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                      {c.notes}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex-wrap gap-2">
                      <span>Staff Member: <strong className="text-slate-800 font-bold">{c.staffMember}</strong></span>
                      {c.nextFollowupDate && (
                        <span className="text-brand-700 font-bold flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                          <Calendar className="w-3 h-3" />
                          Next Follow-up: {new Date(c.nextFollowupDate).toLocaleDateString()} {c.nextFollowupTime ? `- ${c.nextFollowupTime}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT COMMUNICATION MODAL */}
      {showCommModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-brand-600" />
                {editingCommId ? 'Edit Communication Record' : 'Log Communication Record'}
              </h3>
              <button
                onClick={() => { setShowCommModal(false); setEditingCommId(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommunication} className="space-y-3.5 text-xs">
              {/* FEATURE: Speaking With & Person Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-indigo-100">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Speaking With *
                  </label>
                  <select
                    required
                    value={commForm.speakingWithType}
                    onChange={(e) => handleSpeakingWithTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Client / Lead">Client / Lead</option>
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={commForm.speakingWithName}
                    onChange={(e) => setCommForm({ ...commForm, speakingWithName: e.target.value })}
                    placeholder={commForm.speakingWithType === 'Client / Lead' ? lead.fullName : 'Enter person\'s name'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {commForm.speakingWithType === 'Client / Lead'
                      ? 'Auto-populated with lead\'s name (editable)'
                      : `Specify the ${commForm.speakingWithType.toLowerCase()}'s name`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Communication Type *</label>
                  <select
                    value={commForm.communicationType}
                    onChange={(e) => setCommForm({ ...commForm, communicationType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Phone Call">📞 Phone Call</option>
                    <option value="WhatsApp Message">💬 WhatsApp Message</option>
                    <option value="SMS">📱 SMS Message</option>
                    <option value="Email">✉️ Email</option>
                    <option value="Direct Meeting">👥 Direct Meeting</option>
                    <option value="Other">📝 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Direction *</label>
                  <select
                    value={commForm.direction}
                    onChange={(e) => setCommForm({ ...commForm, direction: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Outgoing">Outgoing (Staff to Client)</option>
                    <option value="Incoming">Incoming (Client to Staff)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Topic / Subject</label>
                  <input
                    type="text"
                    value={commForm.subject}
                    onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                    placeholder="e.g. Discussed Fee Plan & Slot"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Member</label>
                  <input
                    type="text"
                    value={commForm.staffMember}
                    onChange={(e) => setCommForm({ ...commForm, staffMember: e.target.value })}
                    placeholder={user?.name || 'Staff Name'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={commForm.communicationDate}
                    onChange={(e) => setCommForm({ ...commForm, communicationDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time *</label>
                  <input
                    type="text"
                    required
                    value={commForm.communicationTime}
                    onChange={(e) => setCommForm({ ...commForm, communicationTime: e.target.value })}
                    placeholder="10:30 AM"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={commForm.nextFollowupDate}
                    onChange={(e) => setCommForm({ ...commForm, nextFollowupDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Follow-up Time</label>
                  <input
                    type="text"
                    value={commForm.nextFollowupTime}
                    onChange={(e) => setCommForm({ ...commForm, nextFollowupTime: e.target.value })}
                    placeholder="11:00 AM"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discussion Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={commForm.notes}
                  onChange={(e) => setCommForm({ ...commForm, notes: e.target.value })}
                  placeholder="Detailed notes of what was discussed, answers given, next steps..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCommModal(false); setEditingCommId(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  {editingCommId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

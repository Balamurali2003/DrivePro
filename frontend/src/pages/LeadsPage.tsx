import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Search, Download, Upload, MessageSquare, Sparkles, UserCheck, 
  Eye, Edit2, Trash2, PhoneCall, PhoneOff, XCircle, Clock, PartyPopper,
  Info, Calendar, CheckCircle2, Copy, Check, ExternalLink, History, 
  FileSpreadsheet, AlertTriangle, ArrowRight, X, ChevronDown, RefreshCw,
  PhoneForwarded, PhoneIncoming, MessageCircle, Mail, Users, FileText,
  MapPin, Zap, Flame, ShieldAlert, Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { Lead, LeadCommunication, LeadImportHistory } from '../types';
import { StatusBadge } from '../components/shared/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Status Option Definitions with Icons & Message Templates
interface StatusDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  message: (leadName: string) => string;
  suggestedAction: string;
}

const STATUS_OPTIONS: StatusDefinition[] = [
  {
    id: 'Call - Not Attended',
    label: 'Call - Not Attended',
    icon: PhoneOff,
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    message: (name) => `Hello ${name}, we tried to contact you regarding your driving school inquiry, but we could not reach you. Please let us know a convenient time to call you back.`,
    suggestedAction: 'Schedule a follow-up call.'
  },
  {
    id: 'Contacted - Not Interested',
    label: 'Contacted - Not Interested',
    icon: XCircle,
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    message: (name) => `Hello ${name}, thank you for your interest in our driving school. We understand that you are not interested at the moment. Please feel free to contact us in the future whenever you require driving lessons or licence assistance.`,
    suggestedAction: 'Mark the lead as not interested and close the current follow-up.'
  },
  {
    id: 'Contacted - Interested (Need Time)',
    label: 'Contacted - Interested (Need Time)',
    icon: Clock,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    message: (name) => `Hello ${name}, thank you for showing interest in our driving school services. We understand that you need some time to decide. We will follow up with you at a convenient time. Please feel free to contact us if you have any questions.`,
    suggestedAction: 'Set the next follow-up date and time.'
  },
  {
    id: 'Today Come to Join',
    label: 'Today Come to Join',
    icon: PartyPopper,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    message: (name) => `Hello ${name}, thank you for your interest in joining our driving school. We are happy to welcome you today. Please visit our driving school to complete your registration and enrollment process.`,
    suggestedAction: 'Mark as expected to join today and prepare for student registration.'
  }
];

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [reqFilter, setReqFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'leadSequence' | 'priority'>('leadSequence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dynamicSources, setDynamicSources] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff Assignment State
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffMappings, setStaffMappings] = useState<Record<string, string>>({});

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [priorityModalLead, setPriorityModalLead] = useState<Lead | null>(null);

  // Communication History Modal
  const [activeCommLead, setActiveCommLead] = useState<Lead | null>(null);
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [showAddCommForm, setShowAddCommForm] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
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

  // Status Action Workflow Modal
  const [activeWorkflowLead, setActiveWorkflowLead] = useState<Lead | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [workflowForm, setWorkflowForm] = useState({
    communicationType: 'Phone Call',
    notes: '',
    nextFollowUpDate: '',
    nextFollowUpTime: '11:00 AM',
    notInterestedReason: 'Price',
    staffMember: 'Counselor / Admissions',
  });

  // Status Message Info Popover/Modal
  const [statusInfoModal, setStatusInfoModal] = useState<{ lead: Lead; statusDef: StatusDefinition } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Reset Leads Data Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resettingLeads, setResettingLeads] = useState(false);

  // Bulk Excel Import Multi-Step Wizard State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadedColumns, setUploadedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [rawUploadedRows, setRawUploadedRows] = useState<any[]>([]);
  const [previewFilterTab, setPreviewFilterTab] = useState<'ALL' | 'VALID' | 'DUPLICATES' | 'INVALID'>('ALL');
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [validationSummary, setValidationSummary] = useState<{
    total: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    unknownStaffCount?: number;
    unknownStaffNames?: string[];
    invalidRows: Array<{ rowNum: number; error: string; data: any }>;
    duplicateRows: Array<{ rowNum: number; phone: string; data: any; reason?: string }>;
    validRows: any[];
  } | null>(null);
  const [importMode, setImportMode] = useState<'import_valid' | 'skip_duplicates' | 'update_duplicates'>('import_valid');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [importHistories, setImportHistories] = useState<LeadImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add / Edit Lead Form
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    currentLocation: string;
    originalLocation: string;
    area: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    latitude: number | '';
    longitude: number | '';
    leadSource: string;
    trainingRequirement: 'Licence Only' | 'Driving Only' | 'Both Licence + Driving';
    classPreference: 'Weekend Class' | 'Weekdays Class';
    transmission: 'MANUAL' | 'AUTOMATIC' | 'BOTH';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    budget: string;
    notes: string;
    assignedToId: string;
  }>({
    fullName: '',
    phone: '',
    email: '',
    currentLocation: '',
    originalLocation: '',
    area: 'Tirunelveli',
    city: 'Tirunelveli',
    district: 'Tirunelveli',
    state: 'Tamil Nadu',
    pincode: '',
    latitude: '',
    longitude: '',
    leadSource: 'Direct Enquiry',
    trainingRequirement: 'Both Licence + Driving',
    classPreference: 'Weekend Class',
    transmission: 'MANUAL',
    priority: 'MEDIUM',
    budget: '8500',
    notes: '',
    assignedToId: '',
  });

  // Load dynamic lead sources, locations & CRM staff users from database
  useEffect(() => {
    api.getLeadSources().then(res => {
      if (res.data) setDynamicSources(res.data);
    }).catch(console.error);

    api.getLeadLocations().then(res => {
      if (res.data?.locations) {
        setLocationSuggestions(res.data.locations);
      } else if (Array.isArray(res.data)) {
        setLocationSuggestions(res.data);
      }
    }).catch(console.error);

    api.getUsers().then(res => {
      if (res.data) {
        setStaffUsers(res.data.filter((u: any) => u.role !== 'STUDENT'));
      }
    }).catch(console.error);
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.getLeads({
        search,
        status: statusFilter,
        source: sourceFilter,
        priority: priorityFilter,
        trainingRequirement: reqFilter,
        classPreference: classFilter,
        assignedTo: assignedToFilter,
        sortBy,
        sortOrder,
        limit: '500'
      });
      setLeads(res.data || []);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter, priorityFilter, reqFilter, classFilter, assignedToFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Status Action Selection
  const handleSelectStatus = (lead: Lead, newStatus: string) => {
    const statusDef = STATUS_OPTIONS.find(s => s.id === newStatus);
    const defaultMsg = statusDef ? statusDef.message(lead.fullName) : '';

    setActiveWorkflowLead(lead);
    setPendingStatus(newStatus);
    setWorkflowForm({
      communicationType: 'Phone Call',
      notes: defaultMsg,
      nextFollowUpDate: newStatus === 'Call - Not Attended' || newStatus === 'Contacted - Interested (Need Time)'
        ? new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
        : '',
      nextFollowUpTime: '11:00 AM',
      notInterestedReason: 'Price',
      staffMember: 'Counselor / Staff',
    });
  };

  // Submit Status Workflow Update
  const handleConfirmStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkflowLead) return;

    try {
      await api.updateLeadStatus(activeWorkflowLead.id, {
        status: pendingStatus,
        communicationType: workflowForm.communicationType,
        notes: workflowForm.notes,
        nextFollowUpDate: workflowForm.nextFollowUpDate || undefined,
        nextFollowUpTime: workflowForm.nextFollowUpTime || undefined,
        notInterestedReason: pendingStatus === 'Contacted - Not Interested' ? workflowForm.notInterestedReason : undefined,
        staffMember: workflowForm.staffMember,
      });

      toast.success(`Status updated to "${pendingStatus}" for ${activeWorkflowLead.fullName}`);
      setActiveWorkflowLead(null);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Quick Convert to Student
  const handleQuickConvertToStudent = async (lead: Lead) => {
    try {
      const res = await api.convertLead(lead.id, {
        totalFee: lead.budget || 8850,
        paidAmount: 5000,
        paymentMode: 'UPI',
      });
      toast.success(`🎉 ${lead.fullName} enrolled as Student!`);
      if (res.data?.student?.id) {
        navigate(`/students/${res.data.student.id}`);
      } else {
        fetchLeads();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to convert lead');
    }
  };

  // Create Lead
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error('Full name and mobile phone are required.');
      return;
    }
    try {
      await api.createLead(formData);
      toast.success(`Lead registered successfully for ${formData.fullName}`);
      setShowCreateModal(false);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create lead');
    }
  };

  // Edit Lead
  const handleEditOpen = (l: Lead) => {
    setEditingLead(l);
    setFormData({
      fullName: l.fullName,
      phone: l.phone,
      email: l.email || '',
      currentLocation: l.currentLocation || l.normalizedLocation || l.originalLocation || l.location || '',
      originalLocation: l.originalLocation || l.location || 'Original Imported Excel Location',
      area: l.area || l.currentLocation || l.normalizedLocation || 'Tirunelveli',
      city: l.city || 'Tirunelveli',
      district: l.district || 'Tirunelveli',
      state: l.state || 'Tamil Nadu',
      pincode: l.pincode || '',
      latitude: (typeof l.latitude === 'number' ? l.latitude : ''),
      longitude: (typeof l.longitude === 'number' ? l.longitude : ''),
      leadSource: l.leadSource || 'Direct Enquiry',
      trainingRequirement: (l.trainingRequirement as any) || 'Both Licence + Driving',
      classPreference: (l.classPreference as any) || 'Weekend Class',
      transmission: l.transmission || 'MANUAL',
      priority: (l.priorityLevel as any) || l.priority || 'MEDIUM',
      budget: String(l.budget || 8500),
      notes: l.notes || '',
      assignedToId: l.assignedToId || l.assignedTo?.id || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      await api.updateLead(editingLead.id, formData);
      toast.success('Lead updated successfully');
      setEditingLead(null);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update lead');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete lead "${name}"?`)) return;
    try {
      await api.deleteLead(id);
      toast.success('Lead deleted successfully');
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete lead');
    }
  };

  // Communication History Modal
  const openCommunicationModal = async (lead: Lead) => {
    setActiveCommLead(lead);
    setShowAddCommForm(false);
    setEditingCommId(null);
    setCommFilterSpeakingWith('ALL');
    setCommFilterType('ALL');
    setCommFilterDirection('ALL');
    setCommSearchTerm('');
    setCommForm({
      speakingWithType: 'Client / Lead',
      speakingWithName: lead.fullName,
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
    try {
      setCommLoading(true);
      const res = await api.getLeadCommunications(lead.id);
      setCommunications(res.data || []);
    } catch {
      toast.error('Failed to load communication history');
    } finally {
      setCommLoading(false);
    }
  };

  const handleSpeakingWithTypeChange = (type: string) => {
    setCommForm(prev => ({
      ...prev,
      speakingWithType: type,
      speakingWithName: type === 'Client / Lead' ? (activeCommLead?.fullName || '') : (prev.speakingWithType === 'Client / Lead' ? '' : prev.speakingWithName),
    }));
  };

  const handleStartEditComm = (c: LeadCommunication) => {
    setEditingCommId(c.id);
    setCommForm({
      speakingWithType: c.speakingWithType || 'Client / Lead',
      speakingWithName: c.speakingWithName || activeCommLead?.fullName || '',
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
    setShowAddCommForm(true);
  };

  const handleDeleteComm = async (commId: string) => {
    if (!activeCommLead) return;
    if (!window.confirm('Are you sure you want to delete this communication record?')) return;
    try {
      await api.deleteLeadCommunication(activeCommLead.id, commId);
      toast.success('Communication record deleted successfully');
      setCommunications(prev => prev.filter(c => c.id !== commId));
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete communication record');
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommLead) return;
    if (!commForm.notes.trim()) {
      toast.error('Discussion notes are required.');
      return;
    }
    try {
      if (editingCommId) {
        const res = await api.updateLeadCommunication(activeCommLead.id, editingCommId, commForm);
        toast.success('Communication record updated successfully');
        setCommunications(prev => prev.map(c => c.id === editingCommId ? res.data : c));
        setEditingCommId(null);
      } else {
        const res = await api.createLeadCommunication(activeCommLead.id, commForm);
        toast.success('Communication logged successfully');
        setCommunications(prev => [res.data, ...prev]);
      }
      setShowAddCommForm(false);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save communication');
    }
  };

  // ==========================================
  // FEATURE 1: BULK EXCEL IMPORT & VALIDATION
  // ==========================================
  const handleDownloadExcelTemplate = () => {
    const sampleStaff = staffUsers.length > 0 ? staffUsers[0].name : "Ramesh Kumar";
    const sampleRows = [
      {
        "Name": "Rohan Deshmukh",
        "Phone": "+91 98450 12345",
        "Email": "rohan.d@example.com",
        "Address": "Indiranagar, Bengaluru",
        "Location": "Indiranagar",
        "Lead Source": "WEBSITE",
        "Campaign": "Bangalore Driving",
        "Training Requirement": "Both Licence + Driving",
        "Class Preference": "Weekend Class",
        "Status": "NEW",
        "Priority": "HIGH",
        "Assigned To": sampleStaff,
        "Expected Joining Date": "2026-09-15",
        "Follow-up Date": "2026-09-10",
        "Notes": "Interested in morning 8 AM batch"
      },
      {
        "Name": "Sneha Patil",
        "Phone": "+91 97412 67890",
        "Email": "sneha.p@example.com",
        "Address": "Koramangala, Bengaluru",
        "Location": "Koramangala",
        "Lead Source": "INSTAGRAM",
        "Campaign": "Social Media Ad",
        "Training Requirement": "Driving Only",
        "Class Preference": "Weekdays Class",
        "Status": "NEW",
        "Priority": "MEDIUM",
        "Assigned To": "Unassigned",
        "Expected Joining Date": "2026-09-20",
        "Follow-up Date": "2026-09-12",
        "Notes": "Wants automatic car training"
      },
      {
        "Name": "Vikram Malhotra",
        "Phone": "+91 99002 33441",
        "Email": "vikram.m@example.com",
        "Address": "HSR Layout, Bengaluru",
        "Location": "HSR Layout",
        "Lead Source": "GOOGLE_ADS",
        "Campaign": "Search Promo",
        "Training Requirement": "Licence Only",
        "Class Preference": "Weekend Class",
        "Status": "NEW",
        "Priority": "HIGH",
        "Assigned To": staffUsers.length > 1 ? staffUsers[1].name : "Priya Sharma",
        "Expected Joining Date": "2026-09-18",
        "Follow-up Date": "2026-09-11",
        "Notes": "RTO endorsement required"
      }
    ];

    const wb = XLSX.utils.book_new();

    // Sheet 1: LeadsTemplate
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    XLSX.utils.book_append_sheet(wb, ws, "LeadsTemplate");

    // Sheet 2: Staff List (Reference for Assigned To)
    const staffRows = staffUsers.map(u => ({
      "Staff ID": u.id,
      "Staff Name": u.name,
      "Role": u.role?.replace('_', ' ') || 'Staff',
      "Email": u.email
    }));
    const wsStaff = XLSX.utils.json_to_sheet(staffRows.length > 0 ? staffRows : [
      { "Staff ID": "staff-1", "Staff Name": "Ramesh Kumar", "Role": "OWNER", "Email": "owner@drivepro.com" }
    ]);
    XLSX.utils.book_append_sheet(wb, wsStaff, "Staff List");

    XLSX.writeFile(wb, "DrivePro_Leads_Import_Template.xlsx");
    toast.success("Excel template downloaded with Sheet 1 (Template) & Sheet 2 (Staff List reference)!");
  };

  const CRM_MAPPING_FIELDS = [
    { key: 'SKIP', label: '— Skip this column —' },
    { key: 'fullName', label: 'Lead Name / Full Name *', required: true },
    { key: 'phone', label: 'Mobile / Phone Number *', required: true },
    { key: 'location', label: 'Location / City / Address' },
    { key: 'area', label: 'Area / Locality' },
    { key: 'email', label: 'Email Address' },
    { key: 'leadSource', label: 'Lead Source' },
    { key: 'campaign', label: 'Campaign Name' },
    { key: 'interestedVehicle', label: 'Interested Vehicle / Car' },
    { key: 'trainingRequirement', label: 'Training Requirement / Course' },
    { key: 'classPreference', label: 'Class Preference / Batch' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedTo', label: 'Assigned Staff / Counselor' },
    { key: 'nextFollowUpAt', label: 'Next Follow-up Date' },
    { key: 'expectedJoiningDate', label: 'Expected Joining Date' },
    { key: 'notes', label: 'Notes / Remarks' },
  ];

  const autoDetectField = (colName: string): string => {
    const c = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (c.includes('name') || c.includes('candidate') || c.includes('client') || c.includes('student')) return 'fullName';
    if (c.includes('phone') || c.includes('mobile') || c.includes('contact') || c.includes('cell') || c.includes('call')) return 'phone';
    if (c.includes('mail')) return 'email';
    if (c.includes('city') || c.includes('location') || c.includes('address') || c.includes('loc') || c.includes('addr')) return 'location';
    if (c.includes('area')) return 'area';
    if (c.includes('source')) return 'leadSource';
    if (c.includes('status')) return 'status';
    if (c.includes('camp')) return 'campaign';
    if (c.includes('vehicle') || c.includes('car') || c.includes('model')) return 'interestedVehicle';
    if (c.includes('train') || c.includes('course') || c.includes('req')) return 'trainingRequirement';
    if (c.includes('class') || c.includes('batch') || c.includes('timing') || c.includes('sched')) return 'classPreference';
    if (c.includes('prior')) return 'priority';
    if (c.includes('staff') || c.includes('assign') || c.includes('agent') || c.includes('counselor')) return 'assignedTo';
    if (c.includes('follow')) return 'nextFollowUpAt';
    if (c.includes('join')) return 'expectedJoiningDate';
    if (c.includes('note') || c.includes('remark') || c.includes('comment') || c.includes('feed')) return 'notes';
    return 'SKIP';
  };

  // Safe Leads Data Reset Handler
  const handleResetLeadsData = async () => {
    try {
      setResettingLeads(true);
      const res = await api.resetLeadsData();
      toast.success(res.message || 'All existing lead data has been removed successfully.');
      setShowResetConfirmModal(false);
      setLeads([]);
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset lead data');
    } finally {
      setResettingLeads(false);
    }
  };

  // Step 1: File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawData.length === 0) {
          toast.error("Uploaded file is empty.");
          return;
        }

        setRawUploadedRows(rawData);

        // Detect all unique columns
        const detectedCols: string[] = [];
        rawData.forEach(row => {
          Object.keys(row).forEach(k => {
            const trimmed = k.trim();
            if (trimmed && !detectedCols.includes(trimmed)) {
              detectedCols.push(trimmed);
            }
          });
        });

        setUploadedColumns(detectedCols);

        // Auto-detect and suggest column mappings
        const initialMapping: Record<string, string> = {};
        const usedCrmKeys = new Set<string>();

        detectedCols.forEach(col => {
          const detected = autoDetectField(col);
          if (detected !== 'SKIP' && !usedCrmKeys.has(detected)) {
            initialMapping[col] = detected;
            usedCrmKeys.add(detected);
          } else {
            initialMapping[col] = 'SKIP';
          }
        });

        setColumnMapping(initialMapping);
        setImportStep('mapping');
        toast.info(`Detected ${detectedCols.length} columns and ${rawData.length} rows. Please review column mappings.`);
      } catch (err: any) {
        toast.error("Error reading file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Step 2: Proceed from Column Mapping to Preview & Duplicate Check
  const handleProceedToPreview = () => {
    const mappedToName = Object.values(columnMapping).includes('fullName');
    const mappedToPhone = Object.values(columnMapping).includes('phone');

    if (!mappedToName || !mappedToPhone) {
      toast.error('Both "Lead Name" and "Mobile / Phone Number" columns must be mapped to proceed.');
      return;
    }

    const existingPhones = new Set(
      leads.map(l => l.phone.replace(/\D/g, '').slice(-10)).filter(Boolean)
    );

    const knownStaffIds = new Set(staffUsers.map(u => u.id));
    const knownStaffExact = new Set(staffUsers.map(u => u.name.trim().toLowerCase()));
    const knownStaffNorm = new Set(staffUsers.map(u => u.name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase()));

    const seenInFile = new Set<string>();
    const invalidRows: Array<{ rowNum: number; error: string; data: any }> = [];
    const duplicateRows: Array<{ rowNum: number; phone: string; data: any; reason?: string }> = [];
    const validRows: any[] = [];
    const allMappedRows: any[] = [];
    const unknownStaffSet = new Set<string>();

    rawUploadedRows.forEach((rawRow, idx) => {
      const rowNum = idx + 2;
      const mappedRow: any = {};

      Object.entries(columnMapping).forEach(([excelCol, crmField]) => {
        if (crmField && crmField !== 'SKIP') {
          mappedRow[crmField] = rawRow[excelCol];
        }
      });

      const name = String(mappedRow.fullName || '').trim();
      const phone = String(mappedRow.phone || '').trim();
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      mappedRow._rowNum = rowNum;
      mappedRow._cleanPhone = cleanPhone;

      // Check Assigned Staff
      const rawAssigned = String(mappedRow.assignedTo || '').trim();
      if (rawAssigned && rawAssigned.toLowerCase() !== 'unassigned' && rawAssigned !== '-') {
        const cleanAssigned = rawAssigned.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
        const matched = knownStaffIds.has(rawAssigned) ||
                        knownStaffExact.has(rawAssigned.toLowerCase()) ||
                        knownStaffNorm.has(cleanAssigned);
        if (!matched) {
          unknownStaffSet.add(rawAssigned);
        }
      }

      if (!name) {
        mappedRow._statusType = 'INVALID';
        mappedRow._statusReason = 'Name is required';
        invalidRows.push({ rowNum, error: 'Name is required', data: mappedRow });
      } else if (!cleanPhone || cleanPhone.length < 8) {
        mappedRow._statusType = 'INVALID';
        mappedRow._statusReason = 'Invalid mobile number (< 8 digits)';
        invalidRows.push({ rowNum, error: 'Valid phone number is required', data: mappedRow });
      } else if (seenInFile.has(cleanPhone)) {
        mappedRow._statusType = 'DUPLICATE';
        mappedRow._statusReason = 'Duplicate phone number in uploaded file';
        duplicateRows.push({ rowNum, phone: cleanPhone, data: mappedRow, reason: 'Duplicate in uploaded file' });
      } else if (existingPhones.has(cleanPhone)) {
        mappedRow._statusType = 'DUPLICATE';
        mappedRow._statusReason = 'Phone number already exists in CRM database';
        duplicateRows.push({ rowNum, phone: cleanPhone, data: mappedRow, reason: 'Already exists in CRM database' });
        seenInFile.add(cleanPhone);
      } else {
        seenInFile.add(cleanPhone);
        mappedRow._statusType = 'VALID';
        validRows.push(mappedRow);
      }

      allMappedRows.push(mappedRow);
    });

    // Default unknown staff mappings
    const initMappings: Record<string, string> = {};
    unknownStaffSet.forEach(sName => {
      initMappings[sName] = 'UNASSIGNED';
    });
    setStaffMappings(initMappings);

    setValidationSummary({
      total: rawUploadedRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicateRows.length,
      unknownStaffCount: unknownStaffSet.size,
      unknownStaffNames: Array.from(unknownStaffSet),
      invalidRows,
      duplicateRows,
      validRows,
    });

    setImportPreviewRows(allMappedRows);
    setPreviewFilterTab('ALL');
    setImportStep('preview');
  };

  // Step 3: Execute Lead Import
  const handleExecuteImport = async () => {
    if (!validationSummary || !importFile) return;

    try {
      setImporting(true);

      let leadsToSend: any[] = [];
      if (importMode === 'import_valid' || importMode === 'skip_duplicates') {
        leadsToSend = validationSummary.validRows;
      } else if (importMode === 'update_duplicates') {
        leadsToSend = [...validationSummary.validRows, ...validationSummary.duplicateRows.map(d => d.data)];
      }

      if (leadsToSend.length === 0) {
        toast.error('No valid leads to import under the selected duplicate mode.');
        return;
      }

      const res = await api.importLeads({
        leads: leadsToSend,
        fileName: importFile.name,
        mode: importMode,
        importedBy: user?.name || 'Staff',
        staffMappings: staffMappings,
      });

      setImportResult(res.summary);
      setImportStep('complete');
      toast.success(
        `Successfully imported ${res.summary.successfulRecords} leads! ${res.summary.failedRecords} invalid rows rejected, ${res.summary.duplicateRecords} duplicates handled.`
      );
      fetchLeads();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import leads');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenImportHistory = async () => {
    setShowHistoryModal(true);
    try {
      setLoadingHistory(true);
      const res = await api.getLeadImportHistory();
      setImportHistories(res.data || []);
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Helper to render Status Badge with dropdown trigger
  const renderStatusDropdown = (lead: Lead) => {
    const currentStatusDef = STATUS_OPTIONS.find(s => s.id === lead.status);

    return (
      <div className="flex items-center gap-1">
        {/* Status Dropdown */}
        <div className="relative inline-block">
          <select
            value={lead.status}
            onChange={(e) => handleSelectStatus(lead, e.target.value)}
            className={`text-[11px] font-extrabold py-1.5 pl-2.5 pr-6 rounded-xl border transition-all cursor-pointer appearance-none ${
              currentStatusDef
                ? `${currentStatusDef.badgeBg} ${currentStatusDef.badgeText} ${currentStatusDef.badgeBorder} shadow-2xs`
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {/* Show current status if standard like NEW, CONVERTED */}
            {!currentStatusDef && <option value={lead.status}>{lead.status}</option>}
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-semibold py-1">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* FEATURE 3: Information Icon ⓘ next to status */}
        {currentStatusDef && (
          <button
            type="button"
            onClick={() => setStatusInfoModal({ lead, statusDef: currentStatusDef })}
            className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
            title="View message template & suggested action"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}

        {/* If Today Come to Join: Show Quick Action "Convert to Student" */}
        {(lead.status === 'Today Come to Join' || lead.status === 'Expected Today') && (
          <button
            onClick={() => handleQuickConvertToStudent(lead)}
            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-xs cursor-pointer flex items-center gap-1 animate-pulse"
            title="Quick Convert to Enrolled Student"
          >
            <Sparkles className="w-2.5 h-2.5" /> Convert
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Admissions & Lead Management CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Excel bulk import, real-time status actions, message templates & chronological communication timeline ({leads.length} leads)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* FEATURE 1: Bulk Import Leads Button */}
          <button
            onClick={() => {
              setImportFile(null);
              setValidationSummary(null);
              setImportResult(null);
              setImportStep('upload');
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Bulk Import Leads
          </button>

          {/* Import History Button */}
          <button
            onClick={handleOpenImportHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            title="View Bulk Import Logs & Audit"
          >
            <History className="w-3.5 h-3.5" />
            Import History
          </button>

          {/* Safe Reset Leads Data Button */}
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            title="Safely reset all lead records to import a new Leads Excel file"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            Reset Leads Data
          </button>

          <button
            onClick={() => {
              setFormData({
                fullName: '',
                phone: '',
                email: '',
                currentLocation: '',
                originalLocation: '',
                area: 'Tirunelveli',
                city: 'Tirunelveli',
                district: 'Tirunelveli',
                state: 'Tamil Nadu',
                pincode: '',
                latitude: '',
                longitude: '',
                leadSource: 'Direct Enquiry',
                trainingRequirement: 'Both Licence + Driving',
                classPreference: 'Weekend Class',
                transmission: 'MANUAL',
                priority: 'MEDIUM',
                budget: '8500',
                notes: '',
                assignedToId: '',
              });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add New Lead
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, phone, lead code, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">🔥 HIGH Priority</option>
            <option value="MEDIUM">⚡ MEDIUM Priority</option>
            <option value="LOW">💤 LOW Priority</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Call - Not Attended">Call - Not Attended</option>
            <option value="Contacted - Not Interested">Contacted - Not Interested</option>
            <option value="Contacted - Interested (Need Time)">Interested - Need Time</option>
            <option value="Today Come to Join">Expected Today</option>
            <option value="NEW">New</option>
            <option value="CONVERTED">Converted</option>
          </select>

          {/* Training Requirement Filter */}
          <select
            value={reqFilter}
            onChange={(e) => setReqFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Requirements</option>
            <option value="Licence Only">Licence Only</option>
            <option value="Driving Only">Driving Only</option>
            <option value="Both Licence + Driving">Both Licence + Driving</option>
          </select>

          {/* Class Preference Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Schedules</option>
            <option value="Weekend Class">Weekend Class</option>
            <option value="Weekdays Class">Weekdays Class</option>
          </select>

          {/* Source Filter (Dynamic from DB) */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Sources ({dynamicSources.length > 0 ? dynamicSources.length : 'All'})</option>
            {dynamicSources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>

          {/* Assigned To Filter */}
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Assigned Staff</option>
            <option value="UNASSIGNED">⚡ Unassigned Leads</option>
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.name} ({u.role?.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FEATURE 5: LEADS DATA TABLE OR EMPTY STATE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-400 shadow-inner">
              <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">No Leads Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Upload your new Leads Excel file to get started.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setValidationSummary(null);
                  setImportResult(null);
                  setImportStep('upload');
                  setShowImportModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                + Import Leads Excel
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th
                  onClick={() => {
                    if (sortBy === 'leadSequence') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('leadSequence');
                      setSortOrder('asc');
                    }
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  title="Click to sort by Continuous Lead ID"
                >
                  <div className="flex items-center gap-1.5 font-black text-slate-800">
                    <span>Lead ID</span>
                    {sortBy === 'leadSequence' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                        {sortOrder === 'asc' ? '↑ Continuous' : '↓ Newest'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Name, Phone & Location</th>
                <th className="py-3.5 px-4">Training Requirement</th>
                <th className="py-3.5 px-4">Class Preference</th>
                <th className="py-3.5 px-4">Source & Campaign</th>
                <th
                  onClick={() => {
                    if (sortBy === 'priority') {
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('priority');
                      setSortOrder('desc');
                    }
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  title="Click to sort by Auto Priority (HIGH -> MEDIUM -> LOW)"
                >
                  <div className="flex items-center gap-1.5 font-black text-slate-800">
                    <span>Priority</span>
                    {sortBy === 'priority' ? (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {sortOrder === 'desc' ? '↓ High First' : '↑ Low First'}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-semibold group-hover:text-slate-700">⇅</span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4">Status & Action</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Last Communication</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4 text-center">Comm. History</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((l) => {
                const latestComm = l.communications && l.communications.length > 0 ? l.communications[0] : null;
                const nextFollowup = l.nextFollowUpAt || (l.followups && l.followups.length > 0 ? l.followups[0]?.followupDate : null) || latestComm?.nextFollowupDate;

                return (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-brand-700">{l.leadCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{l.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span>{l.phone}</span>
                        {l.email && <span className="text-[10px] text-slate-400">({l.email})</span>}
                      </div>
                      {(l.currentLocation || l.normalizedLocation || l.originalLocation || l.location) && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5" title={l.currentLocation || l.normalizedLocation || l.originalLocation}>
                          <span>📍</span>
                          <span className="truncate max-w-[180px] font-medium">{l.area || l.currentLocation || l.originalLocation || l.location}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                        l.trainingRequirement === 'Both Licence + Driving' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        l.trainingRequirement === 'Driving Only' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {l.trainingRequirement || 'Both Licence + Driving'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.classPreference === 'Weekend Class' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        📅 {l.classPreference || 'Weekend Class'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{l.leadSource}</div>
                      {l.campaign && (
                        <div className="text-[10px] text-brand-600 font-medium truncate max-w-[130px]" title={l.campaign}>
                          🏷️ {l.campaign}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const level = l.priorityLevel || l.priority || 'MEDIUM';
                        const score = l.priorityScore ?? (level === 'HIGH' ? 82 : level === 'MEDIUM' ? 48 : 20);
                        const isHigh = level === 'HIGH' || level === 'URGENT';
                        const isMed = level === 'MEDIUM';

                        return (
                          <button
                            type="button"
                            onClick={() => setPriorityModalLead(l)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border transition-all hover:scale-105 cursor-pointer shadow-2xs ${
                              isHigh
                                ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                : isMed
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to view automatic priority calculation breakdown"
                          >
                            <span className={`w-2 h-2 rounded-full ${
                              isHigh ? 'bg-rose-500 animate-pulse' : isMed ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            <span>{level}</span>
                            <span className="opacity-30 font-normal">•</span>
                            <span className="font-mono text-[10px]">{score}</span>
                          </button>
                        );
                      })()}
                    </td>

                    {/* FEATURE 2 & 5: Interactive Status Dropdown & Info Icon */}
                    <td className="py-3.5 px-4">
                      {renderStatusDropdown(l)}
                    </td>

                    {/* Assigned To Staff Dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="relative inline-block w-36">
                        <select
                          value={l.assignedToId || l.assignedTo?.id || ''}
                          onChange={async (e) => {
                            const newId = e.target.value;
                            try {
                              await api.patchLead(l.id, { assignedToId: newId || null });
                              const assignedUser = staffUsers.find(u => u.id === newId);
                              toast.success(`Lead assigned to ${assignedUser ? assignedUser.name : 'Unassigned'}`);
                              setLeads(prev => prev.map(item => item.id === l.id ? {
                                ...item,
                                assignedToId: newId || undefined,
                                assignedTo: assignedUser ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email, role: assignedUser.role } : undefined
                              } : item));
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to reassign lead');
                            }
                          }}
                          className={`text-[11px] font-bold py-1 px-2.5 pr-6 rounded-xl border transition-all cursor-pointer appearance-none w-full truncate ${
                            (l.assignedToId || l.assignedTo)
                              ? 'bg-indigo-50/90 text-indigo-900 border-indigo-200 hover:bg-indigo-100/80 shadow-2xs'
                              : 'bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100/80 shadow-2xs'
                          }`}
                          title={l.assignedTo?.name ? `Assigned to ${l.assignedTo.name}` : 'Unassigned lead'}
                        >
                          <option value="">⚡ Unassigned</option>
                          {staffUsers.map((u) => (
                            <option key={u.id} value={u.id} className="bg-white text-slate-800 font-semibold">
                              {u.name} ({u.role?.replace('_', ' ')})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>

                    {/* Last Communication */}
                    <td className="py-3.5 px-4">
                      {latestComm ? (
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            {latestComm.communicationType === 'Phone Call' && <PhoneCall className="w-3 h-3 text-brand-600" />}
                            {latestComm.communicationType === 'WhatsApp Message' && <MessageCircle className="w-3 h-3 text-emerald-600" />}
                            {latestComm.communicationType === 'Email' && <Mail className="w-3 h-3 text-blue-600" />}
                            <span>{latestComm.communicationType}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(latestComm.communicationDate).toLocaleDateString()} {latestComm.communicationTime || ''}
                          </div>
                        </div>
                      ) : l.lastCommunicationAt ? (
                        <div className="text-[10px] text-slate-500 font-semibold">
                          {new Date(l.lastCommunicationAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No contact yet</span>
                      )}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4">
                      {nextFollowup ? (
                        <div className="font-semibold text-brand-700 flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(nextFollowup).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">—</span>
                      )}
                    </td>

                    {/* FEATURE 6: Communication History Quick Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openCommunicationModal(l)}
                        className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg font-bold inline-flex items-center gap-1 text-xs border border-brand-200 shadow-2xs cursor-pointer transition-all"
                        title="View Communication History & Timeline"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black">{l._count?.communications || (l.communications ? l.communications.length : 1)}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/leads/${l.id}`}
                          className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg font-semibold inline-flex items-center gap-1 text-xs"
                          title="View 360 Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleEditOpen(l)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold inline-flex items-center gap-1 text-xs cursor-pointer"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.fullName)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold inline-flex items-center gap-1 text-xs cursor-pointer"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

      {/* ========================================================================= */}
      {/* AUTOMATIC LEAD PRIORITY ASSESSMENT & BREAKDOWN MODAL */}
      {/* ========================================================================= */}
      {priorityModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl border ${
                  (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'HIGH' || (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'URGENT'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">Lead Priority Assessment</h3>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                      (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'HIGH' || (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'URGENT'
                        ? 'bg-rose-100 text-rose-800'
                        : (priorityModalLead.priorityLevel || priorityModalLead.priority) === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {priorityModalLead.priorityLevel || priorityModalLead.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Candidate: <strong className="text-slate-800">{priorityModalLead.fullName}</strong> ({priorityModalLead.leadCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPriorityModalLead(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Visual Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">Calculated Priority Score</span>
                <span className="text-lg font-black text-brand-700 font-mono">
                  {priorityModalLead.priorityScore ?? 50} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (priorityModalLead.priorityScore || 0) >= 70
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : (priorityModalLead.priorityScore || 0) >= 40
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, priorityModalLead.priorityScore ?? 50))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5 font-medium">
                <span>0 - 39: LOW (Cold / Low intent)</span>
                <span>40 - 69: MEDIUM (Warm prospect)</span>
                <span>70+: HIGH (High conversion intent)</span>
              </div>
            </div>

            {/* Breakdown Reasons */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                Contributing Factors & Scoring Drivers:
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {(() => {
                  let reasons: string[] = [];
                  if (priorityModalLead.priorityReasons) {
                    try {
                      reasons = JSON.parse(priorityModalLead.priorityReasons);
                    } catch {
                      reasons = [priorityModalLead.priorityReasons];
                    }
                  }
                  if (!reasons || reasons.length === 0) {
                    reasons = [
                      `Status: ${priorityModalLead.status}`,
                      `Requirement: ${priorityModalLead.trainingRequirement || 'Standard'}`,
                      `Source: ${priorityModalLead.leadSource || 'Direct Enquiry'}`
                    ];
                  }

                  return reasons.map((reason, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{reason}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Factor
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Real-Time Recalculation Notice */}
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 text-slate-700 text-[11px] leading-relaxed">
              <strong className="block text-blue-900 font-bold mb-0.5">Automated Intelligence:</strong>
              Priority is automatically calculated from real database indicators: lead status, follow-up timeline, joining readiness, course requirement, source channel, and verified communications. Priority recalculates whenever status or follow-up changes.
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">
                Last calculated: {priorityModalLead.priorityUpdatedAt ? new Date(priorityModalLead.priorityUpdatedAt).toLocaleDateString() : 'Real-time'}
              </span>
              <button
                onClick={() => setPriorityModalLead(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 3: STATUS MESSAGE & INFO MODAL */}
      {/* ========================================================================= */}
      {statusInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${statusInfoModal.statusDef.badgeBg} ${statusInfoModal.statusDef.badgeBorder} border`}>
                  <statusInfoModal.statusDef.icon className={`w-5 h-5 ${statusInfoModal.statusDef.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{statusInfoModal.statusDef.label}</h3>
                  <p className="text-[11px] text-slate-500">Candidate: <strong className="text-slate-800">{statusInfoModal.lead.fullName}</strong></p>
                </div>
              </div>
              <button
                onClick={() => { setStatusInfoModal(null); setCopiedMessage(false); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Suggested Communication Message:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(statusInfoModal.statusDef.message(statusInfoModal.lead.fullName));
                    setCopiedMessage(true);
                    toast.success("Message copied to clipboard!");
                    setTimeout(() => setCopiedMessage(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedMessage ? 'Copied' : 'Copy Text'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 font-medium leading-relaxed">
                "{statusInfoModal.statusDef.message(statusInfoModal.lead.fullName)}"
              </div>
            </div>

            {/* Suggested Action Box */}
            <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-200 text-slate-700">
              <strong className="block text-brand-800 font-extrabold text-[11px] mb-0.5">Suggested Next Action:</strong>
              <p className="text-slate-700 font-medium">{statusInfoModal.statusDef.suggestedAction}</p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={`https://wa.me/${statusInfoModal.lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(statusInfoModal.statusDef.message(statusInfoModal.lead.fullName))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Send via WhatsApp
              </a>

              <button
                onClick={() => { setStatusInfoModal(null); setCopiedMessage(false); }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 4: STATUS UPDATE WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {activeWorkflowLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  Status Update: {pendingStatus}
                </h3>
                <p className="text-xs text-slate-500">Lead: <strong className="text-slate-800">{activeWorkflowLead.fullName}</strong> ({activeWorkflowLead.phone})</p>
              </div>
              <button onClick={() => setActiveWorkflowLead(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmStatusUpdate} className="space-y-3.5">
              {/* Conditional Field: Not Interested Reason */}
              {pendingStatus === 'Contacted - Not Interested' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Not Interested *</label>
                  <select
                    value={workflowForm.notInterestedReason}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, notInterestedReason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800"
                  >
                    <option value="Price">Price / Course Fee too high</option>
                    <option value="Timing">Batch Timing does not suit</option>
                    <option value="Location">Distance / Location too far</option>
                    <option value="Already joined another school">Already joined another driving school</option>
                    <option value="Not interested">Not interested at this time</option>
                    <option value="Other">Other / Personal reasons</option>
                  </select>
                </div>
              )}

              {/* Conditional Fields: Next Follow-up Date & Time (for Call - Not Attended and Interested - Need Time) */}
              {(pendingStatus === 'Call - Not Attended' || pendingStatus === 'Contacted - Interested (Need Time)') && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Set Scheduled Follow-up Call
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        required
                        value={workflowForm.nextFollowUpDate}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, nextFollowUpDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Next Follow-up Time</label>
                      <input
                        type="text"
                        value={workflowForm.nextFollowUpTime}
                        onChange={(e) => setWorkflowForm({ ...workflowForm, nextFollowUpTime: e.target.value })}
                        placeholder="11:00 AM"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Banner: Today Come to Join */}
              {(pendingStatus === 'Today Come to Join' || pendingStatus === 'Expected Today') && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 font-medium">
                  🎉 <strong>Expected to join today!</strong> Mark candidate as arriving at the training center today for document verification and fee payment.
                </div>
              )}

              {/* Communication Channel & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Communication Channel</label>
                  <select
                    value={workflowForm.communicationType}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, communicationType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                  >
                    <option value="Phone Call">📞 Phone Call</option>
                    <option value="WhatsApp Message">💬 WhatsApp Message</option>
                    <option value="SMS">📱 SMS</option>
                    <option value="Direct Meeting">👥 Direct Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Member</label>
                  <input
                    type="text"
                    value={workflowForm.staffMember}
                    onChange={(e) => setWorkflowForm({ ...workflowForm, staffMember: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discussion Notes / Activity Log</label>
                <textarea
                  rows={3}
                  required
                  value={workflowForm.notes}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowLead(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  Confirm & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAFE RESET LEADS DATA CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 space-y-5 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reset Leads Data</h3>
                <p className="text-[11px] text-slate-500">Lead Database Maintenance & Fresh Import Preparation</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Permanent Data Removal Warning
              </div>
              <p className="text-xs text-rose-950 font-medium leading-relaxed">
                This will permanently remove all existing lead records, lead communication history, lead location history and lead import history. Student, enrollment, attendance and other CRM data will not be affected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={resettingLeads}
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resettingLeads}
                onClick={handleResetLeadsData}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-md shadow-rose-600/20 cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {resettingLeads ? 'Resetting Leads...' : 'Yes, Reset Leads Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 1: MULTI-STEP DYNAMIC BULK IMPORT LEADS WIZARD */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 md:p-7 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-5 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Import Leads from Excel / CSV</h3>
                  <p className="text-xs text-slate-500">
                    {importStep === 'upload' && 'Upload .xlsx, .xls, or .csv with custom or arbitrary column names'}
                    {importStep === 'mapping' && 'Map your uploaded file columns to CRM lead fields'}
                    {importStep === 'preview' && 'Review validation, duplicate check, and preview records before import'}
                    {importStep === 'complete' && 'Import process completed successfully'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Steps Progress Indicator */}
            <div className="grid grid-cols-4 gap-2 pb-1">
              {[
                { step: 'upload', label: '1. Upload File', desc: 'Select spreadsheet' },
                { step: 'mapping', label: '2. Column Mapping', desc: 'Map fields & skip' },
                { step: 'preview', label: '3. Validate & Preview', desc: 'Duplicate check' },
                { step: 'complete', label: '4. Complete', desc: 'Database updated' },
              ].map((s, idx) => {
                const isActive = importStep === s.step;
                const isPassed =
                  (s.step === 'upload' && importStep !== 'upload') ||
                  (s.step === 'mapping' && (importStep === 'preview' || importStep === 'complete')) ||
                  (s.step === 'preview' && importStep === 'complete');

                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-brand-50 border-brand-300 text-brand-900 shadow-2xs font-extrabold'
                        : isPassed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 text-xs">
                      {isPassed ? <Check className="w-3.5 h-3.5 text-emerald-600 font-black" /> : null}
                      <span>{s.label}</span>
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">{s.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* STEP 1: UPLOAD FILE */}
            {/* ------------------------------------------------------------- */}
            {importStep === 'upload' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Download Reference Template</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Optional starter template formatted with default columns and active staff directory for reference.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadExcelTemplate}
                      className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      Download Template (.xlsx)
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Select Your Leads File</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Supports <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Custom column headers are fully supported.
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {importFile ? importFile.name : 'Choose File to Upload'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="font-extrabold text-blue-900 text-xs">Flexible Header Support</h5>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      You don't need to rename your Excel columns before uploading. On the next screen, you can map any column name (e.g. <em>Client Name</em>, <em>Contact</em>, <em>City</em>, <em>Car Model</em>) directly to CRM fields or skip unneeded columns.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: COLUMN MAPPING */}
            {/* ------------------------------------------------------------- */}
            {importStep === 'mapping' && (
              <div className="space-y-4">
                {/* Mapping Status Banner */}
                {(() => {
                  const mappedName = Object.values(columnMapping).includes('fullName');
                  const mappedPhone = Object.values(columnMapping).includes('phone');
                  const allRequiredMapped = mappedName && mappedPhone;

                  return (
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        allRequiredMapped
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {allRequiredMapped ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <h5 className="font-extrabold text-xs">
                            {allRequiredMapped
                              ? 'Required Columns Successfully Mapped'
                              : 'Required Column Mapping Incomplete'}
                          </h5>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            {allRequiredMapped
                              ? 'Lead Name and Mobile Phone are both mapped. You can proceed or adjust optional field mappings.'
                              : 'You must map both "Lead Name / Full Name *" and "Mobile / Phone Number *" before proceeding to preview.'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono font-bold px-2 py-1 bg-white rounded-lg border border-slate-200">
                          {uploadedColumns.length} Columns Detected
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Column Mapping Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[46vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 sticky top-0 font-extrabold text-slate-700 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Excel / CSV Column Header</th>
                        <th className="py-2.5 px-3">Sample Value (Row 1)</th>
                        <th className="py-2.5 px-3">Maps to CRM Field</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uploadedColumns.map((col, idx) => {
                        const currentMappedKey = columnMapping[col] || 'SKIP';
                        const sampleVal = rawUploadedRows[0] ? String(rawUploadedRows[0][col] || '—') : '—';
                        const isRequired = currentMappedKey === 'fullName' || currentMappedKey === 'phone';

                        return (
                          <tr key={col} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2 px-3">
                              <span className="font-extrabold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {col}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-medium max-w-[180px] truncate" title={sampleVal}>
                              {sampleVal}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={currentMappedKey}
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setColumnMapping(prev => ({ ...prev, [col]: newVal }));
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                                  isRequired
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                                    : currentMappedKey !== 'SKIP'
                                    ? 'bg-brand-50 border-brand-300 text-brand-900 focus:ring-brand-500'
                                    : 'bg-white border-slate-200 text-slate-600 focus:ring-slate-400'
                                }`}
                              >
                                {CRM_MAPPING_FIELDS.map(f => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-center">
                              {currentMappedKey === 'SKIP' ? (
                                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">
                                  Skipped
                                </span>
                              ) : isRequired ? (
                                <span className="text-[10px] font-black text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">
                                  ✓ Required
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-brand-700 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200">
                                  Mapped
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    ← Back to File Upload
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToPreview}
                    className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-md shadow-brand-500/20 cursor-pointer inline-flex items-center gap-2"
                  >
                    Next: Validate & Preview ({rawUploadedRows.length} Rows) →
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: VALIDATE & PREVIEW */}
            {/* ------------------------------------------------------------- */}
            {importStep === 'preview' && validationSummary && (
              <div className="space-y-4">
                {/* Summary KPI Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-100 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Rows</span>
                    <h4 className="text-xl font-black text-slate-900">{validationSummary.total}</h4>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Valid Leads</span>
                    <h4 className="text-xl font-black text-emerald-700">{validationSummary.validCount}</h4>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Duplicates</span>
                    <h4 className="text-xl font-black text-amber-700">{validationSummary.duplicateCount}</h4>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700">Invalid Rows</span>
                    <h4 className="text-xl font-black text-rose-700">{validationSummary.invalidCount}</h4>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-700">Unknown Staff</span>
                    <h4 className="text-xl font-black text-purple-700">{validationSummary.unknownStaffCount ?? 0}</h4>
                  </div>
                </div>

                {/* Unknown Staff Mapping Section (if any detected) */}
                {validationSummary.unknownStaffNames && validationSummary.unknownStaffNames.length > 0 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h5 className="font-extrabold text-amber-950 text-xs">
                        Unknown Assigned Staff Detected ({validationSummary.unknownStaffNames.length})
                      </h5>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      The following staff names in the file do not match current CRM employees. Map each to a known staff member, leave unassigned, or skip rows:
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pt-1">
                      {validationSummary.unknownStaffNames.map(staffName => (
                        <div key={staffName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-xl border border-amber-200">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            "{staffName}"
                          </span>
                          <select
                            value={staffMappings[staffName] || 'UNASSIGNED'}
                            onChange={(e) => setStaffMappings(prev => ({ ...prev, [staffName]: e.target.value }))}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <option value="UNASSIGNED">⚡ Leave Unassigned</option>
                            {staffUsers.map(u => (
                              <option key={u.id} value={u.id}>
                                Map to: {u.name} ({u.role?.replace('_', ' ')})
                              </option>
                            ))}
                            <option value="SKIP">❌ Skip Rows</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate Handling Options */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="block font-bold text-slate-700">Choose Duplicate Handling Action:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'import_valid', label: 'Import Only Valid Leads', desc: 'Skip duplicate & invalid rows' },
                      { id: 'skip_duplicates', label: 'Skip Duplicates', desc: 'Prevent overwriting existing leads' },
                      { id: 'update_duplicates', label: 'Update Duplicate Leads', desc: 'Update details by phone number' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setImportMode(opt.id as any)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          importMode === opt.id
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{opt.label}</div>
                        <div className={`text-[10px] ${importMode === opt.id ? 'text-brand-100' : 'text-slate-400'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Tabs for Preview */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  {[
                    { id: 'ALL', label: `All Records (${validationSummary.total})` },
                    { id: 'VALID', label: `Valid Leads (${validationSummary.validCount})` },
                    { id: 'DUPLICATES', label: `Duplicates (${validationSummary.duplicateCount})` },
                    { id: 'INVALID', label: `Invalid Rows (${validationSummary.invalidCount})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPreviewFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-colors cursor-pointer ${
                        previewFilterTab === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 font-extrabold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Lead Name</th>
                        <th className="py-2 px-3">Mobile Phone</th>
                        <th className="py-2 px-3">Location</th>
                        <th className="py-2 px-3">Requirement</th>
                        <th className="py-2 px-3">Vehicle</th>
                        <th className="py-2 px-3">Assigned To</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewRows
                        .filter(row => {
                          if (previewFilterTab === 'VALID') return row._statusType === 'VALID';
                          if (previewFilterTab === 'DUPLICATES') return row._statusType === 'DUPLICATE';
                          if (previewFilterTab === 'INVALID') return row._statusType === 'INVALID';
                          return true;
                        })
                        .slice(0, 30)
                        .map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-mono text-slate-400">{row._rowNum}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{row.fullName || '—'}</td>
                            <td className="py-1.5 px-3 font-mono">{row.phone || '—'}</td>
                            <td className="py-1.5 px-3 text-slate-600">{row.location || '—'}</td>
                            <td className="py-1.5 px-3">{row.trainingRequirement || 'Both Licence + Driving'}</td>
                            <td className="py-1.5 px-3">{row.interestedVehicle || '—'}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-600">{row.assignedTo || 'Unassigned'}</td>
                            <td className="py-1.5 px-3 text-center">
                              {row._statusType === 'VALID' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  Valid
                                </span>
                              )}
                              {row._statusType === 'DUPLICATE' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800" title={row._statusReason}>
                                  Duplicate
                                </span>
                              )}
                              {row._statusType === 'INVALID' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800" title={row._statusReason}>
                                  Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setImportStep('mapping')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                  >
                    ← Back to Column Mapping
                  </button>
                  <button
                    type="button"
                    disabled={importing || (validationSummary.validCount === 0 && importMode !== 'update_duplicates')}
                    onClick={handleExecuteImport}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-md shadow-brand-500/20 cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {importing
                      ? 'Importing Leads...'
                      : `Import Valid Records (${
                          importMode === 'update_duplicates'
                            ? validationSummary.validCount + validationSummary.duplicateCount
                            : validationSummary.validCount
                        } Leads)`}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: COMPLETE */}
            {/* ------------------------------------------------------------- */}
            {importStep === 'complete' && importResult && (
              <div className="space-y-5 text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Import Completed Successfully!</h3>
                  <p className="text-xs text-slate-500">
                    Your leads have been imported and sequential continuous IDs (e.g. LEAD-0001, LEAD-0002...) were generated.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Imported Leads</span>
                    <h4 className="text-xl font-black text-emerald-800">{importResult.successfulRecords}</h4>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Duplicates Processed</span>
                    <h4 className="text-xl font-black text-amber-800">{importResult.duplicateRecords}</h4>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-rose-700">Invalid Skipped</span>
                    <h4 className="text-xl font-black text-rose-800">{importResult.failedRecords}</h4>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportStep('upload');
                    }}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-md cursor-pointer transition-all"
                  >
                    View Leads in CRM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 1: IMPORT HISTORY MODAL */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-extrabold text-slate-900">Lead Bulk Import Audit History</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingHistory ? (
                <div className="text-center py-8 text-slate-400">Loading audit logs...</div>
              ) : importHistories.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No import records found yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-3 px-3">Import Date</th>
                      <th className="py-3 px-3">File Name</th>
                      <th className="py-3 px-3">Total Rows</th>
                      <th className="py-3 px-3 text-emerald-600">Imported</th>
                      <th className="py-3 px-3 text-rose-600">Failed</th>
                      <th className="py-3 px-3 text-amber-600">Duplicates</th>
                      <th className="py-3 px-3">Imported By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importHistories.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono">{new Date(h.importedAt).toLocaleDateString()} {new Date(h.importedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{h.fileName}</td>
                        <td className="py-2.5 px-3 font-semibold">{h.totalRecords}</td>
                        <td className="py-2.5 px-3 font-black text-emerald-700">{h.successfulRecords}</td>
                        <td className="py-2.5 px-3 font-bold text-rose-600">{h.failedRecords}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-700">{h.duplicateRecords}</td>
                        <td className="py-2.5 px-3 text-slate-600">{h.importedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT LEAD MODAL */}
      {(showCreateModal || editingLead) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" />
                {editingLead ? `Edit Lead (${editingLead.leadCode})` : 'Register New Admission Inquiry'}
              </h3>
              <button
                onClick={() => { setShowCreateModal(false); setEditingLead(null); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Specify student prospect details, course requirements, and class schedule preferences
            </p>

            <form onSubmit={editingLead ? handleUpdate : handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prospect Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Murali Krishna"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="murali@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  Course / Training Requirement & Class Preference
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Course / Requirement *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Licence Only', label: '1. Licence Only', desc: 'RTO Assistance' },
                      { id: 'Driving Only', label: '2. Driving Only', desc: 'Practical Sessions' },
                      { id: 'Both Licence + Driving', label: '3. Both Licence + Driving', desc: 'Complete Program' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, trainingRequirement: opt.id as any })}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          formData.trainingRequirement === opt.id
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{opt.label}</div>
                        <div className={`text-[9px] ${formData.trainingRequirement === opt.id ? 'text-brand-100' : 'text-slate-400'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Class Preference *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Weekend Class', label: '1. Weekend Class', desc: 'Saturday & Sunday Batch' },
                      { id: 'Weekdays Class', label: '2. Weekdays Class', desc: 'Monday to Friday Batch' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, classPreference: opt.id as any })}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          formData.classPreference === opt.id
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{opt.label}</div>
                        <div className={`text-[9px] ${formData.classPreference === opt.id ? 'text-brand-100' : 'text-slate-400'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GEOGRAPHIC LOCATION & TERRITORY MAPPING SECTION */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-600" />
                    Geographic Location & Territory Mapping
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">Sri Munis Kanna Service Area</span>
                </div>

                {/* If Editing: Display Original Imported Location without overwriting */}
                {editingLead && formData.originalLocation && (
                  <div className="p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">
                        Original Imported Location (Excel)
                      </span>
                      <span className="font-bold text-slate-800 text-xs">{formData.originalLocation}</span>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Preserved in DB
                    </span>
                  </div>
                )}

                {/* Location Search / Autocomplete */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Current Location / Locality (Autocomplete) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="lead-location-datalist"
                      required
                      value={formData.currentLocation || formData.area}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, currentLocation: val, area: val });
                      }}
                      placeholder="e.g. Palayamkottai, Tirunelveli, Tenkasi..."
                      className="w-full px-3 py-2 pl-8 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500"
                    />
                    <MapPin className="w-4 h-4 text-brand-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <datalist id="lead-location-datalist">
                      {locationSuggestions.map((loc, idx) => (
                        <option key={idx} value={loc} />
                      ))}
                    </datalist>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select from {locationSuggestions.length} registered Tamil Nadu localities. Normalizes and updates coordinates automatically.
                  </p>
                </div>

                {/* City, District, State, Pincode */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                {/* Geocoded Coordinates with Live Map Sync notice */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-emerald-950 mb-1 text-[11px]">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="8.7139"
                        className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-xl bg-white font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-emerald-950 mb-1 text-[11px]">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="77.7567"
                        className="w-full px-2.5 py-1.5 border border-emerald-300 rounded-xl bg-white font-mono text-slate-900"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-medium leading-tight">
                    🗺️ <strong>Territory Live Map Sync:</strong> Coordinates auto-resolve from the Tamil Nadu GIS catalog. Saving updates the marker on the map without duplicating leads, and records a Location Audit log.
                  </p>
                </div>
              </div>

              {/* Lead Source, Budget & Assigned Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Source *</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    {dynamicSources.length > 0 ? (
                      dynamicSources.map((s) => <option key={s} value={s}>{s}</option>)
                    ) : (
                      <>
                        <option value="SMT Meta Ads">SMT Meta Ads</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Direct Enquiry">Direct Enquiry</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Website">Website</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="8500"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Staff</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    <option value="">⚡ Unassigned</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Prospect Comments</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional inquiry notes, preferred timing slot..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingLead(null); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  {editingLead ? 'Save Changes' : 'Save Lead & Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNICATION HISTORY TIMELINE MODAL */}
      {activeCommLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center font-black border border-brand-200">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    Communication History
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{activeCommLead.leadCode}</span>
                  </h3>
                  <p className="text-xs text-slate-500">{activeCommLead.fullName} • {activeCommLead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (showAddCommForm) {
                      setShowAddCommForm(false);
                      setEditingCommId(null);
                    } else {
                      setEditingCommId(null);
                      setCommForm({
                        speakingWithType: 'Client / Lead',
                        speakingWithName: activeCommLead.fullName,
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
                      setShowAddCommForm(true);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  {showAddCommForm ? 'View Timeline' : '+ Add Communication'}
                </button>
                <button
                  onClick={() => { setActiveCommLead(null); setEditingCommId(null); setShowAddCommForm(false); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Toolbar (Visible when not adding/editing) */}
            {!showAddCommForm && (
              <div className="py-2.5 px-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
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
            )}

            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar pr-1">
              {showAddCommForm ? (
                <form onSubmit={handleAddCommunication} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      {editingCommId ? 'Edit Communication Record' : 'Log New Call / Message / Meeting'}
                    </h4>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      Logged-in Staff: {user?.name || 'Staff'}
                    </span>
                  </div>

                  {/* FEATURE: Speaking With & Person Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-2xs">
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
                        placeholder={commForm.speakingWithType === 'Client / Lead' ? activeCommLead.fullName : 'Enter person\'s name'}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {commForm.speakingWithType === 'Client / Lead'
                          ? 'Auto-populated with lead\'s name (editable if required)'
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
                        placeholder="e.g. Discussed Weekend Batch Fees"
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
                      placeholder="Detailed notes of what was discussed, answers given, client reactions..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 font-medium"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowAddCommForm(false); setEditingCommId(null); }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                    >
                      {editingCommId ? 'Update Communication Record' : 'Save Communication Record'}
                    </button>
                  </div>
                </form>
              ) : null}

              {commLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading communication history...</div>
              ) : communications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No communication logs found for this lead. Click "+ Add Communication" to record one.
                </div>
              ) : (
                (() => {
                  const filtered = communications.filter(c => {
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

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No communication logs match the selected filters.
                      </div>
                    );
                  }

                  return (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {filtered.map((c) => (
                        <div key={c.id} className="relative group">
                          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center shadow-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 hover:bg-slate-50/90 transition-colors">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                  {c.communicationType}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  c.direction === 'Incoming' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {c.direction === 'Incoming' ? '↙ Incoming' : '↗ Outgoing'}
                                </span>

                                {/* FEATURE: Speaking With Display */}
                                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-[11px] flex items-center gap-1">
                                  <Users className="w-3 h-3 text-indigo-600" />
                                  Speaking With: <strong className="font-extrabold">{c.speakingWithType || 'Client / Lead'}</strong> — {c.speakingWithName || activeCommLead.fullName}
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
                              <span>Staff: <strong className="text-slate-800 font-bold">{c.staffMember}</strong></span>
                              {c.nextFollowupDate && (
                                <span className="text-brand-700 font-bold flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                                  <Calendar className="w-3 h-3" />
                                  Next Follow-up: {new Date(c.nextFollowupDate).toLocaleDateString()} {c.nextFollowupTime ? `(${c.nextFollowupTime})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => { setActiveCommLead(null); setEditingCommId(null); setShowAddCommForm(false); }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

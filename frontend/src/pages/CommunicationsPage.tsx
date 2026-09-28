import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  AlertCircle,
  Search,
  Users,
  User,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Clock,
  RefreshCw,
  ExternalLink,
  Plus,
  X,
  Paperclip,
  Smile,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  FileText,
  HelpCircle,
  ArrowUpRight,
  UserCheck,
  Building2,
  Layers,
  Flame,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import io, { Socket } from 'socket.io-client';

interface Conversation {
  id: string;
  phoneNumber: string;
  contactName: string;
  customerType: 'LEAD' | 'STUDENT' | 'CUSTOMER' | 'UNKNOWN';
  status: 'OPEN' | 'WAITING_FOR_REPLY' | 'RESOLVED';
  unreadCount: number;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  leadId?: string | null;
  studentId?: string | null;
  lead?: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    status: string;
    priorityLevel?: string;
    leadSource?: string;
    assignedTo?: { id: string; name: string; email: string };
    lastCommunicationAt?: string;
    nextFollowUpAt?: string;
  };
  student?: {
    id: string;
    fullName: string;
    phone: string;
    studentCode: string;
    assignedInstructor?: { id: string; user?: { name: string } };
    enrollments?: Array<{
      course: { name: string };
    }>;
  };
}

interface Message {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  direction: 'INCOMING' | 'OUTGOING';
  messageType: string;
  messageText: string;
  mediaUrl?: string | null;
  templateName?: string | null;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string | null;
  senderName?: string | null;
  createdAt: string;
}

interface ApiConfig {
  configured: boolean;
  apiVersion?: string;
  phoneNumberId?: string | null;
  businessAccountId?: string | null;
  webhookUrl?: string;
  statusMessage?: string;
}

export const CommunicationsPage: React.FC = () => {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'leads' | 'students' | 'waiting' | 'resolved'>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Composer
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastType, setBroadcastType] = useState<'LEAD' | 'STUDENT'>('LEAD');
  const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastMsgTemplate, setBroadcastMsgTemplate] = useState('Hello {{name}}, welcome to Sri Munis Kanna Driving School! Your driving training session is confirmed.');
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);

  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load WhatsApp API configuration status
  const fetchConfig = async () => {
    try {
      const res = await api.getWhatsAppConfig();
      if (res?.data) {
        setApiConfig(res.data);
      }
    } catch (e) {
      console.warn('Could not fetch WhatsApp config status:', e);
    }
  };

  // Load conversations
  const fetchConversations = async (keepSelection = true) => {
    try {
      setLoadingConversations(true);
      const params: any = {};
      if (activeFilter !== 'all') params.filter = activeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (dateFilter) params.date = dateFilter;

      const res = await api.getWhatsAppConversations(params);
      const data: Conversation[] = res.data || [];
      setConversations(data);

      // Restore or auto-select first conversation
      if (data.length > 0) {
        if (!keepSelection || !selectedConversation) {
          setSelectedConversation(data[0]);
        } else {
          const updated = data.find(c => c.id === selectedConversation.id);
          if (updated) setSelectedConversation(updated);
        }
      } else {
        setSelectedConversation(null);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      toast.error('Could not load WhatsApp conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for a conversation
  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getWhatsAppConversationMessages(convId);
      setMessages(res.data || []);
      // Mark as read if unread
      if (selectedConversation && selectedConversation.unreadCount > 0) {
        await api.markWhatsAppConversationRead(convId);
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err: any) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConfig();
    fetchConversations(false);
  }, [activeFilter, dateFilter]);

  // Handle search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchConversations(true);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // When selected conversation changes, load messages & join socket room
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);

      if (socketRef.current) {
        socketRef.current.emit('join_conversation', selectedConversation.id);
      }
    }
    return () => {
      if (socketRef.current && selectedConversation) {
        socketRef.current.emit('leave_conversation', selectedConversation.id);
      }
    };
  }, [selectedConversation?.id]);

  // Setup Socket.IO listener for live WhatsApp incoming messages & status updates
  useEffect(() => {
    const socketUrl = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WhatsApp Socket] Connected to real-time communication events');
    });

    // Real-time incoming message
    socket.on('whatsapp:incoming_message', (payload: any) => {
      console.log('[WhatsApp Socket] New incoming message received:', payload);
      toast.info(`WhatsApp from ${payload.contactName}: "${payload.message.slice(0, 40)}..."`);

      // Refresh list to bump conversation to top
      fetchConversations(true);

      // If active conversation is this one, append message
      if (selectedConversation && selectedConversation.id === payload.conversationId) {
        setMessages(prev => [
          ...prev,
          {
            id: payload.messageId || String(Date.now()),
            conversationId: payload.conversationId,
            whatsappMessageId: payload.whatsappMessageId,
            direction: 'INCOMING',
            messageType: payload.messageType,
            messageText: payload.message,
            mediaUrl: payload.mediaUrl,
            status: 'DELIVERED',
            sentAt: payload.timestamp,
            deliveredAt: payload.timestamp,
            senderName: payload.contactName,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });

    // Real-time delivery status updates (SENT -> DELIVERED -> READ -> FAILED)
    socket.on('whatsapp:message_status', (payload: any) => {
      console.log('[WhatsApp Socket] Message status update:', payload);
      setMessages(prev =>
        prev.map(m =>
          m.whatsappMessageId === payload.whatsappMessageId
            ? { ...m, status: payload.status, deliveredAt: payload.status === 'DELIVERED' ? payload.timestamp : m.deliveredAt, readAt: payload.status === 'READ' ? payload.timestamp : m.readAt }
            : m
        )
      );
    });

    // Real-time conversation update
    socket.on('whatsapp:conversation_update', (payload: any) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === payload.conversationId
            ? { ...c, status: payload.status, unreadCount: payload.unreadCount, lastMessagePreview: payload.lastMessagePreview, lastMessageAt: payload.lastMessageAt }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedConversation?.id]);

  // Send a WhatsApp reply
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;

    try {
      setSendingMessage(true);
      const textToSend = messageText.trim();
      setMessageText('');

      const res = await api.sendWhatsAppMessage(selectedConversation.id, {
        messageText: textToSend,
        templateName: selectedTemplate || undefined
      });

      if (res?.data) {
        setMessages(prev => [...prev, res.data]);
      }

      toast.success('WhatsApp message sent');
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send WhatsApp message');
      // If error, reload messages in case it was logged with status FAILED
      if (selectedConversation) fetchMessages(selectedConversation.id);
    } finally {
      setSendingMessage(false);
      setSelectedTemplate('');
    }
  };

  // Pre-approved CRM templates
  const crmTemplates = [
    {
      id: 'welcome_lead',
      title: 'Welcome Lead',
      text: 'Hello {{name}}, welcome to Sri Munis Kanna Driving School! We are excited to guide you towards getting your driving license. When would be a good time for a brief consultation?'
    },
    {
      id: 'class_reminder',
      title: 'Class Reminder',
      text: 'Hi {{name}}, friendly reminder: Your driving practical training session is scheduled for tomorrow at Sri Munis Kanna Driving School. Please carry your learner license.'
    },
    {
      id: 'payment_due',
      title: 'Fee Payment Due',
      text: 'Dear {{name}}, this is a gentle reminder regarding your course fee installment due at Sri Munis Kanna Driving School. Feel free to reply here if you have any questions.'
    },
    {
      id: 'rto_test_alert',
      title: 'RTO Test Alert',
      text: 'Dear {{name}}, your official RTO driving license test has been scheduled. Please ensure you arrive 15 minutes before time with your original documents.'
    }
  ];

  const handleApplyTemplate = (tmplText: string) => {
    if (!selectedConversation) return;
    const name = selectedConversation.contactName || 'Valued Customer';
    const interpolated = tmplText.replace(/{{name}}/gi, name);
    setMessageText(interpolated);
  };

  // Toggle resolve status
  const handleResolveConversation = async () => {
    if (!selectedConversation) return;
    try {
      await api.resolveWhatsAppConversation(selectedConversation.id);
      toast.success('Conversation marked as RESOLVED');
      setSelectedConversation(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
      fetchConversations(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Open Bulk Broadcast Modal
  const handleOpenBroadcastModal = async () => {
    setShowBroadcastModal(true);
    setBroadcastResult(null);
    setBroadcastName(`Sri Munis Kanna Broadcast ${new Date().toLocaleDateString()}`);
    loadRecipientsForBroadcast(broadcastType);
  };

  // Load recipients for broadcast
  const loadRecipientsForBroadcast = async (type: 'LEAD' | 'STUDENT') => {
    try {
      setLoadingRecipients(true);
      if (type === 'LEAD') {
        const res = await api.getLeads({ limit: 100 });
        const list = (res.data || []).map((l: any) => ({
          id: l.id,
          type: 'LEAD',
          name: l.fullName,
          phone: l.phone,
          course: l.courseInterested || '4-Wheeler Training',
          status: l.status
        }));
        setAvailableRecipients(list);
        setSelectedRecipientIds(list.map((r: any) => r.id));
      } else {
        const res = await api.getStudents({ limit: 100 });
        const list = (res.data || []).map((s: any) => ({
          id: s.id,
          type: 'STUDENT',
          name: s.fullName,
          phone: s.phone,
          course: s.enrollments?.[0]?.course?.name || 'Driving Course',
          status: s.status
        }));
        setAvailableRecipients(list);
        setSelectedRecipientIds(list.map((r: any) => r.id));
      }
    } catch (e) {
      toast.error('Failed to load recipients list');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // Toggle single recipient checkbox
  const handleToggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedRecipientIds.length === availableRecipients.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(availableRecipients.map(r => r.id));
    }
  };

  // Send Bulk Broadcast
  const handleSendBroadcast = async () => {
    if (!selectedRecipientIds.length) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!broadcastMsgTemplate.trim()) {
      toast.error('Please write a message template');
      return;
    }

    const selectedRecipients = availableRecipients.filter(r => selectedRecipientIds.includes(r.id));

    try {
      setSubmittingBroadcast(true);
      const res = await api.sendWhatsAppBulk({
        name: broadcastName,
        recipients: selectedRecipients,
        messageTemplate: broadcastMsgTemplate
      });

      setBroadcastResult(res.data);
      toast.success(res.message || 'WhatsApp broadcast launched successfully!');
      fetchConversations(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to dispatch broadcast');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  // Formatting helpers
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderStatusTick = (status: string) => {
    switch (status) {
      case 'READ':
        return <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-blue-500 inline ml-1" /></span>;
      case 'DELIVERED':
        return <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-slate-400 inline ml-1" /></span>;
      case 'SENT':
        return <span title="Sent"><Check className="w-3.5 h-3.5 text-slate-400 inline ml-1" /></span>;
      case 'FAILED':
        return <span title="Failed to deliver"><AlertCircle className="w-3.5 h-3.5 text-rose-500 inline ml-1" /></span>;
      default:
        return <span title="Queued"><Clock className="w-3 h-3 text-slate-400 inline ml-1" /></span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] max-h-[calc(100vh-110px)] space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              WhatsApp Business Two-Way Communication Hub
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Meta Cloud API
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Live WhatsApp inbox, automated webhooks, delivery ticks & student/lead engagement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* API Config Diagnostic Pill */}
          <button
            onClick={() => setShowConfigModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              apiConfig?.configured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiConfig?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{apiConfig?.configured ? 'API Connected' : 'API Not Configured'}</span>
            <HelpCircle className="w-3.5 h-3.5 opacity-70" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchConversations(true);
              fetchConfig();
            }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh conversations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Bulk Broadcast Button */}
          <button
            onClick={handleOpenBroadcastModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Bulk Broadcast</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Area */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        {/* PANEL 1: Left Conversations Sidebar (3 cols) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Search & Date Filter */}
          <div className="p-3 border-b border-slate-100 space-y-2 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone or message..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'leads', label: 'Leads' },
                { key: 'students', label: 'Students' },
                { key: 'waiting', label: 'Waiting' },
                { key: 'resolved', label: 'Resolved' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                    activeFilter === f.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 custom-scrollbar">
            {loadingConversations ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">No conversations found</p>
                <p className="text-[11px] text-slate-400">
                  Incoming WhatsApp messages or outbound broadcasts will appear here automatically.
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConversation?.id === conv.id;
                const isStudent = conv.customerType === 'STUDENT';
                const isLead = conv.customerType === 'LEAD';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 transition-all flex items-start gap-3 cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-2xs'
                        : 'border-transparent hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs ${
                        isStudent
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : isLead
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {conv.contactName ? conv.contactName.slice(0, 2).toUpperCase() : 'WA'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.contactName || conv.phoneNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 ml-1">
                          {formatTimestamp(conv.lastMessageAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                            isStudent
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isLead
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {conv.customerType}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono truncate">
                          +{conv.phoneNumber}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <p className="truncate text-[11px] font-medium text-slate-600 flex-1 pr-2">
                          {conv.lastMessagePreview || 'No messages yet'}
                        </p>

                        {/* Unread count badge */}
                        {conv.unreadCount > 0 && (
                          <span className="w-4.5 h-4.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 2: WhatsApp Chat Thread (Center - 6 cols) */}
        <div className="col-span-12 md:col-span-8 lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-0 overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                      selectedConversation.customerType === 'STUDENT'
                        ? 'bg-blue-100 text-blue-700'
                        : selectedConversation.customerType === 'LEAD'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedConversation.contactName?.slice(0, 2).toUpperCase() || 'WA'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {selectedConversation.contactName}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                          selectedConversation.status === 'RESOLVED'
                            ? 'bg-slate-200 text-slate-700'
                            : selectedConversation.status === 'WAITING_FOR_REPLY'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedConversation.status.replace(/_/g, ' ')}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      WhatsApp: +{selectedConversation.phoneNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResolveConversation}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                  >
                    {selectedConversation.status === 'RESOLVED' ? 'Reopen' : 'Mark Resolved'}
                  </button>
                </div>
              </div>

              {/* Chat Message History (WhatsApp style) */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
                style={{
                  backgroundColor: '#efeae2',
                  backgroundImage:
                    'radial-gradient(#0000000a 1px, transparent 1px), radial-gradient(#0000000a 1px, #efeae2 1px)',
                  backgroundSize: '20px 20px'
                }}
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
                    Loading WhatsApp thread...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-400">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No messages in this conversation yet</p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Send a message below or wait for the customer to message via WhatsApp.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOutgoing = msg.direction === 'OUTGOING';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-xs text-xs relative ${
                            isOutgoing
                              ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-xs border border-emerald-200/50'
                              : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/70'
                          }`}
                        >
                          {/* Sender name if outgoing staff */}
                          {isOutgoing && msg.senderName && (
                            <p className="text-[10px] font-bold text-emerald-800 mb-0.5">
                              {msg.senderName}
                            </p>
                          )}

                          {/* Message Content */}
                          <p className="whitespace-pre-wrap leading-relaxed font-normal">
                            {msg.messageText}
                          </p>

                          {/* Timestamp & Ticks Footer */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 font-medium select-none">
                            <span>
                              {msg.sentAt
                                ? new Date(msg.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''}
                            </span>
                            {isOutgoing && renderStatusTick(msg.status)}
                          </div>

                          {/* Error notice if failed */}
                          {msg.status === 'FAILED' && (
                            <p className="text-[10px] text-rose-600 mt-1 font-semibold flex items-center gap-1 border-t border-rose-200/60 pt-1">
                              <AlertCircle className="w-3 h-3" />
                              {msg.errorMessage || 'Failed to deliver via WhatsApp'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2 flex-shrink-0">
                {/* Config warning banner if not configured */}
                {!apiConfig?.configured && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        WhatsApp Business API is not configured. Add Meta credentials in backend/.env to transmit messages.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowConfigModal(true)}
                      className="underline font-bold text-amber-900 cursor-pointer ml-2"
                    >
                      View Setup
                    </button>
                  </div>
                )}

                {/* Quick Template Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Templates:
                  </span>
                  {crmTemplates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleApplyTemplate(tmpl.text)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-semibold border border-slate-200 whitespace-nowrap transition-colors"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>

                {/* Textarea Input + Send button */}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a WhatsApp message (Enter to send, Shift+Enter for new line)..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none font-medium"
                  />

                  <button
                    type="submit"
                    disabled={sendingMessage || !messageText.trim()}
                    className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-600/20 flex-shrink-0 cursor-pointer"
                  >
                    {sendingMessage ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Select a conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose any customer from the list on the left to review WhatsApp chat history, inspect CRM details, or dispatch a message.
              </p>
            </div>
          )}
        </div>

        {/* PANEL 3: Customer CRM Profile Sidebar (Right - 3 cols) */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {selectedConversation ? (
            <>
              {/* Profile Card Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-black text-xl shadow-xs mb-3 ${
                    selectedConversation.customerType === 'STUDENT'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : selectedConversation.customerType === 'LEAD'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {selectedConversation.contactName?.slice(0, 2).toUpperCase() || 'WA'}
                </div>
                <h2 className="font-bold text-slate-900 text-base">
                  {selectedConversation.contactName}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      selectedConversation.customerType === 'STUDENT'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : selectedConversation.customerType === 'LEAD'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedConversation.customerType} PROFILE
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2.5 text-xs">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[10px] text-slate-400">
                  Contact Details
                </h4>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">+{selectedConversation.phoneNumber}</span>
                </div>

                {selectedConversation.lead?.email && (
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{selectedConversation.lead.email}</span>
                  </div>
                )}
              </div>

              {/* LEAD SPECIFIC DETAILS */}
              {selectedConversation.customerType === 'LEAD' && selectedConversation.lead && (
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-purple-600 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" /> Lead CRM Status
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Status</span>
                      <span className="font-bold text-slate-800">
                        {selectedConversation.lead.status}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Priority</span>
                      <span
                        className={`font-bold ${
                          selectedConversation.lead.priorityLevel === 'HIGH'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {selectedConversation.lead.priorityLevel || 'MEDIUM'}
                      </span>
                    </div>
                  </div>

                  {selectedConversation.lead.assignedTo && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium">Assigned Staff</span>
                      <p className="font-bold text-slate-800">
                        {selectedConversation.lead.assignedTo.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {selectedConversation.lead.assignedTo.email}
                      </p>
                    </div>
                  )}

                  <a
                    href="/leads"
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl border border-purple-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <span>View Full Lead Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* STUDENT SPECIFIC DETAILS */}
              {selectedConversation.customerType === 'STUDENT' && selectedConversation.student && (
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-blue-600 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" /> Student Academy 360
                  </h4>

                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                    <span className="text-[10px] text-blue-500 font-medium">Admission Code</span>
                    <p className="font-bold text-blue-900 font-mono">
                      {selectedConversation.student.studentCode}
                    </p>
                  </div>

                  {selectedConversation.student.enrollments?.[0]?.course && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Enrolled Course</span>
                      <span className="font-bold text-slate-800">
                        {selectedConversation.student.enrollments[0].course.name}
                      </span>
                    </div>
                  )}

                  {selectedConversation.student.assignedInstructor?.user && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Assigned Instructor</span>
                      <span className="font-bold text-slate-800">
                        {selectedConversation.student.assignedInstructor.user.name}
                      </span>
                    </div>
                  )}

                  <a
                    href="/students"
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    <span>View Student 360</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Unknown WhatsApp Contact */}
              {selectedConversation.customerType === 'UNKNOWN' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                  <span className="font-bold text-amber-900 block">Unknown WhatsApp Number</span>
                  <p className="text-[11px] text-amber-700">
                    This message originated from an unrecognized phone number. You can convert it into a new Lead.
                  </p>
                  <a
                    href="/leads"
                    className="inline-block px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
                  >
                    Add as New Lead
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>Select a contact to view CRM details</span>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* BULK WHATSAPP BROADCAST MODAL */}
      {/* ======================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Bulk WhatsApp Broadcast Dispatcher
                  </h3>
                  <p className="text-xs text-slate-500">
                    Send personalized bulk messages with real-time delivery tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-xs">
              {broadcastResult ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-900">Broadcast Processed!</h4>
                  <p className="text-xs text-emerald-700">
                    Total: {broadcastResult.total} | Sent: {broadcastResult.sent} | Failed: {broadcastResult.failed}
                  </p>
                  <button
                    onClick={() => {
                      setShowBroadcastModal(false);
                      setBroadcastResult(null);
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Select Target Group */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      1. Select Recipient Audience
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastType('LEAD');
                          loadRecipientsForBroadcast('LEAD');
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                          broadcastType === 'LEAD'
                            ? 'bg-purple-50/80 border-purple-400 text-purple-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <User className="w-5 h-5 text-purple-600" />
                        <div>
                          <span className="font-bold block">Leads & Enquiries</span>
                          <span className="text-[11px] text-slate-500">
                            Prospective driving students
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastType('STUDENT');
                          loadRecipientsForBroadcast('STUDENT');
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                          broadcastType === 'STUDENT'
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <div>
                          <span className="font-bold block">Enrolled Students</span>
                          <span className="text-[11px] text-slate-500">
                            Active batch learners
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recipients Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700">
                        Recipients ({selectedRecipientIds.length} of {availableRecipients.length} selected)
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        {selectedRecipientIds.length === availableRecipients.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                      {loadingRecipients ? (
                        <div className="p-6 text-center text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Loading recipients...
                        </div>
                      ) : availableRecipients.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          No {broadcastType.toLowerCase()}s found with valid records.
                        </div>
                      ) : (
                        availableRecipients.map(r => (
                          <label
                            key={r.id}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedRecipientIds.includes(r.id)}
                                onChange={() => handleToggleRecipient(r.id)}
                                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                              <div>
                                <span className="font-bold text-slate-800">{r.name}</span>
                                <span className="text-slate-400 font-mono ml-2">+{r.phone}</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                              {r.course}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Message Template with Variable Interpolation Chips */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      2. Broadcast Message Template
                    </label>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-slate-400 text-[10px] font-bold uppercase">Insert Variable:</span>
                      {['{{name}}', '{{phone}}', '{{course}}', '{{date}}', '{{staff_name}}'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setBroadcastMsgTemplate(prev => prev + ' ' + tag)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 rounded-md font-mono text-[10px] font-bold border border-slate-200 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      value={broadcastMsgTemplate}
                      onChange={e => setBroadcastMsgTemplate(e.target.value)}
                      placeholder="Write your broadcast text..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Summary Confirmation Alert */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Ready to Dispatch</span>
                      <span className="text-[11px] text-slate-500">
                        {selectedRecipientIds.length} personalized WhatsApp messages will be processed.
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={submittingBroadcast || selectedRecipientIds.length === 0}
                      onClick={handleSendBroadcast}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {submittingBroadcast ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Launch Broadcast</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* META CLOUD API SETUP & DIAGNOSTICS MODAL */}
      {/* ======================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  Meta WhatsApp Cloud API Integration
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">Webhook Callback URL:</span>
                <code className="block p-2 bg-white rounded-xl border font-mono text-[11px] text-slate-800 select-all">
                  {window.location.origin}/api/whatsapp/webhook
                </code>
                <span className="text-[10px] text-slate-500">
                  Configure this in your Meta App Dashboard under WhatsApp &gt; Configuration.
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">Verify Token:</span>
                <code className="block p-2 bg-white rounded-xl border font-mono text-[11px] text-slate-800 select-all">
                  drivepro_crm_webhook_token
                </code>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">Current Connection Status:</span>
                <p className="text-slate-600 text-[11px]">
                  {apiConfig?.statusMessage || 'Checking API status...'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">How to add credentials:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open <code className="bg-slate-100 px-1 py-0.5 rounded">backend/.env</code> file</li>
                  <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded">WHATSAPP_ACCESS_TOKEN</code> to your Meta System User Token</li>
                  <li>Set <code className="bg-slate-100 px-1 py-0.5 rounded">WHATSAPP_PHONE_NUMBER_ID</code> to your WhatsApp Phone ID</li>
                  <li>Subscribe your Webhook to the <code className="bg-slate-100 px-1 py-0.5 rounded">messages</code> field</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800"
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

export default CommunicationsPage;

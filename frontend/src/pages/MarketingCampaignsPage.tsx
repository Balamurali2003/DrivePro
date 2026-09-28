import React, { useState, useEffect } from 'react';
import {
  Megaphone, Plus, Search, CheckCircle2, Clock, DollarSign,
  TrendingUp, TrendingDown, AlertCircle, Eye, Edit2, Trash2, X,
  Users, Target, BarChart2, ArrowUpRight, ArrowDownRight, Pause, Play,
  Sparkles, Wallet, Award, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { DateFilterSelector } from '../components/shared/DateFilterSelector';
import { StatCard } from '../components/shared/StatCard';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const MarketingCampaignsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [campaignDetailData, setCampaignDetailData] = useState<any>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formChannel, setFormChannel] = useState('META_ADS');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBudget, setFormBudget] = useState('10000');
  const [formSpent, setFormSpent] = useState('0');
  const [formTargetAudience, setFormTargetAudience] = useState('Youth 18-25 & College Students');
  const [formDescription, setFormDescription] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams: any = { range: dateRange };
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams.startDate = startDate;
        queryParams.endDate = endDate;
      }
      if (channelFilter !== 'ALL') queryParams.channel = channelFilter;
      if (statusFilter !== 'ALL') queryParams.status = statusFilter;
      if (search.trim()) queryParams.search = search.trim();

      const [metricsRes, campRes] = await Promise.all([
        api.getCampaignMetrics(queryParams),
        api.getCampaigns(queryParams)
      ]);

      setMetrics(metricsRes.data || null);
      setCampaigns(campRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, startDate, endDate, channelFilter, statusFilter]);

  const handleDateChange = (val: string, s?: string, e?: string) => {
    setDateRange(val);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormChannel('META_ADS');
    setFormStatus('ACTIVE');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormBudget('15000');
    setFormSpent('0');
    setFormTargetAudience('Local residents & new learners');
    setFormDescription('');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (camp: any) => {
    setSelectedCampaign(camp);
    setFormName(camp.name);
    setFormChannel(camp.channel || 'META_ADS');
    setFormStatus(camp.status || 'ACTIVE');
    setFormStartDate(camp.startDate ? camp.startDate.split('T')[0] : '');
    setFormEndDate(camp.endDate ? camp.endDate.split('T')[0] : '');
    setFormBudget(String(camp.budget || 0));
    setFormSpent(String(camp.spent || 0));
    setFormTargetAudience(camp.targetAudience || '');
    setFormDescription(camp.description || '');
    setShowEditModal(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formStartDate) {
      toast.error('Campaign name and start date are required.');
      return;
    }
    try {
      await api.createCampaign({
        name: formName,
        channel: formChannel,
        status: formStatus,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        budget: parseFloat(formBudget) || 0,
        spent: parseFloat(formSpent) || 0,
        targetAudience: formTargetAudience,
        description: formDescription
      });
      toast.success('Campaign created successfully!');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create campaign');
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.updateCampaign(selectedCampaign.id, {
        name: formName,
        channel: formChannel,
        status: formStatus,
        startDate: formStartDate,
        endDate: formEndDate || undefined,
        budget: parseFloat(formBudget) || 0,
        spent: parseFloat(formSpent) || 0,
        targetAudience: formTargetAudience,
        description: formDescription
      });
      toast.success('Campaign updated successfully!');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update campaign');
    }
  };

  const handleToggleStatus = async (camp: any) => {
    const newStatus = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateCampaign(camp.id, { status: newStatus });
      toast.success(`Campaign status set to ${newStatus}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? Linked leads will be unlinked.')) return;
    try {
      await api.deleteCampaign(id);
      toast.success('Campaign deleted successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign');
    }
  };

  const handleViewDetail = async (camp: any) => {
    setSelectedCampaign(camp);
    setShowDetailModal(true);
    try {
      setDetailLoading(true);
      const res = await api.getCampaignById(camp.id);
      setCampaignDetailData(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch campaign details');
    } finally {
      setDetailLoading(false);
    }
  };

  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case 'GOOGLE_ADS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Google Ads
          </span>
        );
      case 'META_ADS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Meta / Insta
          </span>
        );
      case 'WHATSAPP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            WhatsApp API
          </span>
        );
      case 'LOCAL_LEAFLETS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Local Flyers
          </span>
        );
      case 'REFERRAL_PROGRAM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Referral Prog.
          </span>
        );
      case 'SEO_WEBSITE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-[10px] font-bold border border-cyan-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Organic SEO
          </span>
        );
      case 'WALK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Walk-in
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80">
            {ch || 'Direct'}
          </span>
        );
    }
  };

  const totalBudgetVal = metrics?.totalBudget ?? 0;
  const totalSpentVal = metrics?.totalSpent ?? 0;
  const overallSpendPct = totalBudgetVal > 0 ? Math.min(100, Math.round((totalSpentVal / totalBudgetVal) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Marketing Campaigns & Dynamic ROI Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Performance Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Compute real-time Customer Acquisition Cost (CAC), CPL, and database-linked revenue returns
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Dynamic Database KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="Total Campaigns"
          value={metrics?.totalCampaigns ?? 0}
          icon={Megaphone}
          indicatorColor="blue"
          sublabel={`${metrics?.activeCampaigns ?? 0} active`}
        />
        <StatCard
          label="Total Budget"
          value={<CurrencyDisplay amount={metrics?.totalBudget ?? 0} />}
          icon={Wallet}
          indicatorColor="slate"
          sublabel="Allocated budget"
        />
        <StatCard
          label="Total Spent"
          value={<CurrencyDisplay amount={metrics?.totalSpent ?? 0} />}
          icon={DollarSign}
          indicatorColor={totalSpentVal > totalBudgetVal ? "rose" : "amber"}
          progress={overallSpendPct}
          sublabel={`${overallSpendPct}% of budget`}
        />
        <StatCard
          label="Leads Generated"
          value={metrics?.totalLeadsGenerated ?? 0}
          icon={Users}
          indicatorColor="cyan"
          sublabel="From CRM leads"
        />
        <StatCard
          label="Enrolled Students"
          value={metrics?.totalConvertedStudents ?? 0}
          icon={CheckCircle2}
          indicatorColor="emerald"
          sublabel="Direct conversions"
        />
        <StatCard
          label="Cost / Lead (CPL)"
          value={<CurrencyDisplay amount={metrics?.overallCPL ?? 0} />}
          icon={Target}
          indicatorColor="slate"
          sublabel="Per unique inquiry"
        />
        <StatCard
          label="Total Revenue"
          value={<CurrencyDisplay amount={metrics?.totalRevenueGenerated ?? 0} />}
          icon={BarChart2}
          indicatorColor="indigo"
          sublabel="Fee collections"
        />
        <StatCard
          label="Overall ROI"
          value={
            metrics?.overallROI === null || metrics?.overallROI === undefined
              ? 'N/A'
              : `${metrics.overallROI >= 0 ? '+' : ''}${metrics.overallROI}%`
          }
          icon={Activity}
          indicatorColor={
            metrics?.overallROI === null || metrics?.overallROI === undefined
              ? 'slate'
              : metrics.overallROI >= 0
              ? 'emerald'
              : 'rose'
          }
          trend={
            metrics?.overallROI !== null && metrics?.overallROI !== undefined
              ? {
                  positive: metrics.overallROI >= 0,
                  value: `${metrics.overallROI >= 0 ? '+' : ''}${metrics.overallROI}%`,
                  label: `ROAS ${(metrics.overallROI / 100 + 1).toFixed(1)}x`
                }
              : undefined
          }
          sublabel="Return on ad spend"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <DateFilterSelector
          selected={dateRange}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Channels</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="META_ADS">Meta / Instagram</option>
            <option value="WHATSAPP">WhatsApp API</option>
            <option value="LOCAL_LEAFLETS">Local Flyers</option>
            <option value="REFERRAL_PROGRAM">Referrals</option>
            <option value="SEO_WEBSITE">Organic SEO</option>
            <option value="WALK_IN">Walk-in</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PLANNED">Planned</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
            />
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Campaign & Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Budget / Spent</th>
                <th className="py-3 px-4">Leads</th>
                <th className="py-3 px-4">Enrolled</th>
                <th className="py-3 px-4">CPL / CPA</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">ROI %</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading marketing campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-bold text-slate-700">No campaigns found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Metrics will appear when data is added. Click 'Create Campaign' above to launch your first promotion.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const budget = camp.budget || 0;
                  const spent = camp.spent || 0;
                  const spendPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
                  const leads = camp.metrics?.leadsCount ?? (camp._count?.leads || 0);
                  const enrolled = camp.metrics?.convertedCount ?? 0;
                  const revenue = camp.metrics?.revenue ?? 0;
                  const roi = camp.metrics?.roi;
                  const cpl = camp.metrics?.cpl ?? 0;
                  const cpa = camp.metrics?.cpa ?? 0;

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{camp.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {getChannelBadge(camp.channel)}
                          <span className="text-[10px] text-slate-400 font-mono">#{camp.campaignCode}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={camp.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                          <CurrencyDisplay amount={spent} />
                          <span className="text-slate-400 font-normal">/ <CurrencyDisplay amount={budget} /></span>
                        </div>
                        <div className="w-28 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${spendPct > 90 ? 'bg-rose-500' : 'bg-blue-600'}`}
                            style={{ width: `${spendPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {leads}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {enrolled}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-semibold text-slate-700">
                          CPL: <CurrencyDisplay amount={cpl} />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          CPA: <CurrencyDisplay amount={cpa} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <CurrencyDisplay amount={revenue} />
                      </td>

                      <td className="py-3.5 px-4">
                        {roi === null || roi === undefined ? (
                          <span className="text-[11px] font-bold text-slate-400">N/A</span>
                        ) : roi >= 0 ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            +{roi}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            {roi}%
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(camp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Leads & Analytics"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(camp)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
                          >
                            {camp.status === 'ACTIVE' ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-emerald-600" />}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(camp)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Campaign Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {showCreateModal ? 'Create New Marketing Campaign' : 'Edit Campaign Details'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Configure acquisition channels and ad budget</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateCampaign : handleUpdateCampaign} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Summer Vacation Driving Special 2026"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marketing Channel</label>
                  <select
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="META_ADS">Meta / Instagram Ads</option>
                    <option value="GOOGLE_ADS">Google Search Ads</option>
                    <option value="WHATSAPP">WhatsApp Broadcast</option>
                    <option value="LOCAL_LEAFLETS">Local Flyers & Banners</option>
                    <option value="REFERRAL_PROGRAM">Referral Incentive</option>
                    <option value="SEO_WEBSITE">Organic Website / SEO</option>
                    <option value="WALK_IN">Walk-in Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="ACTIVE">Active (Running)</option>
                    <option value="PLANNED">Planned (Upcoming)</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Allocated (₹)</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    min="0"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Spend So Far (₹)</label>
                  <input
                    type="number"
                    value={formSpent}
                    onChange={(e) => setFormSpent(e.target.value)}
                    min="0"
                    className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={formTargetAudience}
                  onChange={(e) => setFormTargetAudience(e.target.value)}
                  placeholder="e.g. Working professionals age 22-45 in 10km radius"
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Key creative hook, offer details..."
                  className="w-full text-xs p-2.5 bg-slate-50/50 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  {showCreateModal ? 'Launch Campaign' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal / Leads Drawer */}
      {showDetailModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedCampaign.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono block">
                    Campaign Code: #{selectedCampaign.campaignCode}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* ROI & Financial Summary */}
              <div className="grid grid-cols-4 gap-2 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Spent</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    <CurrencyDisplay amount={selectedCampaign.spent || 0} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Revenue</span>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">
                    <CurrencyDisplay amount={campaignDetailData?.metrics?.revenue ?? selectedCampaign.metrics?.revenue ?? 0} />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Net Return</span>
                  <div className="font-bold text-blue-600 text-sm mt-0.5">
                    <CurrencyDisplay
                      amount={
                        (campaignDetailData?.metrics?.revenue ?? selectedCampaign.metrics?.revenue ?? 0) -
                        (selectedCampaign.spent || 0)
                      }
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">ROI %</span>
                  <div className="font-bold text-sm mt-0.5 text-blue-700">
                    {campaignDetailData?.metrics?.roi !== undefined
                      ? `${campaignDetailData.metrics.roi}%`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Linked Leads Section */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Linked CRM Leads ({campaignDetailData?.leads?.length || 0})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Real database linkage</span>
                </h4>

                {detailLoading ? (
                  <div className="text-center py-6 text-slate-400">
                    <Clock className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-500" />
                    Loading linked leads...
                  </div>
                ) : !campaignDetailData?.leads || campaignDetailData.leads.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <p className="font-medium text-slate-600">No leads linked to this campaign yet</p>
                    <p className="text-[11px] text-slate-400">
                      When incoming inquiries select this campaign, they will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-slate-200/80 rounded-xl divide-y divide-slate-100">
                    {campaignDetailData.leads.map((ld: any) => (
                      <div key={ld.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                        <div>
                          <span className="font-bold text-slate-900">{ld.fullName}</span>
                          <span className="text-[11px] text-slate-500 block">{ld.phone} • {ld.city || 'Local'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={ld.status} />
                          {ld.convertedStudent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Enrolled
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-200/80 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-100 transition-colors cursor-pointer"
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

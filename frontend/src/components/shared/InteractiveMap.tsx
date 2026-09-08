import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, Layers, Filter, RefreshCw, Eye, Phone, Calendar, 
  Tag, Shield, Compass, Navigation, AlertCircle, CheckCircle2,
  Users, ChevronRight, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { toast } from 'sonner';

export interface LeadMapPin {
  id: string;
  leadId: string;
  leadSequence?: number;
  name: string;
  phone: string;
  email?: string | null;
  location: string;
  originalLocation: string;
  normalizedLocation?: string;
  latitude: number;
  longitude: number;
  territory: string;
  source: string;
  campaign: string;
  status: string;
  priority: string;
  trainingRequirement?: string;
  classPreference?: string;
  followupDate?: string | null;
}

export interface MapSummary {
  totalLeads: number;
  locatedLeads: number;
  locationMissing: number;
  topTerritory: string;
  topLeadSource: string;
}

// Controller to smoothly animate map center/zoom
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Custom Marker Icons created with L.divIcon
function createClusterIcon(territory: string, count: number) {
  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 9999px;
        box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
        font-weight: 800;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        white-space: nowrap;
        transform: translate(-50%, -50%);
      ">
        <span style="display:inline-block; width:8px; height:8px; border-radius:9999px; background:#38bdf8; box-shadow:0 0 6px #38bdf8;"></span>
        <span>${territory}</span>
        <span style="background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:9999px; font-size:10px;">${count}</span>
      </div>
    `,
    iconSize: [120, 32],
    iconAnchor: [60, 16]
  });
}

function createLeadIcon(status: string) {
  let color = '#2563eb'; // blue
  const s = (status || '').toLowerCase();
  if (s.includes('converted') || s.includes('join') || s.includes('paid')) color = '#10b981'; // emerald
  else if (s.includes('not interest') || s.includes('lost')) color = '#ef4444'; // rose
  else if (s.includes('time') || s.includes('follow') || s.includes('contact')) color = '#f59e0b'; // amber
  else if (s.includes('trial')) color = '#8b5cf6'; // purple

  return L.divIcon({
    className: 'custom-lead-pin',
    html: `
      <div style="
        background: white;
        color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        border: 2.5px solid ${color};
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transform: translate(-50%, -100%);
      ">
        <div style="width: 10px; height: 10px; border-radius: 9999px; background: ${color};"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}

export const InteractiveMap: React.FC<{
  filterType?: string;
  onSelectLead?: (lead: LeadMapPin) => void;
}> = ({ onSelectLead }) => {
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState<LeadMapPin[]>([]);
  const [unlocated, setUnlocated] = useState<any[]>([]);
  const [summary, setSummary] = useState<MapSummary>({
    totalLeads: 0,
    locatedLeads: 0,
    locationMissing: 0,
    topTerritory: 'Tirunelveli',
    topLeadSource: 'Facebook'
  });

  // Filter option lists from DB
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<string[]>([]);
  const [territoryOptions, setTerritoryOptions] = useState<string[]>([]);

  // Selected filters
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTerritory, setSelectedTerritory] = useState('ALL');

  // Display mode
  const [displayMode, setDisplayMode] = useState<'CLUSTERS' | 'INDIVIDUAL'>('CLUSTERS');
  const [mapCenter, setMapCenter] = useState<[number, number]>([8.7139, 77.7567]); // Tirunelveli Central
  const [mapZoom, setMapZoom] = useState(12);

  // Selected lead for detail card
  const [selectedLead, setSelectedLead] = useState<LeadMapPin | null>(null);

  // Load filter dropdown options from DB
  useEffect(() => {
    Promise.all([
      api.getLeadSources().catch(() => ({ data: [] })),
      api.getLeadCampaigns().catch(() => ({ data: [] })),
      api.getLeadTerritories().catch(() => ({ data: [] }))
    ]).then(([sRes, cRes, tRes]) => {
      if (sRes.data) setSourceOptions(sRes.data);
      if (cRes.data) setCampaignOptions(cRes.data);
      if (tRes.data) setTerritoryOptions(tRes.data);
    });
  }, []);

  // Fetch map data
  const loadMapData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedSource !== 'ALL') params.source = selectedSource;
      if (selectedCampaign !== 'ALL') params.campaign = selectedCampaign;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedPriority !== 'ALL') params.priority = selectedPriority;
      if (selectedTerritory !== 'ALL') params.territory = selectedTerritory;

      const res = await api.getLeadsMap(params);
      if (res.data) {
        setPins(res.data.leads || []);
        setUnlocated(res.data.unlocatedLeads || []);
        if (res.data.summary) setSummary(res.data.summary);
      }
    } catch (err: any) {
      toast.error('Failed to load lead map: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [selectedSource, selectedCampaign, selectedStatus, selectedPriority, selectedTerritory]);

  // Compute territory clusters
  const clusters = useMemo(() => {
    const map = new Map<string, { territory: string; lat: number; lng: number; leads: LeadMapPin[] }>();
    for (const p of pins) {
      const terr = p.territory || 'Other Areas';
      if (!map.has(terr)) {
        map.set(terr, {
          territory: terr,
          lat: p.latitude,
          lng: p.longitude,
          leads: []
        });
      }
      map.get(terr)!.leads.push(p);
    }
    return Array.from(map.values()).sort((a, b) => b.leads.length - a.leads.length);
  }, [pins]);

  const handleClusterClick = (cluster: { territory: string; lat: number; lng: number }) => {
    setMapCenter([cluster.lat, cluster.lng]);
    setMapZoom(15);
    setDisplayMode('INDIVIDUAL');
    setSelectedTerritory(cluster.territory);
  };

  const handleResetFilters = () => {
    setSelectedSource('ALL');
    setSelectedCampaign('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSelectedTerritory('ALL');
    setMapCenter([8.7139, 77.7567]);
    setMapZoom(12);
    setDisplayMode('CLUSTERS');
  };

  return (
    <div className="space-y-4">
      {/* 1. Territory Summary Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Total Leads</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{summary.totalLeads}</div>
          <div className="text-[10px] text-slate-500 font-medium">In CRM Database</div>
        </div>

        <div className="p-3.5 bg-white border border-emerald-100 rounded-2xl shadow-xs bg-gradient-to-b from-emerald-50/40 to-white">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600">Located Leads</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{summary.locatedLeads}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Active on GPS Radar</div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Location Missing</div>
          <div className="text-xl font-black text-slate-600 mt-0.5">{summary.locationMissing}</div>
          <div className="text-[10px] text-slate-400 font-medium">Unspecified Area</div>
        </div>

        <div className="p-3.5 bg-white border border-blue-100 rounded-2xl shadow-xs bg-gradient-to-b from-blue-50/40 to-white">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600">Top Territory</div>
          <div className="text-sm font-black text-blue-900 mt-1 truncate" title={summary.topTerritory}>
            {summary.topTerritory}
          </div>
          <div className="text-[10px] text-blue-600 font-medium">Highest Density Hub</div>
        </div>

        <div className="p-3.5 bg-white border border-indigo-100 rounded-2xl shadow-xs bg-gradient-to-b from-indigo-50/40 to-white">
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600">Top Lead Source</div>
          <div className="text-sm font-black text-indigo-900 mt-1 truncate" title={summary.topLeadSource}>
            {summary.topLeadSource}
          </div>
          <div className="text-[10px] text-indigo-600 font-medium">Leading Channel</div>
        </div>
      </div>

      {/* 2. Map Dynamic Filters Row */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-black text-slate-800">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Radar Filters</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Display Mode Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setDisplayMode('CLUSTERS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'CLUSTERS' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Territory Clusters ({clusters.length})
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('INDIVIDUAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  displayMode === 'INDIVIDUAL' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Individual Pins ({pins.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-bold text-xs flex items-center gap-1"
              title="Reset all filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {/* Source Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Lead Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="ALL">All Sources ({sourceOptions.length})</option>
              {sourceOptions.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Campaign Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Campaign</label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="ALL">All Campaigns ({campaignOptions.length})</option>
              {campaignOptions.map(cmp => (
                <option key={cmp} value={cmp}>{cmp}</option>
              ))}
            </select>
          </div>

          {/* Territory Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Territory / Area</label>
            <select
              value={selectedTerritory}
              onChange={(e) => {
                setSelectedTerritory(e.target.value);
                if (e.target.value !== 'ALL') {
                  const found = clusters.find(c => c.territory === e.target.value);
                  if (found) {
                    setMapCenter([found.lat, found.lng]);
                    setMapZoom(14);
                  }
                }
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="ALL">All Territories ({territoryOptions.length})</option>
              {territoryOptions.map(terr => (
                <option key={terr} value={terr}>{terr}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Trial Scheduled">Trial Scheduled</option>
              <option value="Today Come to Join">Today Come to Join</option>
              <option value="Converted">Converted</option>
              <option value="Contacted - Not Interested">Not Interested</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Map Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Container (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden relative">
          <div className="w-full h-[520px] relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewController center={mapCenter} zoom={mapZoom} />

              {/* CLUSTERS MODE */}
              {displayMode === 'CLUSTERS' && clusters.map(c => (
                <Marker
                  key={c.territory}
                  position={[c.lat, c.lng]}
                  icon={createClusterIcon(c.territory, c.leads.length)}
                  eventHandlers={{
                    click: () => handleClusterClick(c)
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="font-extrabold text-slate-900">{c.territory}</div>
                      <div className="text-slate-600">{c.leads.length} Leads in this hub</div>
                      <button
                        type="button"
                        onClick={() => handleClusterClick(c)}
                        className="mt-2 w-full py-1 bg-brand-600 text-white font-bold rounded-lg text-[10px]"
                      >
                        Zoom into {c.territory}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* INDIVIDUAL PINS MODE */}
              {displayMode === 'INDIVIDUAL' && pins.map(p => (
                <Marker
                  key={p.id}
                  position={[p.latitude, p.longitude]}
                  icon={createLeadIcon(p.status)}
                  eventHandlers={{
                    click: () => setSelectedLead(p)
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-brand-600">{p.leadId}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.status}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                      <div className="text-slate-600 text-[11px] font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                      <div className="text-slate-500 text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{p.location}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>Source: <strong>{p.source}</strong></span>
                        <span>{p.priority}</span>
                      </div>
                      {p.campaign && (
                        <div className="text-[10px] text-brand-600 font-medium">
                          🏷️ {p.campaign}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectLead) onSelectLead(p);
                          navigate(`/leads?search=${p.leadId}`);
                        }}
                        className="mt-2 w-full py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs cursor-pointer text-center"
                      >
                        View Lead Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {loading && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-lg border border-slate-200 text-xs font-bold text-slate-700">
                  <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
                  <span>Loading Real Radar Pins...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Territory Breakdown & Pin Details (1 Col) */}
        <div className="space-y-4">
          {/* Selected Lead Card */}
          {selectedLead ? (
            <div className="bg-white p-4 rounded-3xl border border-brand-200 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-mono font-black text-brand-600 text-xs">{selectedLead.leadId}</span>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm">{selectedLead.name}</h4>
                <p className="text-xs text-slate-600 font-mono mt-0.5">{selectedLead.phone}</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-800">{selectedLead.territory}</div>
                    <div className="text-[10px] text-slate-400 leading-tight">{selectedLead.location}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Source:</span>
                  <span className="font-bold text-slate-800">{selectedLead.source}</span>
                </div>

                {selectedLead.campaign && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Campaign:</span>
                    <span className="font-bold text-brand-600">{selectedLead.campaign}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-slate-800">{selectedLead.status}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Priority:</span>
                  <span className="font-bold text-slate-800">{selectedLead.priority}</span>
                </div>

                {selectedLead.followupDate && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Follow-up:</span>
                    <span className="font-semibold text-brand-700">
                      {new Date(selectedLead.followupDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/leads?search=${selectedLead.leadId}`)}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Lead Profile</span>
              </button>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                Territory Breakdown
              </h4>
              <p className="text-[11px] text-slate-500">Click any cluster below to focus on that locality:</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs">
                {clusters.slice(0, 8).map(c => (
                  <div
                    key={c.territory}
                    onClick={() => handleClusterClick(c)}
                    className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span className="font-semibold text-slate-800">{c.territory}</span>
                    <span className="font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg text-[10px]">
                      {c.leads.length} Leads
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlocated Leads Notice */}
          {unlocated.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Unlocated Inquiries ({unlocated.length})</span>
              </div>
              <p className="text-[11px] text-amber-800">
                {unlocated.length} lead has unmapped address notes in Excel:
              </p>
              <div className="space-y-1">
                {unlocated.map(u => (
                  <div key={u.id} className="text-[10px] bg-white/70 p-1.5 rounded-lg text-slate-700 flex items-center justify-between">
                    <span className="font-bold">{u.leadId}: {u.name}</span>
                    <span className="text-slate-500 italic font-mono">{u.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

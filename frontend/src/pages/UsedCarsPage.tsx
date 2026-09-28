import React, { useState, useEffect, useRef } from 'react';
import { 
  CarFront, Plus, Search, Tag, DollarSign, Calendar, CheckCircle2, 
  Upload, Trash2, Star, Eye, ShieldCheck, Phone, Mail, MapPin, 
  Filter, Sparkles, SlidersHorizontal, Image as ImageIcon, Check, X,
  TrendingUp, Wrench, FileText, UserCheck, PhoneCall, MessageCircle,
  AlertCircle, RefreshCw, Layers, Fuel, Gauge, CheckCircle, Clock,
  ChevronRight, ExternalLink, HelpCircle, Edit2
} from 'lucide-react';
import { api } from '../services/api';
import { UsedCar, UsedCarImage, UsedCarBuyerInquiry, UsedCarStats } from '../types';
import { CurrencyDisplay } from '../components/shared/CurrencyDisplay';
import { StatusBadge } from '../components/shared/StatusBadge';
import { toast } from 'sonner';

export const UsedCarsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SHOWROOM' | 'BUYER_SEARCH' | 'INQUIRIES' | 'STATS'>('SHOWROOM');

  // Inventory State
  const [cars, setCars] = useState<UsedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [generalSearch, setGeneralSearch] = useState('');

  // Stats State
  const [stats, setStats] = useState<UsedCarStats | null>(null);

  // Inquiries State
  const [inquiries, setInquiries] = useState<UsedCarBuyerInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Selected Car for View Details Modal
  const [selectedCar, setSelectedCar] = useState<UsedCar | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [detailAddPhotoType, setDetailAddPhotoType] = useState('Front View');
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Buyer Inquiry Modal State (Attached to specific car)
  const [inquiryCar, setInquiryCar] = useState<UsedCar | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    buyerName: '',
    phone: '',
    email: '',
    contactMethod: 'WhatsApp',
    message: 'Hello, I am interested in this vehicle. Please share further details and schedule a inspection/test drive.',
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Add / Edit Car Modal State
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<UsedCar | null>(null);
  const [submittingCar, setSubmittingCar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local Device Uploaded Images State for the Form
  const [devicePhotos, setDevicePhotos] = useState<Array<{
    id: string;
    imageUrl: string;
    imageType: string;
    isPrimary: boolean;
    name?: string;
  }>>([]);

  const [carFormData, setCarFormData] = useState({
    registrationNumber: '',
    make: 'Honda',
    model: 'City',
    variant: '1.5 V i-VTEC',
    manufacturingYear: '2021',
    registrationYear: '2021',
    kilometers: '36000',
    fuelType: 'Petrol',
    transmission: 'Manual',
    color: 'White',
    owners: '1',
    condition: 'Excellent',
    sellingPrice: '620000',
    description: 'Immaculate single-owner car, complete authorised showroom service history, non-accidental with dual airbags and ABS.',
    location: 'Indiranagar, Bengaluru',
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    status: 'Available',
  });

  // Buyer Search Filters State
  const [buyerMinBudget, setBuyerMinBudget] = useState('');
  const [buyerMaxBudget, setBuyerMaxBudget] = useState('');
  const [buyerModel, setBuyerModel] = useState('ALL');
  const [buyerModelSearch, setBuyerModelSearch] = useState('');
  const [buyerBrand, setBuyerBrand] = useState('ALL');
  const [buyerYear, setBuyerYear] = useState('ALL');
  const [buyerFuel, setBuyerFuel] = useState('ALL');
  const [buyerTrans, setBuyerTrans] = useState('ALL');
  const [buyerMinKm, setBuyerMinKm] = useState('');
  const [buyerMaxKm, setBuyerMaxKm] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('ALL');

  const [searchResults, setSearchResults] = useState<UsedCar[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch Inventory & Stats
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getUsedCars({
        status: statusFilter,
      });
      setCars(res.data || []);
    } catch {
      toast.error('Failed to load vehicle showroom');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.getUsedCarStats();
      setStats(res.data);
    } catch {
      // stats error fallback
    }
  };

  const fetchInquiries = async () => {
    try {
      setLoadingInquiries(true);
      const res = await api.getUsedCarInquiries();
      setInquiries(res.data || []);
    } catch {
      toast.error('Failed to load inquiries');
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, [statusFilter]);

  useEffect(() => {
    if (activeTab === 'INQUIRIES' || activeTab === 'STATS') {
      fetchInquiries();
      fetchStats();
    }
  }, [activeTab]);

  // Execute Buyer Search (Strict AVAILABLE only)
  const executeBuyerSearch = async () => {
    try {
      setSearching(true);
      const effectiveModel = buyerModelSearch.trim() || (buyerModel !== 'ALL' ? buyerModel : undefined);

      const params: Record<string, any> = {
        status: 'AVAILABLE', // Strictly available only as required!
      };

      if (buyerMinBudget && !isNaN(Number(buyerMinBudget))) params.minBudget = buyerMinBudget;
      if (buyerMaxBudget && !isNaN(Number(buyerMaxBudget))) params.maxBudget = buyerMaxBudget;
      if (effectiveModel) params.model = effectiveModel;
      if (buyerBrand !== 'ALL') params.brand = buyerBrand;
      if (buyerYear !== 'ALL') params.year = buyerYear;
      if (buyerFuel !== 'ALL') params.fuelType = buyerFuel;
      if (buyerTrans !== 'ALL') params.transmission = buyerTrans;
      if (buyerMinKm) params.minKm = buyerMinKm;
      if (buyerMaxKm) params.maxKm = buyerMaxKm;
      if (buyerLocation !== 'ALL') params.location = buyerLocation;

      const res = await api.searchUsedCars(params);
      setSearchResults(res.data || []);
    } catch {
      toast.error('Failed to execute car search');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'BUYER_SEARCH') {
      executeBuyerSearch();
    }
  }, [
    activeTab,
    buyerMinBudget,
    buyerMaxBudget,
    buyerModel,
    buyerModelSearch,
    buyerBrand,
    buyerYear,
    buyerFuel,
    buyerTrans,
    buyerMinKm,
    buyerMaxKm,
    buyerLocation,
  ]);

  const handleClearFilters = () => {
    setBuyerMinBudget('');
    setBuyerMaxBudget('');
    setBuyerModel('ALL');
    setBuyerModelSearch('');
    setBuyerBrand('ALL');
    setBuyerYear('ALL');
    setBuyerFuel('ALL');
    setBuyerTrans('ALL');
    setBuyerMinKm('');
    setBuyerMaxKm('');
    setBuyerLocation('ALL');
  };

  // Dynamic models & brands from current available inventory
  const availableCars = cars.filter(c => c.status?.toUpperCase() === 'AVAILABLE');
  const dynamicModels = Array.from(new Set(availableCars.map(c => c.model))).filter(Boolean).sort();
  const dynamicBrands = Array.from(new Set(availableCars.map(c => c.make || c.brand))).filter(Boolean).sort();
  const dynamicLocations = Array.from(new Set(availableCars.map(c => c.location))).filter(Boolean).sort();

  // Handle Device Photo Selection (accepts JPG, JPEG, PNG, WEBP)
  const handleDeviceFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const angleCategories = ['Front View', 'Rear View', 'Left Side', 'Right Side', 'Interior', 'Dashboard', 'Engine', 'Other'];
    let currentIdx = devicePhotos.length;

    Array.from(files).forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast.error(`${file.name} is not a supported format (JPG, PNG, WEBP only).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        const autoType = angleCategories[currentIdx % angleCategories.length] || 'Other';
        const isFirst = devicePhotos.length === 0 && currentIdx === 0;

        setDevicePhotos(prev => [
          ...prev,
          {
            id: `dev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            imageUrl: dataUrl,
            imageType: autoType,
            isPrimary: isFirst,
            name: file.name,
          }
        ]);
        currentIdx++;
      };
      reader.readAsDataURL(file);
    });

    toast.success(`Selected ${files.length} photo(s) from device.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDevicePhoto = (photoId: string) => {
    setDevicePhotos(prev => {
      const filtered = prev.filter(p => p.id !== photoId);
      if (filtered.length > 0 && !filtered.some(p => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryDevicePhoto = (photoId: string) => {
    setDevicePhotos(prev =>
      prev.map(p => ({ ...p, isPrimary: p.id === photoId }))
    );
    toast.success('Selected as primary cover image');
  };

  const handleUpdateDevicePhotoType = (photoId: string, newType: string) => {
    setDevicePhotos(prev =>
      prev.map(p => (p.id === photoId ? { ...p, imageType: newType } : p))
    );
  };

  // Open Add Car Modal
  const openAddCarModal = () => {
    setEditingCar(null);
    setCarFormData({
      registrationNumber: '',
      make: 'Honda',
      model: 'City',
      variant: '1.5 V i-VTEC',
      manufacturingYear: '2021',
      registrationYear: '2021',
      kilometers: '36000',
      fuelType: 'Petrol',
      transmission: 'Manual',
      color: 'White',
      owners: '1',
      condition: 'Excellent',
      sellingPrice: '620000',
      description: 'Single-owner doctor driven vehicle. Complete showroom service record with warranty.',
      location: 'Indiranagar, Bengaluru',
      sellerName: 'Dr. Anand Kulkarni',
      sellerPhone: '+91 98450 11920',
      sellerEmail: 'anand.k@example.com',
      status: 'Available',
    });
    setDevicePhotos([
      {
        id: 'sample_1',
        imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
        imageType: 'Front View',
        isPrimary: true,
        name: 'front_view.jpg'
      },
      {
        id: 'sample_2',
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        imageType: 'Rear View',
        isPrimary: false,
        name: 'rear_view.jpg'
      },
      {
        id: 'sample_3',
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
        imageType: 'Interior',
        isPrimary: false,
        name: 'interior.jpg'
      }
    ]);
    setShowAddCarModal(true);
  };

  // Open Edit Car Modal
  const openEditCarModal = (car: UsedCar) => {
    setEditingCar(car);
    setCarFormData({
      registrationNumber: car.registrationNumber,
      make: car.make || car.brand || 'Honda',
      model: car.model,
      variant: car.variant || '',
      manufacturingYear: String(car.year || car.manufacturingYear || 2021),
      registrationYear: String(car.registrationYear || car.year || 2021),
      kilometers: String(car.odometerKm || car.kilometers || 35000),
      fuelType: car.fuelType,
      transmission: car.transmission,
      color: car.color,
      owners: String(car.ownersCount || car.owners || 1),
      condition: car.carCondition || car.condition || 'Excellent',
      sellingPrice: String(car.expectedSalePrice || car.sellingPrice || 500000),
      description: car.description || '',
      location: car.location || 'Indiranagar, Bengaluru',
      sellerName: car.sellerName || '',
      sellerPhone: car.sellerPhone || '',
      sellerEmail: car.sellerEmail || '',
      status: car.status || 'Available',
    });

    const existingPhotos = (car.images || []).map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      imageType: img.imageType,
      isPrimary: img.isPrimary,
      name: img.imageType,
    }));
    setDevicePhotos(existingPhotos);
    setShowAddCarModal(true);
  };

  // Submit Add / Edit Car
  const handleSubmitCarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.registrationNumber.trim() || !carFormData.model.trim() || !carFormData.sellingPrice) {
      toast.error('Registration number, model, and selling price are required.');
      return;
    }

    try {
      setSubmittingCar(true);
      const payload = {
        ...carFormData,
        images: devicePhotos.map(p => ({
          imageUrl: p.imageUrl,
          imageType: p.imageType,
          isPrimary: p.isPrimary,
        })),
        primaryImage: devicePhotos.find(p => p.isPrimary)?.imageUrl || devicePhotos[0]?.imageUrl || null,
      };

      if (editingCar) {
        await api.updateUsedCar(editingCar.id, payload);
        toast.success(`Vehicle ${carFormData.make} ${carFormData.model} updated successfully!`);
      } else {
        await api.createUsedCar(payload);
        toast.success(`Vehicle ${carFormData.make} ${carFormData.model} listed for sale!`);
      }

      setShowAddCarModal(false);
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save car');
    } finally {
      setSubmittingCar(false);
    }
  };

  // Delete Car
  const handleDeleteCar = async (car: UsedCar) => {
    if (!window.confirm(`Are you sure you want to remove ${car.make} ${car.model} (${car.registrationNumber}) from listings?`)) {
      return;
    }
    try {
      await api.deleteUsedCar(car.id);
      toast.success('Car removed from showroom.');
      if (selectedCar?.id === car.id) setSelectedCar(null);
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete car');
    }
  };

  // Quick Status Toggle (Available -> Reserved -> Sold -> Inactive)
  const handleQuickStatusChange = async (carId: string, newStatus: string) => {
    try {
      await api.updateUsedCar(carId, { status: newStatus.toUpperCase() });
      toast.success(`Vehicle status changed to ${newStatus}`);
      fetchInventory();
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  // Upload Additional Photo directly in Detail Modal
  const handleDetailPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCar) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      try {
        await api.uploadCarImage(selectedCar.id, {
          imageUrl: dataUrl,
          imageType: detailAddPhotoType,
          isPrimary: false,
        });
        toast.success('Additional photo saved to vehicle gallery!');
        const updated = await api.getUsedCarById(selectedCar.id);
        setSelectedCar(updated.data);
        fetchInventory();
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload photo');
      }
    };
    reader.readAsDataURL(file);
    if (detailFileInputRef.current) detailFileInputRef.current.value = '';
  };

  // Delete photo in Detail Modal
  const handleDeleteCarImage = async (imageId: string) => {
    if (!selectedCar) return;
    try {
      await api.deleteCarImage(imageId);
      toast.success('Photo removed.');
      const updated = await api.getUsedCarById(selectedCar.id);
      setSelectedCar(updated.data);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete photo');
    }
  };

  // Set Primary photo in Detail Modal
  const handleSetPrimaryCarImage = async (imageId: string) => {
    if (!selectedCar) return;
    try {
      await api.setPrimaryCarImage(imageId);
      toast.success('Cover photo updated!');
      const updated = await api.getUsedCarById(selectedCar.id);
      setSelectedCar(updated.data);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update cover photo');
    }
  };

  // Submit Buyer Inquiry
  const handleSubmitBuyerInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryCar || !inquiryForm.buyerName.trim() || !inquiryForm.phone.trim()) {
      toast.error('Buyer Name and Mobile Phone are required.');
      return;
    }

    try {
      setSubmittingInquiry(true);
      await api.createVehicleInquiry(inquiryCar.id, {
        buyerName: inquiryForm.buyerName,
        phone: inquiryForm.phone,
        email: inquiryForm.email,
        contactMethod: inquiryForm.contactMethod,
        message: inquiryForm.message,
        vehicleModel: `${inquiryCar.year} ${inquiryCar.make} ${inquiryCar.model}`,
        vehiclePrice: inquiryCar.expectedSalePrice || inquiryCar.sellingPrice,
      });

      toast.success(`🎉 Inquiry sent for ${inquiryCar.make} ${inquiryCar.model}! Our team will reach out via ${inquiryForm.contactMethod}.`);
      setInquiryCar(null);
      fetchStats();
      fetchInquiries();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Helper to open WhatsApp to seller
  const handleContactSellerWhatsApp = (car: UsedCar) => {
    const phone = (car.sellerPhone || '+91 98450 11920').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${car.sellerName || 'Seller'}, I saw your ${car.year} ${car.make} ${car.model} (${car.registrationNumber}) listed on Sri Munis Kanna Pre-Owned Showroom for ₹${(car.expectedSalePrice || 0).toLocaleString()}. Is it currently available for inspection?`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CarFront className="w-6 h-6 text-brand-600" />
            Certified Pre-Owned & Used Car Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Seller vehicle uploads with device photo gallery, dynamic buyer search & instant inquiries ({cars.length} cars in showroom)
          </p>
        </div>

        {/* Top Buttons: [ + Add Used Car ] & [ Find Your Car ] */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTab('BUYER_SEARCH');
              executeBuyerSearch();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Search className="w-4 h-4 text-brand-600" />
            Find Your Car
          </button>

          <button
            onClick={openAddCarModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            + Add Used Car
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SHOWROOM')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SHOWROOM'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CarFront className="w-3.5 h-3.5" />
            Showroom Inventory ({cars.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('BUYER_SEARCH');
              executeBuyerSearch();
            }}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BUYER_SEARCH'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-brand-400" />
            Buyer Search & Filters
          </button>

          <button
            onClick={() => setActiveTab('INQUIRIES')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INQUIRIES'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
            Buyer Inquiries ({inquiries.length || stats?.totalBuyerInquiries || 0})
          </button>

          <button
            onClick={() => setActiveTab('STATS')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STATS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            Marketplace Analytics
          </button>
        </div>

        {/* Status Filter for Showroom */}
        {activeTab === 'SHOWROOM' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 text-xs shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. SHOWROOM INVENTORY (CAR LISTING CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'SHOWROOM' && (
        <div className="space-y-6">
          {/* Quick Search in Showroom */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Quick search by brand, model, registration or seller..."
              value={generalSearch}
              onChange={(e) => setGeneralSearch(e.target.value)}
              className="w-full text-xs outline-none bg-transparent"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading verified vehicles...</div>
          ) : cars.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CarFront className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-sm">No used cars in this category</h3>
              <p className="text-xs text-slate-500">Click "+ Add Used Car" above to list your first vehicle with device photos.</p>
              <button
                onClick={openAddCarModal}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Used Car Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars
                .filter(c => 
                  !generalSearch || 
                  c.model.toLowerCase().includes(generalSearch.toLowerCase()) || 
                  c.make.toLowerCase().includes(generalSearch.toLowerCase()) ||
                  c.registrationNumber.toLowerCase().includes(generalSearch.toLowerCase()) ||
                  (c.sellerName && c.sellerName.toLowerCase().includes(generalSearch.toLowerCase()))
                )
                .map((car) => {
                  const coverImg = car.primaryImage || (car.images && car.images.length > 0 ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800');

                  return (
                    <div
                      key={car.id}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      {/* Image Thumbnail with Registration & Status */}
                      <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={coverImg}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="font-mono text-xs font-black bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl shadow-xs">
                            {car.registrationNumber}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={car.status} />
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-800 px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-brand-600" />
                            {car.images?.length || 1} Photos
                          </span>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-brand-700 tracking-wide uppercase">
                              {car.make || car.brand}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {car.location || 'Bengaluru'}
                            </span>
                          </div>

                          <h3 className="font-black text-slate-900 text-base mt-1 line-clamp-1">
                            {car.year} {car.make} {car.model} {car.variant ? `• ${car.variant}` : ''}
                          </h3>

                          {/* Vehicle Specs Grid */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              <span>{car.odometerKm?.toLocaleString()} km</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Fuel className="w-3.5 h-3.5 text-slate-400" />
                              <span>{car.fuelType}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-slate-400" />
                              <span>{car.transmission}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{car.ownersCount || 1} Owner</span>
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selling Price</span>
                              <h4 className="text-xl font-black text-slate-900">
                                <CurrencyDisplay amount={car.expectedSalePrice || car.sellingPrice || 0} />
                              </h4>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {car.carCondition || 'Certified Clean'}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedCar(car)}
                              className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                            <button
                              onClick={() => handleContactSellerWhatsApp(car)}
                              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Contact Seller
                            </button>
                          </div>

                          {/* Staff Controls (Edit / Delete / Status toggle) */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                            <select
                              value={car.status}
                              onChange={(e) => handleQuickStatusChange(car.id, e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="RESERVED">Reserved</option>
                              <option value="SOLD">Sold</option>
                              <option value="INACTIVE">Inactive</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditCarModal(car)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Edit Vehicle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCar(car)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Listing"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FIND YOUR CAR / BUYER SEARCH */}
      {/* ========================================================================= */}
      {activeTab === 'BUYER_SEARCH' && (
        <div className="space-y-6">
          {/* Filter Panel Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-brand-600" />
                  Find Your Car – Search Available Certified Cars
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time budget range filtering, partial model matching & guaranteed available stock only
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Clear Filters
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {searchResults.length} Available Match{searchResults.length === 1 ? '' : 'es'}
                </span>
              </div>
            </div>

            {/* Filter Form Inputs */}
            <div className="space-y-4 text-xs">
              {/* Row 1: Budget Range & Model Search */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. BUDGET FILTER (Min to Max) */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">
                    Budget Range (₹): <strong className="text-brand-700">
                      {buyerMinBudget ? `₹${Number(buyerMinBudget).toLocaleString()}` : 'Any Min'} → {buyerMaxBudget ? `₹${Number(buyerMaxBudget).toLocaleString()}` : 'Any Max'}
                    </strong>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min Budget (₹)"
                      value={buyerMinBudget}
                      onChange={(e) => setBuyerMinBudget(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                    />
                    <input
                      type="number"
                      placeholder="Max Budget (₹)"
                      value={buyerMaxBudget}
                      onChange={(e) => setBuyerMaxBudget(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                    />
                  </div>

                  {/* Budget Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { label: '< ₹4 Lakh', min: '', max: '400000' },
                      { label: '₹4 - 7 Lakh', min: '400000', max: '700000' },
                      { label: '₹7 - 10 Lakh', min: '700000', max: '1000000' },
                      { label: '> ₹10 Lakh', min: '1000000', max: '' },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setBuyerMinBudget(chip.min);
                          setBuyerMaxBudget(chip.max);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                          buyerMinBudget === chip.min && buyerMaxBudget === chip.max
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. DYNAMIC MODEL SELECTOR & SEARCH */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">
                    Car Model (Dynamic / Search):
                  </label>
                  <input
                    type="text"
                    placeholder="Search Model (e.g. City, Swift, i20)..."
                    value={buyerModelSearch}
                    onChange={(e) => setBuyerModelSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  />
                  {dynamicModels.length > 0 && (
                    <select
                      value={buyerModel}
                      onChange={(e) => {
                        setBuyerModel(e.target.value);
                        setBuyerModelSearch('');
                      }}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
                    >
                      <option value="ALL">All Available Models ({dynamicModels.length})</option>
                      {dynamicModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 3. BRAND / MAKE */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Brand / Make</label>
                  <select
                    value={buyerBrand}
                    onChange={(e) => setBuyerBrand(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="ALL">All Brands</option>
                    {dynamicBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Secondary Filters (Fuel, Transmission, Location, Year) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={buyerFuel}
                    onChange={(e) => setBuyerFuel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Any Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transmission</label>
                  <select
                    value={buyerTrans}
                    onChange={(e) => setBuyerTrans(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Any Transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="AMT">AMT</option>
                    <option value="CVT">CVT</option>
                    <option value="DCT">DCT</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Minimum Year</label>
                  <select
                    value={buyerYear}
                    onChange={(e) => setBuyerYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Any Year</option>
                    <option value="2023">2023 or newer</option>
                    <option value="2022">2022 or newer</option>
                    <option value="2021">2021 or newer</option>
                    <option value="2020">2020 or newer</option>
                    <option value="2019">2019 or newer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <select
                    value={buyerLocation}
                    onChange={(e) => setBuyerLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Any Location</option>
                    {dynamicLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searching ? (
            <div className="p-12 text-center text-xs text-slate-400">Searching matching available cars...</div>
          ) : searchResults.length === 0 ? (
            /* Requirement 14: Clear empty state with clear filters button */
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CarFront className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                No cars found matching your selected model and budget.
              </h3>
              <p className="text-xs text-slate-500">
                Try widening your budget range or clearing specific model and transmission filters.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((car) => {
                const coverImg = car.primaryImage || (car.images && car.images.length > 0 ? car.images[0].imageUrl : 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800');

                return (
                  <div
                    key={car.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-48 w-full bg-slate-100">
                      <img src={coverImg} alt={car.model} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 font-mono text-xs font-black bg-slate-900/80 text-white px-2.5 py-1 rounded-xl">
                        {car.registrationNumber}
                      </span>
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-lg shadow-xs">
                          AVAILABLE
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-extrabold text-brand-700 uppercase">{car.make || car.brand}</span>
                          <span>{car.location || 'Indiranagar'}</span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base mt-0.5">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-slate-500 text-[11px] mt-1">
                          {car.odometerKm?.toLocaleString()} KM • {car.fuelType} • {car.transmission} • {car.ownersCount || 1} Owner
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Price</span>
                          <h4 className="text-lg font-black text-slate-900">
                            <CurrencyDisplay amount={car.expectedSalePrice || car.sellingPrice || 0} />
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedCar(car)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setInquiryCar(car);
                              setInquiryForm({
                                buyerName: '',
                                phone: '',
                                email: '',
                                contactMethod: 'WhatsApp',
                                message: `I am interested in buying your ${car.year} ${car.make} ${car.model}. Please contact me with availability and inspection slot.`,
                              });
                            }}
                            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Send Inquiry
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BUYER INQUIRIES TAB (FOR STAFF & SELLER) */}
      {/* ========================================================================= */}
      {activeTab === 'INQUIRIES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Customer Buyer Inquiries on Vehicles
              </h2>
              <p className="text-xs text-slate-500">Inquiries submitted by prospective buyers via vehicle detail pages</p>
            </div>
            <button
              onClick={fetchInquiries}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loadingInquiries ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
              No inquiries received yet. Inquiries submitted on vehicle pages will appear here.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Inquiry Code</th>
                    <th className="py-3.5 px-4">Buyer Details</th>
                    <th className="py-3.5 px-4">Attached Vehicle</th>
                    <th className="py-3.5 px-4">Preferred Channel</th>
                    <th className="py-3.5 px-4">Buyer Message</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inquiries.map(inq => (
                    <tr key={inq.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inq.inquiryCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inq.buyerName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{inq.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-brand-700">{inq.vehicleModel || inq.usedCar?.model || 'General Inquiry'}</strong>
                        {inq.vehiclePrice && (
                          <div className="text-[10px] text-slate-500 font-bold">
                            ₹{inq.vehiclePrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {inq.contactMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{inq.message || '—'}</td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${inq.buyerName}, thank you for your inquiry regarding ${inq.vehicleModel || 'the vehicle'}. I am connecting from Sri Munis Kanna Showroom.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SELLER / STAFF MARKETPLACE ANALYTICS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'STATS' && (
        <div className="space-y-6">
          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Cars</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats?.totalCars || cars.length}</h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Available</span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {stats?.availableCars ?? cars.filter(c => c.status === 'AVAILABLE').length}
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-600">Reserved</span>
              <h3 className="text-2xl font-black text-amber-700 mt-1">
                {stats?.reservedCars ?? cars.filter(c => c.status === 'RESERVED').length}
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-blue-600">Sold</span>
              <h3 className="text-2xl font-black text-blue-700 mt-1">
                {stats?.soldCars ?? cars.filter(c => c.status === 'SOLD').length}
              </h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-purple-600">Total Listings</span>
              <h3 className="text-2xl font-black text-purple-700 mt-1">{stats?.totalListings || cars.length}</h3>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-600">Buyer Inquiries</span>
              <h3 className="text-2xl font-black text-rose-700 mt-1">{stats?.totalBuyerInquiries || inquiries.length}</h3>
            </div>
          </div>

          {/* Quick Views */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Recent Listings */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" /> Recent Vehicle Listings
              </h4>
              <div className="space-y-2">
                {(stats?.recentListings || cars.slice(0, 5)).map(car => (
                  <div key={car.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">{car.year} {car.make} {car.model}</h5>
                      <span className="text-[11px] font-mono text-slate-500">{car.registrationNumber} • {car.location || 'Bengaluru'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900">₹{(car.expectedSalePrice || 0).toLocaleString()}</span>
                      <div className="text-[10px]"><StatusBadge status={car.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Sold */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recently Sold Vehicles
              </h4>
              <div className="space-y-2">
                {cars.filter(c => c.status === 'SOLD').length === 0 ? (
                  <p className="text-slate-400 py-6 text-center">No vehicles marked as Sold yet.</p>
                ) : (
                  cars.filter(c => c.status === 'SOLD').slice(0, 5).map(car => (
                    <div key={car.id} className="p-3 bg-emerald-50/50 rounded-2xl flex items-center justify-between border border-emerald-100">
                      <div>
                        <h5 className="font-bold text-slate-900">{car.year} {car.make} {car.model}</h5>
                        <span className="text-[11px] text-slate-500">{car.registrationNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-800">₹{(car.expectedSalePrice || 0).toLocaleString()}</span>
                        <span className="block text-[10px] text-emerald-600 font-bold">Sold & Delivered</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT USED CAR MODAL (DEVICE PHOTO UPLOADER) */}
      {/* ========================================================================= */}
      {showAddCarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 md:p-8 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200">
                  <CarFront className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCar ? `Edit Car (${editingCar.registrationNumber})` : 'List Used Car for Sale'}
                  </h3>
                  <p className="text-xs text-slate-500">Upload device pictures, specify technical specs & set valuation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCarForm} className="space-y-6">
              {/* SECTION 1: UPLOAD CAR PHOTOS FROM DEVICE */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-brand-600" />
                      1. Upload Car Photos from Device (JPG, PNG, WEBP) *
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select multiple photos. Tag angles (Front, Rear, Side, Interior, Dashboard, Engine). Click "★ Set Cover" to pick the primary listing photo.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleDeviceFilesSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload from Device
                  </button>
                </div>

                {/* Previews Grid */}
                {devicePhotos.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-white transition-colors"
                  >
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Click to select car photos from your computer or phone</p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts JPG, JPEG, PNG, WEBP</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {devicePhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all group bg-white ${
                          photo.isPrimary ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.imageType}
                          className="w-full h-28 object-cover"
                        />

                        {/* Primary Badge */}
                        {photo.isPrimary && (
                          <span className="absolute top-2 left-2 text-[9px] font-black bg-brand-600 text-white px-2 py-0.5 rounded-lg shadow-xs flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Cover Image
                          </span>
                        )}

                        {/* Angle Tag Selector */}
                        <div className="p-2 space-y-1.5 bg-white border-t border-slate-100">
                          <select
                            value={photo.imageType}
                            onChange={(e) => handleUpdateDevicePhotoType(photo.id, e.target.value)}
                            className="w-full text-[10px] font-bold px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                          >
                            <option value="Front View">Front View</option>
                            <option value="Rear View">Rear View</option>
                            <option value="Left Side">Left Side</option>
                            <option value="Right Side">Right Side</option>
                            <option value="Interior">Interior</option>
                            <option value="Dashboard">Dashboard</option>
                            <option value="Engine">Engine</option>
                            <option value="Other">Other Angle</option>
                          </select>

                          <div className="flex items-center justify-between pt-0.5">
                            {!photo.isPrimary ? (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryDevicePhoto(photo.id)}
                                className="text-[10px] font-bold text-brand-600 hover:underline cursor-pointer"
                              >
                                Set Cover
                              </button>
                            ) : (
                              <span className="text-[10px] font-black text-brand-700">★ Primary</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveDevicePhoto(photo.id)}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: VEHICLE TECHNICAL DETAILS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs">2. Vehicle Specifications</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Registration Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KA01-MJ-2041"
                      value={carFormData.registrationNumber}
                      onChange={(e) => setCarFormData({ ...carFormData, registrationNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Brand / Make *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Honda, Hyundai, Maruti"
                      value={carFormData.make}
                      onChange={(e) => setCarFormData({ ...carFormData, make: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. City, Swift, i20"
                      value={carFormData.model}
                      onChange={(e) => setCarFormData({ ...carFormData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Variant</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.5 V i-VTEC"
                      value={carFormData.variant}
                      onChange={(e) => setCarFormData({ ...carFormData, variant: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mfg Year *</label>
                    <input
                      type="number"
                      required
                      value={carFormData.manufacturingYear}
                      onChange={(e) => setCarFormData({ ...carFormData, manufacturingYear: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Reg Year</label>
                    <input
                      type="number"
                      value={carFormData.registrationYear}
                      onChange={(e) => setCarFormData({ ...carFormData, registrationYear: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kilometers *</label>
                    <input
                      type="number"
                      required
                      value={carFormData.kilometers}
                      onChange={(e) => setCarFormData({ ...carFormData, kilometers: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fuel Type *</label>
                    <select
                      value={carFormData.fuelType}
                      onChange={(e) => setCarFormData({ ...carFormData, fuelType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transmission *</label>
                    <select
                      value={carFormData.transmission}
                      onChange={(e) => setCarFormData({ ...carFormData, transmission: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                      <option value="AMT">AMT</option>
                      <option value="CVT">CVT</option>
                      <option value="DCT">DCT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. White"
                      value={carFormData.color}
                      onChange={(e) => setCarFormData({ ...carFormData, color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Owners Count</label>
                    <select
                      value={carFormData.owners}
                      onChange={(e) => setCarFormData({ ...carFormData, owners: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="1">1st Owner</option>
                      <option value="2">2nd Owner</option>
                      <option value="3">3rd Owner</option>
                      <option value="4">4+ Owners</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 550000"
                      value={carFormData.sellingPrice}
                      onChange={(e) => setCarFormData({ ...carFormData, sellingPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-black text-brand-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Condition</label>
                    <select
                      value={carFormData.condition}
                      onChange={(e) => setCarFormData({ ...carFormData, condition: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="Excellent">Excellent (Showroom Mint)</option>
                      <option value="Very Good">Very Good (Clean)</option>
                      <option value="Good">Good (Normal City Wear)</option>
                      <option value="Fair">Fair (Needs Minor Detailing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vehicle Status</label>
                    <select
                      value={carFormData.status}
                      onChange={(e) => setCarFormData({ ...carFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold text-emerald-700"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Showroom Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Indiranagar, Bengaluru"
                    value={carFormData.location}
                    onChange={(e) => setCarFormData({ ...carFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description & Inspection Notes</label>
                  <textarea
                    rows={2}
                    value={carFormData.description}
                    onChange={(e) => setCarFormData({ ...carFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* SECTION 3: SELLER INFORMATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs">3. Seller Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seller Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Anand Kulkarni"
                      value={carFormData.sellerName}
                      onChange={(e) => setCarFormData({ ...carFormData, sellerName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seller Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98450 12345"
                      value={carFormData.sellerPhone}
                      onChange={(e) => setCarFormData({ ...carFormData, sellerPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Seller Email</label>
                    <input
                      type="email"
                      placeholder="seller@example.com"
                      value={carFormData.sellerEmail}
                      onChange={(e) => setCarFormData({ ...carFormData, sellerEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCarModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCar}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black shadow-md shadow-brand-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingCar ? 'Saving Car...' : (editingCar ? 'Update Listing' : 'Publish Car Listing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VEHICLE DETAILS MODAL (WITH HIGH-RES GALLERY & CONTACT/INQUIRY BUTTONS) */}
      {/* ========================================================================= */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto space-y-5 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">
                    {selectedCar.year} {selectedCar.make} {selectedCar.model} {selectedCar.variant ? `(${selectedCar.variant})` : ''}
                  </h2>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedCar.registrationNumber}
                  </span>
                  <StatusBadge status={selectedCar.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {selectedCar.location || 'Bengaluru'} • Stock ID: {selectedCar.carCode}
                </p>
              </div>

              <button
                onClick={() => setSelectedCar(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Image Gallery Viewport */}
            <div className="space-y-3">
              <div className="relative h-64 sm:h-80 w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-200">
                <img
                  src={
                    selectedCar.images && selectedCar.images.length > 0
                      ? selectedCar.images[selectedImageIndex % selectedCar.images.length]?.imageUrl
                      : selectedCar.primaryImage || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800'
                  }
                  alt="Car Preview"
                  className="w-full h-full object-contain"
                />

                {/* Tag & Primary Badge */}
                {selectedCar.images && selectedCar.images[selectedImageIndex % selectedCar.images.length] && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="bg-slate-900/85 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-bold">
                      {selectedCar.images[selectedImageIndex % selectedCar.images.length].imageType}
                    </span>
                    {selectedCar.images[selectedImageIndex % selectedCar.images.length].isPrimary && (
                      <span className="bg-brand-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Primary Cover Image
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnails Strip */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {selectedCar.images.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 cursor-pointer shrink-0 transition-all ${
                        selectedImageIndex === idx ? 'border-brand-600 shadow-sm ring-2 ring-brand-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.imageUrl} alt={img.imageType} className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Additional Photo into this Car */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Add Photo from Device:</span>
                  <select
                    value={detailAddPhotoType}
                    onChange={(e) => setDetailAddPhotoType(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="Front View">Front View</option>
                    <option value="Rear View">Rear View</option>
                    <option value="Left Side">Left Side</option>
                    <option value="Right Side">Right Side</option>
                    <option value="Interior">Interior</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Engine">Engine</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <input
                    type="file"
                    ref={detailFileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleDetailPhotoSelected}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => detailFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload Device Image
                  </button>
                </div>
              </div>
            </div>

            {/* Price Banner & Actions */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-brand-900 text-white rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Selling Price</span>
                <h3 className="text-2xl font-black">
                  <CurrencyDisplay amount={selectedCar.expectedSalePrice || selectedCar.sellingPrice || 0} />
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleContactSellerWhatsApp(selectedCar)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" /> Contact Seller
                </button>

                <button
                  onClick={() => {
                    const target = selectedCar;
                    setSelectedCar(null);
                    setInquiryCar(target);
                    setInquiryForm({
                      buyerName: '',
                      phone: '',
                      email: '',
                      contactMethod: 'WhatsApp',
                      message: `I am interested in buying your ${target.year} ${target.make} ${target.model}. Please contact me with availability and inspection slot.`,
                    });
                  }}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  Send Inquiry
                </button>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Kilometers Driven</span>
                <strong className="text-slate-900 text-sm font-mono">{selectedCar.odometerKm?.toLocaleString()} km</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Fuel & Transmission</span>
                <strong className="text-slate-900 text-sm">{selectedCar.fuelType} • {selectedCar.transmission}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Year (Mfg / Reg)</span>
                <strong className="text-slate-900 text-sm">{selectedCar.year} {selectedCar.registrationYear ? `(${selectedCar.registrationYear})` : ''}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Owners & Condition</span>
                <strong className="text-slate-900 text-sm">{selectedCar.ownersCount || 1} Owner • {selectedCar.carCondition || 'Mint'}</strong>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <strong className="font-bold text-slate-900 block">Vehicle Description:</strong>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedCar.description || 'Certified vehicle verified by Sri Munis Kanna mechanics with clean title and comprehensive insurance.'}
              </p>
            </div>

            {/* Seller Contact Info Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Seller Information</span>
                <strong className="text-slate-900 font-bold">{selectedCar.sellerName || 'Direct Academy Trade-in'}</strong>
                <p className="text-slate-500 font-mono text-[11px]">{selectedCar.sellerPhone || '+91 98450 11920'}</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${(selectedCar.sellerPhone || '+91 98450 11920').replace(/\D/g, '')}`}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-600" /> Call
                </a>
                <button
                  onClick={() => handleContactSellerWhatsApp(selectedCar)}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCar(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BUYER INQUIRY MODAL (ATTACHED TO SPECIFIC VEHICLE) */}
      {/* ========================================================================= */}
      {inquiryCar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-brand-600" />
                  Send Vehicle Purchase Inquiry
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong>{inquiryCar.year} {inquiryCar.make} {inquiryCar.model}</strong> (₹{(inquiryCar.expectedSalePrice || inquiryCar.sellingPrice || 0).toLocaleString()})
                </p>
              </div>
              <button
                onClick={() => setInquiryCar(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBuyerInquiry} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik Raman"
                    value={inquiryForm.buyerName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, buyerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="karthik@example.com"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Contact Method</label>
                  <select
                    value={inquiryForm.contactMethod}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, contactMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  >
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="Phone Call">📞 Phone Call</option>
                    <option value="Email">✉️ Email</option>
                    <option value="SMS">📱 SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message / Questions</label>
                <textarea
                  rows={3}
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                />
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-2xl text-[11px] text-brand-900 font-medium">
                Vehicle Attached: <strong>{inquiryCar.year} {inquiryCar.make} {inquiryCar.model}</strong> (ID: {inquiryCar.carCode} • Price: ₹{(inquiryCar.expectedSalePrice || 0).toLocaleString()})
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInquiryCar(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingInquiry ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

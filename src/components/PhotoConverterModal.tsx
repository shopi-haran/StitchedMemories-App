import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Upload, Sparkles, Sliders, Layers, Check, Download,
  RefreshCw, Lock, Shield, ArrowRight, Eye, CheckCircle2,
  Edit3, Trash2, Repeat, Ruler, Calculator, ZoomIn, Info,
  ShoppingBag, Package, Truck, CreditCard, Crown
} from 'lucide-react';
import { DMCItem, DMC_DATABASE } from '../utils/dmcPalette';
import {
  PatternConfig,
  GeneratedPattern,
  FABRIC_COUNTS,
  generatePatternFromImage,
  renderPatternCanvas,
  createScaledThumbnail
} from '../utils/patternEngine';
import { exportPatternToPDF } from '../utils/pdfExporter';
import { fetchUserProfile, saveUserConversionJob } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { StudioImageEditorModal } from './StudioImageEditorModal';
import dogImg from '../assets/images/hoop_dog.png';

interface PhotoConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { id?: string; name: string; email: string; avatar_url?: string } | null;
  onLoginSuccess?: (user: { id?: string; name: string; email: string; avatar_url?: string }) => void;
}

export const PhotoConverterModal: React.FC<PhotoConverterModalProps> = ({ isOpen, onClose, user, onLoginSuccess }) => {
  // User Tier & Active Plan Tier State (Free, Pro, Studio)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'studio'>('free');
  const [planTier, setPlanTier] = useState<'free' | 'pro' | 'studio'>('free');

  // Converter Login Prompt & Auth Modal State
  const [showGuestPrompt, setShowGuestPrompt] = useState<boolean>(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    defaultTab: 'login' | 'signup';
    customTitle?: string;
    customSubtitle?: string;
  } | null>(null);

  // Sync plan mode according to user's subscription_tier from Supabase profile
  useEffect(() => {
    let active = true;
    const syncUserTier = async () => {
      let targetTier: 'free' | 'pro' | 'studio' | null = null;

      // 1. Check local storage overrides first
      try {
        const globalOverride = localStorage.getItem('user_tier_global');
        if (globalOverride === 'free' || globalOverride === 'pro' || globalOverride === 'studio') {
          targetTier = globalOverride;
        }

        if (!targetTier && user?.email) {
          const userOverride = localStorage.getItem(`user_tier_${user.email.toLowerCase()}`);
          if (userOverride === 'free' || userOverride === 'pro' || userOverride === 'studio') {
            targetTier = userOverride;
          }
        }

        if (!targetTier) {
          const defaultOverride = localStorage.getItem('user_tier_info.nxuswave@gmail.com') || localStorage.getItem('user_tier_shopi.haran@gmail.com');
          if (defaultOverride === 'free' || defaultOverride === 'pro' || defaultOverride === 'studio') {
            targetTier = defaultOverride;
          }
        }
      } catch {}

      // 2. Fetch from Supabase profile if no local override found
      if (!targetTier) {
        try {
          const emailToUse = user?.email || 'info.nxuswave@gmail.com';
          const idToUse = user?.id || emailToUse;
          const profile = await fetchUserProfile(idToUse, emailToUse);
          const rawTier = (profile?.subscription_tier || '').toLowerCase();
          if (rawTier.includes('studio')) {
            targetTier = 'studio';
          } else if (rawTier.includes('pro')) {
            targetTier = 'pro';
          } else {
            targetTier = 'free';
          }
        } catch (err) {
          console.error('Error fetching user profile for converter tier:', err);
          targetTier = 'free';
        }
      }

      if (active && targetTier) {
        setUserTier(targetTier);
        setPlanTier(targetTier);
      }
    };

    if (isOpen) {
      syncUserTier();
    }

    const handleTierChange = (e: any) => {
      let extractedTier: 'free' | 'pro' | 'studio' | null = null;
      if (typeof e?.detail === 'string') {
        extractedTier = e.detail as any;
      } else if (typeof e?.detail?.tier === 'string') {
        extractedTier = e.detail.tier as any;
      }

      if (extractedTier === 'free' || extractedTier === 'pro' || extractedTier === 'studio') {
        setUserTier(extractedTier);
        setPlanTier(extractedTier);
      } else {
        syncUserTier();
      }
    };

    window.addEventListener('dev-tier-changed', handleTierChange);
    window.addEventListener('tierChanged', handleTierChange);

    return () => {
      active = false;
      window.removeEventListener('dev-tier-changed', handleTierChange);
      window.removeEventListener('tierChanged', handleTierChange);
    };
  }, [isOpen, user]);

  // Input Image State
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('');
  const [customPhotoName, setCustomPhotoName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState<boolean>(false);

  // Pattern Parameters with Default Initial Values
  const [gridWidth, setGridWidth] = useState<number>(60);
  const [fabricCount, setFabricCount] = useState<number>(14);
  const [colorLimit, setColorLimit] = useState<number>(18);
  const [dithering, setDithering] = useState<'none' | 'soft' | 'floyd-steinberg' | 'atkinson'>('none');
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showSymbolsOnColor, setShowSymbolsOnColor] = useState<boolean>(true);
  const [brand, setBrand] = useState<'DMC' | 'Anchor'>('DMC');

  // Reset converter state to defaults for a new conversion session
  const resetSessionState = () => {
    setSelectedPhotoUrl('');
    setOriginalPhotoUrl('');
    setCustomPhotoName('');
    setIsImageEditorOpen(false);
    setGridWidth(60);
    setFabricCount(14);
    setColorLimit(18);
    setDithering('none');
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setShowGridLines(true);
    setShowSymbolsOnColor(true);
    setBrand('DMC');
    setCompletedStitches(new Set());
    setViewMode('color');
    setPattern(null);
    setIsOrderModalOpen(false);
    setOrderPlaced(false);
    setCustomerName('');
    setShippingAddress('');
    setCustomerEmail('');
    setOrderRef('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      localStorage.clear();
    } catch {}
  };

  const handleConvertAnotherImage = () => {
    resetSessionState();
  };

  const handleClose = () => {
    resetSessionState();
    onClose();
  };

  // Order Kit & Supplies Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [orderRef, setOrderRef] = useState<string>('');

  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalConfig({
        isOpen: true,
        defaultTab: 'signup',
        customTitle: 'Create an account to complete your order',
        customSubtitle: 'Please log in or sign up to finalize your stitching supplies order.'
      });
      return;
    }
    const generatedRef = `STM-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderRef(generatedRef);
    setOrderPlaced(true);
  };

  // View Mode: 'color' (Color Chart), 'symbol' (B&W Printable Chart)
  const [viewMode, setViewMode] = useState<'color' | 'symbol'>('color');

  // Processing & Generated Pattern
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pattern, setPattern] = useState<GeneratedPattern | null>(null);

  // Daily Pattern Generations Counter (Free Plan Limit = 3)
  const [dailyGenerations, setDailyGenerations] = useState<number>(1);

  // Manual Color Editing (Studio Plan) - Overridden Palette
  const [customPalette, setCustomPalette] = useState<DMCItem[] | undefined>(undefined);
  const [editingDmcCode, setEditingDmcCode] = useState<string | null>(null);
  const [swapTargetCode, setSwapTargetCode] = useState<string>('');

  // Interactive Stitch Tracker State
  const [completedStitches, setCompletedStitches] = useState<Set<number>>(new Set());

  // Studio Plan DMC ↔ Anchor Bidirectional Converter State
  const [conversionDirection, setConversionDirection] = useState<'dmcToAnchor' | 'anchorToDmc'>('dmcToAnchor');
  const [lookupThreadCode, setLookupThreadCode] = useState<string>('DMC 310');

  // Compute lookup item for Studio Converter
  const lookupItem = useMemo(() => {
    if (conversionDirection === 'dmcToAnchor') {
      return DMC_DATABASE.find(d => d.code === lookupThreadCode) || DMC_DATABASE[0];
    } else {
      return DMC_DATABASE.find(d => d.anchorCode === lookupThreadCode) || DMC_DATABASE[0];
    }
  }, [lookupThreadCode, conversionDirection]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Max Allowed Grid Width & Colors based on Tier
  const maxAllowedGrid = planTier === 'free' ? 100 : (planTier === 'pro' ? 300 : 400);
  const maxAllowedColors = planTier === 'free' ? 50 : (planTier === 'pro' ? 150 : 250);

  // Track saved conversion job to avoid redundant duplicates
  const lastSavedPatternKeyRef = useRef<string>('');

  // Generate Pattern Callback
  const processPattern = async () => {
    if (!selectedPhotoUrl) return;
    setIsProcessing(true);
    try {
      const config: PatternConfig = {
        gridWidth: Math.min(gridWidth, maxAllowedGrid),
        fabricCount,
        colorLimit: Math.min(colorLimit, maxAllowedColors),
        showGridLines,
        showSymbols: showSymbolsOnColor,
        brand,
        dithering,
        brightness: planTier === 'studio' ? brightness : 0,
        contrast: planTier === 'studio' ? contrast : 0,
        saturation: planTier === 'studio' ? saturation : 0,
        isAdFree: planTier !== 'free',
        planTier
      };

      const result = await generatePatternFromImage(selectedPhotoUrl, config);
      setPattern(result);

      // Save conversion job to database ONLY for logged-in users (guest users skip DB saving)
      if (user && (user.id || user.email)) {
        const userIdToSave = user.id || user.email;
        const patternKey = `${userIdToSave}_${customPhotoName}_${result.widthStitches}x${result.heightStitches}_${result.flossList.length}`;
        if (lastSavedPatternKeyRef.current !== patternKey) {
          lastSavedPatternKeyRef.current = patternKey;

          let compactThumb = '';
          try {
            compactThumb = await createScaledThumbnail(selectedPhotoUrl, 250);
          } catch {
            compactThumb = selectedPhotoUrl;
          }

          saveUserConversionJob({
            user_id: userIdToSave,
            title: customPhotoName || 'Converted Pattern',
            status: 'complete',
            grid_width: result.widthStitches,
            grid_height: result.heightStitches,
            colors_count: result.flossList.length,
            photo_url: selectedPhotoUrl,
            thumbnail_url: compactThumb,
          });
        }
      }
    } catch (err) {
      console.error('Pattern processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset session whenever modal is opened freshly
  const prevIsOpenRef = useRef<boolean>(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      resetSessionState();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Re-run pattern processing when parameters change
  useEffect(() => {
    if (isOpen && selectedPhotoUrl) {
      const timer = setTimeout(() => {
        processPattern();
      }, 300);
      return () => clearTimeout(timer);
    } else if (isOpen && !selectedPhotoUrl) {
      setPattern(null);
    }
  }, [isOpen, selectedPhotoUrl, gridWidth, fabricCount, colorLimit, dithering, brightness, contrast, saturation, showGridLines, showSymbolsOnColor, brand, planTier]);

  // Render Pattern to Canvas whenever pattern or viewMode changes
  useEffect(() => {
    if (canvasRef.current && pattern) {
      const config: PatternConfig = {
        gridWidth,
        fabricCount,
        colorLimit,
        showGridLines,
        showSymbols: showSymbolsOnColor,
        brand,
        isAdFree: planTier !== 'free',
        planTier
      };

      renderPatternCanvas(
        canvasRef.current,
        pattern,
        viewMode,
        config
      );
    }
  }, [pattern, viewMode, showGridLines, showSymbolsOnColor, planTier]);

  if (!isOpen) return null;

  // Process Custom Image File (Supports input selection & Drag & Drop)
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (planTier === 'free' && dailyGenerations >= 3) {
      alert('Free Plan daily limit reached (3 patterns/day). Upgrade to Pro or Studio for unlimited pattern conversions!');
      return;
    }
    
    if (!user) {
      try {
        const choice = localStorage.getItem('converterGuestChoice');
        if (!choice) {
          setShowGuestPrompt(true);
        }
      } catch {}
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64DataUrl = event.target?.result as string;
      if (base64DataUrl) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setSelectedPhotoUrl(base64DataUrl);
        setOriginalPhotoUrl(base64DataUrl);
        setCustomPhotoName(fileName);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setCompletedStitches(new Set());
        setDailyGenerations(prev => prev + 1);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  // Download Action - Generates Multi-Page Zoomed PDF with Color Symbols and Floss Key
  const handleDownloadChart = async (exportMode: 'color' | 'symbol') => {
    if (!pattern || isExportingPdf) return;

    setIsExportingPdf(true);

    try {
      const config: PatternConfig = {
        gridWidth,
        fabricCount,
        colorLimit,
        showGridLines,
        showSymbols: showSymbolsOnColor,
        brand,
        isAdFree: planTier !== 'free',
        planTier
      };

      await exportPatternToPDF(pattern, exportMode, config, customPhotoName);
    } catch (err) {
      console.error('Failed to generate PDF export:', err);
      alert('Unable to generate PDF pattern. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Canvas Click for Interactive Stitch Tracker
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== 'tracker' || !canvasRef.current || !pattern) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellW = rect.width / pattern.widthStitches;
    const cellH = rect.height / pattern.heightStitches;

    const gridX = Math.floor(clickX / cellW);
    const gridY = Math.floor(clickY / cellH);

    const index = gridY * pattern.widthStitches + gridX;

    const newSet = new Set(completedStitches);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCompletedStitches(newSet);
  };

  return (
    <div id="photo-converter-modal" data-converter-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF6EE] rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-[#E8E1D2] flex flex-col">
        
        {/* Modal Top Header with Plan Switcher */}
        <div className="px-6 py-4 border-b border-[#E8E1D2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E06C38] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D231E]">Stitchly • Pattern Studio</h2>
              <p className="text-xs text-[#5C685A]">Photo to Cross-Stitch Pattern Studio • CIEDE2000 Color Matching</p>
            </div>
          </div>

          {/* Plan Tier Display according to User Subscription Tier */}
          <div className="flex items-center gap-2 bg-[#F5EFE4] p-1.5 rounded-full border border-[#DCD2C0]">
            <span className="text-[10px] font-bold text-[#70806E] uppercase px-2">Plan Mode:</span>
            
            {userTier === 'free' ? (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#1D231E] text-white shadow-xs">
                Free
              </span>
            ) : userTier === 'pro' ? (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#E06C38] text-white shadow-xs flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Pro</span>
              </span>
            ) : (
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#3D5239] text-white shadow-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#E06C38]" />
                <span>Studio</span>
              </span>
            )}

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#E5EDE2] text-[#3D5239] flex items-center justify-center transition-colors ml-1 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Free Plan Limit Notice Banner if in Free Mode */}
        {planTier === 'free' && (
          <div className="bg-[#FFF8EC] border-b border-[#E8D0B0] px-6 py-2.5 flex items-center justify-between text-xs text-[#8A511B]">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#E06C38] shrink-0" />
              <span>
                <strong>Free Plan Active:</strong> Limited to 100x100 max grid size & 3 patterns per day ({3 - dailyGenerations} remaining today). Exports contain watermark.
              </span>
            </div>
            <button
              onClick={() => setPlanTier('pro')}
              className="text-[11px] font-bold text-[#E06C38] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Unlock Pro (Ad-Free, 200 Grid)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Panel Left (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Upload or Drop Photo */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E1D2] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#1D231E] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#E06C38]" />
                  1. Select or Drop Photo
                </span>
                <span className="text-[10px] text-[#7A8877] font-normal truncate max-w-[150px]">
                  {customPhotoName || 'No photo selected'}
                </span>
              </h3>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full py-6 px-4 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 text-center group cursor-pointer ${
                  isDragging
                    ? 'border-[#E06C38] bg-[#E06C38]/10 scale-[1.01]'
                    : 'border-[#C5D3C2] hover:border-[#E06C38] bg-[#FAF6EE]/70 hover:bg-[#FAF6EE]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-[#E06C38] text-white' : 'bg-[#E5EDE2] text-[#3D5239] group-hover:bg-[#E06C38] group-hover:text-white'
                }`}>
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#1D231E] block">
                    {isDragging
                      ? 'Drop Image Here to Convert'
                      : selectedPhotoUrl
                      ? 'Click or Drag to Replace Image'
                      : 'Drag & Drop or Click to Upload Image'}
                  </span>
                  <span className="text-[10px] text-[#6B7869] block mt-0.5">
                    {selectedPhotoUrl ? customPhotoName : 'Supports PNG, JPG, WEBP, GIF'}
                  </span>
                </div>
              </div>

              {/* Studio Plan Feature: Image Editor Action Button */}
              {selectedPhotoUrl && (
                <div className="pt-1">
                  {planTier === 'studio' ? (
                    <button
                      onClick={() => setIsImageEditorOpen(true)}
                      className="w-full py-2.5 px-4 bg-[#3D5239] hover:bg-[#2C3B29] text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Sliders className="w-4 h-4 text-[#E06C38]" />
                      <span>Launch Studio Image Editor (Crop, Rotate, Scale & Adjust)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('Studio Image Editor (Crop, Rotate, Flip, Scale & Tone Filters) is exclusive to Studio Plan users. Switch plan mode to Studio above to try it out!')}
                      className="w-full py-2.5 px-4 bg-[#F0EBE1] text-[#7A8877] rounded-xl font-bold text-xs border border-[#DCD2C0] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#E8E1D2]/80 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#E06C38]" />
                      <span>Studio Image Editor (Studio Plan Exclusive)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Algorithm Parameters */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E1D2] shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-[#1D231E] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#E06C38]" />
                2. Grid & Thread Parameters
              </h3>

              {/* Grid Width Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D231E] mb-1.5">
                  <span className="flex items-center gap-1">
                    <span>Pattern Grid Width</span>
                    {planTier === 'free' && gridWidth >= 100 && (
                      <span className="text-[9px] bg-[#E06C38]/10 text-[#E06C38] px-1.5 py-0.5 rounded font-bold">Free Max</span>
                    )}
                  </span>
                  <span className="text-[#E06C38] font-mono font-bold">{gridWidth} stitches wide</span>
                </div>

                <input
                  type="range"
                  min="30"
                  max={maxAllowedGrid}
                  step="5"
                  value={gridWidth}
                  onChange={(e) => setGridWidth(Number(e.target.value))}
                  className="w-full accent-[#E06C38] cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-[#7A8877] mt-1">
                  <span>Small (30st)</span>
                  <span>Medium (60st)</span>
                  <span>{planTier === 'free' ? 'Free Max (100st)' : (planTier === 'pro' ? 'Pro Max (300st)' : 'Studio Unlimited (400st)')}</span>
                </div>
              </div>

              {/* Fabric Count Selector */}
              <div>
                <label className="text-xs font-semibold text-[#1D231E] block mb-1.5 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-[#E06C38]" />
                  <span>Fabric Type & Count</span>
                </label>
                <select
                  value={fabricCount}
                  onChange={(e) => setFabricCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E8E1D2] text-xs font-semibold text-[#1D231E] focus:outline-none focus:border-[#E06C38] cursor-pointer"
                >
                  {FABRIC_COUNTS.map((f) => (
                    <option key={f.count} value={f.count}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DMC Color Limit */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1D231E] mb-1.5">
                  <span className="flex items-center gap-1">
                    <span>Thread Color Limit</span>
                    {planTier === 'free' && colorLimit >= 50 && (
                      <span className="text-[9px] bg-[#E06C38]/10 text-[#E06C38] px-1.5 py-0.5 rounded font-bold">Free Max (50)</span>
                    )}
                    {planTier === 'pro' && colorLimit >= 150 && (
                      <span className="text-[9px] bg-[#E06C38]/10 text-[#E06C38] px-1.5 py-0.5 rounded font-bold">Pro Max (150)</span>
                    )}
                    {planTier === 'studio' && (
                      <span className="text-[9px] bg-[#3D5239]/10 text-[#3D5239] px-1.5 py-0.5 rounded font-bold">Studio Unlimited</span>
                    )}
                  </span>
                  <span className="text-[#E06C38] font-mono font-bold">{colorLimit} threads</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max={maxAllowedColors}
                  step="2"
                  value={colorLimit}
                  onChange={(e) => setColorLimit(Number(e.target.value))}
                  className="w-full accent-[#E06C38] cursor-pointer"
                />
                <span className="text-[10px] text-[#7A8877] block mt-1">
                  CIEDE2000 algorithm reduces photo down to exact {colorLimit} closest {brand} skein shades.
                  {planTier === 'free' && ' (Free plan capped at 50 colors)'}
                  {planTier === 'pro' && ' (Pro plan supports up to 150 colors)'}
                  {planTier === 'studio' && ' (Studio plan supports unlimited colors)'}
                </span>
              </div>

              {/* Dithering Algorithm Selector */}
              <div>
                <label className="text-xs font-semibold text-[#1D231E] block mb-1.5 flex items-center justify-between">
                  <span>Dithering Algorithm</span>
                  <span className="text-[10px] text-[#E06C38] font-mono uppercase">{dithering}</span>
                </label>
                <select
                  value={dithering}
                  onChange={(e) => setDithering(e.target.value as 'none' | 'soft' | 'floyd-steinberg' | 'atkinson')}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6EE] border border-[#E8E1D2] text-xs font-semibold text-[#1D231E] focus:outline-none focus:border-[#E06C38] cursor-pointer"
                >
                  <option value="none">None (Clean Solid Color Blocks - Recommended)</option>
                  <option value="soft">Soft Blend (Gentle Gradient Transitions - No Dot Noise)</option>
                  <option value="floyd-steinberg">Floyd-Steinberg (Balanced Photo Diffusion)</option>
                  <option value="atkinson">Atkinson (Artistic Contrast Dithering)</option>
                </select>
                <span className="text-[10px] text-[#7A8877] block mt-1">
                  {dithering === 'none' && 'Direct CIEDE2000 color matching per stitch cell. Eliminates all noise speckles.'}
                  {dithering === 'soft' && 'Subtle damped error diffusion for smooth gradient transitions without harsh dots.'}
                  {dithering === 'floyd-steinberg' && 'Balanced Floyd-Steinberg error diffusion for photo-like blending.'}
                  {dithering === 'atkinson' && 'Macintosh Atkinson dithering for high-contrast artistic cross-stitch.'}
                </span>
              </div>

              {/* Tone Shading & Fine-Tuning Controls (Studio Plan Tier Only) */}
              {planTier === 'studio' && (
                <div className="pt-3 border-t border-[#F0EBE1] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D231E]">Tone Shading & Color Adjustments (Studio)</span>
                    {(brightness !== 0 || contrast !== 0 || saturation !== 0) && (
                      <button
                        onClick={() => {
                          setBrightness(0);
                          setContrast(0);
                          setSaturation(0);
                        }}
                        className="text-[10px] text-[#E06C38] font-bold hover:underline cursor-pointer"
                      >
                        Reset Tones
                      </button>
                    )}
                  </div>

                  {/* Brightness Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#4A5548] mb-1">
                      <span>Brightness Adjustment</span>
                      <span className="font-mono">{brightness > 0 ? `+${brightness}` : brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="2"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-[#E06C38] cursor-pointer"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#4A5548] mb-1">
                      <span>Contrast Adjustment</span>
                      <span className="font-mono">{contrast > 0 ? `+${contrast}` : contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="2"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-[#E06C38] cursor-pointer"
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-[#4A5548] mb-1">
                      <span>Color Saturation Adjustment</span>
                      <span className="font-mono">{saturation > 0 ? `+${saturation}` : saturation}</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      step="2"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-[#E06C38] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Thread Brand Selector (Pro & Studio Feature) */}
              <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#1D231E] block">Thread Code System:</span>
                  <span className="text-[10px] text-[#7A8877]">Available in Pro & Studio Plans</span>
                </div>
                <div className="inline-flex rounded-lg bg-[#FAF6EE] p-1 border border-[#E8E1D2]">
                  <button
                    onClick={() => setBrand('DMC')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      brand === 'DMC' ? 'bg-[#1D231E] text-white shadow-xs' : 'text-[#5A6659]'
                    }`}
                  >
                    DMC
                  </button>
                  <button
                    onClick={() => {
                      if (planTier === 'free') {
                        alert('DMC & Anchor thread code selection is available on Pro & Studio Plans! Switch plan mode above to test.');
                        return;
                      }
                      setBrand('Anchor');
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      brand === 'Anchor' ? 'bg-[#3D5239] text-white shadow-xs' : 'text-[#5A6659]'
                    }`}
                  >
                    <span>Anchor</span>
                    {planTier === 'free' && <Lock className="w-2.5 h-2.5 text-[#E06C38]" />}
                  </button>
                </div>
              </div>

              {/* Grid Lines & Symbols Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                <label className="flex items-center justify-between text-xs font-semibold text-[#1D231E] cursor-pointer">
                  <span>Show 10-Stitch Grid Lines</span>
                  <input
                    type="checkbox"
                    checked={showGridLines}
                    onChange={(e) => setShowGridLines(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E06C38] focus:ring-[#E06C38] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold text-[#1D231E] cursor-pointer">
                  <span>Overlay Floss Symbols on Color Chart</span>
                  <input
                    type="checkbox"
                    checked={showSymbolsOnColor}
                    onChange={(e) => setShowSymbolsOnColor(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E06C38] focus:ring-[#E06C38] cursor-pointer"
                  />
                </label>
              </div>

            </div>

            {/* Live Calculated Physical Specifications */}
            {pattern && (
              <div className="bg-[#93A28F]/15 p-4 rounded-2xl border border-[#93A28F]/30 space-y-2 text-xs text-[#2A3429]">
                <div className="flex justify-between items-center pb-2 border-b border-[#93A28F]/20">
                  <span className="font-bold flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-[#E06C38]" />
                    <span>Physical Dimensions:</span>
                  </span>
                  <span className="font-bold font-mono">
                    {pattern.physicalWidthInches}" x {pattern.physicalHeightInches}" ({Math.round(pattern.physicalWidthInches * 2.54)} x {Math.round(pattern.physicalHeightInches * 2.54)} cm)
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Stitch Resolution:</span>
                  <span className="font-mono font-bold">{pattern.widthStitches} x {pattern.heightStitches} stitches</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total Cross-Stitches:</span>
                  <span className="font-mono font-bold text-[#E06C38]">{pattern.totalStitches.toLocaleString()}</span>
                </div>
              </div>
            )}

          </div>

          {/* Pattern Preview Panel Right (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* View Mode Tabs: Color Chart vs B&W Symbol Chart vs Interactive Tracker */}
            <div className="bg-white p-3 rounded-2xl border border-[#E8E1D2] shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E8E1D2]">
                <button
                  onClick={() => setViewMode('color')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'color' ? 'bg-white text-[#1D231E] shadow-xs border border-[#E8E1D2]' : 'text-[#5A6659]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#E06C38]" />
                  <span>Color Pattern</span>
                </button>
                <button
                  onClick={() => setViewMode('symbol')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'symbol' ? 'bg-white text-[#1D231E] shadow-xs border border-[#E8E1D2]' : 'text-[#5A6659]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-[#1D231E]" />
                  <span>Printable Symbol Chart (B&W)</span>
                </button>
              </div>

              {/* Quick Status */}
              {isProcessing && (
                <span className="text-xs text-[#E06C38] flex items-center gap-1 font-bold animate-pulse shrink-0 px-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Quantizing CIEDE2000...
                </span>
              )}
            </div>

            {/* Pattern Canvas Container */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E1D2] shadow-xs flex-1 flex flex-col justify-between">
              
              {/* Active View Title & Info */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-[#1D231E]">
                  {viewMode === 'color' && 'Full Color DMC Pattern Chart'}
                  {viewMode === 'symbol' && 'Black & White Symbol Chart (Print-Ready)'}
                </span>
              </div>

              {/* Canvas viewport */}
              <div className="relative flex-1 min-h-[320px] rounded-xl overflow-auto bg-[#FAF6EE] border border-[#E0D8C8] flex items-center justify-center p-4 group">
                {selectedPhotoUrl && pattern ? (
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-[420px] rounded shadow-md border border-[#1D231E]/20 transition-all"
                  />
                ) : isProcessing ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-[#505C4F]">
                    <RefreshCw className="w-8 h-8 text-[#E06C38] animate-spin mb-3" />
                    <span className="text-xs font-bold">Converting image to cross-stitch pattern...</span>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 text-center text-[#6B7869] cursor-pointer hover:text-[#1D231E] transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#E5EDE2] text-[#3D5239] flex items-center justify-center mb-3 shadow-xs group-hover:bg-[#E06C38] group-hover:text-white transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-[#1D231E] mb-1">No Image Uploaded Yet</span>
                    <span className="text-xs text-[#505C4F] max-w-xs mb-3">
                      Drag & drop or click here to choose an image file from your device to create a pattern.
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-[#E06C38] text-white text-xs font-bold shadow-xs hover:bg-[#C95B28] transition-colors">
                      Select Photo to Start
                    </span>
                  </div>
                )}
              </div>

              {/* Required Floss Key & Skein Summary */}
              {pattern && (
                <div className="mt-4 pt-4 border-t border-[#E8E1D2]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#1D231E] flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#E06C38]" />
                      <span>Required Floss Palette & Skein Key ({pattern.flossList.length} threads)</span>
                    </h4>

                    {planTier === 'studio' && (
                      <span className="text-[10px] font-bold text-[#3D5239] bg-[#E8EFE5] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Edit3 className="w-3 h-3 text-[#E06C38]" />
                        Studio DMC ⇄ Anchor Converter Active
                      </span>
                    )}
                  </div>

                  {/* Studio Feature: DMC ↔ Anchor Bidirectional Thread Converter Panel */}
                  {planTier === 'studio' && (
                    <div className="mb-3 p-3.5 bg-[#E8EFE5]/80 rounded-2xl border border-[#C5D3C2] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-[#E06C38]" />
                          <h4 className="text-xs font-bold text-[#1D231E]">
                            Studio DMC ⇄ Anchor Bidirectional Converter
                          </h4>
                        </div>
                        <div className="inline-flex rounded-lg bg-white p-0.5 border border-[#C5D3C2]">
                          <button
                            onClick={() => {
                              setConversionDirection('dmcToAnchor');
                              setLookupThreadCode('DMC 310');
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              conversionDirection === 'dmcToAnchor' ? 'bg-[#3D5239] text-white shadow-xs' : 'text-[#5A6659]'
                            }`}
                          >
                            DMC ➔ Anchor
                          </button>
                          <button
                            onClick={() => {
                              setConversionDirection('anchorToDmc');
                              setLookupThreadCode('Anchor 403');
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              conversionDirection === 'anchorToDmc' ? 'bg-[#3D5239] text-white shadow-xs' : 'text-[#5A6659]'
                            }`}
                          >
                            Anchor ➔ DMC
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Source Thread Selector */}
                        <div className="sm:col-span-5">
                          <label className="text-[10px] font-bold text-[#5A6659] block mb-1">
                            Select {conversionDirection === 'dmcToAnchor' ? 'DMC Code' : 'Anchor Code'}:
                          </label>
                          <select
                            value={lookupThreadCode}
                            onChange={(e) => setLookupThreadCode(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#C5D3C2] text-xs font-bold text-[#1D231E] focus:outline-none focus:border-[#E06C38] cursor-pointer"
                          >
                            {DMC_DATABASE.map((d) => (
                              <option key={d.code} value={conversionDirection === 'dmcToAnchor' ? d.code : d.anchorCode}>
                                {conversionDirection === 'dmcToAnchor' ? `${d.code} • ${d.name}` : `${d.anchorCode} • ${d.name}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Arrow Divider */}
                        <div className="sm:col-span-2 flex justify-center text-[#E06C38] font-bold text-sm">
                          ➔
                        </div>

                        {/* Converted Output Card */}
                        <div className="sm:col-span-5 bg-white p-2 rounded-xl border border-[#C5D3C2] flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg border border-black/20 shrink-0"
                            style={{ backgroundColor: lookupItem.hex }}
                          />
                          <div className="truncate">
                            <span className="text-[10px] text-[#7A8877] block font-semibold">
                              Equivalent {conversionDirection === 'dmcToAnchor' ? 'Anchor Thread' : 'DMC Thread'}
                            </span>
                            <span className="text-xs font-bold text-[#E06C38] block truncate">
                              {conversionDirection === 'dmcToAnchor' ? lookupItem.anchorCode : lookupItem.code} ({lookupItem.name})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#3D5239] pt-1 border-t border-[#C5D3C2]/50">
                        <span>Pattern active brand: <strong>{brand}</strong></span>
                        <button
                          onClick={() => setBrand(prev => prev === 'DMC' ? 'Anchor' : 'DMC')}
                          className="px-3 py-1 rounded-full bg-[#3D5239] text-white font-bold hover:bg-[#2C3B29] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Repeat className="w-3 h-3 text-[#E06C38]" />
                          <span>Convert Entire Pattern to {brand === 'DMC' ? 'Anchor' : 'DMC'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {pattern.flossList.map((item) => (
                      <div
                        key={item.dmc.code}
                        className="flex items-center justify-between p-2 bg-[#FAF6EE] rounded-xl border border-[#E8E1D2] text-xs hover:border-[#E06C38]/40 transition-all gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color Swatch with Symbol */}
                          <div
                            className="w-6 h-6 rounded-md border border-black/20 flex items-center justify-center shrink-0 font-bold text-[10px]"
                            style={{
                              backgroundColor: item.dmc.hex,
                              color: parseInt(item.dmc.hex.replace('#',''), 16) > 0x888888 ? '#000' : '#FFF'
                            }}
                          >
                            {item.dmc.symbol}
                          </div>

                          <div className="truncate">
                            <span className="font-bold text-[#1D231E] block text-[11px] truncate">
                              {brand === 'Anchor' ? item.dmc.anchorCode : item.dmc.code} • {item.dmc.name}
                            </span>
                            <span className="text-[#6B7869] text-[10px] block">
                              {item.stitchCount} sts ({item.percentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Skeins badge */}
                          <span className="text-[10px] font-bold text-[#E06C38] bg-[#E06C38]/10 px-2 py-0.5 rounded-md border border-[#E06C38]/20">
                            {item.skeinsNeeded} {item.skeinsNeeded === 1 ? 'skein' : 'skeins'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Actions & Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-full border border-[#D5CDC0] text-xs font-bold text-[#4A544A] hover:bg-white transition-colors cursor-pointer"
                >
                  Close Converter
                </button>
                <button
                  onClick={handleConvertAnotherImage}
                  className="px-5 py-2.5 rounded-full border border-[#E06C38]/40 bg-[#E06C38]/10 text-xs font-bold text-[#E06C38] hover:bg-[#E06C38]/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Convert Another Image</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (!pattern) return;
                    setOrderPlaced(false);
                    setIsOrderModalOpen(true);
                  }}
                  disabled={!pattern}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1D231E] hover:bg-[#2C352E] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  title="Order thread floss, Aida cloth, needles & hoops for this pattern"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E06C38]" />
                  <span>Order Kit & Supplies</span>
                </button>

                <button
                  onClick={() => handleDownloadChart('color')}
                  disabled={!pattern || isExportingPdf}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#E06C38] hover:bg-[#d05c28] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Complete Pattern PDF</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Order Custom Kit & Supplies Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF6EE] border border-[#D5CDC0] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-[#1D231E]">
            <button
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute top-4 right-4 text-[#6B7869] hover:text-[#1D231E] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderPlaced ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#E06C38]/15 text-[#E06C38] flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1D231E]">Order Stitching Kit & Supplies</h3>
                    <p className="text-xs text-[#505C4F]">Custom supplies tailored to your converted pattern</p>
                  </div>
                </div>

                {/* Kit Itemized Overview */}
                <div className="bg-white border border-[#C5D3C2] rounded-xl p-4 mb-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5EDE2]">
                    <span className="font-bold text-[#1D231E]">Converted Pattern:</span>
                    <span className="text-[#E06C38] font-semibold">{customPhotoName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4A544A]">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#E06C38]" />
                      <span>{brand} Floss Skeins ({pattern?.flossList.length || 0} Colors)</span>
                    </span>
                    <span className="font-semibold">${((pattern?.flossList.length || 12) * 1.25).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4A544A]">
                    <span className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#E06C38]" />
                      <span>Custom {fabricCount}ct Aida Cloth ({((gridWidth / fabricCount) + 4).toFixed(1)}" × {((pattern ? (gridWidth * (pattern.gridHeight / pattern.gridWidth)) : gridWidth) / fabricCount + 4).toFixed(1)}")</span>
                    </span>
                    <span className="font-semibold">$8.50</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4A544A]">
                    <span>Gold-Eye Tapestry Needles (5 Pack)</span>
                    <span className="font-semibold">$3.00</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4A544A]">
                    <span>Polished Wooden Hoop (8")</span>
                    <span className="font-semibold">$6.50</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4A544A]">
                    <span>Printed Color Pattern Booklet</span>
                    <span className="font-semibold">$4.00</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5EDE2] flex justify-between items-center font-bold text-sm text-[#1D231E]">
                    <span>Estimated Total (Free Shipping)</span>
                    <span className="text-[#E06C38]">
                      ${(((pattern?.flossList.length || 12) * 1.25) + 8.50 + 3.00 + 6.50 + 4.00).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Shipping & Checkout Form */}
                <form onSubmit={handlePlaceOrder} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#505C4F] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full px-3 py-2 rounded-lg border border-[#C5D3C2] bg-white text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#505C4F] mb-1">Shipping Address</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Street address, city, state, zip code"
                      className="w-full px-3 py-2 rounded-lg border border-[#C5D3C2] bg-white text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#505C4F] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-[#C5D3C2] bg-white text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3 px-4 rounded-full bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Place Direct Order for Supplies Kit</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#E06C38]/20 text-[#E06C38] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1D231E] mb-1">Order Placed Successfully!</h3>
                <p className="text-xs text-[#505C4F] mb-3">
                  Order Reference: <span className="font-mono font-bold text-[#E06C38]">{orderRef}</span>
                </p>
                <div className="bg-white border border-[#C5D3C2] rounded-xl p-4 text-xs text-[#4A544A] text-left space-y-1.5 mb-5">
                  <p><span className="font-bold text-[#1D231E]">Customer:</span> {customerName}</p>
                  <p><span className="font-bold text-[#1D231E]">Shipping Address:</span> {shippingAddress}</p>
                  <p><span className="font-bold text-[#1D231E]">Confirmation Email:</span> {customerEmail}</p>
                  <div className="pt-2 border-t border-[#E5EDE2] flex items-center gap-1.5 text-[#E06C38] font-semibold">
                    <Truck className="w-4 h-4" />
                    <span>Estimated Shipping: 3-5 Business Days</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#1D231E] hover:bg-[#2C352E] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Return to Converter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Converter First Upload Guest Login Choice Modal */}
      {showGuestPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF6EE] border border-[#E8E1D2] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
            <button
              onClick={() => {
                try {
                  localStorage.setItem('converterGuestChoice', 'guest');
                } catch {}
                setShowGuestPrompt(false);
              }}
              className="absolute top-4 right-4 p-2 text-[#6B7869] hover:text-[#1D231E] rounded-full hover:bg-[#E8E1D2]/50 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#E06C38]/10 text-[#E06C38] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-[#1D231E] mb-2">
              Welcome to Stitchly Pattern Studio
            </h3>
            <p className="text-xs text-[#5A6659] mb-6 leading-relaxed">
              Log in or sign up to save your pattern conversions to your account and access them from any device, or continue as a guest.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('converterGuestChoice', 'login');
                  } catch {}
                  setShowGuestPrompt(false);
                  setAuthModalConfig({
                    isOpen: true,
                    defaultTab: 'login',
                    customTitle: 'Log In to Stitchly',
                    customSubtitle: 'Access your saved cross-stitch patterns across devices.'
                  });
                }}
                className="w-full py-3 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Log in
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.setItem('converterGuestChoice', 'signup');
                  } catch {}
                  setShowGuestPrompt(false);
                  setAuthModalConfig({
                    isOpen: true,
                    defaultTab: 'signup',
                    customTitle: 'Create a Free Account',
                    customSubtitle: 'Save your custom patterns to your personal account.'
                  });
                }}
                className="w-full py-3 bg-white hover:bg-[#FAF6EE] border border-[#D5CDBC] text-[#1D231E] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Sign up
              </button>

              <button
                onClick={() => {
                  try {
                    localStorage.setItem('converterGuestChoice', 'guest');
                  } catch {}
                  setShowGuestPrompt(false);
                }}
                className="w-full py-2.5 text-xs font-semibold text-[#6B7869] hover:text-[#1D231E] transition-colors cursor-pointer"
              >
                Continue as guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio Image Editor Modal */}
      {isImageEditorOpen && (
        <StudioImageEditorModal
          isOpen={isImageEditorOpen}
          onClose={() => setIsImageEditorOpen(false)}
          imageUrl={selectedPhotoUrl}
          originalImageUrl={originalPhotoUrl || selectedPhotoUrl}
          onApplyEdits={(editedDataUrl) => {
            setSelectedPhotoUrl(editedDataUrl);
          }}
        />
      )}

      {/* Auth Modal Triggered from Converter / Order Flow */}
      {authModalConfig?.isOpen && (
        <AuthModal
          isOpen={true}
          onClose={() => setAuthModalConfig(null)}
          defaultTab={authModalConfig.defaultTab}
          customTitle={authModalConfig.customTitle}
          customSubtitle={authModalConfig.customSubtitle}
          onLoginSuccess={(u) => {
            if (onLoginSuccess) onLoginSuccess(u);
            setAuthModalConfig(null);
          }}
        />
      )}
    </div>
  );
};

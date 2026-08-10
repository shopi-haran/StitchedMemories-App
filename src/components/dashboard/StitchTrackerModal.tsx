import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  CheckCircle2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Eye, 
  Download, 
  Check, 
  Layers, 
  Loader2,
  ListFilter
} from 'lucide-react';
import { SupabaseConversionJobRow } from '../../lib/supabase';
import { 
  generatePatternFromImage, 
  renderPatternCanvas, 
  GeneratedPattern, 
  PatternConfig 
} from '../../utils/patternEngine';
import { exportPatternToPDF } from '../../utils/pdfExporter';
import dogImg from '../../assets/images/hoop_dog.png';

interface StitchTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: SupabaseConversionJobRow;
}

export const StitchTrackerModal: React.FC<StitchTrackerModalProps> = ({
  isOpen,
  onClose,
  job
}) => {
  const [pattern, setPattern] = useState<GeneratedPattern | null>(null);
  const [loadingPattern, setLoadingPattern] = useState<boolean>(true);
  const [completedStitches, setCompletedStitches] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'tracker' | 'color' | 'symbol'>('tracker');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterDmcCode, setFilterDmcCode] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Storage key for persisting stitching progress
  const storageKey = `stitch_tracker_job_${job.id}`;

  // Load saved progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedStitches(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to load stitch tracker progress:', e);
    }
  }, [storageKey]);

  // Save progress whenever completedStitches changes
  const saveProgress = useCallback((newSet: Set<number>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
    } catch (e) {
      console.error('Failed to save stitch tracker progress:', e);
    }
  }, [storageKey]);

  // Load or generate pattern data for this conversion job
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingPattern(true);

    const initPattern = async () => {
      try {
        let photoUrl = job.photo_url || job.thumbnail_url || '';
        if (!photoUrl || photoUrl.length < 5 || photoUrl.startsWith('blob:')) {
          try {
            const cachedPhoto = localStorage.getItem(`user_pattern_photo_${job.title}`);
            const cachedImgUser = localStorage.getItem(`user_pattern_img_${job.user_id}_${job.title}`);
            const cachedImgTitle = localStorage.getItem(`user_pattern_img_${job.title}`);
            const cachedThumb = localStorage.getItem(`user_pattern_thumb_${job.title}`);
            photoUrl = cachedPhoto || cachedImgUser || cachedImgTitle || cachedThumb || photoUrl || '';
          } catch {}
        }
        if (!photoUrl || photoUrl.startsWith('blob:')) {
          photoUrl = dogImg;
        }

        const config: PatternConfig = {
          gridWidth: job.grid_width || 60,
          fabricCount: 14,
          colorLimit: job.colors_count || 18,
          showGridLines: true,
          showSymbols: true,
          brand: 'DMC',
          isAdFree: true,
          planTier: 'studio'
        };

        try {
          const result = await generatePatternFromImage(photoUrl, config);
          if (isMounted) {
            setPattern(result);
          }
        } catch (firstErr) {
          console.warn('First attempt image pattern generation failed, falling back to sample image:', firstErr);
          const fallbackResult = await generatePatternFromImage(dogImg, config);
          if (isMounted) {
            setPattern(fallbackResult);
          }
        }
      } catch (err) {
        console.error('Error rendering pattern for tracker:', err);
      } finally {
        if (isMounted) {
          setLoadingPattern(false);
        }
      }
    };

    initPattern();

    return () => {
      isMounted = false;
    };
  }, [isOpen, job]);

  // Render pattern on canvas reliably
  const drawCanvas = useCallback(() => {
    if (canvasRef.current && pattern) {
      const config: PatternConfig = {
        gridWidth: pattern.widthStitches,
        fabricCount: 14,
        colorLimit: pattern.flossList.length,
        showGridLines: true,
        showSymbols: true,
        brand: 'DMC',
        isAdFree: true,
        planTier: 'studio'
      };

      renderPatternCanvas(
        canvasRef.current,
        pattern,
        viewMode,
        config,
        completedStitches
      );
    }
  }, [pattern, viewMode, completedStitches]);

  // Callback ref guarantees canvas rendering as soon as element mounts
  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && pattern) {
      drawCanvas();
    }
  }, [pattern, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, zoomLevel]);

  // Canvas Click Handler: Toggle stitch completed status
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== 'tracker' || !canvasRef.current || !pattern) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellW = rect.width / pattern.widthStitches;
    const cellH = rect.height / pattern.heightStitches;

    const gridX = Math.floor(clickX / cellW);
    const gridY = Math.floor(clickY / cellH);

    if (gridX >= 0 && gridX < pattern.widthStitches && gridY >= 0 && gridY < pattern.heightStitches) {
      const index = gridY * pattern.widthStitches + gridX;

      const newSet = new Set(completedStitches);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      setCompletedStitches(newSet);
      saveProgress(newSet);
    }
  };

  // Quick Action: Mark all stitches of a specific DMC thread as complete
  const handleToggleColorComplete = (dmcCode: string) => {
    if (!pattern) return;

    // Find all indices with this dmc code
    const colorIndices: number[] = [];
    pattern.pixelDmcMap.forEach((dmc, idx) => {
      if (dmc.code === dmcCode) {
        colorIndices.push(idx);
      }
    });

    const allColorDone = colorIndices.every(idx => completedStitches.has(idx));
    const newSet = new Set(completedStitches);

    if (allColorDone) {
      colorIndices.forEach(idx => newSet.delete(idx));
    } else {
      colorIndices.forEach(idx => newSet.add(idx));
    }

    setCompletedStitches(newSet);
    saveProgress(newSet);
  };

  // Quick Action: Mark all stitches complete
  const handleMarkAllComplete = () => {
    if (!pattern) return;
    const allSet = new Set<number>();
    for (let i = 0; i < pattern.totalStitches; i++) {
      allSet.add(i);
    }
    setCompletedStitches(allSet);
    saveProgress(allSet);
  };

  // Quick Action: Reset progress
  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all completed stitches for this pattern?')) {
      const empty = new Set<number>();
      setCompletedStitches(empty);
      saveProgress(empty);
    }
  };

  if (!isOpen) return null;

  const totalStitches = pattern ? pattern.totalStitches : (job.grid_width || 60) * (job.grid_height || 60);
  const completedCount = completedStitches.size;
  const progressPercentage = Math.min(100, Math.round((completedCount / Math.max(1, totalStitches)) * 100));
  const cardTitle = job.title || job.title_name || job.filename || `Pattern #${job.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF6EE] rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8E1D2] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E8E1D2] bg-white/80 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3D5239] text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#E06C38]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#E06C38] uppercase tracking-wider bg-[#E06C38]/10 px-2 py-0.5 rounded-md border border-[#E06C38]/20">
                  Dashboard Stitch Progress
                </span>
                <span className="text-xs font-semibold text-[#6B7869]">
                  {job.grid_width || 60}×{job.grid_height || 60} sts
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#1D231E] leading-tight truncate max-w-md">
                {cardTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (job.pattern_pdf_url) {
                  window.open(job.pattern_pdf_url, '_blank');
                  return;
                }
                if (!pattern) return;
                try {
                  const config: PatternConfig = {
                    gridWidth: pattern.widthStitches,
                    fabricCount: 14,
                    colorLimit: pattern.flossList.length,
                    showGridLines: true,
                    showSymbols: true,
                    brand: 'DMC',
                    isAdFree: true,
                    planTier: 'studio'
                  };
                  await exportPatternToPDF(pattern, viewMode === 'symbol' ? 'symbol' : 'color', config, cardTitle);
                } catch (e) {
                  console.error(e);
                  alert('Unable to export PDF pattern.');
                }
              }}
              className="px-3 py-2 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Download PDF pattern chart"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#6B7869] hover:text-[#1D231E] hover:bg-[#FAF6EE] transition-colors cursor-pointer border border-[#E8E1D2]"
              title="Close pattern viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Summary Bar */}
        <div className="px-6 py-3 bg-[#E8EFE5] border-b border-[#C5D3C2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-[#1D231E]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-48 bg-white h-3.5 rounded-full overflow-hidden border border-[#A2B59E] shadow-inner">
              <div
                className="bg-[#3D5239] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-[#3D5239] text-sm shrink-0">
              {progressPercentage}% Done
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#3D5239] justify-between w-full sm:w-auto">
            <span>
              Stitches: <strong className="text-[#1D231E]">{completedCount.toLocaleString()}</strong> / {totalStitches.toLocaleString()}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllComplete}
                className="px-2.5 py-1 bg-[#3D5239] hover:bg-[#2C3B29] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                title="Mark all stitches complete"
              >
                <Check className="w-3 h-3" />
                <span>Mark All Done</span>
              </button>

              <button
                onClick={handleResetProgress}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                title="Reset progress"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Canvas Column */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Control Bar: Modes & Zoom */}
            <div className="bg-white p-3 rounded-2xl border border-[#E8E1D2] shadow-xs flex flex-wrap items-center justify-between gap-2">
              
              {/* View Modes */}
              <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E8E1D2]">
                <button
                  onClick={() => setViewMode('tracker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'tracker' ? 'bg-[#3D5239] text-white shadow-xs' : 'text-[#5A6659]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E06C38]" />
                  <span>Stitch Tracker</span>
                </button>

                <button
                  onClick={() => setViewMode('color')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'color' ? 'bg-white text-[#1D231E] shadow-xs border border-[#E8E1D2]' : 'text-[#5A6659]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#E06C38]" />
                  <span>Color Chart</span>
                </button>

                <button
                  onClick={() => setViewMode('symbol')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'symbol' ? 'bg-white text-[#1D231E] shadow-xs border border-[#E8E1D2]' : 'text-[#5A6659]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-[#1D231E]" />
                  <span>Symbol Chart</span>
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded-xl border border-[#E8E1D2] text-xs">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                  className="p-1.5 hover:bg-white text-[#5A6659] rounded-lg transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-bold text-[#1D231E] text-[11px]">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                  className="p-1.5 hover:bg-white text-[#5A6659] rounded-lg transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Pattern Canvas Container */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] shadow-xs flex-1 flex flex-col justify-between">
              
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-bold text-[#1D231E]">
                  {viewMode === 'tracker' && 'Tap any cell below to toggle stitch completion (✓)'}
                  {viewMode === 'color' && 'Full DMC Color Cross-Stitch View'}
                  {viewMode === 'symbol' && 'Black & White Printable Symbol Chart'}
                </span>
              </div>

              <div className="relative min-h-[360px] max-h-[500px] overflow-auto bg-[#FAF6EE] border border-[#E0D8C8] rounded-xl flex items-center justify-center p-4">
                {loadingPattern && (
                  <div className="absolute inset-0 z-10 bg-[#FAF6EE]/90 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center text-[#5A6659]">
                    <Loader2 className="w-8 h-8 text-[#E06C38] animate-spin mb-3" />
                    <span className="text-xs font-bold">Rendering pattern chart...</span>
                  </div>
                )}

                {pattern ? (
                  <div 
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-200"
                  >
                    <canvas
                      ref={setCanvasRef}
                      onClick={handleCanvasClick}
                      className={`rounded shadow-md border border-[#1D231E]/20 transition-all ${
                        viewMode === 'tracker' ? 'cursor-pointer hover:ring-2 hover:ring-[#E06C38]' : ''
                      }`}
                    />
                  </div>
                ) : !loadingPattern ? (
                  <div className="text-center p-6 text-[#5A6659] text-xs">
                    Failed to load pattern chart for tracking.
                  </div>
                ) : null}
              </div>

            </div>

          </div>

          {/* Right DMC Floss Palette Progress Checklist */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#E8E1D2] shadow-xs flex flex-col space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#E8E1D2] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#1D231E] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E06C38]" />
                  <span>DMC Color Checklist</span>
                </h4>
                <p className="text-[10px] text-[#5A6659] mt-0.5">
                  Track completed stitches per thread shade
                </p>
              </div>

              {pattern && (
                <span className="text-[10px] font-bold text-[#3D5239] bg-[#E8EFE5] px-2 py-0.5 rounded-full border border-[#C5D3C2]">
                  {pattern.flossList.length} Shades
                </span>
              )}
            </div>

            {/* List of DMC colors with individual progress */}
            <div className="flex-1 max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {pattern ? (
                pattern.flossList.map((item) => {
                  // Calculate stitches done for this specific dmc code
                  const colorIndices: number[] = [];
                  pattern.pixelDmcMap.forEach((dmc, idx) => {
                    if (dmc.code === item.dmc.code) {
                      colorIndices.push(idx);
                    }
                  });

                  const doneCount = colorIndices.filter(idx => completedStitches.has(idx)).length;
                  const isAllDone = colorIndices.length > 0 && doneCount === colorIndices.length;
                  const colorPct = Math.round((doneCount / Math.max(1, colorIndices.length)) * 100);

                  return (
                    <div
                      key={item.dmc.code}
                      className={`p-2.5 rounded-xl border text-xs transition-all ${
                        isAllDone 
                          ? 'bg-[#E8EFE5]/60 border-[#C5D3C2]' 
                          : 'bg-[#FAF6EE] border-[#E8E1D2] hover:border-[#E06C38]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color Swatch */}
                          <div
                            className="w-5 h-5 rounded-md border border-black/20 flex items-center justify-center shrink-0 font-bold text-[9px]"
                            style={{
                              backgroundColor: item.dmc.hex,
                              color: parseInt(item.dmc.hex.replace('#',''), 16) > 0x888888 ? '#000' : '#FFF'
                            }}
                          >
                            {item.dmc.symbol}
                          </div>

                          <span className="font-bold text-[#1D231E] truncate text-[11px]">
                            {item.dmc.code} • {item.dmc.name}
                          </span>
                        </div>

                        {/* Toggle entire color button */}
                        <button
                          onClick={() => handleToggleColorComplete(item.dmc.code)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                            isAllDone
                              ? 'bg-[#2E7D32] text-white'
                              : 'bg-white text-[#5A6659] border border-[#D5CDBC] hover:border-[#E06C38]'
                          }`}
                          title="Toggle all stitches for this color"
                        >
                          {isAllDone ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Done</span>
                            </>
                          ) : (
                            <span>{doneCount}/{item.stitchCount}</span>
                          )}
                        </button>
                      </div>

                      {/* Mini progress bar for this thread color */}
                      <div className="w-full bg-[#E8E1D2] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${isAllDone ? 'bg-[#2E7D32]' : 'bg-[#E06C38]'}`}
                          style={{ width: `${colorPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-[#6B7869] text-xs">
                  Loading floss palette...
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

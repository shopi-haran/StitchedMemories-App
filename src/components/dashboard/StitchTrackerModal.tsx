import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  CheckCircle2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Sparkles, 
  Eye, 
  Download, 
  Check, 
  Layers, 
  Loader2,
  ListFilter
} from 'lucide-react';
import { SupabaseConversionJobRow, getJobPatternConfig } from '../../lib/supabase';
import { 
  generatePatternFromImage, 
  renderPatternViewportCanvas, 
  GeneratedPattern, 
  PatternConfig 
} from '../../utils/patternEngine';
import { exportPatternToPDF, downloadFileFromUrl } from '../../utils/pdfExporter';
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
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1);
  const [filterDmcCode, setFilterDmcCode] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 600, height: 420 });
  const prevZoomRef = useRef<number>(1);

  // Measure canvas viewport container dimensions dynamically
  useEffect(() => {
    if (!isOpen) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => ro.disconnect();
  }, [isOpen]);

  // Reset zoom to 1 (Fit to screen) on new pattern or job
  useEffect(() => {
    setZoomMultiplier(1);
    setScrollOffset({ left: 0, top: 0 });
    prevZoomRef.current = 1;
  }, [job.id]);

  // Maintain scroll center when zooming in/out
  useEffect(() => {
    if (containerRef.current && prevZoomRef.current !== zoomMultiplier) {
      const container = containerRef.current;
      const ratio = zoomMultiplier / prevZoomRef.current;
      if (container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight) {
        const currentCenterX = container.scrollLeft + container.clientWidth / 2;
        const currentCenterY = container.scrollTop + container.clientHeight / 2;
        container.scrollLeft = Math.max(0, currentCenterX * ratio - container.clientWidth / 2);
        container.scrollTop = Math.max(0, currentCenterY * ratio - container.clientHeight / 2);
      }
      prevZoomRef.current = zoomMultiplier;
    }
  }, [zoomMultiplier]);

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
        let sourcePhotoUrl = job.original_image_url || job.photo_url || job.thumbnail_url || '';
        if (!sourcePhotoUrl || sourcePhotoUrl.length < 5 || sourcePhotoUrl.startsWith('blob:')) {
          try {
            const cachedPhoto = localStorage.getItem(`user_pattern_photo_${job.title}`);
            const cachedImgUser = localStorage.getItem(`user_pattern_img_${job.user_id}_${job.title}`);
            const cachedImgTitle = localStorage.getItem(`user_pattern_img_${job.title}`);
            const cachedThumb = localStorage.getItem(`user_pattern_thumb_${job.title}`);
            sourcePhotoUrl = cachedPhoto || cachedImgUser || cachedImgTitle || cachedThumb || sourcePhotoUrl || '';
          } catch {}
        }
        if (!sourcePhotoUrl || sourcePhotoUrl.startsWith('blob:')) {
          sourcePhotoUrl = dogImg;
        }

        const config = getJobPatternConfig(job);

        try {
          const result = await generatePatternFromImage(sourcePhotoUrl, config);
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

  // Aspect-ratio preserving fit dimensions based on measured container size
  const padding = 28;
  const availWidth = Math.max(120, containerSize.width - padding);
  const availHeight = Math.max(120, containerSize.height - padding);

  const patternWidth = pattern?.widthStitches || (job.grid_width || 60);
  const patternHeight = pattern?.heightStitches || (job.grid_height || 60);
  const patternAspectRatio = patternWidth / Math.max(1, patternHeight);

  let baseFitWidth = availWidth;
  let baseFitHeight = baseFitWidth / patternAspectRatio;

  if (baseFitHeight > availHeight) {
    baseFitHeight = availHeight;
    baseFitWidth = baseFitHeight * patternAspectRatio;
  }

  const displayWidth = Math.max(40, Math.round(baseFitWidth * zoomMultiplier));
  const displayHeight = Math.max(40, Math.round(baseFitHeight * zoomMultiplier));

  // Compute viewport bounds and overscan for virtualized canvas rendering
  const overscan = 64;
  const isFitMode = zoomMultiplier === 1 && displayWidth <= containerSize.width && displayHeight <= containerSize.height;

  let canvasX = 0;
  let canvasY = 0;
  let canvasW = displayWidth;
  let canvasH = displayHeight;

  if (!isFitMode) {
    canvasX = Math.max(0, scrollOffset.left - overscan);
    canvasY = Math.max(0, scrollOffset.top - overscan);
    canvasW = Math.min(displayWidth - canvasX, containerSize.width + overscan * 2);
    canvasH = Math.min(displayHeight - canvasY, containerSize.height + overscan * 2);
  }

  // Viewport scroll listener for smooth virtualized rendering
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollTop } = e.currentTarget;
    setScrollOffset({ left: scrollLeft, top: scrollTop });
  };

  // Render pattern on canvas reliably with high-resolution DPI scaling
  const drawCanvas = useCallback(() => {
    if (canvasRef.current && pattern) {
      const config = getJobPatternConfig(job);

      renderPatternViewportCanvas(
        canvasRef.current,
        pattern,
        {
          mode: viewMode,
          config,
          completedStitchesSet: completedStitches,
          filterDmcCode,
          displayWidth,
          displayHeight,
          canvasX,
          canvasY,
          canvasW,
          canvasH,
        }
      );
    }
  }, [
    pattern, 
    viewMode, 
    completedStitches, 
    filterDmcCode, 
    job, 
    displayWidth, 
    displayHeight, 
    canvasX, 
    canvasY, 
    canvasW, 
    canvasH
  ]);

  // Callback ref guarantees canvas rendering as soon as element mounts
  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && pattern) {
      drawCanvas();
    }
  }, [pattern, drawCanvas]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pattern Click Handler: Toggle stitch completed status directly from pattern bounding box
  const handlePatternClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'tracker' || !pattern) return;

    const rect = e.currentTarget.getBoundingClientRect();
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

  // Zoom control steps (up to 1200% / 12x zoom for high-color/high-density charts)
  const handleZoomIn = () => {
    setZoomMultiplier(prev => {
      if (prev < 1) return Number((prev + 0.25).toFixed(2));
      if (prev < 2) return Number((prev + 0.5).toFixed(2));
      if (prev < 4) return Number((prev + 1.0).toFixed(2));
      return Math.min(12.0, Number((prev + 2.0).toFixed(2)));
    });
  };

  const handleZoomOut = () => {
    setZoomMultiplier(prev => {
      if (prev <= 1) return Math.max(0.5, Number((prev - 0.25).toFixed(2)));
      if (prev <= 2) return Number((prev - 0.5).toFixed(2));
      if (prev <= 4) return Number((prev - 1.0).toFixed(2));
      return Math.max(0.5, Number((prev - 2.0).toFixed(2)));
    });
  };

  // Quick Action: Mark all stitches of a specific DMC thread as complete
  const handleToggleColorComplete = (dmcCode: string) => {
    if (!pattern) return;

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
                  await downloadFileFromUrl(job.pattern_pdf_url, cardTitle);
                  return;
                }
                if (!pattern) return;
                try {
                  const config = getJobPatternConfig(job);
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
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white text-[#5A6659] hover:text-[#1D231E] rounded-lg transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-bold text-[#1D231E] text-[11px] min-w-[46px] text-center">
                  {Math.round(zoomMultiplier * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white text-[#5A6659] hover:text-[#1D231E] rounded-lg transition-colors cursor-pointer"
                  title="Zoom in (up to 1200%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-[#E8E1D2] mx-0.5" />

                {/* Quick Zoom Presets */}
                <button
                  onClick={() => setZoomMultiplier(1)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    zoomMultiplier === 1
                      ? 'bg-[#3D5239] text-white shadow-xs'
                      : 'bg-white text-[#5A6659] hover:text-[#1D231E] border border-[#E8E1D2]'
                  }`}
                  title="Fit entire pattern to screen"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fit</span>
                </button>

                <button
                  onClick={() => setZoomMultiplier(4)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    zoomMultiplier === 4
                      ? 'bg-[#3D5239] text-white shadow-xs'
                      : 'bg-white text-[#5A6659] hover:text-[#1D231E] border border-[#E8E1D2]'
                  }`}
                  title="400% Zoom"
                >
                  400%
                </button>

                <button
                  onClick={() => setZoomMultiplier(8)}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    zoomMultiplier === 8
                      ? 'bg-[#3D5239] text-white shadow-xs'
                      : 'bg-white text-[#5A6659] hover:text-[#1D231E] border border-[#E8E1D2]'
                  }`}
                  title="800% Ultra HD Zoom for 20+ color charts"
                >
                  800%
                </button>
              </div>

            </div>

            {/* Pattern Canvas Container */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] shadow-xs flex-1 flex flex-col justify-between">
              
              <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1D231E]">
                    {viewMode === 'tracker' && 'Tap any cell below to toggle stitch completion (✓)'}
                    {viewMode === 'color' && 'Full DMC Color Cross-Stitch View'}
                    {viewMode === 'symbol' && 'Black & White Printable Symbol Chart'}
                  </span>
                  {filterDmcCode && (
                    <span className="bg-[#E06C38]/10 text-[#E06C38] px-2 py-0.5 rounded-md text-[10px] font-bold border border-[#E06C38]/20 flex items-center gap-1">
                      Filtering: {filterDmcCode}
                      <button 
                        onClick={() => setFilterDmcCode(null)}
                        className="hover:text-black cursor-pointer font-bold ml-1"
                        title="Clear filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#6B7869]">
                  {pattern ? `${pattern.widthStitches} × ${pattern.heightStitches} stitches` : ''}
                </span>
              </div>

              <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="relative min-h-[380px] max-h-[520px] h-[52vh] overflow-auto bg-[#FAF6EE] border border-[#E0D8C8] rounded-xl flex p-3 select-none"
              >
                {loadingPattern && (
                  <div className="absolute inset-0 z-20 bg-[#FAF6EE]/90 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center text-[#5A6659]">
                    <Loader2 className="w-8 h-8 text-[#E06C38] animate-spin mb-3" />
                    <span className="text-xs font-bold">Rendering pattern chart...</span>
                  </div>
                )}

                {pattern ? (
                  <div 
                    className="relative shrink-0"
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      margin: isFitMode ? 'auto' : undefined,
                    }}
                    onClick={handlePatternClick}
                  >
                    <canvas
                      ref={setCanvasRef}
                      style={{
                        position: 'absolute',
                        left: `${canvasX}px`,
                        top: `${canvasY}px`,
                        width: `${canvasW}px`,
                        height: `${canvasH}px`,
                      }}
                      className={`rounded shadow-md border border-[#1D231E]/20 ${
                        viewMode === 'tracker' ? 'cursor-pointer' : ''
                      }`}
                    />
                  </div>
                ) : !loadingPattern ? (
                  <div className="m-auto text-center p-6 text-[#5A6659] text-xs">
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
                  Click a shade to isolate on chart or mark done
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
                  const colorIndices: number[] = [];
                  pattern.pixelDmcMap.forEach((dmc, idx) => {
                    if (dmc.code === item.dmc.code) {
                      colorIndices.push(idx);
                    }
                  });

                  const doneCount = colorIndices.filter(idx => completedStitches.has(idx)).length;
                  const isAllDone = colorIndices.length > 0 && doneCount === colorIndices.length;
                  const colorPct = Math.round((doneCount / Math.max(1, colorIndices.length)) * 100);
                  const isSelected = filterDmcCode === item.dmc.code;

                  return (
                    <div
                      key={item.dmc.code}
                      onClick={() => setFilterDmcCode(prev => prev === item.dmc.code ? null : item.dmc.code)}
                      className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#E06C38]/10 border-[#E06C38] ring-1 ring-[#E06C38]'
                          : isAllDone 
                          ? 'bg-[#E8EFE5]/60 border-[#C5D3C2]' 
                          : 'bg-[#FAF6EE] border-[#E8E1D2] hover:border-[#E06C38]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Color Swatch with Symbol */}
                          <div
                            className="w-5 h-5 rounded-md border border-black/20 flex items-center justify-center shrink-0 font-bold text-[10px]"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleColorComplete(item.dmc.code);
                          }}
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


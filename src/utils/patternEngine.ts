import { DMCItem, DMC_DATABASE, quantizeImageToDMC } from './dmcPalette';

export interface PatternConfig {
  gridWidth: number;          // width in stitches
  fabricCount: number;        // e.g. 14, 16, 18, 28
  colorLimit: number;         // e.g. 10 - 250
  showGridLines: boolean;     // show 10-stitch bold grid lines
  showSymbols: boolean;       // overlay symbols on color chart
  brand: 'DMC' | 'Anchor';    // Thread brand key
  dithering?: 'none' | 'soft' | 'floyd-steinberg' | 'atkinson'; // Dithering algorithm
  brightness?: number;        // -50 to +50
  contrast?: number;          // -50 to +50
  saturation?: number;        // -50 to +50
  isAdFree: boolean;          // Plan flag
  planTier: 'free' | 'pro' | 'studio';
}

export interface FlossUsage {
  dmc: DMCItem;
  stitchCount: number;
  percentage: number;
  skeinsNeeded: number;
}

export interface StitchCell {
  stitchX: number;
  stitchY: number;
  dmcCode: string;
  name: string;
  hex: string;
  symbol: string;
  dmc: DMCItem;
}

export interface GeneratedPattern {
  widthStitches: number;
  heightStitches: number;
  physicalWidthInches: number;
  physicalHeightInches: number;
  totalStitches: number;
  pixelDmcMap: DMCItem[];
  stitchMatrix: StitchCell[][]; // 2D matrix [y][x]
  flossList: FlossUsage[];
  aspectRatio: number;
}

// Fabric Count options
export const FABRIC_COUNTS = [
  { count: 14, label: '14-Count Aida (Standard)' },
  { count: 16, label: '16-Count Aida (Fine Detail)' },
  { count: 18, label: '18-Count Aida (HD Fine)' },
  { count: 28, label: '28-Count Evenweave / Linen' },
];

// Helper to load HTMLImageElement from URL with resilient error recovery
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin header if initial load failed
      const retryImg = new Image();
      retryImg.onload = () => resolve(retryImg);
      retryImg.onerror = (err) => reject(err);
      retryImg.src = url;
    };
    img.src = url;
  });
}

// Generate compact thumbnail data URL (~15KB) from any source image
export async function createScaledThumbnail(srcUrl: string, maxDim = 250): Promise<string> {
  if (!srcUrl) return '';
  try {
    const img = await loadImage(srcUrl);
    const canvas = document.createElement('canvas');
    let w = img.naturalWidth || img.width || 250;
    let h = img.naturalHeight || img.height || 250;
    if (w > h) {
      if (w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      }
    } else {
      if (h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = Math.max(10, w);
    canvas.height = Math.max(10, h);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    }
  } catch (err) {
    console.warn('Failed to create scaled thumbnail:', err);
  }
  return srcUrl;
}

// Multi-step high-quality downsampling to preserve sharp edges and local contrast like Pixel-Stitch
export function resampleImageHighQuality(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ImageData {
  let curWidth = img.naturalWidth || img.width;
  let curHeight = img.naturalHeight || img.height;

  // Offscreen canvas
  let canvas = document.createElement('canvas');
  canvas.width = curWidth;
  canvas.height = curHeight;
  let ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, curWidth, curHeight);

  // Step-down resample by half iterations until close to target
  while (curWidth * 0.5 >= targetWidth && curHeight * 0.5 >= targetHeight) {
    const nextWidth = Math.floor(curWidth * 0.5);
    const nextHeight = Math.floor(curHeight * 0.5);

    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = nextWidth;
    nextCanvas.height = nextHeight;
    const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
    if (!nextCtx) break;

    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(canvas, 0, 0, curWidth, curHeight, 0, 0, nextWidth, nextHeight);

    canvas = nextCanvas;
    ctx = nextCtx;
    curWidth = nextWidth;
    curHeight = nextHeight;
  }

  // Final draw to target grid resolution
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  if (!finalCtx) throw new Error('Canvas context unavailable');

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(canvas, 0, 0, curWidth, curHeight, 0, 0, targetWidth, targetHeight);

  return finalCtx.getImageData(0, 0, targetWidth, targetHeight);
}

// Apply tone adjustments (Brightness, Contrast, Saturation)
export function applyImageAdjustments(
  imageData: ImageData,
  brightness: number = 0, // -50 to +50
  contrast: number = 0,   // -50 to +50
  saturation: number = 0  // -50 to +50
): ImageData {
  if (brightness === 0 && contrast === 0 && saturation === 0) {
    return imageData;
  }

  const data = imageData.data;
  const numPixels = data.length / 4;

  // Contrast multiplier
  const cFactor = (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));
  // Saturation factor
  const sFactor = (saturation + 100) / 100;
  // Brightness offset
  const bOffset = brightness * 2.55;

  for (let i = 0; i < numPixels; i++) {
    let r = data[i * 4];
    let g = data[i * 4 + 1];
    let b = data[i * 4 + 2];

    // 1. Brightness
    if (brightness !== 0) {
      r += bOffset;
      g += bOffset;
      b += bOffset;
    }

    // 2. Contrast
    if (contrast !== 0) {
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;
    }

    // 3. Saturation (relative luminance weights)
    if (saturation !== 0) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray + sFactor * (r - gray);
      g = gray + sFactor * (g - gray);
      b = gray + sFactor * (b - gray);
    }

    data[i * 4] = Math.max(0, Math.min(255, Math.round(r)));
    data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
    data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
  }

  return imageData;
}

// Base default tone shading & color settings applied to all uploaded images
export const DEFAULT_BASE_BRIGHTNESS = -4;
export const DEFAULT_BASE_CONTRAST = 20;
export const DEFAULT_BASE_SATURATION = -6;

// Generate pattern dataset from image URL and config
export async function generatePatternFromImage(
  imageUrl: string,
  config: PatternConfig,
  allowedPalette?: DMCItem[]
): Promise<GeneratedPattern> {
  const img = await loadImage(imageUrl);

  const aspectRatio = img.height / img.width;
  const widthStitches = Math.max(10, Math.round(config.gridWidth));
  const heightStitches = Math.max(10, Math.round(widthStitches * aspectRatio));

  // Multi-pass high quality downscaling
  let imageData = resampleImageHighQuality(img, widthStitches, heightStitches);

  // Apply default base tone adjustments (-4, +20, -6) plus any user slider offsets (Studio tier)
  const effectiveBrightness = DEFAULT_BASE_BRIGHTNESS + (config.brightness || 0);
  const effectiveContrast = DEFAULT_BASE_CONTRAST + (config.contrast || 0);
  const effectiveSaturation = DEFAULT_BASE_SATURATION + (config.saturation || 0);

  if (effectiveBrightness !== 0 || effectiveContrast !== 0 || effectiveSaturation !== 0) {
    imageData = applyImageAdjustments(
      imageData,
      effectiveBrightness,
      effectiveContrast,
      effectiveSaturation
    );
  }

  // Run Frequency-Weighted DMC Quantization + CIEDE2000 Matching + Dithering
  const { pixelDmcMap } = quantizeImageToDMC(
    imageData,
    config.colorLimit,
    allowedPalette,
    config.dithering || 'none'
  );

  const totalStitches = widthStitches * heightStitches;

  // Build 2D Stitch Matrix [y][x]
  const stitchMatrix: StitchCell[][] = [];
  for (let y = 0; y < heightStitches; y++) {
    const row: StitchCell[] = [];
    for (let x = 0; x < widthStitches; x++) {
      const idx = y * widthStitches + x;
      const dmc = pixelDmcMap[idx];
      row.push({
        stitchX: x,
        stitchY: y,
        dmcCode: dmc.code,
        name: dmc.name,
        hex: dmc.hex,
        symbol: dmc.symbol,
        dmc
      });
    }
    stitchMatrix.push(row);
  }

  // Calculate floss usage stats
  const countMap = new Map<string, { dmc: DMCItem; count: number }>();
  for (const dmc of pixelDmcMap) {
    const existing = countMap.get(dmc.code);
    if (existing) {
      existing.count += 1;
    } else {
      countMap.set(dmc.code, { dmc, count: 1 });
    }
  }

  const flossList: FlossUsage[] = Array.from(countMap.values())
    .map(({ dmc, count }) => {
      const percentage = Math.round((count / totalStitches) * 1000) / 10;
      // 1 skein = ~1800 stitches on 14ct Aida
      const stitchesPerSkein = Math.round(1800 * (14 / config.fabricCount));
      const skeinsNeeded = Math.max(1, Math.ceil(count / Math.max(500, stitchesPerSkein)));
      return {
        dmc,
        stitchCount: count,
        percentage,
        skeinsNeeded
      };
    })
    .sort((a, b) => b.stitchCount - a.stitchCount);

  // Physical size in inches
  const physicalWidthInches = Math.round((widthStitches / config.fabricCount) * 10) / 10;
  const physicalHeightInches = Math.round((heightStitches / config.fabricCount) * 10) / 10;

  return {
    widthStitches,
    heightStitches,
    physicalWidthInches,
    physicalHeightInches,
    totalStitches,
    pixelDmcMap,
    stitchMatrix,
    flossList,
    aspectRatio
  };
}

// Render Pattern onto a Canvas Element
export function renderPatternCanvas(
  canvas: HTMLCanvasElement,
  pattern: GeneratedPattern,
  mode: 'color' | 'symbol' | 'tracker',
  config: PatternConfig,
  completedStitchesSet?: Set<number>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { widthStitches, heightStitches, pixelDmcMap } = pattern;
  
  // Cell size calculation based on high-DPI pattern resolution for crisp symbols
  const cellSize = Math.max(16, Math.min(36, Math.floor(1200 / widthStitches)));
  const width = widthStitches * cellSize;
  const height = heightStitches * cellSize;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // Background
  if (mode === 'symbol') {
    ctx.fillStyle = '#FFFFFF';
  } else {
    ctx.fillStyle = '#FAF6EE';
  }
  ctx.fillRect(0, 0, width, height);

  // Draw Stitches
  for (let y = 0; y < heightStitches; y++) {
    for (let x = 0; x < widthStitches; x++) {
      const index = y * widthStitches + x;
      const dmc = pixelDmcMap[index];
      const isCompleted = completedStitchesSet?.has(index);

      const px = x * cellSize;
      const py = y * cellSize;

      if (mode === 'color') {
        // Colored stitch square
        ctx.fillStyle = dmc.hex;
        ctx.fillRect(px, py, cellSize, cellSize);

        // Optional symbol overlay for high contrast
        if (config.showSymbols && cellSize >= 12) {
          ctx.fillStyle = isLightColor(dmc.hex) ? '#000000' : '#FFFFFF';
          ctx.font = `bold ${Math.floor(cellSize * 0.55)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(dmc.symbol, px + cellSize / 2, py + cellSize / 2);
        }
      } else if (mode === 'symbol') {
        // B&W Printable chart
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, cellSize, cellSize);

        // Symbol text
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${Math.floor(cellSize * 0.6)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dmc.symbol, px + cellSize / 2, py + cellSize / 2);
      } else if (mode === 'tracker') {
        // Interactive Stitch Progress Tracker
        if (isCompleted) {
          ctx.fillStyle = '#E8EFE5';
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.fillStyle = '#2E7D32';
          ctx.font = `bold ${Math.floor(cellSize * 0.6)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✓', px + cellSize / 2, py + cellSize / 2);
        } else {
          ctx.fillStyle = dmc.hex;
          ctx.fillRect(px, py, cellSize, cellSize);
          if (cellSize >= 12) {
            ctx.fillStyle = isLightColor(dmc.hex) ? '#000000' : '#FFFFFF';
            ctx.font = `bold ${Math.floor(cellSize * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dmc.symbol, px + cellSize / 2, py + cellSize / 2);
          }
        }
      }
    }
  }

  // Draw Grid Lines (1-cell light lines, 10-cell bold lines)
  if (config.showGridLines) {
    for (let x = 0; x <= widthStitches; x++) {
      ctx.beginPath();
      const isTen = x % 10 === 0;
      ctx.strokeStyle = isTen ? '#1D231E' : mode === 'symbol' ? '#CCCCCC' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = isTen ? 1.8 : 0.6;
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }

    for (let y = 0; y <= heightStitches; y++) {
      ctx.beginPath();
      const isTen = y % 10 === 0;
      ctx.strokeStyle = isTen ? '#1D231E' : mode === 'symbol' ? '#CCCCCC' : 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = isTen ? 1.8 : 0.6;
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }
  }
}

// Utility to check luminance of hex color
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

// Export Pattern Chart as Printable Canvas Data URL
export function generatePrintableImage(
  pattern: GeneratedPattern,
  mode: 'color' | 'symbol',
  config: PatternConfig
): string {
  const canvas = document.createElement('canvas');
  renderPatternCanvas(canvas, pattern, mode, config);
  return canvas.toDataURL('image/png');
}

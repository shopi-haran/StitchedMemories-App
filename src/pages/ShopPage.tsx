import React from 'react';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Package, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  Sparkles,
  ClipboardList,
  Palette,
  FileCheck
} from 'lucide-react';

interface ShopPageProps {
  onGoHome: () => void;
  onOpenConverter: () => void;
  user?: { id?: string; name: string; email: string; avatar_url?: string } | null;
  onLoginSuccess?: (user: { id?: string; name: string; email: string; avatar_url?: string }) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onGoHome, onOpenConverter }) => {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1D231E]">
      
      {/* Top Marketplace Header */}
      <div className="bg-[#1D231E] text-white py-12 px-6 lg:px-12 border-b border-[#2D382E] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A28F] hover:text-white mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#E8EFE5] text-[#3D5239] text-[10px] font-bold uppercase tracking-wider">
                Marketplace Studio
              </span>
              <span className="text-[11px] text-[#A2B0A0]">• Custom Quote & Bespoke Orders</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Marketplace</span>
              <ShoppingBag className="w-6 h-6 text-[#E06C38]" />
            </h1>
            <p className="text-sm text-[#A2B0A0] mt-1 max-w-xl">
              Request tailored material kits, custom thread matching, and finished heirloom hand-stitched pieces made to your exact specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenConverter}
              className="px-5 py-2.5 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Pattern Converter</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-10 top-0 w-96 h-96 bg-[#E06C38]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        
        {/* Marketplace Guarantees Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Artisan Shipping</span>
              <span className="text-[10px] text-[#6B7869]">Tracked worldwide dispatch</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">100% Genuine DMC</span>
              <span className="text-[10px] text-[#6B7869]">Pre-sorted French threads</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Zweigart Fabrics</span>
              <span className="text-[10px] text-[#6B7869]">Premium German cloth</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Hand-Inspected</span>
              <span className="text-[10px] text-[#6B7869]">Custom-cut to size</span>
            </div>
          </div>
        </div>

        {/* Structural Custom Order Hub Ready for Quote-Based Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white rounded-3xl p-8 border border-[#E8E1D2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1D231E] mb-2">Custom Physical Kits</h3>
              <p className="text-xs text-[#5A6659] leading-relaxed mb-4">
                Get an exact physical kit assembled for any converted or uploaded pattern. Includes pre-cut Aida cloth, pre-sorted DMC thread bobbins, needles, and a printed color booklet.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0EBE1] text-xs font-medium text-[#70806E] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#E06C38]" />
              <span>Tailored quotes based on stitch count & dimensions</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-[#E8E1D2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center mb-4">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1D231E] mb-2">Hand-Stitched Finished Art</h3>
              <p className="text-xs text-[#5A6659] leading-relaxed mb-4">
                Commission a master artisan stitcher to complete your heirloom photo portrait or intricate tapestry by hand, washed, pressed, and mounted ready for framing.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F0EBE1] text-xs font-medium text-[#70806E] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#E06C38]" />
              <span>Bespoke artisan quotes with timeline estimates</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-[#E8E1D2] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1D231E] mb-2">Converter Integration</h3>
              <p className="text-xs text-[#5A6659] leading-relaxed mb-4">
                Convert any photo in Stitchly Pattern Studio, customize thread palettes, and generate instant quote requests directly from your pattern specifications.
              </p>
            </div>
            <button
              onClick={onOpenConverter}
              className="mt-4 w-full py-3 rounded-xl bg-[#1D231E] hover:bg-[#323D34] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-[#E06C38]" />
              <span>Launch Pattern Studio</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

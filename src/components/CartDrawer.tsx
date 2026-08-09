import React from 'react';
import { X, ShoppingBag, Bell, Sparkles, ArrowRight, PackageCheck, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConverter?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenConverter }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#FAF6EE] h-full shadow-2xl flex flex-col z-10 border-l border-[#E8E1D2]">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E8E1D2] flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#E06C38]/10 text-[#E06C38] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D231E]">Your Craft Cart</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8EFE5] text-[#4A5D48] border border-[#D0DCD0] inline-block mt-0.5">
                Shop Kits Coming Soon
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#6B7869] hover:text-[#1D231E] hover:bg-[#E8E1D2]/50 rounded-full transition-all cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Informational Card */}
          <div className="bg-white border border-[#E8E1D2] rounded-2xl p-5 shadow-xs text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#E06C38]/30 text-[#E06C38] flex items-center justify-center mx-auto mb-3">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1D231E] mb-1">
              Shop Kits launching soon!
            </h3>
            <p className="text-xs text-[#5B675A] leading-relaxed mb-4">
              Our complete physical craft kits — including DMC thread palettes, pre-cut 14-count Aida cloth, bamboo hoops & custom photo patterns — are currently in preparation.
            </p>

            <div className="bg-[#FAF6EE] border border-[#E8E1D2] rounded-xl p-3 text-left flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#E06C38] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#3A4538] leading-tight">
                In the meantime, you can convert your photos into digital cross-stitch PDF patterns anytime!
              </p>
            </div>
          </div>

          {/* Featured Preview Kit Items */}
          <div>
            <h4 className="text-xs font-bold text-[#6B7869] uppercase tracking-wider mb-3">
              Upcoming Physical Craft Kits
            </h4>

            <div className="space-y-3">
              <div className="bg-white border border-[#E8E1D2] rounded-xl p-3 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E8EFE5] flex items-center justify-center text-[#556653] font-bold text-xs">
                    PET
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1D231E]">Custom Pet Portrait Kit</h5>
                    <span className="text-[10px] text-[#8A9588]">Includes Hoop, Cloth & Threads</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#8A9588]">$29.00</span>
              </div>

              <div className="bg-white border border-[#E8E1D2] rounded-xl p-3 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#E8EFE5] flex items-center justify-center text-[#556653] font-bold text-xs">
                    WED
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1D231E]">Wedding Anniversary Kit</h5>
                    <span className="text-[10px] text-[#8A9588]">Includes Frame, Palette & Needles</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#8A9588]">$34.00</span>
              </div>
            </div>
          </div>

          {/* Stock Notification Form */}
          <div className="bg-[#E8EFE5]/60 border border-[#D0DCD0] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5 text-[#3A4538]">
              <Bell className="w-4 h-4 text-[#E06C38]" />
              <h4 className="text-xs font-bold">Get Launch Notification</h4>
            </div>
            <p className="text-[11px] text-[#556653] mb-3">
              Be the first to know when physical kit shipping opens in your area.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-3 py-1.5 bg-white border border-[#D0DCD0] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:ring-2 focus:ring-[#E06C38]/40"
              />
              <button
                type="button"
                onClick={() => alert("Thank you! We'll notify you as soon as Shop Kits are available.")}
                className="px-3 py-1.5 bg-[#1D231E] hover:bg-[#323D34] text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Notify Me
              </button>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-5 border-t border-[#E8E1D2] bg-white/80 space-y-2">
          {onOpenConverter && (
            <button
              onClick={() => {
                onClose();
                onOpenConverter();
              }}
              className="w-full py-3 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Stitchly</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-[#6B7869] hover:text-[#1D231E] cursor-pointer"
          >
            Continue Browsing
          </button>
        </div>

      </div>
    </div>
  );
};

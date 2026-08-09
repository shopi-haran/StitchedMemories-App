import React, { useState } from 'react';
import { SHOP_KITS } from '../data/mockData';
import { ShopKit } from '../types';
import { ShoppingBag, Lock, Check, Bell, Sparkles, ArrowLeft, Package, ShieldCheck, Heart, Info, ArrowRight } from 'lucide-react';

interface ShopPageProps {
  onGoHome: () => void;
  onOpenConverter: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onGoHome, onOpenConverter }) => {
  const [selectedKit, setSelectedKit] = useState<ShopKit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [isNotified, setIsNotified] = useState<boolean>(false);

  const categories = ['All', 'Full Kit', 'Curated Design', 'Notions'];

  const filteredKits = SHOP_KITS.filter(
    (kit) => selectedCategory === 'All' || kit.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1D231E]">
      
      {/* Top Banner Header */}
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
            
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#E8EFE5] text-[#3D5239] text-[10px] font-bold uppercase tracking-wider">
                E-Commerce Store • Launching Soon
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Physical Embroidery Kits & Notions</span>
              <ShoppingBag className="w-6 h-6 text-[#E06C38]" />
            </h1>
            <p className="text-sm text-[#A2B0A0] mt-1 max-w-xl">
              Complete cross-stitch kits containing pre-sorted DMC thread palettes, premium Zweigart Aida cloth, gold-plated tapestry needles, and custom photo charts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenConverter}
              className="px-5 py-2.5 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Digital Photo Patterns</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-10 top-0 w-96 h-96 bg-[#E06C38]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        
        {/* Category Tabs & Pre-order Guarantee Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 bg-white border border-[#E8E1D2] rounded-2xl p-4 shadow-xs">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1D231E] text-white shadow-xs'
                    : 'bg-[#FAF6EE] text-[#5A6659] hover:bg-[#E8E1D2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#556653] bg-[#E8EFE5]/70 border border-[#D0DCD0] px-3.5 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#E06C38] shrink-0" />
            <span className="font-medium">Early bird subscribers receive 20% off when kit shipping opens!</span>
          </div>

        </div>

        {/* Kits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredKits.map((kit) => (
            <div
              key={kit.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#E8E1D2] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
            >
              {/* Badge */}
              <div className="absolute top-4 right-4 z-10 bg-[#E8EFE5] text-[#3D5239] text-[10px] font-bold px-3 py-1 rounded-full border border-[#C5D3C2] shadow-xs">
                {kit.status}
              </div>

              <div>
                <div className="relative aspect-[4/3] bg-[#F5EFE4] overflow-hidden">
                  <img
                    src={kit.imageUrl}
                    alt={kit.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#1D231E]">
                    {kit.difficulty} Level
                  </div>
                </div>

                <div className="p-6">
                  <span className="text-[11px] font-bold text-[#93A28F] uppercase tracking-wider block mb-1">
                    {kit.category}
                  </span>
                  <h3 className="text-xl font-bold text-[#1D231E] mb-2">{kit.title}</h3>
                  <div className="text-lg font-extrabold text-[#E06C38] mb-4">{kit.price}</div>

                  <div className="space-y-2 text-xs text-[#5A6659] pt-3 border-t border-[#F0EBE1]">
                    <span className="font-bold text-[#1D231E] block text-[11px] mb-1">Kit Includes:</span>
                    {kit.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#93A28F] shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-2">
                <button
                  onClick={() => setSelectedKit(kit)}
                  className="w-full py-3 rounded-xl bg-[#E06C38] hover:bg-[#d05c28] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Reserve Early Access</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* E-Commerce Roadmap Section */}
        <div className="mt-16 bg-white border border-[#E8E1D2] rounded-3xl p-8 lg:p-10 shadow-sm">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E06C38] mb-2 block">
              Physical Kit Shipping Roadmap
            </span>
            <h3 className="text-2xl font-bold text-[#1D231E] mb-3">
              How Physical Custom Kits Will Work
            </h3>
            <p className="text-sm text-[#5B675A] leading-relaxed mb-6">
              When physical kit ordering opens, simply upload your photo on StitchedMemories. We will pre-cut your Aida fabric, wind your exact DMC skeins onto labeled thread drops, and ship a completed box directly to your address.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2]">
                <Package className="w-5 h-5 text-[#93A28F] mb-2" />
                <h4 className="text-xs font-bold text-[#1D231E] mb-1">1. Pre-Sorted Threads</h4>
                <p className="text-[11px] text-[#5A6659]">No more buying full skeins for just 10 stitches of one accent color.</p>
              </div>

              <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2]">
                <Sparkles className="w-5 h-5 text-[#E06C38] mb-2" />
                <h4 className="text-xs font-bold text-[#1D231E] mb-1">2. Printed Color Charts</h4>
                <p className="text-[11px] text-[#5A6659]">High-contrast physical booklet chart alongside your digital PDF copy.</p>
              </div>

              <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2]">
                <ShieldCheck className="w-5 h-5 text-[#3D5239] mb-2" />
                <h4 className="text-xs font-bold text-[#1D231E] mb-1">3. Eco-Friendly Hoops</h4>
                <p className="text-[11px] text-[#5A6659]">Smooth bamboo or solid beechwood hoops included in every starter kit.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Early Access Reserve Modal */}
      {selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF6EE] rounded-3xl max-w-md w-full p-6 lg:p-8 shadow-2xl border border-[#E8E1D2] relative">
            
            <button
              onClick={() => { setSelectedKit(null); setIsNotified(false); }}
              className="absolute top-5 right-5 p-2 text-[#6B7869] hover:text-[#1D231E] hover:bg-[#E8E1D2]/50 rounded-full transition-all cursor-pointer"
            >
              <Info className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#E06C38]/10 text-[#E06C38] flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1D231E]">
                Reserve "{selectedKit.title}"
              </h3>
              <p className="text-xs text-[#5B675A] mt-1">
                Be the first to order when shipping opens. Includes 20% early bird coupon!
              </p>
            </div>

            {isNotified ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#E5EDE2] text-[#2E7D32] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1D231E]">You're on the VIP list!</h4>
                <p className="text-xs text-[#5B675A]">
                  We'll send launch notification and your 20% discount code to <span className="font-bold">{registeredEmail}</span>.
                </p>
                <button
                  onClick={() => { setSelectedKit(null); setIsNotified(false); }}
                  className="mt-4 px-6 py-2.5 bg-[#1D231E] text-white text-xs font-semibold rounded-full hover:bg-[#323D34] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (registeredEmail) setIsNotified(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#3A4538] mb-1.5">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={registeredEmail}
                    onChange={(e) => setRegisteredEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#D5CDBC] rounded-xl text-sm text-[#1D231E] focus:outline-none focus:ring-2 focus:ring-[#E06C38]/40"
                  />
                </div>

                <div className="bg-[#E8EFE5] border border-[#D0DCD0] rounded-xl p-3 text-xs text-[#3D5239]">
                  <p><strong>Kit Price:</strong> {selectedKit.price}</p>
                  <p className="text-[11px] text-[#556653] mt-0.5">Zero payment taken today. This is an interest reservation.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E06C38] hover:bg-[#d05c28] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirm Reservation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

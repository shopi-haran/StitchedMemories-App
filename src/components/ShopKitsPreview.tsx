import React from 'react';
import { SHOP_KITS } from '../data/mockData';
import { ShoppingBag, Check, Lock, ArrowRight, Sparkles, Package } from 'lucide-react';

interface ShopKitsPreviewProps {
  onNavigateToShopPage?: () => void;
}

export const ShopKitsPreview: React.FC<ShopKitsPreviewProps> = ({ onNavigateToShopPage }) => {
  const mainKit = SHOP_KITS[0];
  const secondaryKits = SHOP_KITS.slice(1);

  return (
    <section id="shop-section" className="py-20 bg-[#FAF6EE] border-t border-[#E8E1D2]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#70806E] bg-[#E8EFE5] px-3 py-1 rounded-full mb-3 border border-[#D0DCD0]">
              <Package className="w-3.5 h-3.5 text-[#556653]" />
              <span>Shop Kits</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1D231E]">
              Physical Kits & Craft Notions
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 mt-3 md:mt-0">
            <p className="text-sm text-[#5A6659] max-w-md text-left md:text-right">
              Preview our custom kits: pre-sorted DMC thread, premium Aida cloth, gold-plated needles, and custom charts delivered to your door.
            </p>
            {onNavigateToShopPage && (
              <button
                onClick={onNavigateToShopPage}
                className="text-xs font-bold text-[#E06C38] hover:underline flex items-center gap-1 cursor-pointer mt-1"
              >
                <span>Visit Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Featured Main Kit & Half-Size Balance Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Physical Kit Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl overflow-hidden border border-[#E8E1D2] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between relative group">
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10 bg-[#E8EFE5] text-[#3D5239] text-[10px] font-bold px-3 py-1 rounded-full border border-[#C5D3C2] shadow-xs">
              {mainKit.status}
            </div>

            <div className="md:w-1/2 relative bg-[#F5EFE4] aspect-[4/3] md:aspect-auto overflow-hidden">
              <img
                src={mainKit.imageUrl}
                alt={mainKit.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#1D231E]">
                {mainKit.difficulty} Level
              </div>
            </div>

            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#93A28F] uppercase tracking-wider block mb-1">
                  {mainKit.category}
                </span>
                <h3 className="text-2xl font-bold text-[#1D231E] mb-2">{mainKit.title}</h3>
                <div className="text-xl font-extrabold text-[#E06C38] mb-4">{mainKit.price}</div>

                <div className="space-y-2 text-xs text-[#5A6659] pt-3 border-t border-[#F0EBE1] mb-6">
                  <span className="font-bold text-[#1D231E] block text-[11px] mb-1">Kit Includes:</span>
                  {mainKit.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#93A28F] shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two CTAs: 1. Buy Now, 2. Customize Kit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={onNavigateToShopPage}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#E06C38] hover:bg-[#d05c28] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={onNavigateToShopPage}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1D231E] hover:bg-[#323D34] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#E06C38]" />
                  <span>Customize Kit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Balance Area: Half Size Cards for Popular Individual Products */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#70806E]">
              Popular Individual Products
            </span>

            {secondaryKits.map((kit) => (
              <div
                key={kit.id}
                className="bg-white rounded-2xl p-4 border border-[#E8E1D2] shadow-xs hover:shadow-md transition-all duration-300 flex items-center gap-4 group"
              >
                <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-[#F5EFE4] relative">
                  <img
                    src={kit.imageUrl}
                    alt={kit.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-[#93A28F] uppercase tracking-wider block">
                    {kit.category}
                  </span>
                  <h4 className="text-sm font-bold text-[#1D231E] truncate mb-1" title={kit.title}>
                    {kit.title}
                  </h4>
                  <div className="text-xs font-extrabold text-[#E06C38] mb-2">{kit.price}</div>

                  <button
                    onClick={onNavigateToShopPage}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D231E] hover:text-[#E06C38] transition-colors cursor-pointer"
                  >
                    <span>Buy Now</span>
                    <ArrowRight className="w-3 h-3 text-[#E06C38]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};


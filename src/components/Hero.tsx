import React from 'react';
import { Heart, Sparkles, Palette, ShoppingBag, ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenConverter: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

const HERO_FOCAL_IMAGE = "https://raw.githubusercontent.com/shopi-haran/StitchedMemories/4f6b9f162dae3dc7b2f116d652e1081b2cb51038/assets/images/master/hoop%20_dog.png";
const HERO_COLLECTION_IMAGE = "https://raw.githubusercontent.com/shopi-haran/StitchedMemories/ecd4bdb0778697f489dad46afca6c3079c82712a/assets/images/master/Hoop_wedding_cat_family.png";

export const Hero: React.FC<HeroProps> = ({ onOpenConverter }) => {
  return (
    <section className="relative overflow-hidden bg-[#FAF6EE] pt-6 pb-16 text-[#1D231E]">
      {/* Background SVG Wave Layer matching reference layout */}
      <div className="absolute top-0 right-0 w-full h-[832px] pointer-events-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 1440 910"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
        >
          {/* Main Top Right Sage Green Organic Shape (Smooth Elegant Curve with No Kinks/Dots) */}
          <path
            d="M 560 0 
               C 560 200, 570 400, 680 560 
               C 790 720, 1080 750, 1440 700 
               L 1440 0 Z"
            fill="#93A28F"
          />
          {/* Soft Bottom Left Secondary Wave Layer (Extended 30% Downwards) */}
          <path
            d="M 0 702 
               C 180 676, 360 754, 480 806 
               C 600 858, 680 884, 800 910 
               L 0 910 Z"
            fill="#EBE5D8"
            opacity="0.6"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Main Hero Layout Grid: Left Text Content & Right Focal Craft Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[480px]">
          
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left py-4 max-w-xl">
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-[#1D231E] leading-[1.15] mb-5 font-sans text-left">
              Stitch your Memories
            </h1>
            
            {/* Paragraph Text - Strictly Left Aligned & Left Half Constrained */}
            <p className="text-[#4A544A] text-base sm:text-lg leading-relaxed mb-8 max-w-md font-normal text-left">
              Turning your favorite photos into handmade cross-stitch keepsakes - patterns or ready-to-frame pieces. Pets, portraits, memories, made to stitch.
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-3.5 mb-10 text-left">
              <button
                onClick={onOpenConverter}
                id="hero-cta-button"
                className="inline-flex items-center justify-center gap-2.5 bg-[#E06C38] hover:bg-[#d05c28] text-white font-medium text-base px-7 py-3.5 rounded-full shadow-lg shadow-[#E06C38]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Convert a Photo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenConverter}
                id="hero-custom-order-button"
                className="inline-flex items-center justify-center gap-2 bg-[#1D231E] hover:bg-[#323D34] text-white font-medium text-base px-7 py-3.5 rounded-full shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#93A28F]" />
                <span>Place your Order</span>
              </button>
            </div>

            {/* 3 Micro Feature Badges - Equally Spread & Left Aligned */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-md text-left pt-2">
              
              {/* Badge 1: DMC/Anchor Colors */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-[#E5EDE2] flex items-center justify-center text-[#3D5239] shrink-0">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-[#2C352B] leading-snug text-left">
                  DMC/Anchor Colors
                </span>
              </div>

              {/* Badge 2: Instant Preview */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-[#E5EDE2] flex items-center justify-center text-[#3D5239] shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#E06C38]" />
                </div>
                <span className="text-xs font-medium text-[#2C352B] leading-snug text-left">
                  Instant Preview
                </span>
              </div>

              {/* Badge 3: Stitched with Love */}
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-[#E5EDE2] flex items-center justify-center text-[#3D5239] shrink-0">
                  <Heart className="w-3.5 h-3.5 text-[#E06C38]" />
                </div>
                <span className="text-xs font-medium text-[#2C352B] leading-snug text-left">
                  Stitched with Love
                </span>
              </div>

            </div>

          </div>

          {/* Right Column: Prominent Focal Craft Image & Polygon Category Row */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-4 min-h-[320px]">
            <div className="relative group hover:scale-[1.02] transition-transform duration-300 my-2">
              
              {/* Soft ambient backlight glow */}
              <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl transform scale-95 -z-10" />

              {/* Focal Transparent PNG Embroidery Hoop Image */}
              <img
                src={HERO_FOCAL_IMAGE}
                alt="Custom Golden Retriever Cross Stitch Transformation Preview Hoop"
                className="w-[320px] max-w-full h-auto object-contain drop-shadow-2xl mx-auto relative z-10"
                referrerPolicy="no-referrer"
              />

            </div>

            {/* Collection Image below focal image */}
            <div className="mt-3 z-20 w-full flex justify-center">
              <div className="relative group hover:scale-[1.02] transition-all duration-300">
                <img
                  src={HERO_COLLECTION_IMAGE}
                  alt="Wedding, Cat, and Family Cross Stitch Hoop Examples"
                  className="w-[540px] max-w-full h-auto object-contain drop-shadow-xl mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Social Proof Stats Section */}
        <div className="mt-12 pt-10 relative">
          
          {/* Subtle concentric ripple background circles matching reference image */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-hidden opacity-40">
            <div className="w-[520px] h-[520px] rounded-full border border-[#93A28F]/40 animate-pulse" />
            <div className="absolute w-[380px] h-[380px] rounded-full border border-[#93A28F]/30" />
            <div className="absolute w-[240px] h-[240px] rounded-full border border-[#93A28F]/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-center max-w-5xl mx-auto">
            
            {/* Panel 1: Patterns Created */}
            <div className="bg-[#93A28F]/20 backdrop-blur-md border border-[#93A28F]/35 shadow-lg hover:shadow-xl rounded-[28px] p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#93A28F]/25 hover:-translate-y-1">
              <span className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#1D231E] tracking-tight mb-3 font-sans">
                14K+
              </span>
              
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#1D231E] mb-3">
                PATTERNS CREATED
              </h3>

              <p className="text-xs text-[#3D4B3C] font-medium leading-relaxed max-w-[220px]">
                Custom memories turned into detailed cross-stitch charts.
              </p>
            </div>

            {/* Panel 2: Colours Listed (Central Panel - Equal in size, elevated slightly above with hover lift animation) */}
            <div className="bg-[#93A28F]/30 backdrop-blur-lg border border-[#93A28F]/50 shadow-xl rounded-[28px] p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#93A28F]/35 md:-translate-y-6 hover:md:-translate-y-8 hover:-translate-y-1 hover:shadow-2xl">
              <span className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#1D231E] tracking-tight mb-3 font-sans">
                450+
              </span>
              
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#1D231E] mb-3">
                COLOURS LISTED
              </h3>

              <p className="text-xs text-[#3D4B3C] font-medium leading-relaxed max-w-[220px]">
                Precision matched across DMC and Anchor thread palettes.
              </p>
            </div>

            {/* Panel 3: Stitches Counted */}
            <div className="bg-[#93A28F]/20 backdrop-blur-md border border-[#93A28F]/35 shadow-lg hover:shadow-xl rounded-[28px] p-8 sm:p-10 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#93A28F]/25 hover:-translate-y-1">
              <span className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-[#1D231E] tracking-tight mb-3 font-sans">
                18M+
              </span>
              
              <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#1D231E] mb-3">
                STITCHES COUNTED
              </h3>

              <p className="text-xs text-[#3D4B3C] font-medium leading-relaxed max-w-[220px]">
                Mapped and completed across custom heirloom keepsakes.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

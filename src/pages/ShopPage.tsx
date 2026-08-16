import React, { useState, useMemo } from 'react';
import { SHOP_KITS } from '../data/mockData';
import { ShopKit } from '../types';
import { 
  ShoppingBag, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Package, 
  ShieldCheck, 
  Star, 
  Search, 
  SlidersHorizontal, 
  X, 
  CheckCircle2, 
  Truck, 
  Plus, 
  Minus,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ShopPageProps {
  onGoHome: () => void;
  onOpenConverter: () => void;
  user?: { id?: string; name: string; email: string; avatar_url?: string } | null;
  onLoginSuccess?: (user: { id?: string; name: string; email: string; avatar_url?: string }) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({ onGoHome, onOpenConverter }) => {
  const { addToCart, setIsCartOpen, cartCount, subtotal } = useCart();

  const [selectedKit, setSelectedKit] = useState<ShopKit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const categories = ['All', 'Full Kit', 'Curated Design', 'Threads', 'Fabrics', 'Notions'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'All Levels'];

  const filteredKits = useMemo(() => {
    return SHOP_KITS.filter((kit) => {
      const matchesCategory = selectedCategory === 'All' || kit.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || kit.difficulty === selectedDifficulty;
      const matchesSearch = 
        kit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (kit.description && kit.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        kit.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  const handleAddToCart = (kit: ShopKit, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    addToCart({
      id: kit.id,
      title: kit.title,
      price: kit.numericPrice,
      priceFormatted: kit.price,
      imageUrl: kit.imageUrl,
      category: kit.category,
      difficulty: kit.difficulty,
      includes: kit.includes,
    }, quantity);

    setAddedToast(`Added "${kit.title}" (${quantity}×) to your cart!`);
    setTimeout(() => {
      setAddedToast(null);
    }, 3000);
  };

  const handleOpenDetail = (kit: ShopKit) => {
    setSelectedKit(kit);
    setModalQuantity(1);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1D231E]">
      
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D231E] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-[#3D4B3E] flex items-center gap-3 animate-fadeIn">
          <div className="w-6 h-6 rounded-full bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium">{addedToast}</span>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="text-xs font-bold text-[#E06C38] hover:underline ml-2"
          >
            View Cart
          </button>
        </div>
      )}

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
                Official Marketplace
              </span>
              <span className="text-[11px] text-[#A2B0A0]">• In Stock & Ready to Ship</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Craft Marketplace & Supplies</span>
              <ShoppingBag className="w-6 h-6 text-[#E06C38]" />
            </h1>
            <p className="text-sm text-[#A2B0A0] mt-1 max-w-xl">
              Authentic French DMC floss, German Zweigart Aida fabrics, Bohin needles, and custom photo cross-stitch kits packed by hand in our studio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-[#E06C38]" />
              <span>Cart ({cartCount})</span>
              {subtotal > 0 && (
                <span className="bg-[#E06C38] px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                  ${subtotal.toFixed(2)}
                </span>
              )}
            </button>

            <button
              onClick={onOpenConverter}
              className="px-5 py-2.5 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Custom Photo Kit</span>
            </button>
          </div>
        </div>

        <div className="absolute -right-10 top-0 w-96 h-96 bg-[#E06C38]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        
        {/* Marketplace Guarantees Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Free Shipping</span>
              <span className="text-[10px] text-[#6B7869]">On orders over $45</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">100% Genuine DMC</span>
              <span className="text-[10px] text-[#6B7869]">France Mouliné Cotton</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Zweigart Fabric</span>
              <span className="text-[10px] text-[#6B7869]">Anti-fray German weave</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E8E1D2] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1D231E] block">Studio Packed</span>
              <span className="text-[10px] text-[#6B7869]">Ships in 24–48 hours</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white border border-[#E8E1D2] rounded-2xl p-4 shadow-xs">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1D231E] text-white shadow-xs'
                    : 'bg-[#FAF6EE] text-[#5A6659] hover:bg-[#E8E1D2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Difficulty Filter */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#93A28F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search kits, DMC floss, needles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF6EE] border border-[#E8E1D2] rounded-full text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#93A28F] hover:text-[#1D231E]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#93A28F]" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#FAF6EE] border border-[#E8E1D2] rounded-full px-3 py-1.5 text-xs text-[#5A6659] font-medium focus:outline-none focus:border-[#E06C38] cursor-pointer"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === 'All' ? 'All Skill Levels' : diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Product Grid */}
        {filteredKits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E8E1D2] p-8">
            <Package className="w-12 h-12 text-[#93A28F] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#1D231E]">No items match your search</h3>
            <p className="text-xs text-[#5A6659] max-w-sm mx-auto mt-1 mb-4">
              Try adjusting your category filters or search keywords to find craft kits and supplies.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full bg-[#1D231E] text-white text-xs font-semibold hover:bg-[#323D34] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredKits.map((kit) => (
              <div
                key={kit.id}
                onClick={() => handleOpenDetail(kit)}
                className="bg-white rounded-3xl overflow-hidden border border-[#E8E1D2] shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group cursor-pointer"
              >
                {/* Status Badge */}
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
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#1D231E] shadow-xs">
                      {kit.difficulty}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#93A28F] uppercase tracking-wider block">
                        {kit.category}
                      </span>
                      {kit.rating && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#1D231E]">
                          <Star className="w-3.5 h-3.5 fill-[#E06C38] text-[#E06C38]" />
                          <span>{kit.rating.toFixed(1)}</span>
                          <span className="text-[#93A28F] font-normal">({kit.reviewsCount})</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-[#1D231E] mb-2 group-hover:text-[#E06C38] transition-colors line-clamp-1">
                      {kit.title}
                    </h3>
                    
                    <p className="text-xs text-[#5A6659] line-clamp-2 leading-relaxed mb-4">
                      {kit.description || 'Premium cross-stitch materials hand-selected for optimal stitch definition and heirloom longevity.'}
                    </p>

                    <div className="text-xl font-extrabold text-[#E06C38] mb-4">{kit.price}</div>

                    <div className="space-y-1.5 text-xs text-[#5A6659] pt-3 border-t border-[#F0EBE1]">
                      <span className="font-bold text-[#1D231E] block text-[11px] mb-1">Includes:</span>
                      {kit.includes.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#93A28F] shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                      {kit.includes.length > 3 && (
                        <span className="text-[10px] text-[#93A28F] font-medium block pl-5.5">
                          +{kit.includes.length - 3} more items included
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(kit);
                    }}
                    className="p-3 rounded-xl bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] transition-colors border border-[#E8E1D2] cursor-pointer"
                    title="Quick Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleAddToCart(kit, 1, e)}
                    className="flex-1 py-3 rounded-xl bg-[#E06C38] hover:bg-[#d05c28] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Kit Generation Callout */}
        <div className="mt-16 bg-white border border-[#E8E1D2] rounded-3xl p-8 lg:p-12 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E06C38] mb-2 block">
              Have a Custom Photo?
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#1D231E] mb-3">
              Order a Custom Heirloom Kit from Your Own Photo
            </h3>
            <p className="text-sm text-[#5B675A] leading-relaxed mb-6">
              Upload any personal memory — pets, weddings, landscapes, or family portraits. Our converter creates an exact DMC color chart, and our studio ships the custom cut cloth, pre-sorted floss skeins, and printed chart book right to you.
            </p>

            <button
              onClick={onOpenConverter}
              className="py-3 px-6 rounded-full bg-[#1D231E] hover:bg-[#323D34] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#E06C38]" />
              <span>Create My Custom Kit Now</span>
            </button>
          </div>

          <div className="w-48 h-48 rounded-2xl bg-[#FAF6EE] border border-[#E8E1D2] p-4 flex flex-col items-center justify-center text-center shrink-0 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#E8EFE5] text-[#3D5239] flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-[#1D231E]">Custom Photo Kit</span>
            <span className="text-[11px] text-[#E06C38] font-extrabold mt-0.5">$34.99</span>
            <span className="text-[10px] text-[#6B7869] mt-1">Includes all DMC threads</span>
          </div>
        </div>

      </div>

      {/* Product Detail Modal */}
      {selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF6EE] rounded-3xl max-w-2xl w-full shadow-2xl border border-[#E8E1D2] relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E1D2] bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#93A28F] bg-[#FAF6EE] px-3 py-1 rounded-full border border-[#E8E1D2]">
                  {selectedKit.category}
                </span>
                <span className="text-xs font-semibold text-[#3D5239] bg-[#E8EFE5] px-2.5 py-0.5 rounded-full border border-[#C5D3C2]">
                  {selectedKit.status}
                </span>
              </div>

              <button
                onClick={() => setSelectedKit(null)}
                className="p-2 text-[#6B7869] hover:text-[#1D231E] hover:bg-[#E8E1D2]/60 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Image */}
                <div className="sm:w-1/2 aspect-square rounded-2xl bg-white overflow-hidden border border-[#E8E1D2] shrink-0">
                  <img
                    src={selectedKit.imageUrl}
                    alt={selectedKit.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="sm:w-1/2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1D231E] mb-2">{selectedKit.title}</h3>
                    
                    {selectedKit.rating && (
                      <div className="flex items-center gap-1.5 text-xs text-[#1D231E] mb-3">
                        <div className="flex text-[#E06C38]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="font-bold">{selectedKit.rating}</span>
                        <span className="text-[#93A28F]">({selectedKit.reviewsCount} verified reviews)</span>
                      </div>
                    )}

                    <div className="text-2xl font-extrabold text-[#E06C38] mb-4">
                      {selectedKit.price}
                    </div>

                    <p className="text-xs text-[#5A6659] leading-relaxed mb-4">
                      {selectedKit.description}
                    </p>
                  </div>

                  {/* Quantity and Add to Cart */}
                  <div className="pt-4 border-t border-[#E8E1D2] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1D231E]">Quantity</span>
                      <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-xl border border-[#D5CBBA]">
                        <button
                          onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                          className="text-[#5A6659] hover:text-[#1D231E] p-1 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#1D231E] min-w-[20px] text-center">
                          {modalQuantity}
                        </span>
                        <button
                          onClick={() => setModalQuantity(modalQuantity + 1)}
                          className="text-[#5A6659] hover:text-[#1D231E] p-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleAddToCart(selectedKit, modalQuantity);
                        setSelectedKit(null);
                      }}
                      className="w-full py-3.5 bg-[#E06C38] hover:bg-[#d05c28] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart (${(selectedKit.numericPrice * modalQuantity).toFixed(2)})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inclusions & Specs */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8E1D2] space-y-4 shadow-xs">
                <div>
                  <h4 className="text-xs font-bold text-[#1D231E] uppercase tracking-wider mb-2.5">
                    What's Included in This Package:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3A4538]">
                    {selectedKit.includes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#93A28F] shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="pt-3 border-t border-[#F0EBE1] grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#93A28F] block">Thread Type:</span>
                    <strong className="text-[#1D231E] font-semibold">{selectedKit.threadBrand || 'DMC France'}</strong>
                  </div>
                  <div>
                    <span className="text-[#93A28F] block">Fabric Base:</span>
                    <strong className="text-[#1D231E] font-semibold">{selectedKit.clothType || 'Zweigart Aida'}</strong>
                  </div>
                  <div>
                    <span className="text-[#93A28F] block">Skill Level:</span>
                    <strong className="text-[#1D231E] font-semibold">{selectedKit.difficulty}</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

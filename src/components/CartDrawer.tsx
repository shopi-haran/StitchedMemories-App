import React, { useState } from 'react';
import { X, ShoppingBag, Sparkles, ArrowRight, Trash2, Plus, Minus, Package, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CheckoutModal } from './CheckoutModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConverter?: () => void;
  onNavigateToShop?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onOpenConverter,
  onNavigateToShop 
}) => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, cartCount } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  const freeShippingThreshold = 45;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Drawer Container */}
        <div className="relative w-full max-w-md bg-[#FAF6EE] h-full shadow-2xl flex flex-col z-10 border-l border-[#E8E1D2]">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#E8E1D2] flex items-center justify-between bg-white/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#3D5239] text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1D231E]">Your Craft Cart</h2>
                <span className="text-xs text-[#5A6659] font-medium">
                  {cartCount === 1 ? '1 item' : `${cartCount} items`}
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

          {/* Free Shipping Meter */}
          <div className="bg-[#E8EFE5] px-6 py-3 border-b border-[#D0DCD0]">
            <div className="flex items-center justify-between text-xs text-[#3D5239] mb-1.5 font-medium">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#3D5239]" />
                <span>
                  {remainingForFreeShipping === 0
                    ? '🎉 You unlocked FREE standard shipping!'
                    : `Add $${remainingForFreeShipping.toFixed(2)} more for FREE shipping`}
                </span>
              </div>
              <span className="font-bold">{Math.round(progressToFreeShipping)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#C5D3C2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3D5239] transition-all duration-300 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              /* Empty Cart View */
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white border border-[#E8E1D2] text-[#93A28F] flex items-center justify-center mx-auto shadow-xs">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D231E]">Your cart is empty</h3>
                  <p className="text-xs text-[#5A6659] max-w-xs mx-auto mt-1">
                    Explore our physical cross-stitch kits, DMC floss vaults, and artisan notions in the Marketplace.
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  {onNavigateToShop && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToShop();
                      }}
                      className="py-3 px-6 rounded-full bg-[#1D231E] hover:bg-[#323D34] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Browse Marketplace</span>
                    </button>
                  )}
                  {onOpenConverter && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenConverter();
                      }}
                      className="py-2.5 px-6 rounded-full bg-white hover:bg-[#FAF6EE] border border-[#D5CBBA] text-[#1D231E] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-[#E06C38]" />
                      <span>Convert a Photo</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Cart Items List */
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-[#E8E1D2] shadow-xs flex gap-3 items-start"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-xl bg-[#FAF6EE] overflow-hidden shrink-0 border border-[#E8E1D2]">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#93A28F] block">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#1D231E] truncate">{item.title}</h4>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[#93A28F] hover:text-[#C51E3A] transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0EBE1]">
                        {/* Quantity Adjuster */}
                        <div className="flex items-center gap-2 bg-[#FAF6EE] px-2 py-1 rounded-lg border border-[#E8E1D2]">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-[#5A6659] hover:text-[#1D231E] p-0.5 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#1D231E] min-w-[14px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-[#5A6659] hover:text-[#1D231E] p-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Total Price */}
                        <span className="text-xs font-bold text-[#E06C38]">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer with Subtotal & Checkout CTA */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-[#E8E1D2] bg-white/90 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#5A6659]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1D231E]">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5A6659]">
                  <span>Estimated Shipping</span>
                  <span>{remainingForFreeShipping === 0 ? <strong className="text-[#3D5239]">FREE</strong> : '$4.99'}</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3.5 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#70806E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3D5239]" />
                <span>Secure Checkout • 100% Satisfaction Guarantee</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          onClose();
        }}
      />
    </>
  );
};

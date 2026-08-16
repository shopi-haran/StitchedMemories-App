import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, CreditCard, Sparkles, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { cartItems, subtotal, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    fullName: 'Clara Oswald',
    email: 'clara.stitcher@craftmail.com',
    address: '42 Heritage Lane, Suite 3B',
    city: 'Portland',
    state: 'OR',
    zipCode: '97201',
    country: 'United States',
    paymentMethod: 'card',
    cardNumber: '•••• •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '•••',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!isOpen) return null;

  const shippingCost = subtotal >= 45 || subtotal === 0 ? 0 : 4.99;
  const estimatedTax = subtotal * 0.05;
  const finalTotal = subtotal + shippingCost + estimatedTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const generatedId = `STM-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setIsProcessing(false);
      setOrderComplete(true);
      clearCart();
      if (onSuccess) onSuccess();
    }, 1200);
  };

  const handleResetAndClose = () => {
    setOrderComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FAF6EE] rounded-3xl shadow-2xl border border-[#E8E1D2] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E8E1D2] bg-white/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3D5239] text-white flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D231E]">
                {orderComplete ? 'Order Confirmed!' : 'Express Craft Checkout'}
              </h2>
              <p className="text-xs text-[#6B7869]">
                {orderComplete ? 'Your artisan kits & supplies are in preparation' : 'Handcrafted kits & DMC threads delivered directly to your door'}
              </p>
            </div>
          </div>

          <button
            onClick={orderComplete ? handleResetAndClose : onClose}
            className="p-2 text-[#6B7869] hover:text-[#1D231E] hover:bg-[#E8E1D2]/60 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {orderComplete ? (
            /* Order Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E8EFE5] text-[#3D5239] border-2 border-[#C5D3C2] flex items-center justify-center mx-auto animate-scale-in">
                <CheckCircle2 className="w-8 h-8 text-[#3D5239]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#3D5239] bg-[#E8EFE5] px-3 py-1 rounded-full inline-block mb-2">
                  Order #{orderId}
                </span>
                <h3 className="text-2xl font-bold text-[#1D231E]">Thank you for your order!</h3>
                <p className="text-sm text-[#5A6659] max-w-md mx-auto mt-2">
                  We've sent an order confirmation and tracking details to <strong className="text-[#1D231E]">{formData.email}</strong>. Our studio team will carefully pack your threads and canvas within 1–2 business days.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-[#E8E1D2] text-left max-w-md mx-auto space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0EBE1]">
                  <span className="text-[#6B7869]">Shipping Destination:</span>
                  <span className="font-semibold text-[#1D231E]">{formData.address}, {formData.city}, {formData.state}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0EBE1]">
                  <span className="text-[#6B7869]">Delivery Estimate:</span>
                  <span className="font-semibold text-[#3D5239]">3–5 Business Days</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-[#1D231E]">Total Paid:</span>
                  <span className="text-[#E06C38]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleResetAndClose}
                  className="py-3 px-8 rounded-full bg-[#1D231E] hover:bg-[#323D34] text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Continue Browsing Marketplace
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Order Items Mini Summary */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E1D2] shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1D231E] pb-2 border-b border-[#F0EBE1]">
                  <span>Items in Shipment ({cartItems.length})</span>
                  <span className="text-[#E06C38]">${subtotal.toFixed(2)}</span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-[#1D231E]">{item.quantity}×</span>
                        <span className="text-[#3A4538] truncate">{item.title}</span>
                      </div>
                      <span className="font-semibold text-[#1D231E] shrink-0 ml-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-xs font-bold text-[#1D231E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#3D5239]" />
                  <span>1. Shipping Details</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">State / Prov</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#5A6659] block mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <h4 className="text-xs font-bold text-[#1D231E] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#3D5239]" />
                  <span>2. Payment & Protection</span>
                </h4>

                <div className="bg-white rounded-2xl p-4 border border-[#E8E1D2] space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-[#F0EBE1]">
                    <span className="font-semibold text-[#1D231E]">Credit / Debit Card</span>
                    <span className="text-[11px] text-[#70806E] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#3D5239]" />
                      256-bit Encrypted
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <label className="text-[10px] font-semibold text-[#5A6659] block mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-semibold text-[#5A6659] block mb-1">Expiration</label>
                      <input
                        type="text"
                        required
                        value={formData.cardExp}
                        onChange={(e) => setFormData({ ...formData, cardExp: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#5A6659] block mb-1">CVC</label>
                      <input
                        type="text"
                        required
                        value={formData.cardCvc}
                        onChange={(e) => setFormData({ ...formData, cardCvc: e.target.value })}
                        className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D5CBBA] rounded-xl text-xs text-[#1D231E] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-[#FAF6EE] rounded-2xl p-4 border border-[#E8E1D2] space-y-2 text-xs">
                <div className="flex justify-between text-[#5A6659]">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5A6659]">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? <strong className="text-[#3D5239]">FREE</strong> : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-[#5A6659]">
                  <span>Sales Tax (Est.)</span>
                  <span>${estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1D231E] pt-2 border-t border-[#E8E1D2]">
                  <span>Total</span>
                  <span className="text-[#E06C38]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!orderComplete && (
          <div className="p-5 border-t border-[#E8E1D2] bg-white/90 flex items-center justify-between">
            <div className="text-xs text-[#5A6659]">
              <span>Final Total: </span>
              <strong className="text-sm font-bold text-[#1D231E] ml-1">${finalTotal.toFixed(2)}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-[#5A6659] hover:text-[#1D231E] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || cartItems.length === 0}
                className="py-2.5 px-6 rounded-xl bg-[#E06C38] hover:bg-[#d05c28] disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <span>Place Order (${finalTotal.toFixed(2)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

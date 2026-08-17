import React, { useEffect, useState, useCallback } from 'react';
import { 
  Package, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Calendar, 
  FileText, 
  Radio, 
  Truck, 
  Check,
  SearchCheck,
  CreditCard,
  MapPin,
  Phone,
  ShieldCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  supabase, 
  fetchUserStitchOrders, 
  SupabaseStitchOrderRow, 
  acceptCustomerQuote 
} from '../../lib/supabase';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
}

interface CustomOrdersTabProps {
  user: UserProfile;
  onOpenConverter?: () => void;
}

export const ORDER_STAGES = [
  { id: 'received', label: 'Recived', icon: Package, description: 'Order received & queued' },
  { id: 'quoted', label: 'Quoted', icon: FileText, description: 'Studio pricing ready' },
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Payment verified & booked' },
  { id: 'in_progress', label: 'In Progress', icon: Sparkles, description: 'Artisan crafting in progress' },
  { id: 'quality_check', label: 'Quality Check', icon: SearchCheck, description: 'Inspection & finishing' },
  { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Dispatched with tracking' },
  { id: 'delivered', label: 'Delivered', icon: Check, description: 'Delivered to your door' },
];

export const getStageIndex = (statusRaw?: string): number => {
  if (!statusRaw) return 0;
  const s = statusRaw.toLowerCase().trim();

  // Stage 6: Delivered
  if (s === 'delivered' || s.includes('deliver') || s.includes('complete') || s.includes('done')) {
    return 6;
  }
  // Stage 5: Shipped
  if (s === 'shipped' || s.includes('ship') || s.includes('transit') || s.includes('dispatch')) {
    return 5;
  }
  // Stage 4: Quality Check
  if (s === 'quality_check' || s.includes('quality') || s.includes('qc') || s.includes('inspect') || s.includes('proof')) {
    return 4;
  }
  // Stage 3: In Progress
  if (s === 'in_progress' || s.includes('progress') || s.includes('stitch') || s.includes('craft') || s.includes('process')) {
    return 3;
  }
  // Stage 2: Confirmed (Only set when payment is received/verified)
  if (s === 'confirmed' || s === 'paid' || s.includes('payment_received')) {
    return 2;
  }
  // Stage 1: Quoted (Skip showing Awaiting Payment as separate visual step — remains at Quoted stage)
  if (s === 'quoted' || s === 'awaiting_payment' || s.includes('quote') || s.includes('awaiting')) {
    return 1;
  }
  // Stage 0: Recived (default for pending_quote, received, new)
  return 0;
};

export const CustomOrdersTab: React.FC<CustomOrdersTabProps> = ({ user, onOpenConverter }) => {
  const [orders, setOrders] = useState<SupabaseStitchOrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserStitchOrders(user.id, user.email);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load stitch orders:', err);
      setError('Unable to load custom orders from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.email]);

  useEffect(() => {
    loadOrders();

    // Supabase Realtime subscriptions for both orders and stitch_orders
    const channel = supabase
      .channel('custom_orders_tab_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => { loadOrders(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stitch_orders' },
        () => { loadOrders(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeActive(false);
        }
      });

    const handleLocalUpdate = () => { loadOrders(); };
    window.addEventListener('orderUpdated', handleLocalUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('orderUpdated', handleLocalUpdate);
    };
  }, [loadOrders]);

  const handleConfirmQuote = async (order: SupabaseStitchOrderRow) => {
    const targetId = order.raw_order_id || order.id;
    setConfirmingOrderId(targetId);
    try {
      // Per specification: Clicking "Confirm Order" moves status to 'awaiting_payment' (NOT 'confirmed')
      const res = await acceptCustomerQuote(targetId);
      if (res.success) {
        setFeedbackMsg({
          text: 'Quote accepted! Your order is now awaiting payment processing. Our studio team will reach out with payment confirmation.',
          type: 'success'
        });
        await loadOrders();
      } else {
        setFeedbackMsg({
          text: 'Unable to confirm order at this moment. Please try again.',
          type: 'info'
        });
      }
    } catch (err) {
      console.error('Error accepting quote:', err);
    } finally {
      setConfirmingOrderId(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const formatDate = (rawDateStr?: string) => {
    if (!rawDateStr) return 'Recent';
    try {
      const d = new Date(rawDateStr);
      if (isNaN(d.getTime())) return rawDateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return rawDateStr;
    }
  };

  const getStatusBadge = (statusRaw?: string) => {
    const s = (statusRaw || 'pending_quote').toLowerCase().trim();
    if (s === 'delivered' || s.includes('deliver')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'shipped' || s.includes('ship')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
          <Truck className="w-3.5 h-3.5 text-sky-600" />
          <span>Shipped</span>
        </span>
      );
    }
    if (s === 'quality_check' || s.includes('quality') || s.includes('qc')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <SearchCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Quality Check</span>
        </span>
      );
    }
    if (s === 'in_progress' || s.includes('progress')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>In Progress</span>
        </span>
      );
    }
    if (s === 'confirmed' || s === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (s === 'awaiting_payment') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Awaiting Payment</span>
        </span>
      );
    }
    if (s === 'quoted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
          <FileText className="w-3.5 h-3.5 text-orange-600" />
          <span>Quote Ready</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#1D231E] border border-[#E8E1D2]">
        <span className="w-2 h-2 rounded-full bg-[#E06C38]" />
        <span>Recived</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#93A28F]">
              My Orders
            </span>
            {isRealtimeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>Live Realtime Sync</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#1D231E]">Custom Orders & Quotes</h2>
          <p className="text-xs text-[#5A6659] mt-1">
            Track your bespoke kit orders and hand-stitched product requests through all 7 stages from quote to delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            title="Refresh custom orders"
            className="p-2 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#5A6659] rounded-xl border border-[#D5CDBC] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenConverter && (
            <button
              onClick={onOpenConverter}
              className="px-4 py-2 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convert Photo to Kit</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-3 animate-fadeIn ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 bg-[#FAF6EE] border border-[#E8E1D2] rounded-3xl animate-pulse space-y-4">
              <div className="h-5 bg-[#E8E1D2] rounded w-1/3" />
              <div className="h-16 bg-[#E8E1D2] rounded-2xl w-full" />
              <div className="h-4 bg-[#E8E1D2] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-full hover:bg-rose-700 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStageIndex = getStageIndex(order.status);
            const orderTitle = order.title || order.title_name || `Custom Order #${order.id}`;
            const details = order.request_details || {};
            const isQuotedState = (order.status || '').toLowerCase() === 'quoted';
            const isAwaitingPayment = (order.status || '').toLowerCase() === 'awaiting_payment';

            return (
              <div
                key={order.id}
                className="bg-white border border-[#E8E1D2] hover:border-[#D5CDBC] rounded-3xl p-6 sm:p-8 transition-all shadow-xs space-y-6"
              >
                
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E1D2]/80">
                  <div className="flex items-center gap-3.5">
                    {order.image_url ? (
                      <img
                        src={order.image_url}
                        alt={orderTitle}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E8E1D2] shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#E06C38]/10 text-[#E06C38] flex items-center justify-center shrink-0">
                        <Package className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1D231E] leading-snug">
                          {orderTitle}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B7869] mt-0.5">
                        <span className="font-mono font-semibold text-[#8A9588]">
                          Order #{String(order.raw_order_id || order.id).slice(-8)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8A9588]" />
                          {formatDate(order.created_at)}
                        </span>
                        {order.quoted_price !== undefined && Number(order.quoted_price) > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-[#1D231E]">
                              Quote: ${Number(order.quoted_price).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto shrink-0">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* 7-Stage Order Progress Tracker */}
                <div className="py-2">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-[#5A6659] uppercase tracking-wider">
                      Order Progress Tracker (7 Stages)
                    </p>
                    <span className="text-xs font-bold text-[#E06C38]">
                      Stage {currentStageIndex + 1} of 7: {ORDER_STAGES[currentStageIndex]?.label}
                    </span>
                  </div>

                  {/* Desktop / Tablet Stepper */}
                  <div className="relative hidden md:block">
                    {/* Connecting Line Background */}
                    <div className="absolute top-5 left-8 right-8 h-1 bg-[#E8E1D2] -z-0 rounded-full" />
                    
                    {/* Active Line Fill */}
                    <div 
                      className="absolute top-5 left-8 h-1 bg-[#E06C38] -z-0 transition-all duration-500 rounded-full"
                      style={{
                        width: `${(currentStageIndex / (ORDER_STAGES.length - 1)) * 92}%`
                      }}
                    />

                    {/* 7 Stage Nodes */}
                    <div className="grid grid-cols-7 gap-2 relative z-10">
                      {ORDER_STAGES.map((stage, idx) => {
                        const isPassed = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const StageIcon = stage.icon;

                        return (
                          <div 
                            key={stage.id}
                            className="flex flex-col items-center text-center group"
                          >
                            {/* Circle Node Icon */}
                            <div 
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 font-bold ${
                                isPassed
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : isCurrent
                                  ? 'bg-[#E06C38] text-white shadow-md ring-4 ring-[#E06C38]/20 scale-105'
                                  : 'bg-[#FAF6EE] text-[#8A9588] border border-[#E8E1D2]'
                              }`}
                            >
                              {isPassed ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <StageIcon className="w-4 h-4" />
                              )}
                            </div>

                            {/* Stage Label & Description */}
                            <div className="mt-2 w-full px-1">
                              <p className={`text-xs font-bold transition-colors truncate ${
                                isCurrent 
                                  ? 'text-[#E06C38]' 
                                  : isPassed 
                                  ? 'text-[#1D231E]' 
                                  : 'text-[#8A9588]'
                              }`}>
                                {stage.label}
                              </p>
                              <p className="text-[10px] text-[#6B7869] leading-tight mt-0.5 line-clamp-2">
                                {stage.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Stepper (Vertical Stack for small screens) */}
                  <div className="md:hidden space-y-2">
                    {ORDER_STAGES.map((stage, idx) => {
                      const isPassed = idx < currentStageIndex;
                      const isCurrent = idx === currentStageIndex;
                      const StageIcon = stage.icon;

                      return (
                        <div 
                          key={stage.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-[#FAF6EE] border-[#E06C38]/40 shadow-xs'
                              : isPassed
                              ? 'bg-white border-[#E8E1D2]'
                              : 'bg-[#FAF6EE]/40 border-transparent opacity-60'
                          }`}
                        >
                          <div 
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                              isPassed
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-[#E06C38] text-white ring-2 ring-[#E06C38]/20'
                                : 'bg-[#FAF6EE] text-[#8A9588] border border-[#E8E1D2]'
                            }`}
                          >
                            {isPassed ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <StageIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold ${
                              isCurrent ? 'text-[#E06C38]' : isPassed ? 'text-[#1D231E]' : 'text-[#8A9588]'
                            }`}>
                              {stage.label}
                            </p>
                            <p className="text-[10px] text-[#6B7869] truncate">
                              {stage.description}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-[#E06C38] bg-[#E06C38]/10 px-2 py-0.5 rounded-full shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quoted State Action Card (When status is 'quoted') */}
                {isQuotedState && (
                  <div className="p-5 bg-gradient-to-r from-[#FAF6EE] to-[#FFF8F0] border-2 border-[#E06C38]/30 rounded-3xl space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E06C38] text-white mb-1.5">
                          <Sparkles className="w-3 h-3" /> Quote Ready for Approval
                        </span>
                        <h4 className="text-base font-bold text-[#1D231E]">
                          Studio Pricing & Delivery Quotation
                        </h4>
                        <p className="text-xs text-[#5A6659] mt-0.5">
                          Review your handcrafted kit quotation. Click Confirm Order to proceed with your booking.
                        </p>
                      </div>

                      {order.quoted_price !== undefined && Number(order.quoted_price) > 0 && (
                        <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#E8E1D2] text-right shrink-0 shadow-2xs">
                          <span className="text-[10px] font-bold text-[#8A9588] uppercase tracking-wider block">
                            Quoted Total
                          </span>
                          <span className="text-xl font-black text-[#1D231E]">
                            ${Number(order.quoted_price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {order.status_note && (
                      <div className="p-3.5 bg-white rounded-2xl border border-[#E8E1D2]/80 text-xs text-[#1D231E]">
                        <p className="font-bold text-[#556653] text-[11px] mb-0.5">Studio Artisan Note:</p>
                        <p className="leading-relaxed">{order.status_note}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <p className="text-[11px] text-[#6B7869] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#556653]" />
                        <span>Includes premium DMC floss, Zweigart Aida & tracked shipping.</span>
                      </p>
                      
                      <button
                        onClick={() => handleConfirmQuote(order)}
                        disabled={confirmingOrderId === (order.raw_order_id || order.id)}
                        className="px-5 py-2.5 bg-[#1D231E] hover:bg-[#323D34] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
                      >
                        {confirmingOrderId === (order.raw_order_id || order.id) ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Confirming Order...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#E06C38]" />
                            <span>Confirm Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Awaiting Payment State Banner */}
                {isAwaitingPayment && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Quote Confirmed — Awaiting Payment Verification
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Thank you for confirming your quote! The payment gateway (PayHere) is currently in setup. Our studio team is preparing your order materials and will confirm once verified.
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Details & Delivery Info Grid */}
                <div className="pt-4 border-t border-[#E8E1D2]/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Status / Artisan Note */}
                  {order.status_note && !isQuotedState && (
                    <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2] flex items-start gap-3">
                      <FileText className="w-4 h-4 text-[#E06C38] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block">
                          Studio Update
                        </span>
                        <p className="text-xs text-[#1D231E] mt-0.5 leading-relaxed font-medium">
                          {order.status_note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Estimated Turnaround / Completion */}
                  {order.estimated_completion && (
                    <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2] flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-[#556653] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block">
                          Estimated Turnaround
                        </span>
                        <p className="text-xs font-bold text-[#1D231E] mt-0.5">
                          {order.estimated_completion}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address & Customer Details */}
                  {(details.delivery_address || details.phone_number || details.customer_phone) && (
                    <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2] flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#8A9588] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block">
                          Destination Address
                        </span>
                        {details.delivery_address && (
                          <p className="text-xs text-[#1D231E] mt-0.5 leading-relaxed font-medium line-clamp-2">
                            {details.delivery_address}
                          </p>
                        )}
                        {(details.phone_number || details.customer_phone) && (
                          <p className="text-[11px] text-[#6B7869] mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{details.phone_number || details.customer_phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tracking Number if Shipped */}
                  {order.tracking_number && (
                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-start gap-3">
                      <Truck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 block">
                          Courier Tracking
                        </span>
                        <p className="text-xs font-mono font-bold text-sky-950 mt-0.5">
                          {order.tracking_number}
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 border-2 border-dashed border-[#E8E1D2] rounded-3xl bg-[#FAF6EE]/50 text-center">
          <div className="w-12 h-12 bg-[#E06C38]/10 text-[#E06C38] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#1D231E]">No Custom Orders Yet</h3>
          <p className="text-xs text-[#5A6659] max-w-md mx-auto mt-1 mb-5 leading-relaxed">
            When you request a custom kit from the photo converter or order a bespoke hand-stitched piece, you can track its 7-stage progress live right here.
          </p>
          {onOpenConverter && (
            <button
              onClick={onOpenConverter}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E06C38] text-white text-xs font-bold rounded-full hover:bg-[#d05c28] transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Custom Order Request</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
};


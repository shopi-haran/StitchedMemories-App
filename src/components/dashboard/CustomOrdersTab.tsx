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
  SearchCheck
} from 'lucide-react';
import { supabase, fetchUserStitchOrders, SupabaseStitchOrderRow } from '../../lib/supabase';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
}

interface CustomOrdersTabProps {
  user: UserProfile;
  onOpenConverter?: () => void;
}

const STAGES = [
  { id: 'received', label: 'Received', icon: Package, description: 'Order received & artwork queued' },
  { id: 'in_progress', label: 'In Progress', icon: Sparkles, description: 'Artisan stitching in progress' },
  { id: 'quality_check', label: 'Quality Check', icon: SearchCheck, description: 'Inspection & proof verification' },
  { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Dispatched with tracking' },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Delivered to your doorstep' },
];

export const CustomOrdersTab: React.FC<CustomOrdersTabProps> = ({ user, onOpenConverter }) => {
  const [orders, setOrders] = useState<SupabaseStitchOrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

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

    // Supabase Realtime subscription for live updates without page refresh
    const channel = supabase
      .channel('custom_stitch_orders_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stitch_orders',
        },
        (_payload) => {
          // Live reload when status, status_note, or estimated_completion changes
          loadOrders();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const getStageIndex = (statusRaw?: string): number => {
    if (!statusRaw) return 0;
    const s = statusRaw.toLowerCase().trim();

    if (s.includes('deliver') || s.includes('complete') || s.includes('done')) return 4;
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) return 3;
    if (s.includes('quality') || s.includes('qc') || s.includes('inspect') || s.includes('review')) return 2;
    if (s.includes('progress') || s.includes('stitch') || s.includes('craft') || s.includes('process')) return 1;
    if (s.includes('receive') || s.includes('pending') || s.includes('new') || s.includes('create')) return 0;

    return 0;
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

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#93A28F]">
              Bespoke Requests
            </span>
            {isRealtimeActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>Live Realtime Sync</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#1D231E]">Custom Orders</h2>
          <p className="text-xs text-[#5A6659] mt-1">
            Track your custom embroidery requests, live artisan proofing stages, and physical hoop creation status.
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
              <span>Request Custom Hoop</span>
            </button>
          )}
        </div>
      </div>

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
            const orderTitle = order.title || order.title_name || `Bespoke Hoop Order #${order.id}`;

            return (
              <div
                key={order.id}
                className="bg-white border border-[#E8E1D2] hover:border-[#D5CDBC] rounded-3xl p-6 sm:p-8 transition-all shadow-xs space-y-6"
              >
                
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E1D2]/80">
                  <div className="flex items-center gap-3">
                    {order.image_url ? (
                      <img
                        src={order.image_url}
                        alt={orderTitle}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E8E1D2] shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#E06C38]/10 text-[#E06C38] flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-[#1D231E] leading-snug">
                        {orderTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6B7869] mt-0.5">
                        <span className="font-mono font-semibold text-[#8A9588]">Order #{String(order.id).slice(-8)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8A9588]" />
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF6EE] text-[#1D231E] border border-[#E8E1D2]">
                      <span className="w-2 h-2 rounded-full bg-[#E06C38]" />
                      <span className="capitalize">{order.status || 'Received'}</span>
                    </span>
                  </div>
                </div>

                {/* Horizontal Progress Tracker (5 Stages) */}
                <div className="py-2">
                  <p className="text-xs font-bold text-[#5A6659] uppercase tracking-wider mb-4">
                    Stage Progress Tracker
                  </p>

                  <div className="relative">
                    
                    {/* Connecting Line background */}
                    <div className="absolute top-5 left-6 right-6 h-1 bg-[#E8E1D2] hidden sm:block -z-0 rounded-full" />
                    
                    {/* Active Line Fill */}
                    <div 
                      className="absolute top-5 left-6 h-1 bg-[#E06C38] hidden sm:block -z-0 transition-all duration-500 rounded-full"
                      style={{
                        width: `${(currentStageIndex / (STAGES.length - 1)) * 90}%`
                      }}
                    />

                    {/* Stage Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                      {STAGES.map((stage, idx) => {
                        const isPassed = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        const StageIcon = stage.icon;

                        return (
                          <div 
                            key={stage.id}
                            className={`flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center p-3 sm:p-0 rounded-2xl sm:bg-transparent ${
                              isCurrent ? 'bg-[#FAF6EE] border sm:border-0 border-[#E8E1D2]' : ''
                            }`}
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

                            {/* Label & Description */}
                            <div className="min-w-0">
                              <p className={`text-xs font-bold transition-colors ${
                                isCurrent 
                                  ? 'text-[#E06C38]' 
                                  : isPassed 
                                  ? 'text-[#1D231E]' 
                                  : 'text-[#8A9588]'
                              }`}>
                                {stage.label}
                              </p>
                              <p className="text-[10px] text-[#6B7869] leading-tight hidden sm:block mt-0.5">
                                {stage.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* Status Note & Estimated Completion beneath */}
                {(order.status_note || order.estimated_completion) && (
                  <div className="pt-4 border-t border-[#E8E1D2]/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {order.status_note && (
                      <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2] flex items-start gap-3">
                        <FileText className="w-4 h-4 text-[#E06C38] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block">
                            Artisan Status Note
                          </span>
                          <p className="text-xs text-[#1D231E] mt-0.5 leading-relaxed font-medium">
                            {order.status_note}
                          </p>
                        </div>
                      </div>
                    )}

                    {order.estimated_completion && (
                      <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E8E1D2] flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-[#556653] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block">
                            Estimated Completion
                          </span>
                          <p className="text-xs font-bold text-[#1D231E] mt-0.5">
                            {order.estimated_completion}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                )}

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
            When you request custom hand-stitched portrait hoops or bespoke embroidery proofs, you can track their 5-stage progress live right here.
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

import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  DollarSign,
  Send,
  Filter,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { 
  supabase, 
  fetchAllAdminOrders, 
  updateAdminOrderStatus, 
  markOrderAsPaidTest, 
  SupabaseStitchOrderRow 
} from '../lib/supabase';
import { ORDER_STAGES, getStageIndex } from '../components/dashboard/CustomOrdersTab';

interface AdminQuotesPageProps {
  onGoHome: () => void;
}

export const AdminQuotesPage: React.FC<AdminQuotesPageProps> = ({ onGoHome }) => {
  const [orders, setOrders] = useState<SupabaseStitchOrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Editing state per order
  const [editingOrderId, setEditingOrderId] = useState<string | number | null>(null);
  const [quotePrice, setQuotePrice] = useState<string>('');
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
      setError('Unable to load orders from Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('admin_quotes_realtime_sync')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleStartEdit = (order: SupabaseStitchOrderRow) => {
    setEditingOrderId(order.id);
    setQuotePrice(order.quoted_price ? String(order.quoted_price) : (order.total_amount ? String(order.total_amount) : '45.00'));
    setEstimatedCompletion(order.estimated_completion || '5-7 business days');
    setStatusNote(order.status_note || 'Includes premium DMC cotton floss, Zweigart 14ct Aida, needles & tracked shipping.');
    setTrackingNumber(order.tracking_number || '');
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
  };

  // Submit quote pricing -> moves status to 'quoted'
  const handleSubmitQuote = async (order: SupabaseStitchOrderRow) => {
    setIsSaving(true);
    try {
      const priceNum = parseFloat(quotePrice) || 0;
      const res = await updateAdminOrderStatus(order.raw_order_id || order.id, {
        fulfillment_status: 'quoted',
        payment_status: 'pending_payment',
        quoted_price: priceNum,
        total_amount: priceNum,
        estimated_completion: estimatedCompletion.trim(),
        status_note: statusNote.trim() || 'Your custom quote is ready! Review the quote details and click Confirm Order to proceed.',
      });

      if (res.success) {
        showToast(`Quote for Order #${String(order.id).slice(-8)} submitted successfully ($${priceNum.toFixed(2)})! Status set to 'quoted'.`);
        setEditingOrderId(null);
        await loadOrders();
      } else {
        alert('Failed to update quote. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting quote:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Test-only action: Mark as Paid (test) -> moves status to 'confirmed'
  const handleMarkAsPaidTest = async (order: SupabaseStitchOrderRow) => {
    if (!window.confirm(`[TEST-ONLY ACTION]\n\nMark Order #${String(order.id).slice(-8)} as Paid (test mode)?\nThis will transition the order fulfillment status to 'confirmed' and payment status to 'paid'.`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await markOrderAsPaidTest(order.raw_order_id || order.id);
      if (res.success) {
        showToast(`[TEST ACTION SUCCESS] Order #${String(order.id).slice(-8)} marked as PAID. Status moved to 'confirmed'.`);
        await loadOrders();
      } else {
        alert('Failed to update order status.');
      }
    } catch (err) {
      console.error('Error in test paid action:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Move status to any arbitrary stage
  const handleUpdateStatus = async (order: SupabaseStitchOrderRow, nextStatus: string, defaultNote?: string) => {
    setIsSaving(true);
    try {
      const updates: any = {
        fulfillment_status: nextStatus,
      };

      if (defaultNote) {
        updates.status_note = defaultNote;
      }
      if (nextStatus === 'shipped' && trackingNumber) {
        updates.tracking_number = trackingNumber;
      }

      const res = await updateAdminOrderStatus(order.raw_order_id || order.id, updates);
      if (res.success) {
        showToast(`Order status updated to: ${nextStatus.toUpperCase()}`);
        setEditingOrderId(null);
        await loadOrders();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const s = (order.fulfillment_status || order.status || 'pending_quote').toLowerCase();
    
    // Status tab filter
    if (activeFilter === 'pending_quote' && s !== 'pending_quote' && s !== 'received' && s !== 'new') return false;
    if (activeFilter === 'quoted' && s !== 'quoted') return false;
    if (activeFilter === 'awaiting_payment' && s !== 'awaiting_payment') return false;
    if (activeFilter === 'confirmed' && s !== 'confirmed' && s !== 'paid') return false;
    if (activeFilter === 'in_progress' && s !== 'in_progress') return false;
    if (activeFilter === 'quality_check' && s !== 'quality_check') return false;
    if (activeFilter === 'shipped' && s !== 'shipped') return false;
    if (activeFilter === 'delivered' && s !== 'delivered') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = String(order.id).toLowerCase().includes(q);
      const userMatch = String(order.user_id || '').toLowerCase().includes(q);
      const titleMatch = String(order.title || '').toLowerCase().includes(q);
      const detailsMatch = JSON.stringify(order.request_details || {}).toLowerCase().includes(q);
      return idMatch || userMatch || titleMatch || detailsMatch;
    }

    return true;
  });

  const getFilterCount = (filterKey: string) => {
    if (filterKey === 'all') return orders.length;
    return orders.filter((o) => {
      const s = (o.fulfillment_status || o.status || 'pending_quote').toLowerCase();
      if (filterKey === 'pending_quote') return s === 'pending_quote' || s === 'received' || s === 'new';
      if (filterKey === 'quoted') return s === 'quoted';
      if (filterKey === 'awaiting_payment') return s === 'awaiting_payment';
      if (filterKey === 'confirmed') return s === 'confirmed' || s === 'paid';
      if (filterKey === 'in_progress') return s === 'in_progress';
      if (filterKey === 'quality_check') return s === 'quality_check';
      if (filterKey === 'shipped') return s === 'shipped';
      if (filterKey === 'delivered') return s === 'delivered';
      return false;
    }).length;
  };

  const formatDate = (rawDateStr?: string) => {
    if (!rawDateStr) return 'Recent';
    try {
      const d = new Date(rawDateStr);
      if (isNaN(d.getTime())) return rawDateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return rawDateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1D231E] pb-24">
      
      {/* Top Banner Header */}
      <div className="bg-[#1D231E] text-white py-8 px-6 lg:px-12 border-b border-[#2D382E]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A28F] hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Storefront</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E06C38] text-white font-bold text-sm flex items-center justify-center shadow-md">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Studio Admin: Quotes & Order Management
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E06C38]/20 text-[#E06C38] border border-[#E06C38]/30">
                    Admin Portal (/admin/quotes)
                  </span>
                </div>
                <p className="text-xs text-[#A2B0A0]">
                  Manage incoming bespoke kit requests, submit official price quotes, trigger test payments, and update production stages.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRealtimeActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Supabase Live Sync</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Syncing...</span>
              </span>
            )}

            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh ({orders.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-6">
        
        {/* Toast Feedback */}
        {actionSuccessMsg && (
          <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="flex-1">{actionSuccessMsg}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#E8E1D2] rounded-3xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending_quote', label: '1. Recived / Pending' },
                { id: 'quoted', label: '2. Quoted' },
                { id: 'awaiting_payment', label: 'Awaiting Payment' },
                { id: 'confirmed', label: '3. Confirmed' },
                { id: 'in_progress', label: '4. In Progress' },
                { id: 'quality_check', label: '5. Quality Check' },
                { id: 'shipped', label: '6. Shipped' },
                { id: 'delivered', label: '7. Delivered' },
              ].map((tab) => {
                const count = getFilterCount(tab.id);
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#1D231E] text-white shadow-xs'
                        : 'bg-[#FAF6EE] text-[#5A6659] hover:bg-[#E8E1D2] hover:text-[#1D231E]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-[#E06C38] text-white' : 'bg-[#E8E1D2] text-[#556653]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-[#8A9588] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, email, ID..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF6EE] border border-[#E8E1D2] rounded-full text-xs text-[#1D231E] placeholder:text-[#8A9588] focus:outline-none focus:border-[#E06C38]"
              />
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-8 bg-white border border-[#E8E1D2] rounded-3xl animate-pulse space-y-4">
                <div className="h-6 bg-[#E8E1D2] rounded w-1/4" />
                <div className="h-20 bg-[#FAF6EE] rounded-2xl w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-rose-800">{error}</p>
            <button
              onClick={loadOrders}
              className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-full hover:bg-rose-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const details = order.request_details || {};
              const currentStatus = (order.fulfillment_status || order.status || 'pending_quote').toLowerCase();
              const stageIdx = getStageIndex(currentStatus);
              const isEditing = editingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E8E1D2] hover:border-[#D5CDBC] rounded-3xl p-6 sm:p-8 transition-all shadow-xs space-y-6"
                >
                  {/* Top Order Information */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E8E1D2]">
                    <div className="flex items-start gap-4">
                      {order.image_url ? (
                        <a 
                          href={order.image_url} 
                          target="_blank" 
                          rel="noreferrer"
                          title="Click to view full photo"
                          className="shrink-0 group relative block"
                        >
                          <img
                            src={order.image_url}
                            alt="Reference"
                            className="w-16 h-16 rounded-2xl object-cover border border-[#E8E1D2] shadow-2xs group-hover:opacity-90 transition-opacity"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </a>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#FAF6EE] border border-[#E8E1D2] text-[#E06C38] flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-[#1D231E]">
                            {order.title || `Custom Order #${order.id}`}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FAF6EE] text-[#556653] border border-[#E8E1D2]">
                            {order.order_type || 'custom_request'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7869]">
                          <span className="font-mono font-bold text-[#1D231E]">
                            ID: {String(order.raw_order_id || order.id)}
                          </span>
                          <span>•</span>
                          <span>Customer: <strong className="text-[#1D231E]">{order.user_id}</strong></span>
                          <span>•</span>
                          <span>Received: {formatDate(order.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Test Badge */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        currentStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        currentStatus === 'shipped' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                        currentStatus === 'quality_check' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        currentStatus === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        currentStatus === 'confirmed' || currentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        currentStatus === 'awaiting_payment' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                        currentStatus === 'quoted' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        'bg-[#FAF6EE] text-[#1D231E] border-[#E8E1D2]'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span className="capitalize">{currentStatus.replace(/_/g, ' ')}</span>
                      </span>

                      {/* Manual Stage Edit button */}
                      <button
                        onClick={() => isEditing ? handleCancelEdit() : handleStartEdit(order)}
                        className="px-3 py-1 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] text-xs font-bold rounded-full border border-[#D5CDBC] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-[#E06C38]" />
                        <span>{isEditing ? 'Close Edit' : 'Edit Quote / Status'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Specifications Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6EE] p-4 rounded-2xl border border-[#E8E1D2] text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8A9588] block">Size</span>
                      <span className="font-bold text-[#1D231E]">{details.size || 'Standard (8" × 10")'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8A9588] block">DMC Colors</span>
                      <span className="font-bold text-[#1D231E]">{details.color_count || details.colors || '24 Colors'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8A9588] block">Stitch Count</span>
                      <span className="font-bold text-[#1D231E]">{details.stitch_count ? `${Number(details.stitch_count).toLocaleString()} sts` : 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8A9588] block">Style / Framing</span>
                      <span className="font-bold text-[#1D231E]">
                        {details.framed !== undefined ? (details.framed ? 'Framed & Matted' : 'Unframed Fabric') : (details.product_style || 'Custom Kit')}
                      </span>
                    </div>
                  </div>

                  {/* Customer Address & Notes */}
                  {(details.delivery_address || details.customer_notes || details.phone_number || details.customer_phone) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {details.delivery_address && (
                        <div className="p-3.5 bg-white border border-[#E8E1D2] rounded-2xl flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-[#8A9588] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#8A9588] block">Delivery Address</span>
                            <p className="text-[#1D231E] font-medium leading-relaxed mt-0.5">{details.delivery_address}</p>
                            {(details.phone_number || details.customer_phone) && (
                              <p className="text-[#6B7869] mt-1 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3" />
                                <span>{details.phone_number || details.customer_phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {details.customer_notes && (
                        <div className="p-3.5 bg-white border border-[#E8E1D2] rounded-2xl flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-[#8A9588] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#8A9588] block">Customer Special Notes</span>
                            <p className="text-[#1D231E] italic mt-0.5 leading-relaxed">"{details.customer_notes}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7-Stage Tracker Mini Stepper Preview */}
                  <div className="py-2 border-t border-[#E8E1D2]/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A28F] block mb-2">
                      Live Customer Stepper: Stage {stageIdx + 1} of 7 ({ORDER_STAGES[stageIdx]?.label})
                    </span>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {ORDER_STAGES.map((st, i) => (
                        <div 
                          key={st.id} 
                          className={`p-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                            i === stageIdx 
                              ? 'bg-[#E06C38] text-white shadow-xs' 
                              : i < stageIdx 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-[#FAF6EE] text-[#8A9588]'
                          }`}
                        >
                          {st.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Admin Actions & Edit Panel */}
                  <div className="pt-4 border-t border-[#E8E1D2] space-y-4">
                    
                    {/* Editing Form (When active) */}
                    {isEditing ? (
                      <div className="p-5 bg-[#FAF6EE] border-2 border-[#E06C38]/40 rounded-3xl space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1D231E] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#E06C38]" />
                            <span>Edit Pricing Quote & Production Parameters</span>
                          </h4>
                          <span className="text-[10px] text-[#8A9588]">Order #{String(order.id).slice(-8)}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#556653] block mb-1">
                              Quoted Price ($ USD)
                            </label>
                            <div className="relative">
                              <DollarSign className="w-3.5 h-3.5 text-[#8A9588] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="number"
                                step="0.50"
                                value={quotePrice}
                                onChange={(e) => setQuotePrice(e.target.value)}
                                placeholder="45.00"
                                className="w-full pl-8 pr-3 py-2 bg-white border border-[#E8E1D2] rounded-xl text-xs font-bold text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#556653] block mb-1">
                              Estimated Turnaround
                            </label>
                            <input
                              type="text"
                              value={estimatedCompletion}
                              onChange={(e) => setEstimatedCompletion(e.target.value)}
                              placeholder="5-7 business days"
                              className="w-full px-3 py-2 bg-white border border-[#E8E1D2] rounded-xl text-xs font-medium text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#556653] block mb-1">
                              Tracking Number (if Shipped)
                            </label>
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="DHL-84920489"
                              className="w-full px-3 py-2 bg-white border border-[#E8E1D2] rounded-xl text-xs font-mono text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[#556653] block mb-1">
                            Artisan Note / Quote Message to Customer
                          </label>
                          <textarea
                            rows={2}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder="Write message explaining the quote or current progress..."
                            className="w-full p-3 bg-white border border-[#E8E1D2] rounded-xl text-xs text-[#1D231E] focus:outline-none focus:border-[#E06C38]"
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-white text-[#5A6659] hover:bg-[#FAF6EE] text-xs font-bold rounded-full border border-[#E8E1D2] cursor-pointer"
                          >
                            Cancel
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubmitQuote(order)}
                              disabled={isSaving}
                              className="px-5 py-2 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Save & Submit Quote (Status: Quoted)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Action Bar (Quick Stage Advancers + Test Paid Button) */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      
                      {/* Left: Primary Stage Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* 1. If Pending -> Quick Quote Submit */}
                        {(currentStatus === 'pending_quote' || currentStatus === 'received') && !isEditing && (
                          <button
                            onClick={() => handleStartEdit(order)}
                            className="px-4 py-2 bg-[#E06C38] hover:bg-[#d05c28] text-white text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Submit Pricing Quote</span>
                          </button>
                        )}

                        {/* 2. Manual Stage Buttons for Requirements 4 */}
                        <button
                          onClick={() => handleUpdateStatus(order, 'in_progress', 'Artisan stitching and material preparation is actively in progress.')}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] text-xs font-bold rounded-full border border-[#D5CDBC] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Set "In Progress"</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(order, 'quality_check', 'Undergoing master embroiderer tensioning, mounting & final quality inspection.')}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] text-xs font-bold rounded-full border border-[#D5CDBC] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <SearchCheck className="w-3 h-3 text-purple-600" />
                          <span>Set "Quality Check"</span>
                        </button>

                        <button
                          onClick={() => {
                            const track = prompt('Enter courier tracking number (optional):', order.tracking_number || 'DHL-948201');
                            if (track !== null) {
                              setTrackingNumber(track);
                              handleUpdateStatus(order, 'shipped', track ? `Dispatched with tracking: ${track}` : 'Dispatched with courier tracking.');
                            }
                          }}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] text-xs font-bold rounded-full border border-[#D5CDBC] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3 text-sky-600" />
                          <span>Set "Shipped"</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(order, 'delivered', 'Order successfully delivered to customer destination.')}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-[#E8E1D2] text-[#1D231E] text-xs font-bold rounded-full border border-[#D5CDBC] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Set "Delivered"</span>
                        </button>
                      </div>

                      {/* Right: Requirement 3 Manual "Mark as Paid (test)" Button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkAsPaidTest(order)}
                          disabled={isSaving}
                          title="Temporary testing trigger before PayHere is wired in. Sets fulfillment_status to 'confirmed' and payment_status to 'paid'."
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-emerald-600"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Mark as Paid (test)</span>
                          <span className="px-1.5 py-0.2 bg-emerald-950/60 rounded text-[9px] uppercase tracking-wider text-emerald-200">
                            TEST-ONLY
                          </span>
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 border-2 border-dashed border-[#E8E1D2] rounded-3xl bg-white text-center space-y-3">
            <Package className="w-10 h-10 text-[#8A9588] mx-auto" />
            <h3 className="text-base font-bold text-[#1D231E]">No Orders Found</h3>
            <p className="text-xs text-[#5A6659] max-w-sm mx-auto">
              No orders matched the selected status filter ({activeFilter}) or search query.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

import { createClient } from '@supabase/supabase-js';
import { BlogPost, ContentSection } from '../types';
import { createScaledThumbnail, PatternConfig } from '../utils/patternEngine';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://flwkfgtjkgcluuphibyp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd2tmZ3Rqa2djbHV1cGhpYnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODA0MzgsImV4cCI6MjEwMTc1NjQzOH0.5OCxUr0IU_TSSVuNSHS7UAe-7kFoPEdl77pYWLT4Ir0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface SupabaseBlogPostRow {
  id: string | number;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  published_at: string;
  cover_image_url: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  content_sections?: ContentSection[];
}

export function mapRowToBlogPost(row: SupabaseBlogPostRow): BlogPost {
  let dateFormatted = row.published_at || '';
  if (row.published_at) {
    try {
      const d = new Date(row.published_at);
      if (!isNaN(d.getTime())) {
        dateFormatted = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      dateFormatted = row.published_at;
    }
  }

  const authorObj = typeof row.author === 'string' 
    ? (() => { try { return JSON.parse(row.author); } catch { return { name: row.author, avatarUrl: '' }; } })()
    : row.author || { name: 'Elena Rostova', avatarUrl: '' };

  const rawSections = row.content_sections || (row as any).contentSections;
  const contentSections = Array.isArray(rawSections) ? rawSections : [];

  return {
    id: String(row.id),
    title: row.title || '',
    excerpt: row.excerpt || '',
    category: row.category || 'Guide & Tips',
    readTime: row.read_time || (row as any).readTime || '',
    date: dateFormatted,
    imageUrl: row.cover_image_url || (row as any).imageUrl || '',
    author: {
      name: authorObj?.name || 'Author',
      avatarUrl: authorObj?.avatarUrl || '',
    },
    contentSections: contentSections,
  };
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog_posts from Supabase:', error);
    throw error;
  }

  return (data || []).map(mapRowToBlogPost);
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching blog_post by id from Supabase:', error);
    return null;
  }

  return mapRowToBlogPost(data);
}

export interface SupabaseConversionJobRow {
  id: string | number;
  user_id: string;
  title?: string;
  filename?: string;
  thumbnail_url?: string;
  original_image_url?: string;
  pattern_pdf_url?: string;
  pattern_preview_url?: string;
  pattern_config?: PatternConfig | any;
  status: 'complete' | 'processing' | 'failed' | 'pending' | string;
  created_at: string;
  grid_width?: number;
  grid_height?: number;
  colors_count?: number;
  [key: string]: any;
}

/**
 * Resolve the PatternConfig object for a given conversion job.
 * Checks job.pattern_config, then localStorage fallback, then returns sane defaults.
 */
export function getJobPatternConfig(job: SupabaseConversionJobRow): PatternConfig {
  let rawConfig = job.pattern_config;
  if (typeof rawConfig === 'string') {
    try {
      rawConfig = JSON.parse(rawConfig);
    } catch {}
  }

  if (!rawConfig || typeof rawConfig !== 'object') {
    try {
      const cached = localStorage.getItem(`user_pattern_config_${job.title}`);
      if (cached) rawConfig = JSON.parse(cached);
    } catch {}
  }

  return {
    gridWidth: rawConfig?.gridWidth || job.grid_width || 60,
    fabricCount: rawConfig?.fabricCount || 14,
    colorLimit: rawConfig?.colorLimit || job.colors_count || 18,
    dithering: rawConfig?.dithering || 'floyd-steinberg',
    brightness: rawConfig?.brightness ?? 0,
    contrast: rawConfig?.contrast ?? 0,
    saturation: rawConfig?.saturation ?? 0,
    showGridLines: rawConfig?.showGridLines ?? true,
    showSymbols: rawConfig?.showSymbols ?? true,
    brand: rawConfig?.brand || 'DMC',
    isAdFree: rawConfig?.isAdFree ?? true,
    planTier: rawConfig?.planTier || 'studio',
  };
}

export async function fetchUserConversionJobs(
  userId?: string,
  userEmail?: string,
  page: number = 0,
  pageSize: number = 10
): Promise<{ jobs: SupabaseConversionJobRow[]; totalCount: number }> {
  const fromIndex = page * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let supabaseJobs: SupabaseConversionJobRow[] = [];
  let count = 0;

  try {
    let query = supabase
      .from('conversion_jobs')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_id', userEmail);
    }

    query = query.order('created_at', { ascending: false }).range(fromIndex, toIndex);

    const res = await query;
    if (res.data && Array.isArray(res.data)) {
      supabaseJobs = res.data as SupabaseConversionJobRow[];
      count = res.count || supabaseJobs.length;
    }
  } catch (err) {
    console.error('Error querying Supabase conversion_jobs:', err);
  }

  return {
    jobs: supabaseJobs,
    totalCount: count,
  };
}

export async function saveUserConversionJob(jobData: {
  user_id: string;
  title: string;
  status?: string;
  grid_width?: number;
  grid_height?: number;
  colors_count?: number;
  photo_url?: string;
  thumbnail_url?: string;
  original_image_url?: string;
  pattern_pdf_url?: string;
  pattern_preview_url?: string;
  [key: string]: any;
}): Promise<boolean> {
  console.log('[saveUserConversionJob] Function invoked with data:', {
    user_id: jobData.user_id,
    title: jobData.title,
    status: jobData.status,
    grid: `${jobData.grid_width}x${jobData.grid_height}`,
    colors_count: jobData.colors_count,
    hasPhotoUrl: !!jobData.photo_url,
    hasThumbUrl: !!jobData.thumbnail_url,
    hasOriginalUrl: !!jobData.original_image_url,
    hasPdfUrl: !!jobData.pattern_pdf_url,
    hasPreviewUrl: !!jobData.pattern_preview_url,
    photo_url_snippet: jobData.photo_url ? jobData.photo_url.substring(0, 80) : '',
    pdf_url_snippet: jobData.pattern_pdf_url ? jobData.pattern_pdf_url.substring(0, 80) : '',
  });

  if (!jobData.user_id) {
    console.warn('[saveUserConversionJob] Missing user_id, aborting save');
    return false;
  }

  const rawPhoto = jobData.photo_url || jobData.thumbnail_url || jobData.original_image_url || '';
  let compactThumbnail = jobData.thumbnail_url || '';
  let mediumPhoto = jobData.photo_url || '';

  // 1. Generate compact thumbnail (250px) for fast card display
  try {
    if (rawPhoto) {
      if (rawPhoto.startsWith('data:image/') || rawPhoto.startsWith('blob:') || rawPhoto.length > 5000) {
        compactThumbnail = await createScaledThumbnail(rawPhoto, 250);
      } else {
        compactThumbnail = rawPhoto;
      }
    }
  } catch (e) {
    console.error('[saveUserConversionJob] Failed to generate compact thumbnail:', e);
    compactThumbnail = rawPhoto;
  }

  // 2. Generate medium scaled photo (600px) so blob: URLs or large files persist reliably
  try {
    if (rawPhoto) {
      if (rawPhoto.startsWith('blob:') || rawPhoto.length > 100000) {
        mediumPhoto = await createScaledThumbnail(rawPhoto, 600);
      } else {
        mediumPhoto = rawPhoto;
      }
    }
  } catch (e) {
    console.error('[saveUserConversionJob] Failed to generate medium photo:', e);
    mediumPhoto = compactThumbnail || rawPhoto;
  }

  const finalThumb = compactThumbnail || mediumPhoto;
  const finalPhoto = mediumPhoto || finalThumb;

  // Cache thumbnail & photo in localStorage under multiple key conventions for immediate synchronous access
  if (finalThumb) {
    try {
      localStorage.setItem(`user_pattern_img_${jobData.user_id}_${jobData.title}`, finalThumb);
      localStorage.setItem(`user_pattern_img_${jobData.title}`, finalThumb);
      localStorage.setItem(`user_pattern_thumb_${jobData.title}`, finalThumb);
    } catch (e) {
      console.warn('[saveUserConversionJob] LocalStorage quota for thumbnail cache:', e);
    }
  }

  if (finalPhoto) {
    try {
      localStorage.setItem(`user_pattern_photo_${jobData.title}`, finalPhoto);
    } catch (e) {
      console.warn('[saveUserConversionJob] LocalStorage quota for photo cache:', e);
    }
  }

  const newLocalJob: SupabaseConversionJobRow = {
    id: `job_${Date.now()}`,
    user_id: jobData.user_id,
    title: jobData.title || 'Converted Pattern',
    status: jobData.status || 'complete',
    grid_width: jobData.grid_width || 60,
    grid_height: jobData.grid_height || 60,
    colors_count: jobData.colors_count || 18,
    photo_url: finalPhoto.length < 250000 ? finalPhoto : '',
    thumbnail_url: finalThumb.length < 100000 ? finalThumb : '',
    original_image_url: jobData.original_image_url || '',
    pattern_pdf_url: jobData.pattern_pdf_url || '',
    pattern_preview_url: jobData.pattern_preview_url || '',
    pattern_config: jobData.pattern_config || null,
    created_at: new Date().toISOString(),
  };

  // Persist locally to localStorage array
  try {
    const raw = localStorage.getItem('stitchly_local_conversion_jobs');
    let list: SupabaseConversionJobRow[] = raw ? JSON.parse(raw) : [];
    // Remove duplicate entry with same title if present
    list = list.filter(j => j.title !== newLocalJob.title);
    list.unshift(newLocalJob);
    localStorage.setItem('stitchly_local_conversion_jobs', JSON.stringify(list.slice(0, 50)));
    console.log('[saveUserConversionJob] Saved job to local storage array cache');
  } catch (e) {
    console.error('[saveUserConversionJob] Failed to update local conversion jobs list:', e);
  }

  // Retrieve current active Supabase Auth session right before insert
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[saveUserConversionJob] Supabase Auth Session before insert:', {
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    sessionUserEmail: session?.user?.email,
    payloadUserId: jobData.user_id,
    hasAccessToken: !!session?.access_token,
    accessTokenSnippet: session?.access_token ? `${session.access_token.substring(0, 20)}...` : null,
  });

  // Align insert user_id with session.user.id when an active session exists so RLS (auth.uid() = user_id) passes
  const effectiveUserId = session?.user?.id || (jobData.user_id !== 'guest' ? jobData.user_id : null);

  if (effectiveUserId) {
    const insertPayload = {
      user_id: effectiveUserId,
      title: jobData.title || 'Converted Pattern',
      status: jobData.status || 'complete',
      grid_width: jobData.grid_width || 60,
      grid_height: jobData.grid_height || 60,
      colors_count: jobData.colors_count || 18,
      photo_url: finalPhoto.length < 250000 ? finalPhoto : '',
      thumbnail_url: jobData.thumbnail_url || (finalThumb.length < 100000 ? finalThumb : ''),
      original_image_url: jobData.original_image_url || '',
      pattern_pdf_url: jobData.pattern_pdf_url || '',
      pattern_preview_url: jobData.pattern_preview_url || '',
      pattern_config: jobData.pattern_config || null,
      created_at: new Date().toISOString(),
    };

    console.log('[saveUserConversionJob] Executing Supabase insert for conversion_jobs:', insertPayload);

    // Persist to Supabase database
    try {
      const { data, error } = await supabase.from('conversion_jobs').insert([insertPayload]).select();

      if (error) {
        console.error('[saveUserConversionJob] Supabase insert error for conversion_jobs:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      } else {
        console.log('[saveUserConversionJob] Supabase insert succeeded for conversion_jobs:', data);
      }
    } catch (err) {
      console.error('[saveUserConversionJob] Supabase insert exception:', err);
    }
  } else {
    console.log('[saveUserConversionJob] Guest user session - saved job to local storage cache only.');
  }

  try {
    window.dispatchEvent(new CustomEvent('patternSaved'));
  } catch {}

  return true;
}

export async function migrateGuestConversionJobs(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const raw = localStorage.getItem('stitchly_local_conversion_jobs');
    if (!raw) return;
    let list: SupabaseConversionJobRow[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return;

    let hasChanges = false;
    const jobsToUpload: SupabaseConversionJobRow[] = [];

    list = list.map((job) => {
      if (job.user_id === 'guest' || !job.user_id) {
        hasChanges = true;
        const updated = { ...job, user_id: userId };
        jobsToUpload.push(updated);
        return updated;
      }
      return job;
    });

    if (hasChanges) {
      localStorage.setItem('stitchly_local_conversion_jobs', JSON.stringify(list));
      console.log(`[migrateGuestConversionJobs] Migrated ${jobsToUpload.length} guest jobs to user ${userId}`);

      for (const job of jobsToUpload) {
        try {
          await supabase.from('conversion_jobs').upsert([
            {
              user_id: userId,
              title: job.title || 'Converted Pattern',
              status: job.status || 'complete',
              grid_width: job.grid_width || 60,
              grid_height: job.grid_height || 60,
              colors_count: job.colors_count || 18,
              photo_url: job.photo_url || '',
              thumbnail_url: job.thumbnail_url || '',
              original_image_url: job.original_image_url || '',
              pattern_pdf_url: job.pattern_pdf_url || '',
              pattern_preview_url: job.pattern_preview_url || '',
              pattern_config: job.pattern_config || null,
              created_at: job.created_at || new Date().toISOString(),
            },
          ]);
        } catch (e) {
          console.error('[migrateGuestConversionJobs] Supabase sync error:', e);
        }
      }

      window.dispatchEvent(new CustomEvent('patternSaved'));
    }
  } catch (e) {
    console.error('[migrateGuestConversionJobs] Error migrating guest jobs:', e);
  }
}

export interface OrderItem {
  name?: string;
  title?: string;
  price?: string | number;
  quantity?: number;
  [key: string]: any;
}

export interface SupabaseOrderRow {
  id: string | number;
  user_id: string;
  order_type: string;
  items?: OrderItem[] | OrderItem | string | any;
  request_details?: {
    photo_url?: string;
    pattern_result_url?: string;
    size?: string;
    color_count?: number | string;
    stitch_count?: number | string | null;
    delivery_address?: string;
    customer_notes?: string;
    phone?: string;
    product_style?: string;
    is_framed?: boolean;
    framing_option?: string;
    customer_name?: string;
    customer_email?: string;
    [key: string]: any;
  };
  fulfillment_status?: string;
  created_at: string;
  total_amount?: number | string;
  payment_status?: string;
  [key: string]: any;
}

export async function fetchUserStoreOrders(
  userId?: string,
  userEmail?: string
): Promise<SupabaseOrderRow[]> {
  let query = supabase
    .from('orders')
    .select('*')
    .eq('order_type', 'store');

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (userEmail) {
    query = query.eq('user_id', userEmail);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching store orders from Supabase:', error);
    return [];
  }

  return (data || []) as SupabaseOrderRow[];
}

export interface CreateOrderRequestParams {
  userId?: string;
  userEmail?: string;
  orderType: 'custom_kit_converter' | 'custom_kit_assisted' | 'custom_stitched' | string;
  requestDetails: {
    photo_url?: string;
    pattern_result_url?: string;
    size?: string;
    color_count?: number | string;
    stitch_count?: number | string | null;
    delivery_address: string;
    customer_notes?: string;
    phone?: string;
    product_style?: string;
    framed?: boolean;
    is_framed?: boolean;
    framing_option?: string;
    customer_name?: string;
    customer_email?: string;
    [key: string]: any;
  };
}

export async function createOrderRequest(params: CreateOrderRequestParams): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const effectiveUserId = session?.user?.id || params.userId || session?.user?.email || params.userEmail;

    if (!effectiveUserId) {
      console.warn('[createOrderRequest] No logged in user session or user ID provided.');
      return { success: false, error: new Error('User must be logged in to submit an order.') };
    }

    const payload: Record<string, any> = {
      user_id: effectiveUserId,
      order_type: params.orderType,
      request_details: params.requestDetails,
      fulfillment_status: 'pending_quote',
      payment_status: 'pending_quote',
      total_amount: 0,
      created_at: new Date().toISOString(),
    };

    console.log('[createOrderRequest] Submitting row to Supabase orders table:', payload);

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select();

    if (error) {
      console.error('[createOrderRequest] Supabase orders table insert error:', error);
      
      // Attempt fallback insert with stringified request_details if jsonb typing differed
      try {
        const fallbackPayload = {
          ...payload,
          request_details: JSON.stringify(params.requestDetails),
          items: [{
            title: params.orderType === 'custom_kit_converter' ? 'Converter Custom Kit' :
                   params.orderType === 'custom_kit_assisted' ? 'Assisted Custom Kit' : 'Custom Stitched Product',
            price: 0,
            quantity: 1,
            details: params.requestDetails,
          }],
        };
        const fallbackRes = await supabase.from('orders').insert([fallbackPayload]).select();
        if (!fallbackRes.error) {
          console.log('[createOrderRequest] Fallback insert succeeded:', fallbackRes.data);
          return { success: true, data: fallbackRes.data };
        }
      } catch (fallbackErr) {
        console.warn('[createOrderRequest] Fallback insert exception:', fallbackErr);
      }

      return { success: false, error };
    }

    console.log('[createOrderRequest] Order successfully saved to Supabase orders:', data);

    // Also mirror to stitch_orders for real-time tracking tabs
    try {
      let orderTitle = 'Custom Quote Request';
      if (params.orderType === 'custom_kit_converter') {
        orderTitle = `Converter Custom Kit (${params.requestDetails.size || 'Standard'})`;
      } else if (params.orderType === 'custom_kit_assisted') {
        orderTitle = `Assisted Custom Kit (${params.requestDetails.size || 'Standard'})`;
      } else if (params.orderType === 'custom_stitched') {
        orderTitle = `Custom Hand-Stitched Keepsake (${params.requestDetails.size || 'Standard'})`;
      }

      await supabase.from('stitch_orders').insert([
        {
          user_id: effectiveUserId,
          title: orderTitle,
          status: 'received',
          status_note: "Order received — we'll confirm final pricing and delivery charges in your dashboard within 24-48 hours.",
          image_url: params.requestDetails.photo_url || params.requestDetails.pattern_result_url || '',
          created_at: new Date().toISOString(),
        }
      ]);
    } catch (mirrorErr) {
      console.warn('[createOrderRequest] stitch_orders mirror notice:', mirrorErr);
    }

    try {
      window.dispatchEvent(new CustomEvent('orderCreated', { detail: { orderType: params.orderType } }));
    } catch {}

    return { success: true, data };
  } catch (err: any) {
    console.error('[createOrderRequest] Unexpected exception:', err);
    return { success: false, error: err };
  }
}

export interface AdminQuoteData {
  item_price: number;
  delivery_charge: number;
  total_amount: number;
  admin_notes: string;
  quoted_at?: string;
}

export interface SupabaseStitchOrderRow {
  id: string | number;
  raw_order_id?: string | number;
  user_id: string;
  title?: string;
  title_name?: string;
  image_url?: string;
  status: string; // 'pending_quote' | 'quoted' | 'awaiting_payment' | 'confirmed' | 'in_progress' | 'in_production' | 'quality_check' | 'shipped' | 'delivered'
  fulfillment_status?: string;
  payment_status?: string;
  quote?: AdminQuoteData;
  item_price?: number;
  delivery_charge?: number;
  quoted_price?: number;
  total_amount?: number;
  status_note?: string;
  admin_notes?: string;
  estimated_completion?: string;
  tracking_number?: string;
  progress_percent?: number;
  progress_note?: string;
  progress_updated_at?: string;
  created_at?: string;
  updated_at?: string;
  order_type?: string;
  request_details?: any;
  items?: any;
  // Joined/derived customer info
  customer_name?: string;
  customer_email?: string;
  customer_tier?: string;
  customer_tier_label?: string;
  customer_avatar?: string;
  [key: string]: any;
}

export async function fetchUserStitchOrders(
  userId?: string,
  userEmail?: string
): Promise<SupabaseStitchOrderRow[]> {
  const allResults: SupabaseStitchOrderRow[] = [];
  const seenIds = new Set<string>();

  // 1. Fetch from custom requests in orders table
  try {
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .in('order_type', ['custom_kit_converter', 'custom_kit_assisted', 'custom_stitched']);

    if (userId) {
      orderQuery = orderQuery.eq('user_id', userId);
    } else if (userEmail) {
      orderQuery = orderQuery.eq('user_id', userEmail);
    }

    orderQuery = orderQuery.order('created_at', { ascending: false });

    const { data: orderRows, error: orderErr } = await orderQuery;
    if (!orderErr && orderRows && Array.isArray(orderRows)) {
      for (const row of orderRows) {
        const details = typeof row.request_details === 'string'
          ? (() => { try { return JSON.parse(row.request_details); } catch { return {}; } })()
          : row.request_details || {};

        const quoteObj = typeof row.quote === 'string'
          ? (() => { try { return JSON.parse(row.quote); } catch { return undefined; } })()
          : row.quote || details.quote || undefined;

        let title = 'Custom Quote Request';
        if (row.order_type === 'custom_kit_converter') title = `Custom Kit (Converter) - ${details.size || 'Standard'}`;
        else if (row.order_type === 'custom_kit_assisted') title = `Assisted Kit - ${details.size || 'Standard'}`;
        else if (row.order_type === 'custom_stitched') title = `Custom Stitched Keepsake - ${details.size || 'Standard'}`;

        const rawStatus = row.fulfillment_status || 'pending_quote';
        let defaultNote = '';
        if (rawStatus === 'pending_quote' || rawStatus === 'received') {
          defaultNote = "Order received — we'll confirm final pricing and delivery charges in your dashboard within 24-48 hours.";
        } else if (rawStatus === 'quoted') {
          defaultNote = quoteObj?.admin_notes || row.admin_notes || "Your custom quote is ready! Review the quote details and click Confirm Order to proceed.";
        } else if (rawStatus === 'awaiting_payment') {
          defaultNote = "Quote confirmed. Awaiting payment processing before crafting begins.";
        } else if (rawStatus === 'confirmed') {
          defaultNote = "Payment confirmed. Your project has entered our artisan workshop queue.";
        } else if (rawStatus === 'in_progress' || rawStatus === 'in_production') {
          defaultNote = row.progress_note || details.progress_note || "Artisan stitching and material preparation is actively in progress.";
        } else if (rawStatus === 'quality_check') {
          defaultNote = "Undergoing master embroiderer tensioning, mounting & final quality inspection.";
        } else if (rawStatus === 'shipped') {
          defaultNote = row.tracking_number ? `Order dispatched with tracking: ${row.tracking_number}` : "Order dispatched with tracking.";
        } else if (rawStatus === 'delivered') {
          defaultNote = "Order delivered to your destination. Thank you for stitching with us!";
        }

        const totalAmountVal = row.total_amount ?? quoteObj?.total_amount ?? row.quoted_price ?? (details.quoted_price ?? 0);
        const itemPriceVal = quoteObj?.item_price ?? row.item_price ?? details.item_price ?? (totalAmountVal > 0 ? totalAmountVal : undefined);
        const deliveryChargeVal = quoteObj?.delivery_charge ?? row.delivery_charge ?? details.delivery_charge ?? 0;

        const mapped: SupabaseStitchOrderRow = {
          id: `order_${row.id}`,
          raw_order_id: row.id,
          user_id: row.user_id,
          title: title,
          image_url: details.photo_url || details.pattern_result_url || row.image_url || '',
          status: rawStatus,
          fulfillment_status: rawStatus,
          payment_status: row.payment_status || details.payment_status || 'pending_quote',
          quote: quoteObj,
          item_price: itemPriceVal,
          delivery_charge: deliveryChargeVal,
          quoted_price: totalAmountVal > 0 ? totalAmountVal : undefined,
          total_amount: totalAmountVal,
          status_note: row.status_note || details.status_note || defaultNote,
          admin_notes: quoteObj?.admin_notes || row.admin_notes || details.admin_notes || '',
          estimated_completion: row.estimated_completion || details.estimated_completion || '',
          tracking_number: row.tracking_number || details.tracking_number || '',
          progress_percent: row.progress_percent ?? details.progress_percent,
          progress_note: row.progress_note || details.progress_note || '',
          progress_updated_at: row.progress_updated_at || details.progress_updated_at || '',
          created_at: row.created_at,
          updated_at: row.updated_at,
          order_type: row.order_type,
          request_details: details,
        };
        seenIds.add(String(mapped.id));
        allResults.push(mapped);
      }
    }
  } catch (err) {
    console.error('Error fetching custom orders from orders table:', err);
  }

  // 2. Fetch from stitch_orders table
  try {
    let query = supabase
      .from('stitch_orders')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.eq('user_id', userEmail);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (!error && data && Array.isArray(data)) {
      for (const item of data) {
        if (!seenIds.has(String(item.id))) {
          allResults.push({
            ...item,
            raw_order_id: item.id,
            fulfillment_status: item.status || 'received',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching stitch_orders from Supabase:', err);
  }

  // Sort newest first
  allResults.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return allResults;
}

export async function fetchAllAdminOrders(): Promise<SupabaseStitchOrderRow[]> {
  const allResults: SupabaseStitchOrderRow[] = [];
  const seenIds = new Set<string>();

  // First, fetch all profiles to build lookup map
  const profileMap = new Map<string, SupabaseProfileRow>();
  try {
    const profiles = await fetchAllProfiles();
    for (const p of profiles) {
      if (p.id) profileMap.set(String(p.id).toLowerCase(), p);
      if (p.user_id) profileMap.set(String(p.user_id).toLowerCase(), p);
      if (p.email) profileMap.set(String(p.email).toLowerCase(), p);
    }
  } catch (err) {
    console.warn('[fetchAllAdminOrders] Profiles pre-fetch warning:', err);
  }

  try {
    const { data: orderRows, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!orderErr && orderRows && Array.isArray(orderRows)) {
      for (const row of orderRows) {
        const details = typeof row.request_details === 'string'
          ? (() => { try { return JSON.parse(row.request_details); } catch { return {}; } })()
          : row.request_details || {};

        const quoteObj = typeof row.quote === 'string'
          ? (() => { try { return JSON.parse(row.quote); } catch { return undefined; } })()
          : row.quote || details.quote || undefined;

        let title = 'Custom Quote Request';
        if (row.order_type === 'custom_kit_converter') title = `Custom Kit (Converter) - ${details.size || 'Standard'}`;
        else if (row.order_type === 'custom_kit_assisted') title = `Assisted Kit - ${details.size || 'Standard'}`;
        else if (row.order_type === 'custom_stitched') title = `Custom Stitched Keepsake - ${details.size || 'Standard'}`;
        else if (row.order_type) title = `${row.order_type.replace(/_/g, ' ')}`;

        const rawStatus = row.fulfillment_status || 'pending_quote';

        // Match customer profile
        const userKey = String(row.user_id || details.customer_email || details.email || '').toLowerCase();
        const matchedProfile = profileMap.get(userKey) || 
          profileMap.get(String(row.user_id || '').toLowerCase()) || 
          profileMap.get(String(details.customer_email || '').toLowerCase());

        const customerTier = getEffectiveTier(matchedProfile);
        const customerTierLabel = getEffectiveTierLabel(matchedProfile);

        const customerName = matchedProfile?.display_name || 
          matchedProfile?.name || 
          details.customer_name || 
          details.name || 
          (row.user_id?.includes('@') ? row.user_id.split('@')[0] : 'Customer');

        const customerEmail = matchedProfile?.email || 
          details.customer_email || 
          details.email || 
          (row.user_id?.includes('@') ? row.user_id : '');

        const totalAmountVal = row.total_amount ?? quoteObj?.total_amount ?? row.quoted_price ?? (details.quoted_price ?? 0);
        const itemPriceVal = quoteObj?.item_price ?? row.item_price ?? details.item_price ?? (totalAmountVal > 0 ? totalAmountVal : undefined);
        const deliveryChargeVal = quoteObj?.delivery_charge ?? row.delivery_charge ?? details.delivery_charge ?? 0;

        const mapped: SupabaseStitchOrderRow = {
          id: `order_${row.id}`,
          raw_order_id: row.id,
          user_id: row.user_id,
          title: title,
          image_url: details.photo_url || details.pattern_result_url || row.image_url || '',
          status: rawStatus,
          fulfillment_status: rawStatus,
          payment_status: row.payment_status || details.payment_status || 'pending_quote',
          quote: quoteObj,
          item_price: itemPriceVal,
          delivery_charge: deliveryChargeVal,
          quoted_price: totalAmountVal > 0 ? totalAmountVal : undefined,
          total_amount: totalAmountVal,
          status_note: row.status_note || details.status_note || '',
          admin_notes: quoteObj?.admin_notes || row.admin_notes || details.admin_notes || '',
          estimated_completion: row.estimated_completion || details.estimated_completion || '',
          tracking_number: row.tracking_number || details.tracking_number || '',
          progress_percent: row.progress_percent ?? details.progress_percent,
          progress_note: row.progress_note || details.progress_note || '',
          progress_updated_at: row.progress_updated_at || details.progress_updated_at || '',
          created_at: row.created_at,
          updated_at: row.updated_at,
          order_type: row.order_type,
          request_details: details,
          items: row.items,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_tier: customerTier,
          customer_tier_label: customerTierLabel,
          customer_avatar: matchedProfile?.avatar_url,
          customer_role: matchedProfile?.role || 'user',
        };
        seenIds.add(String(mapped.id));
        allResults.push(mapped);
      }
    }
  } catch (err) {
    console.error('Error fetching all admin orders:', err);
  }

  // Also query stitch_orders table for legacy items
  try {
    const { data: stitchRows, error: stitchErr } = await supabase
      .from('stitch_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!stitchErr && stitchRows && Array.isArray(stitchRows)) {
      for (const item of stitchRows) {
        if (!seenIds.has(String(item.id)) && !seenIds.has(`order_${item.id}`)) {
          const userKey = String(item.user_id || '').toLowerCase();
          const matchedProfile = profileMap.get(userKey);

          allResults.push({
            ...item,
            raw_order_id: item.id,
            fulfillment_status: item.status || 'received',
            customer_name: matchedProfile?.display_name || matchedProfile?.name || (item.user_id?.includes('@') ? item.user_id.split('@')[0] : 'Customer'),
            customer_email: matchedProfile?.email || (item.user_id?.includes('@') ? item.user_id : ''),
            customer_tier: getEffectiveTier(matchedProfile),
            customer_tier_label: getEffectiveTierLabel(matchedProfile),
            customer_avatar: matchedProfile?.avatar_url,
          });
        }
      }
    }
  } catch (err) {
    console.error('Error fetching admin stitch_orders:', err);
  }

  allResults.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return allResults;
}

/**
 * Submits pricing quote for an order:
 *  - updates quote jsonb field with item_price, delivery_charge, total_amount, admin_notes
 *  - sets fulfillment_status = 'quoted'
 *  - writes directly to Supabase orders table and mirrors to stitch_orders
 */
export async function submitAdminQuote(
  orderId: string | number,
  quoteData: {
    item_price: number;
    delivery_charge: number;
    total_amount: number;
    admin_notes: string;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    const rawId = typeof orderId === 'string' && orderId.startsWith('order_')
      ? orderId.replace('order_', '')
      : orderId;

    const quoteJson = {
      item_price: Number(quoteData.item_price) || 0,
      delivery_charge: Number(quoteData.delivery_charge) || 0,
      total_amount: Number(quoteData.total_amount) || 0,
      admin_notes: quoteData.admin_notes || '',
      quoted_at: new Date().toISOString(),
    };

    const statusNoteText = quoteData.admin_notes
      ? `Quote Ready: ${quoteData.admin_notes}`
      : 'Your custom quote is ready! Review the quote details and click Confirm Order to proceed.';

    const payload: Record<string, any> = {
      quote: quoteJson,
      quoted_price: Number(quoteData.total_amount) || 0,
      total_amount: Number(quoteData.total_amount) || 0,
      fulfillment_status: 'quoted',
      status_note: statusNoteText,
      admin_notes: quoteData.admin_notes || '',
      updated_at: new Date().toISOString(),
    };

    const { error: orderError } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', rawId);

    if (orderError) {
      console.warn('[submitAdminQuote] orders update note:', orderError);
    }

    // Mirror to stitch_orders if row exists
    try {
      await supabase
        .from('stitch_orders')
        .update({
          status: 'quoted',
          status_note: statusNoteText,
        })
        .eq('id', rawId);
    } catch (e) {
      console.warn('[submitAdminQuote] stitch_orders mirror error:', e);
    }

    // Trigger local events
    try {
      window.dispatchEvent(new CustomEvent('orderUpdated', { detail: { orderId, quoteData } }));
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('[submitAdminQuote] Exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Updates full admin order details including stage advancement,
 * progress tracking for custom_stitched, and tracking number.
 */
export async function updateAdminOrderDetails(
  orderId: string | number,
  updates: {
    fulfillment_status?: string;
    payment_status?: string;
    progress_percent?: number;
    progress_note?: string;
    progress_updated_at?: string;
    tracking_number?: string;
    status_note?: string;
    admin_notes?: string;
    estimated_completion?: string;
    quoted_price?: number;
    total_amount?: number;
  }
): Promise<{ success: boolean; error?: any }> {
  try {
    const rawId = typeof orderId === 'string' && orderId.startsWith('order_')
      ? orderId.replace('order_', '')
      : orderId;

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.fulfillment_status) payload.fulfillment_status = updates.fulfillment_status;
    if (updates.payment_status) payload.payment_status = updates.payment_status;
    if (updates.progress_percent !== undefined) payload.progress_percent = Number(updates.progress_percent);
    if (updates.progress_note !== undefined) payload.progress_note = updates.progress_note;
    if (updates.progress_updated_at !== undefined) payload.progress_updated_at = updates.progress_updated_at;
    if (updates.tracking_number !== undefined) payload.tracking_number = updates.tracking_number;
    if (updates.status_note !== undefined) payload.status_note = updates.status_note;
    if (updates.admin_notes !== undefined) payload.admin_notes = updates.admin_notes;
    if (updates.estimated_completion !== undefined) payload.estimated_completion = updates.estimated_completion;
    if (updates.quoted_price !== undefined) payload.quoted_price = Number(updates.quoted_price);
    if (updates.total_amount !== undefined) payload.total_amount = Number(updates.total_amount);

    const { error: orderError } = await supabase
      .from('orders')
      .update(payload)
      .eq('id', rawId);

    if (orderError) {
      console.warn('[updateAdminOrderDetails] orders table update error:', orderError);
    }

    // Mirror to stitch_orders if row exists
    try {
      const stitchPayload: Record<string, any> = {};
      if (updates.fulfillment_status) stitchPayload.status = updates.fulfillment_status;
      if (updates.status_note) stitchPayload.status_note = updates.status_note;
      if (updates.tracking_number) stitchPayload.tracking_number = updates.tracking_number;
      if (updates.estimated_completion) stitchPayload.estimated_completion = updates.estimated_completion;

      await supabase
        .from('stitch_orders')
        .update(stitchPayload)
        .eq('id', rawId);
    } catch (e) {
      console.warn('[updateAdminOrderDetails] stitch_orders mirror error:', e);
    }

    // Trigger local events
    try {
      window.dispatchEvent(new CustomEvent('orderUpdated', { detail: { orderId, updates } }));
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('[updateAdminOrderDetails] Exception:', err);
    return { success: false, error: err };
  }
}

export async function updateAdminOrderStatus(
  orderId: string | number,
  updates: {
    fulfillment_status?: string;
    payment_status?: string;
    quoted_price?: number;
    total_amount?: number;
    status_note?: string;
    estimated_completion?: string;
    tracking_number?: string;
  }
): Promise<{ success: boolean; error?: any }> {
  return updateAdminOrderDetails(orderId, updates);
}

/**
 * Customer confirms quote -> Moves fulfillment_status to 'awaiting_payment'
 */
export async function acceptCustomerQuote(orderId: string | number): Promise<{ success: boolean; error?: any }> {
  return updateAdminOrderStatus(orderId, {
    fulfillment_status: 'awaiting_payment',
    payment_status: 'awaiting_payment',
    status_note: 'Quote confirmed by customer. Awaiting payment confirmation before crafting begins.',
  });
}

/**
 * Manual test action for admin to mark an order as paid -> Moves fulfillment_status to 'confirmed'
 */
export async function markOrderAsPaidTest(orderId: string | number): Promise<{ success: boolean; error?: any }> {
  return updateAdminOrderStatus(orderId, {
    fulfillment_status: 'confirmed',
    payment_status: 'paid',
    status_note: 'Payment received (Test Mode). Order confirmed and queued for production.',
  });
}

export async function createCustomStitchOrder(params: {
  userId?: string;
  userEmail: string;
  customerName: string;
  title: string;
  description: string;
  estimatedPrice?: number;
  sourceImageUrl?: string;
}): Promise<boolean> {
  const targetUserId = params.userId || params.userEmail;
  try {
    const { error } = await supabase.from('stitch_orders').insert([
      {
        user_id: targetUserId,
        title: params.title,
        status: 'received',
        status_note: "Order received — we'll confirm final pricing and delivery charges in your dashboard within 24-48 hours.",
        image_url: params.sourceImageUrl || '',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Supabase stitch_orders insert notice:', error);
    }
  } catch (err) {
    console.error('Error inserting into stitch_orders:', err);
  }

  return true;
}

export interface SupabaseProfileRow {
  id?: string;
  user_id?: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
  role?: string; // 'admin' | 'user' | string
  payment_brand?: string;
  payment_last4?: string;
  subscription_tier?: string;
  subscription_status?: string;
  access_until?: string;
  email?: string;
  created_at?: string;
  [key: string]: any;
}

export async function fetchAllProfiles(): Promise<SupabaseProfileRow[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[fetchAllProfiles] Supabase profiles query warning:', error);
      return [];
    }
    return (data as SupabaseProfileRow[]) || [];
  } catch (err) {
    console.error('[fetchAllProfiles] Exception fetching profiles:', err);
    return [];
  }
}

export type EffectiveTier = 'free' | 'pro' | 'studio';

/**
 * Derives the effective subscription tier for feature gating across the app.
 * Access to paid features requires BOTH:
 *  1. subscription_tier matching 'pro' or 'studio'
 *  2. subscription_status === 'active'
 *
 * If subscription_status is 'inactive', 'canceled', 'canceling', 'past_due', or missing,
 * the function returns 'free' so all pro/studio features remain locked.
 */
export function getEffectiveTier(
  profile?: { subscription_tier?: string | null; subscription_status?: string | null } | null
): EffectiveTier {
  if (!profile) return 'free';

  const rawTier = (profile.subscription_tier || '').toLowerCase().trim();
  const rawStatus = (profile.subscription_status || '').toLowerCase().trim();

  // If tier is explicitly free, empty, or missing, always 'free'
  if (!rawTier || rawTier === 'free') {
    return 'free';
  }

  // Paid tier requires subscription_status === 'active'
  if (rawStatus !== 'active') {
    return 'free';
  }

  if (rawTier.includes('studio')) {
    return 'studio';
  }
  if (rawTier.includes('pro')) {
    return 'pro';
  }

  return 'free';
}

/**
 * Returns a human-friendly display label based on the effective active tier.
 */
export function getEffectiveTierLabel(
  profile?: { subscription_tier?: string | null; subscription_status?: string | null } | null
): string {
  const tier = getEffectiveTier(profile);
  if (tier === 'studio') return 'Studio Plan';
  if (tier === 'pro') return 'Pro Crafter';
  return 'Free Crafter';
}

export async function cancelSubscription(): Promise<{ success: boolean; message?: string }> {
  // Placeholder function for cancelling subscription
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Subscription cancellation request received.' });
    }, 1500);
  });
}

export function resizeImageClientSide(file: File, maxPx: number = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxPx || height > maxPx) {
          if (width > height) {
            height = Math.round((height * maxPx) / width);
            width = maxPx;
          } else {
            width = Math.round((width * maxPx) / height);
            height = maxPx;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatarToSupabase(file: File, userId: string): Promise<string | null> {
  try {
    const resizedBlob = await resizeImageClientSide(file, 400);
    const cleanUserId = (userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanUserId}_${Date.now()}.jpg`;

    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, resizedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload error (profile-pictures):', error);
      // Create local object URL / data URL as fallback if storage bucket fails
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(resizedBlob);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Error in uploadAvatarToSupabase:', err);
    return null;
  }
}

export async function uploadPDFToSupabase(pdfBlob: Blob, fileName: string, userId: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[uploadPDFToSupabase] Supabase Auth Session before upload:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email,
      hasAccessToken: !!session?.access_token,
      paramUserId: userId,
    });

    const effectiveUserId = session?.user?.id || userId;
    const cleanUserId = (effectiveUserId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = (fileName || 'pattern').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${cleanUserId}_${cleanFileName}_${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from('conversion-results')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('[uploadPDFToSupabase] Supabase storage upload error (conversion-results):', {
        error,
        code: (error as any).statusCode || (error as any).code,
        message: error.message,
      });
      return null;
    }

    console.log('[uploadPDFToSupabase] Storage upload succeeded:', data);

    const { data: publicUrlData } = supabase.storage
      .from('conversion-results')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('[uploadPDFToSupabase] Exception during PDF upload:', err);
    return null;
  }
}

export async function uploadThumbnailToSupabase(imageSrc: string, fileName: string, userId: string): Promise<string | null> {
  try {
    if (!imageSrc) return null;
    let blob: Blob;
    if (imageSrc.startsWith('data:')) {
      const resp = await fetch(imageSrc);
      blob = await resp.blob();
    } else if (imageSrc.startsWith('blob:')) {
      const resp = await fetch(imageSrc);
      blob = await resp.blob();
    } else if (imageSrc.startsWith('http')) {
      return imageSrc;
    } else {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log('[uploadThumbnailToSupabase] Supabase Auth Session before upload:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email,
      hasAccessToken: !!session?.access_token,
      paramUserId: userId,
    });

    const effectiveUserId = session?.user?.id || userId;
    const cleanUserId = (effectiveUserId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = (fileName || 'thumb').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = `${cleanUserId}_${cleanFileName}_thumb_${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from('conversion-results')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[uploadThumbnailToSupabase] Supabase storage upload error for thumbnail:', {
        error,
        code: (error as any).statusCode || (error as any).code,
        message: error.message,
      });
      return null;
    }

    console.log('[uploadThumbnailToSupabase] Storage upload succeeded:', data);

    const { data: publicUrlData } = supabase.storage
      .from('conversion-results')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('[uploadThumbnailToSupabase] Exception during thumbnail upload:', err);
    return null;
  }
}

export async function uploadOriginalPhotoToSupabase(imageSrc: string, fileName: string, userId: string): Promise<string | null> {
  try {
    if (!imageSrc) return null;
    let blob: Blob;
    if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:') || imageSrc.startsWith('http')) {
      const resp = await fetch(imageSrc);
      blob = await resp.blob();
    } else {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log('[uploadOriginalPhotoToSupabase] Supabase Auth Session before upload:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email,
      hasAccessToken: !!session?.access_token,
      paramUserId: userId,
    });

    const effectiveUserId = session?.user?.id || userId;
    const cleanUserId = (effectiveUserId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = (fileName || 'original').replace(/[^a-zA-Z0-9_-]/g, '_');

    let fileExt = 'jpg';
    if (blob.type === 'image/png') fileExt = 'png';
    else if (blob.type === 'image/webp') fileExt = 'webp';
    else if (blob.type === 'image/gif') fileExt = 'gif';

    const filePath = `${cleanUserId}_${cleanFileName}_original_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('conversion-results')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[uploadOriginalPhotoToSupabase] Supabase storage upload error for original photo:', {
        error,
        code: (error as any).statusCode || (error as any).code,
        message: error.message,
      });
      return null;
    }

    console.log('[uploadOriginalPhotoToSupabase] Storage upload succeeded:', data);

    const { data: publicUrlData } = supabase.storage
      .from('conversion-results')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('[uploadOriginalPhotoToSupabase] Exception during original photo upload:', err);
    return null;
  }
}

export async function uploadPatternPreviewToSupabase(imageSrc: string | Blob, fileName: string, userId: string): Promise<string | null> {
  try {
    if (!imageSrc) return null;
    let blob: Blob;
    if (imageSrc instanceof Blob) {
      blob = imageSrc;
    } else if (typeof imageSrc === 'string' && (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:') || imageSrc.startsWith('http'))) {
      const resp = await fetch(imageSrc);
      blob = await resp.blob();
    } else {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log('[uploadPatternPreviewToSupabase] Supabase Auth Session before upload:', {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email,
      hasAccessToken: !!session?.access_token,
      paramUserId: userId,
    });

    const effectiveUserId = session?.user?.id || userId;
    const cleanUserId = (effectiveUserId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = (fileName || 'pattern_preview').replace(/[^a-zA-Z0-9_-]/g, '_');

    let fileExt = 'png';
    if (blob.type === 'image/jpeg') fileExt = 'jpg';
    else if (blob.type === 'image/webp') fileExt = 'webp';

    const filePath = `${cleanUserId}_${cleanFileName}_preview_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('conversion-results')
      .upload(filePath, blob, {
        contentType: blob.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('[uploadPatternPreviewToSupabase] Supabase storage upload error for pattern preview:', {
        error,
        code: (error as any).statusCode || (error as any).code,
        message: error.message,
      });
      return null;
    }

    console.log('[uploadPatternPreviewToSupabase] Storage upload succeeded:', data);

    const { data: publicUrlData } = supabase.storage
      .from('conversion-results')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('[uploadPatternPreviewToSupabase] Exception during pattern preview upload:', err);
    return null;
  }
}

export async function fetchUserProfile(userId?: string, userEmail?: string): Promise<SupabaseProfileRow | null> {
  let profile: SupabaseProfileRow | null = null;

  try {
    if (userId) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) profile = data as SupabaseProfileRow;
      if (!profile) {
        const { data: byUserId } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (byUserId) profile = byUserId as SupabaseProfileRow;
      }
    }

    if (!profile && userEmail) {
      const { data: byEmail } = await supabase.from('profiles').select('*').ilike('email', userEmail.trim()).maybeSingle();
      if (byEmail) profile = byEmail as SupabaseProfileRow;
    }
  } catch (err) {
    console.warn('[fetchUserProfile] Error fetching profile:', err);
  }

  if (!profile) {
    profile = { 
      id: userId,
      email: userEmail || '', 
      display_name: userEmail ? userEmail.split('@')[0] : 'Crafter',
      role: 'user',
      subscription_tier: 'free',
      subscription_status: 'active'
    };
  }

  return profile;
}

export async function updateUserProfile(
  userId: string,
  userEmail: string,
  updates: { display_name?: string; avatar_url?: string }
): Promise<boolean> {
  const existing = await fetchUserProfile(userId, userEmail);

  if (existing && existing.id) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating profile in Supabase:', error);
      return false;
    }
    return true;
  } else {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        ...updates
      });

    if (error) {
      console.error('Error upserting profile in Supabase:', error);
      return false;
    }
    return true;
  }
}

export async function updateUserTier(
  userId: string,
  userEmail: string,
  tier: 'free' | 'pro' | 'studio'
): Promise<boolean> {
  window.dispatchEvent(new CustomEvent('dev-tier-changed', { detail: tier }));
  window.dispatchEvent(new CustomEvent('tierChanged', { detail: { tier } }));

  try {
    const existing = await fetchUserProfile(userId, userEmail);

    if (existing && existing.id) {
      await supabase
        .from('profiles')
        .update({ 
          subscription_tier: tier, 
          subscription_status: 'active',
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('profiles')
        .upsert({
          id: userId || 'info.nxuswave@gmail.com',
          user_id: userId || 'info.nxuswave@gmail.com',
          subscription_tier: tier,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        });
    }

    // Also sync user_profiles table if present
    if (userId || userEmail) {
      await supabase.from('user_profiles').upsert([
        {
          id: userId || userEmail || 'info.nxuswave@gmail.com',
          subscription_tier: tier,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }
      ]);
    }
  } catch (err) {
    console.error('Error updating tier in Supabase:', err);
  }

  return true;
}




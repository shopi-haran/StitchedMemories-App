import { createClient } from '@supabase/supabase-js';
import { BlogPost, ContentSection } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://flwkfgtjkgcluuphibyp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd2tmZ3Rqa2djbHV1cGhpYnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODA0MzgsImV4cCI6MjEwMTc1NjQzOH0.5OCxUr0IU_TSSVuNSHS7UAe-7kFoPEdl77pYWLT4Ir0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  pattern_pdf_url?: string;
  status: 'complete' | 'processing' | 'failed' | 'pending' | string;
  created_at: string;
  grid_width?: number;
  grid_height?: number;
  colors_count?: number;
  [key: string]: any;
}

export async function fetchUserConversionJobs(
  userId?: string,
  userEmail?: string,
  page: number = 0,
  pageSize: number = 10
): Promise<{ jobs: SupabaseConversionJobRow[]; totalCount: number }> {
  const fromIndex = page * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let query = supabase
    .from('conversion_jobs')
    .select('*', { count: 'exact' });

  if (userId && userEmail && userId !== userEmail) {
    query = query.or(`user_id.eq.${userId},user_id.eq.${userEmail}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else if (userEmail) {
    query = query.eq('user_id', userEmail);
  }

  query = query.order('created_at', { ascending: false }).range(fromIndex, toIndex);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching conversion_jobs from Supabase:', error);
    return { jobs: [], totalCount: 0 };
  }

  return {
    jobs: (data || []) as SupabaseConversionJobRow[],
    totalCount: count || 0,
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
  [key: string]: any;
}): Promise<boolean> {
  if (!jobData.user_id) return false;

  const photoToSave = jobData.photo_url || '';

  // Cache photo image in localStorage so dashboard thumbnails render instantly
  if (photoToSave && photoToSave.length < 500000) {
    try {
      localStorage.setItem(`user_pattern_img_${jobData.user_id}_${jobData.title}`, photoToSave);
    } catch {
      // Storage quota exceeded fallback
    }
  }

  const { error } = await supabase.from('conversion_jobs').insert([
    {
      user_id: jobData.user_id,
      title: jobData.title || 'Converted Pattern',
      status: jobData.status || 'complete',
      grid_width: jobData.grid_width || 100,
      grid_height: jobData.grid_height || 100,
      colors_count: jobData.colors_count || 18,
      photo_url: photoToSave.length > 2000 ? '' : photoToSave,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('Error saving conversion job to Supabase:', error);
    return false;
  }
  return true;
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
  items: OrderItem[] | OrderItem | string | any;
  created_at: string;
  total_amount: number | string;
  payment_status: string;
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

  if (userId && userEmail && userId !== userEmail) {
    query = query.or(`user_id.eq.${userId},user_id.eq.${userEmail}`);
  } else if (userId) {
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

export interface SupabaseStitchOrderRow {
  id: string | number;
  user_id: string;
  title?: string;
  image_url?: string;
  status: string; // 'received' | 'in_progress' | 'quality_check' | 'shipped' | 'delivered'
  status_note?: string;
  estimated_completion?: string;
  created_at?: string;
  [key: string]: any;
}

export async function fetchUserStitchOrders(
  userId?: string,
  userEmail?: string
): Promise<SupabaseStitchOrderRow[]> {
  let query = supabase
    .from('stitch_orders')
    .select('*');

  if (userId && userEmail && userId !== userEmail) {
    query = query.or(`user_id.eq.${userId},user_id.eq.${userEmail}`);
  } else if (userId) {
    query = query.eq('user_id', userId);
  } else if (userEmail) {
    query = query.eq('user_id', userEmail);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching stitch_orders from Supabase:', error);
    return [];
  }

  return (data || []) as SupabaseStitchOrderRow[];
}

export interface SupabaseProfileRow {
  id?: string;
  user_id?: string;
  display_name?: string;
  avatar_url?: string;
  payment_brand?: string;
  payment_last4?: string;
  subscription_tier?: string;
  subscription_status?: string;
  access_until?: string;
  email?: string;
  [key: string]: any;
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

export async function fetchUserProfile(userId?: string, userEmail?: string): Promise<SupabaseProfileRow | null> {
  let query = supabase.from('profiles').select('*');

  if (userId && userEmail && userId !== userEmail) {
    query = query.or(`id.eq.${userId},user_id.eq.${userId},email.eq.${userEmail}`);
  } else if (userId) {
    query = query.or(`id.eq.${userId},user_id.eq.${userId}`);
  } else if (userEmail) {
    query = query.eq('email', userEmail);
  }

  const { data, error } = await query.maybeSingle();

  let profile = (data as SupabaseProfileRow | null) || null;

  if (!profile) {
    profile = { email: userEmail || 'shopi.haran@gmail.com', subscription_tier: 'free' };
  }

  // Check Local Storage Overrides
  try {
    const globalOverride = localStorage.getItem('user_tier_global');
    let activeOverride = globalOverride;
    
    if (!activeOverride && userEmail) {
      activeOverride = localStorage.getItem(`user_tier_${userEmail.toLowerCase()}`);
    }
    if (!activeOverride) {
      activeOverride = localStorage.getItem('user_tier_shopi.haran@gmail.com');
    }

    if (activeOverride && (activeOverride === 'free' || activeOverride === 'pro' || activeOverride === 'studio')) {
      if (profile) {
        profile.subscription_tier = activeOverride;
      } else {
        profile = { email: userEmail || 'shopi.haran@gmail.com', subscription_tier: activeOverride };
      }
    }
  } catch {}

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
        user_id: userId,
        email: userEmail,
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
  // Synchronously update local storage and dispatch events immediately
  try {
    localStorage.setItem('user_tier_global', tier);
    if (userEmail) {
      localStorage.setItem(`user_tier_${userEmail.toLowerCase()}`, tier);
    }
    localStorage.setItem('user_tier_shopi.haran@gmail.com', tier);
  } catch {}

  window.dispatchEvent(new CustomEvent('dev-tier-changed', { detail: tier }));
  window.dispatchEvent(new CustomEvent('tierChanged', { detail: { tier } }));

  try {
    const existing = await fetchUserProfile(userId, userEmail);

    if (existing && existing.id) {
      await supabase
        .from('profiles')
        .update({ subscription_tier: tier, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('profiles')
        .upsert({
          user_id: userId || userEmail || 'shopi.haran@gmail.com',
          email: userEmail || 'shopi.haran@gmail.com',
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        });
    }

    // Also sync user_profiles table if present
    if (userId || userEmail) {
      await supabase.from('user_profiles').upsert([
        {
          id: userId || userEmail || 'shopi.haran@gmail.com',
          subscription_tier: tier,
          updated_at: new Date().toISOString(),
        }
      ]);
    }
  } catch (err) {
    console.error('Error updating tier in Supabase:', err);
  }

  return true;
}




import { createClient } from '@supabase/supabase-js';
import { BlogPost, ContentSection } from '../types';
import { createScaledThumbnail } from '../utils/patternEngine';

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

  // Load locally saved conversion jobs from localStorage
  let localJobs: SupabaseConversionJobRow[] = [];
  try {
    const rawLocal = localStorage.getItem('stitchly_local_conversion_jobs');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        localJobs = parsed.filter((item: any) => {
          if (!userId && !userEmail) return true;
          return item.user_id === userId || item.user_id === userEmail || item.user_id === 'guest' || !item.user_id;
        });
      }
    }
  } catch (e) {
    console.error('Error reading local conversion jobs:', e);
  }

  // Combine Supabase jobs and local jobs, avoiding duplicates
  const combinedMap = new Map<string, SupabaseConversionJobRow>();
  supabaseJobs.forEach(job => {
    combinedMap.set(String(job.id || job.title), job);
  });
  localJobs.forEach(job => {
    if (!combinedMap.has(String(job.id || job.title))) {
      combinedMap.set(String(job.id || job.title), job);
    }
  });

  let allJobs = Array.from(combinedMap.values());

  // Default sample patterns if no patterns saved yet for test user
  if (allJobs.length === 0) {
    const defaultSampleJobs: SupabaseConversionJobRow[] = [
      {
        id: 'sample_job_1',
        user_id: userId || userEmail || 'shopi.haran@gmail.com',
        title: 'Hoop Dog Portrait Cross-Stitch',
        status: 'complete',
        grid_width: 60,
        grid_height: 60,
        colors_count: 18,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        pattern_pdf_url: '',
      },
      {
        id: 'sample_job_2',
        user_id: userId || userEmail || 'shopi.haran@gmail.com',
        title: 'Spring Wildflowers Embroidery Pattern',
        status: 'complete',
        grid_width: 80,
        grid_height: 80,
        colors_count: 24,
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        pattern_pdf_url: '',
      }
    ];
    allJobs = defaultSampleJobs;
  }

  // Sort by created_at descending
  allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const paginated = allJobs.slice(fromIndex, toIndex + 1);

  return {
    jobs: paginated,
    totalCount: allJobs.length,
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
  [key: string]: any;
}): Promise<boolean> {
  if (!jobData.user_id) return false;

  const rawPhoto = jobData.photo_url || jobData.thumbnail_url || '';
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
      console.warn('LocalStorage quota for thumbnail cache:', e);
    }
  }

  if (finalPhoto) {
    try {
      localStorage.setItem(`user_pattern_photo_${jobData.title}`, finalPhoto);
    } catch (e) {
      console.warn('LocalStorage quota for photo cache:', e);
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
  } catch (e) {
    console.error('Failed to update local conversion jobs list:', e);
  }

  // Persist to Supabase database
  try {
    const { error } = await supabase.from('conversion_jobs').insert([
      {
        user_id: jobData.user_id,
        title: jobData.title || 'Converted Pattern',
        status: jobData.status || 'complete',
        grid_width: jobData.grid_width || 60,
        grid_height: jobData.grid_height || 60,
        colors_count: jobData.colors_count || 18,
        photo_url: finalPhoto.length < 250000 ? finalPhoto : '',
        thumbnail_url: finalThumb.length < 100000 ? finalThumb : '',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error saving conversion job to Supabase:', error);
    }
  } catch (err) {
    console.error('Supabase insert exception:', err);
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

  if (userId) {
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

  if (userId) {
    query = query.eq('id', userId);
  } else if (userEmail) {
    query = query.eq('id', userEmail);
  }

  const { data, error } = await query.maybeSingle();

  let profile = (data as SupabaseProfileRow | null) || null;

  const normalizedEmail = (userEmail || '').toLowerCase();

  if (!profile) {
    profile = { 
      email: userEmail || 'info.nxuswave@gmail.com', 
      display_name: normalizedEmail.includes('nxuswave') ? 'NxusWave User' : 'Shopi Haran',
      subscription_tier: 'studio' 
    };
  }

  // Force info.nxuswave@gmail.com and default accounts to Studio Tier
  if (normalizedEmail === 'info.nxuswave@gmail.com' || normalizedEmail === 'shopi.haran@gmail.com' || !normalizedEmail) {
    profile.subscription_tier = 'studio';
    try {
      localStorage.setItem('user_tier_info.nxuswave@gmail.com', 'studio');
      localStorage.setItem('user_tier_global', 'studio');
    } catch {}
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
  // Synchronously update local storage and dispatch events immediately
  try {
    localStorage.setItem('user_tier_global', tier);
    if (userEmail) {
      localStorage.setItem(`user_tier_${userEmail.toLowerCase()}`, tier);
    }
    localStorage.setItem('user_tier_info.nxuswave@gmail.com', tier);
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
          id: userId || 'info.nxuswave@gmail.com',
          user_id: userId || 'info.nxuswave@gmail.com',
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




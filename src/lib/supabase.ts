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

export interface BlogPostSection {
  type: 'paragraph' | 'heading2' | 'heading3' | 'list' | 'bulletList' | 'image' | 'callout' | 'quote' | 'faq' | 'cta' | string;
  content?: string;
  text?: string;
  title?: string;
  items?: string[];
  imageUrl?: string;
  imageCaption?: string;
  author?: string;
  faqs?: { question: string; answer: string }[];
  ctaText?: string;
  ctaAction?: 'converter' | 'shop' | string;
}

export type ContentSection = BlogPostSection;

export interface BlogPost {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  published_at?: string | null;
  published?: boolean;
  imageUrl: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  contentSections?: BlogPostSection[];
}

export interface GalleryItem {
  id: string;
  title: string;
  author: string;
  originalImage: string;
  stitchedImage: string;
  stitchesCount: string;
  colorsCount: number;
  timeSpent: string;
}

export interface ShopKit {
  id: string;
  title: string;
  category: 'Full Kit' | 'Curated Design' | 'Threads' | 'Fabrics' | 'Notions' | string;
  price: string;
  numericPrice: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  imageUrl: string;
  status: 'In Stock' | 'Popular' | 'Best Seller' | 'Limited Stock';
  rating?: number;
  reviewsCount?: number;
  description?: string;
  includes: string[];
  dimensions?: string;
  threadBrand?: string;
  clothType?: string;
}

export interface DMCColor {
  code: string;
  name: string;
  hex: string;
}

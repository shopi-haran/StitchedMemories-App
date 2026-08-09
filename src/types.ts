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
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
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
  category: string;
  price: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  imageUrl: string;
  status: 'Coming Soon' | 'Pre-Order';
  includes: string[];
}

export interface DMCColor {
  code: string;
  name: string;
  hex: string;
}

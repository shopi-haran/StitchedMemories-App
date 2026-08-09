import { GalleryItem, ShopKit, DMCColor } from '../types';
import stitchedHeroImg from '../assets/images/stitched_hero_image_1785822844207.jpg';
import catPortraitImg from '../assets/images/cat_portrait_hoop_1785833604540.jpg';
import dogSplitImg from '../assets/images/dog_split_hoop_1785833581050.jpg';
import weddingMemoryImg from '../assets/images/wedding_memory_hoop_1785833628080.jpg';
import familyFrameImg from '../assets/images/family_keepsake_frame_1785833649590.jpg';

export const SAMPLE_DMC_COLORS: DMCColor[] = [
  { code: 'DMC 310', name: 'Black', hex: '#000000' },
  { code: 'DMC B5200', name: 'Snow White', hex: '#FFFFFF' },
  { code: 'DMC 321', name: 'Red', hex: '#C51E3A' },
  { code: 'DMC 815', name: 'Garnet Medium', hex: '#7C0A02' },
  { code: 'DMC 743', name: 'Yellow Medium', hex: '#F9D71C' },
  { code: 'DMC 702', name: 'Kelly Green', hex: '#4CBB17' },
  { code: 'DMC 930', name: 'Antique Blue Dark', hex: '#314D60' },
  { code: 'DMC 800', name: 'Pale Delft Blue', hex: '#C0D6E4' },
  { code: 'DMC 3823', name: 'Yellow Ultra Pale', hex: '#FFFDD0' },
  { code: 'DMC 434', name: 'Brown Light', hex: '#8B5A2B' },
  { code: 'DMC 938', name: 'Coffee Brown Dark', hex: '#362212' },
  { code: 'DMC 3865', name: 'Winter White', hex: '#FDFBF7' },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: '1',
    title: 'Grandmother’s Cottage Portrait',
    author: 'Sarah M.',
    originalImage: familyFrameImg,
    stitchedImage: stitchedHeroImg,
    stitchesCount: '12,400 stitches',
    colorsCount: 24,
    timeSpent: '3 weeks'
  },
  {
    id: '2',
    title: 'Golden Retriever "Milo"',
    author: 'David K.',
    originalImage: dogSplitImg,
    stitchedImage: catPortraitImg,
    stitchesCount: '18,200 stitches',
    colorsCount: 32,
    timeSpent: '1 month'
  },
  {
    id: '3',
    title: 'Wedding Day Sunset Memory',
    author: 'Hannah & James',
    originalImage: weddingMemoryImg,
    stitchedImage: familyFrameImg,
    stitchesCount: '24,000 stitches',
    colorsCount: 40,
    timeSpent: '2 months'
  }
];

export const SHOP_KITS: ShopKit[] = [
  {
    id: '1',
    title: 'Custom Photo Starter Kit',
    category: 'Full Kit',
    price: '$34.99',
    difficulty: 'Beginner',
    imageUrl: dogSplitImg,
    status: 'Coming Soon',
    includes: ['Custom Printed Pattern', '14-Count Aida Cloth', 'DMC Pre-sorted Floss', '2 Embroidery Needles', '6" Wooden Hoop']
  },
  {
    id: '2',
    title: 'Botanical Garden Memory Kit',
    category: 'Curated Design',
    price: '$29.99',
    difficulty: 'Intermediate',
    imageUrl: weddingMemoryImg,
    status: 'Coming Soon',
    includes: ['HD Chart PDF + Printout', 'Zweigart Aida 16ct', 'Full DMC Floss Set', 'Gold-plated Tapestry Needles']
  },
  {
    id: '3',
    title: 'Essential Stitcher Accessories Box',
    category: 'Notions',
    price: '$22.50',
    difficulty: 'Beginner',
    imageUrl: catPortraitImg,
    status: 'Coming Soon',
    includes: ['Bohin Needle Set', 'Magnetic Needle Minder', 'Stork Scissors', 'Floss Bobbins (50x)', 'DMC Color Card']
  }
];

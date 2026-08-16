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
    title: 'Custom Photo Heirloom Kit',
    category: 'Full Kit',
    price: '$34.99',
    numericPrice: 34.99,
    difficulty: 'Beginner',
    imageUrl: dogSplitImg,
    status: 'Best Seller',
    rating: 4.9,
    reviewsCount: 128,
    description: 'Transform your favorite pet or family photo into a physical ready-to-stitch kit with custom pre-sorted DMC thread drops, Zweigart Aida cloth, needles, and a high-contrast chart booklet.',
    includes: [
      'Custom Printed Full-Color Pattern Booklet',
      'Zweigart 14-Count Premium Aida Cloth (12" × 12")',
      'Genuine DMC Pre-Sorted Stranded Cotton Floss',
      '2× Bohin France Tapestry Needles (Size 24)',
      '6" Smooth Solid Beechwood Embroidery Hoop',
      'Step-by-Step Beginner Stitching Guide'
    ],
    dimensions: '12" × 12" fabric (8" hoop)',
    threadBrand: 'DMC Mouliné Spécial',
    clothType: 'Zweigart White 14ct Aida'
  },
  {
    id: '2',
    title: 'Golden Meadow Floral Keepsake Kit',
    category: 'Curated Design',
    price: '$29.99',
    numericPrice: 29.99,
    difficulty: 'Intermediate',
    imageUrl: weddingMemoryImg,
    status: 'Popular',
    rating: 4.8,
    reviewsCount: 94,
    description: 'A soothing botanical heirloom composition featuring delicate wildflowers, warm amber honey tones, and intricate backstitched details designed by artisan crafters.',
    includes: [
      'Laminated Multi-Page Symbol & Color Chart',
      'Zweigart 16-Count Oatmeal Flecked Aida',
      '22 Color-Sorted DMC Floss Skein Drops',
      '2× Gold-Plated Tapestry Needles',
      '7" Natural Bamboo Tension Hoop'
    ],
    dimensions: '10" × 10" finished piece',
    threadBrand: 'DMC France',
    clothType: '16ct Oatmeal Aida'
  },
  {
    id: '3',
    title: 'Warm Sunlight Pet Portrait Kit',
    category: 'Full Kit',
    price: '$38.50',
    numericPrice: 38.50,
    difficulty: 'Intermediate',
    imageUrl: catPortraitImg,
    status: 'In Stock',
    rating: 5.0,
    reviewsCount: 62,
    description: 'Capture subtle fur textures and vibrant golden-hour highlights with a carefully curated 28-shade DMC gradient palette and tight-weave German canvas.',
    includes: [
      'Large Format High-DPI Color Chart with Key',
      '14-Count Antique White Zweigart Aida (14" × 14")',
      '28 Individual DMC Floss Bins with Number Tags',
      'Enamel Magnetic Needle Minder',
      '8" Ergonomic Beechwood Display Hoop'
    ],
    dimensions: '14" × 14" fabric',
    threadBrand: 'DMC France (100% Egyptian Cotton)',
    clothType: '14ct Antique White Aida'
  },
  {
    id: '4',
    title: 'Master Crafter Floss Vault (50 DMC Skeins)',
    category: 'Threads',
    price: '$44.00',
    numericPrice: 44.00,
    difficulty: 'All Levels',
    imageUrl: familyFrameImg,
    status: 'Popular',
    rating: 4.9,
    reviewsCount: 215,
    description: 'Essential assortment of the 50 most frequently used DMC Six-Strand Embroidery Cotton colors across neutrals, skin tones, botanicals, and vibrant accent shades.',
    includes: [
      '50× Full 8m (8.7yd) Genuine DMC Floss Skeins',
      'DMC Color Printed Reference Swatch Card',
      '50× Durable Plastic Floss Bobbins with Ring Holder',
      'DMC Thread Number Sticker Sheet'
    ],
    dimensions: '50 Skeins (8m each)',
    threadBrand: 'DMC Six-Strand Mouline 117',
    clothType: 'N/A'
  },
  {
    id: '5',
    title: 'Zweigart Premium Aida Cloth Bundle (3-Pack)',
    category: 'Fabrics',
    price: '$21.99',
    numericPrice: 21.99,
    difficulty: 'All Levels',
    imageUrl: stitchedHeroImg,
    status: 'In Stock',
    rating: 4.9,
    reviewsCount: 88,
    description: 'Triple pack of world-renowned German Zweigart 100% cotton Aida fabric with crisp, square weave and anti-fray surged edges.',
    includes: [
      '1× 14-Count Pure White Aida (15" × 18")',
      '1× 14-Count Vintage Oatmeal Aida (15" × 18")',
      '1× 16-Count Natural Cream Aida (15" × 18")',
      'Edge-bound zig-zag overlock finish'
    ],
    dimensions: 'Three 15" × 18" Pre-Cut Pieces',
    threadBrand: 'N/A',
    clothType: '100% Cotton German Zweigart'
  },
  {
    id: '6',
    title: 'Vintage Gold Stork Scissor & Needle Notions Set',
    category: 'Notions',
    price: '$18.50',
    numericPrice: 18.50,
    difficulty: 'All Levels',
    imageUrl: familyFrameImg,
    status: 'Best Seller',
    rating: 4.9,
    reviewsCount: 173,
    description: 'Classic heirloom stainless steel embroidery scissors with razor-sharp micro-tips, paired with Bohin France needles and a magnetic brass needle minder.',
    includes: [
      '3.5" Vintage Gold-Plated Stork Embroidery Scissors',
      'Enamel Floral Magnetic Needle Minder with Backing Magnet',
      'Pack of 6× Bohin Size 24/26 Tapestry Needles',
      'Handcrafted Velvet Notions Travel Pouch'
    ],
    dimensions: '3.5" Scissors / 1.2" Enamel Minder',
    threadBrand: 'Bohin France',
    clothType: 'N/A'
  }
];

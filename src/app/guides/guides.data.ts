export interface Guide {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: number;
  author: string;
  authorImage: string;
  views: string;
  date: string;
}

export const GUIDES_DATA: Guide[] = [
  {
    id: 1,
    slug: 'japan-auction-grade-explained',
    title: 'What is Japan Auction Grade? Everything You Need to Know',
    excerpt: 'Understand auction grades 1 to 5 and why Grade 4+ means a car in excellent condition.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=85',
    category: 'Buying Process',
    readTime: 8,
    author: 'Kenji Tanaka',
    authorImage: 'https://i.pravatar.cc/150?img=12',
    views: '12.5K',
    date: '2024-03-01'
  },
  {
    id: 2,
    slug: 'why-japanese-used-cars-low-mileage',
    title: 'Why Japanese Used Cars Have Such Low Mileage',
    excerpt: 'Japan\'s unique road culture and strict shaken inspection system keeps mileage surprisingly low.',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=85',
    category: 'Vehicle Quality',
    readTime: 6,
    author: 'Yuki Sato',
    authorImage: 'https://i.pravatar.cc/150?img=33',
    views: '18.2K',
    date: '2024-02-28'
  },
  {
    id: 3,
    slug: 'top-10-reliable-japanese-cars-import',
    title: 'Top 10 Most Reliable Japanese Cars for Import',
    excerpt: 'Toyota Land Cruiser, Honda CR-V, Nissan X-Trail — find out which JDM cars last the longest.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=85',
    category: 'Vehicle Selection',
    readTime: 10,
    author: 'Hiroshi Yamada',
    authorImage: 'https://i.pravatar.cc/150?img=68',
    views: '25.8K',
    date: '2024-02-25'
  },
  {
    id: 4,
    slug: 'check-japanese-car-history-before-buying',
    title: 'How to Check a Japanese Car\'s History Before Buying',
    excerpt: 'Use the chassis number to verify mileage, accidents, and ownership history before you commit.',
    image: 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=800&q=85',
    category: 'Inspection',
    readTime: 12,
    author: 'Mai Kobayashi',
    authorImage: 'https://i.pravatar.cc/150?img=47',
    views: '15.3K',
    date: '2024-02-20'
  },
  {
    id: 5,
    slug: 'complete-jdm-import-costs-breakdown',
    title: 'Complete JDM Import Costs Breakdown 2024',
    excerpt: 'Understand every cost: vehicle price, auction fees, shipping, customs, and port charges.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=85',
    category: 'Import Process',
    readTime: 15,
    author: 'Takeshi Nakamura',
    authorImage: 'https://i.pravatar.cc/150?img=15',
    views: '32.1K',
    date: '2024-02-18'
  },
  {
    id: 6,
    slug: 'japanese-kei-cars-explained',
    title: 'Japanese Kei Cars: The Ultimate Beginner\'s Guide',
    excerpt: 'Everything about Japan\'s mini vehicles — regulations, benefits, and best models to import.',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=85',
    category: 'Vehicle Types',
    readTime: 9,
    author: 'Akiko Suzuki',
    authorImage: 'https://i.pravatar.cc/150?img=29',
    views: '9.7K',
    date: '2024-02-15'
  },
  {
    id: 7,
    slug: 'shipping-methods-jdm-vehicles',
    title: 'RoRo vs Container: Which Shipping Method is Best?',
    excerpt: 'Compare roll-on/roll-off and container shipping for cost, safety, and delivery time.',
    image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=85',
    category: 'Shipping & Logistics',
    readTime: 11,
    author: 'Kenji Tanaka',
    authorImage: 'https://i.pravatar.cc/150?img=12',
    views: '14.6K',
    date: '2024-02-12'
  },
  {
    id: 8,
    slug: 'customs-clearance-guide-jdm-imports',
    title: 'Customs Clearance Guide for JDM Imports',
    excerpt: 'Navigate customs regulations, required documents, and duties for smooth vehicle clearance.',
    image: 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?w=800&q=85',
    category: 'Import Process',
    readTime: 13,
    author: 'Yuki Sato',
    authorImage: 'https://i.pravatar.cc/150?img=33',
    views: '11.2K',
    date: '2024-02-10'
  },
  {
    id: 9,
    slug: 'jdm-maintenance-tips-imported-cars',
    title: 'Essential Maintenance Tips for Imported JDM Cars',
    excerpt: 'Keep your Japanese import running smoothly with proper maintenance schedules and parts sourcing.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=85',
    category: 'Maintenance',
    readTime: 10,
    author: 'Hiroshi Yamada',
    authorImage: 'https://i.pravatar.cc/150?img=68',
    views: '8.9K',
    date: '2024-02-08'
  }
];

export function guideSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

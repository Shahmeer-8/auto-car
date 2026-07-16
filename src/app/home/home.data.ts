import { SliderConfig, SliderItem } from '../components/slider/slider.types';
import { GUIDES_DATA, guideSlug } from '../guides/guides.data';

/**
 * Slider items (GUIDES/STUDIES/RESOURCES below) don't carry real guide slugs.
 * When an item's title matches a real guide, link straight to its detail page;
 * otherwise fall back to the guides listing page.
 */
function guideRouterLink(item: SliderItem): string | any[] {
  const match = GUIDES_DATA.find((g) => g.title === item.title);
  return match ? ['/guides', guideSlug(match.title)] : ['/guides'];
}

export const HARDCODED_CARS: SliderItem[] = [
  {
    id: 'static-1',
    title: '2022 Toyota Land Cruiser',
    price: '$45,000',
    meta: '28,000 km • Automatic • SUV',
    badge: 'Grade 4.5',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80',
  },
  {
    id: 'static-2',
    title: '2021 Honda CR-V',
    price: '$22,500',
    meta: '32,000 km • Automatic • SUV',
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=400&q=80',
  },
  {
    id: 'static-3',
    title: '2022 Nissan X-Trail',
    price: '$24,000',
    meta: '21,000 km • Automatic • SUV',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
  },
  {
    id: 'static-4',
    title: '2022 Mazda CX-5',
    price: '$26,000',
    meta: '19,000 km • Automatic • SUV',
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80',
  },
  {
    id: 'static-5',
    title: '2021 Subaru Forester',
    price: '$21,000',
    meta: '35,000 km • Automatic • SUV',
    badge: 'Great Deal',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80',
  },
  {
    id: 'static-6',
    title: '2020 Toyota Hilux',
    price: '$32,000',
    meta: '45,000 km • Manual • Truck',
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'static-7',
    title: '2022 Lexus RX 350',
    price: '$54,000',
    meta: '12,000 km • Automatic • SUV',
    badge: 'Premium',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',
  },
  {
    id: 'static-8',
    title: '2021 Mitsubishi Pajero',
    price: '$29,500',
    meta: '38,000 km • Automatic • SUV',
    badge: 'Grade 4',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&q=80',
  },
];

export const GUIDES: SliderItem[] = [
  {
    title: 'How to Buy a Car from Japan: Step by Step Guide',
    desc: 'Learn the complete process of importing a Japanese used car — from auction to your doorstep.',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80',
  },
  {
    title: 'What is Japan Auction Grade? Everything You Need to Know',
    desc: 'Understand auction grades 1 to 5 and why Grade 4+ means a car in excellent condition.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
  },
  {
    title: 'Why Japanese Used Cars Have Such Low Mileage',
    desc: "Japan's unique road culture and strict shaken inspection system keeps mileage surprisingly low.",
    image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=400&q=80',
  },
  {
    title: 'Top 10 Most Reliable Japanese Cars for Import',
    desc: 'Toyota Land Cruiser, Honda CR-V, Nissan X-Trail — find out which JDM cars last the longest.',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&q=80',
  },
  {
    title: "How to Check a Japanese Car's History Before Buying",
    desc: 'Use the chassis number to verify mileage, accidents, and ownership history before you commit.',
    image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&q=80',
  },
  {
    title: 'Shipping a Car from Japan: Costs, Time & What to Expect',
    desc: 'RoRo vs container shipping — which is better for your JDM import and how long does it take?',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    title: "What is Shaken? Japan's Vehicle Inspection Explained",
    desc: "Japan's biennial shaken inspection is one of the strictest in the world — and it benefits buyers.",
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&q=80',
  },
  {
    title: 'Best JDM Cars Under $15,000 in 2025',
    desc: "Quality Japanese imports don't have to break the bank. Here are the best budget JDM picks.",
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80',
  },
];

export const RANKINGS: SliderItem[] = [
  {
    title: 'Best Small SUVs from Japan',
    type: 'suv',
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
  },
  {
    title: 'Best Japanese Hybrid Cars',
    type: 'hybrid',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80',
  },
  {
    title: 'Best Midsize SUVs from Japan',
    type: 'suv',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  },
  {
    title: 'Best Japanese Sedans',
    type: 'sedan',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
  },
  {
    title: 'Best Japanese Trucks & Pickups',
    type: 'truck',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'Best Luxury Japanese Cars',
    type: 'luxury',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  },
  {
    title: 'Best Japanese Minivans',
    type: 'minivan',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  },
  {
    title: 'Best Japanese Sports Cars',
    type: 'sports car',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  },
];

export const RELIABLE_CARS: SliderItem[] = [
  {
    title: 'Most Reliable Trucks',
    type: 'truck',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'Most Reliable SUVs',
    type: 'suv',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  },
  {
    title: 'Most Reliable Luxury Cars',
    type: 'luxury',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  },
  {
    title: 'Most Reliable Sedans',
    type: 'sedan',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
  },
  {
    title: 'Most Reliable Hybrid Cars',
    type: 'hybrid',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80',
  },
  {
    title: 'Most Reliable Compact Cars',
    type: 'compact',
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
  },
  {
    title: 'Most Reliable Minivans',
    type: 'minivan',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  },
  {
    title: 'Most Reliable Sports Cars',
    type: 'sports car',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  },
];

export const STUDIES: SliderItem[] = [
  {
    title: 'Most Popular Japanese Car Colors',
    desc: 'Most popular car colors in Japan, by region and car type.',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
  },
  {
    title: 'Which JDM Cars Hold Their Value Best?',
    desc: 'Car depreciation analysis — which Japanese cars lose value the slowest?',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80',
  },
  {
    title: 'Top 10 JDM Cars That Last 200,000+ KM',
    desc: 'Longest-lasting Japanese cars — a mix of SUVs, trucks and sedans.',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  },
  {
    title: 'Best Time to Buy a Used Car from Japan',
    desc: 'Seasonal price trends and when Japanese auction prices are at their lowest.',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  },
  {
    title: 'Toyota vs Honda — Which is More Reliable?',
    desc: "A data-driven comparison of Japan's two most popular car brands.",
    image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80',
  },
  {
    title: 'Average Mileage of Japanese Used Cars by Year',
    desc: 'How many km do Japanese used cars typically have based on their age?',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'Most Searched JDM Cars Worldwide in 2025',
    desc: 'Which Japanese cars are buyers around the world searching for the most?',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  },
  {
    title: 'Japan Auction Grade vs Actual Car Condition',
    desc: 'Does auction grade accurately predict the real condition of a used car?',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
  },
];

export const RESOURCES: SliderItem[] = [
  {
    title: 'How to Buy a Japanese Used Car: A Definitive Guide',
    desc: '10 Tips to Help You Buy a Quality JDM Car Through an Exporter',
    image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80',
  },
  {
    title: 'How Many KM Should a Used Japanese Car Have?',
    desc: 'How many kilometers is too many when buying a used car from Japan?',
    image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?w=600&q=80',
  },
  {
    title: 'New Vs. Used Japanese Car Buying',
    desc: 'Top 10 Reasons to Buy a Used JDM Car Over a Brand New One',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80',
  },
  {
    title: 'What Documents Do You Need to Import a Car from Japan?',
    desc: 'A complete checklist of paperwork required to import a Japanese vehicle.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80',
  },
  {
    title: 'How to Read a Japan Auction Sheet',
    desc: 'Understand every field on a Japanese auction inspection sheet before buying.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
  },
  {
    title: 'Japan Car Export Process: Step by Step',
    desc: 'From winning the auction to car arriving at your port — everything explained.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'How to Negotiate Price When Buying a JDM Car',
    desc: 'Smart strategies to get the best deal on your Japanese import.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',
  },
  {
    title: 'Top Mistakes to Avoid When Importing from Japan',
    desc: 'Common errors first-time importers make — and how to avoid them.',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80',
  },
];

export const BEST_USED: SliderItem[] = [
  {
    title: 'Best Used Japanese Cars Under $20,000',
    desc: 'Most reliable, safest used JDM cars that retain the most value under $20,000.',
    budget: '20000',
    image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80',
  },
  {
    title: 'Best Used Japanese SUVs Under $25,000',
    desc: 'Top JDM SUVs with low mileage, auction grade 4+ and great condition.',
    budget: '25000',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Trucks Under $20,000',
    desc: 'Most reliable, longest-lasting used Japanese pickup trucks.',
    budget: '20000',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Cars Under $15,000',
    desc: 'Quality JDM imports that give the best value for money under $15,000.',
    budget: '15000',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Luxury Cars Under $30,000',
    desc: 'Premium Lexus and Infiniti models with full service history under $30,000.',
    budget: '30000',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Hybrid Cars Under $20,000',
    desc: 'Top fuel-efficient JDM hybrid models available for under $20,000.',
    budget: '20000',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Minivans Under $15,000',
    desc: 'Spacious, reliable JDM minivans perfect for families — under $15,000.',
    budget: '15000',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  },
  {
    title: 'Best Used Japanese Sports Cars Under $25,000',
    desc: 'Fun, fast and affordable — the best JDM sports cars under $25,000.',
    budget: '25000',
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
  },
];

export const COMPARISONS: SliderItem[] = [
  {
    title: 'Toyota Land Cruiser vs Nissan Patrol',
    slug: 'land-cruiser-vs-patrol',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80',
  },
  {
    title: 'Honda CR-V vs Toyota RAV4',
    slug: 'crv-vs-rav4',
    image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=600&q=80',
  },
  {
    title: 'Toyota Hilux vs Nissan Navara',
    slug: 'hilux-vs-navara',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    title: 'Subaru Forester vs Mazda CX-5',
    slug: 'forester-vs-cx5',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  },
  {
    title: 'Lexus RX vs Toyota Harrier',
    slug: 'lexus-rx-vs-harrier',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  },
  {
    title: 'Honda Civic vs Toyota Corolla',
    slug: 'civic-vs-corolla',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
  },
  {
    title: 'Nissan X-Trail vs Honda CR-V',
    slug: 'xtrail-vs-crv',
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80',
  },
  {
    title: 'Toyota Prado vs Mitsubishi Pajero',
    slug: 'prado-vs-pajero',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
  },
];

export const POPULAR_CARS_CONFIG: SliderConfig = {
  cardVariant: 'car',
  viewAllLink: '/cars',
  showDots: true,
  headerLayout: 'inline',
  autoPlayMs: 3500,
};

export const GUIDES_CONFIG: SliderConfig = {
  cardVariant: 'article',
  viewAllLink: '/guides',
  headerLayout: 'stacked',
  bordered: true,
  autoPlayMs: 4000,
  getRouterLink: (item) => guideRouterLink(item),
};

export const RANKINGS_CONFIG: SliderConfig = {
  cardVariant: 'category',
  viewAllLink: '/cars',
  headerLayout: 'stacked',
  compactPadding: true,
  autoPlayMs: 4500,
  getRouterLink: () => ['/cars'],
  getQueryParams: (item) => (item.type ? { body: item.type } : null),
};

export const RELIABLE_CONFIG: SliderConfig = {
  cardVariant: 'category',
  viewAllLink: '/cars',
  headerLayout: 'stacked',
  compactPadding: true,
  autoPlayMs: 4500,
  getRouterLink: () => ['/cars'],
  getQueryParams: (item) => (item.type ? { body: item.type } : null),
};

export const STUDIES_CONFIG: SliderConfig = {
  cardVariant: 'article',
  compactPadding: true,
  showDivider: true,
  autoPlayMs: 5000,
  getRouterLink: (item) => guideRouterLink(item),
};

export const RESOURCES_CONFIG: SliderConfig = {
  cardVariant: 'article',
  compactPadding: true,
  showDivider: true,
  autoPlayMs: 5000,
  getRouterLink: (item) => guideRouterLink(item),
};

export const BEST_USED_CONFIG: SliderConfig = {
  cardVariant: 'article',
  compactPadding: true,
  showDivider: true,
  autoPlayMs: 5000,
  getRouterLink: () => ['/cars'],
  getQueryParams: (item) => (item.budget ? { budget: item.budget } : null),
};

export const COMPARISONS_CONFIG: SliderConfig = {
  cardVariant: 'comparison',
  compactPadding: true,
  showDivider: true,
  autoPlayMs: 5000,
  getRouterLink: () => ['/cars'],
  getQueryParams: (item) => (item.slug ? { compare: item.slug } : null),
};

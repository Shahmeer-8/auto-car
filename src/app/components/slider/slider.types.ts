export type SliderCardVariant = 'car' | 'article' | 'category' | 'comparison';

export type SliderHeaderLayout = 'inline' | 'stacked';

export interface SliderConfig {
  cardVariant: SliderCardVariant;
  viewAllLink?: string;
  viewAllLabel?: string;
  autoPlayMs?: number;
  showDots?: boolean;
  showDivider?: boolean;
  headerLayout?: SliderHeaderLayout;
  sectionClass?: string;
  bordered?: boolean;
  compactPadding?: boolean;
  getRouterLink?: (item: SliderItem, index: number) => string | any[];
  getQueryParams?: (item: SliderItem) => Record<string, string> | null;
}

export interface SliderItem {
  id?: string;
  title: string;
  image: string;
  desc?: string;
  price?: string;
  meta?: string;
  badge?: string;
  type?: string;
  budget?: string;
  slug?: string;
  isUserListing?: boolean;
}

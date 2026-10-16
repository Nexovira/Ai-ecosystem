export type SearchEntityType =
  | 'ALL'
  | 'PRODUCT'
  | 'DIGITAL_PRODUCT'
  | 'COURSE'
  | 'SERVICE'
  | 'EXPERT'
  | 'CATEGORY';

export interface SearchResultItem {
  id: string;
  type: 'PRODUCT' | 'DIGITAL_PRODUCT' | 'COURSE' | 'SERVICE' | 'EXPERT' | 'CATEGORY';
  title: string;
  slug: string;
  description: string;
  category: string;
  categoryLabel?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  availability?: string;
  rating?: number;
  badge?: string;
  metadata?: Record<string, string | number | boolean>;
  destinationUrl: string;
  score: number;
}

export interface SearchQueryFilters {
  query: string;
  type?: SearchEntityType;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: SearchResultItem[];
  countsByType: Record<string, number>;
  availableCategories: Array<{ slug: string; name: string; count: number; entityType: string }>;
  executionTimeMs: number;
}

export interface AutocompleteSuggestion {
  text: string;
  type: 'PRODUCT' | 'DIGITAL_PRODUCT' | 'COURSE' | 'SERVICE' | 'EXPERT' | 'CATEGORY';
  category?: string;
  destinationUrl: string;
  iconName?: string;
}

export interface SearchIndexStatus {
  totalIndexed: number;
  countsByType: {
    products: number;
    digitalProducts?: number;
    courses: number;
    services: number;
    experts: number;
    categories: number;
  };
  lastReindexedAt: string;
  isHealthy: boolean;
}

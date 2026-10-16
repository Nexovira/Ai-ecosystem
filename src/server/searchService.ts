import {
  SearchResultItem,
  SearchQueryFilters,
  SearchResponse,
  AutocompleteSuggestion,
  SearchIndexStatus,
  SearchEntityType,
} from '../types/search';
import { commerceService } from './commerceService';
import { academyService } from './academyService';
import { servicesService } from './servicesService';
import { reviewService } from './reviewService';
import { digitalProductService } from './digitalProductService';
import { INITIAL_CATEGORIES } from '../data/marketplaceCatalog';
import { INITIAL_COURSE_CATEGORIES } from '../data/academyCatalog';

interface SearchIndexDocument {
  id: string;
  type: 'PRODUCT' | 'DIGITAL_PRODUCT' | 'COURSE' | 'SERVICE' | 'EXPERT' | 'CATEGORY';
  title: string;
  slug: string;
  description: string;
  category: string;
  categoryLabel: string;
  imageUrl?: string;
  price?: number;
  currency: string;
  availability?: string;
  rating?: number;
  badge?: string;
  skills?: string[];
  destinationUrl: string;
  isPublic: boolean;
  createdAt?: string;
}

export class SearchService {
  private indexCache: SearchIndexDocument[] = [];
  private lastIndexedAt: string = new Date().toISOString();
  private isIndexWarm = false;

  constructor() {
    this.warmIndex().catch((err) => {
      console.warn('Initial search index warming warning:', err);
    });
  }

  /**
   * Builds the synchronized search index from authoritative ecosystem sources.
   * Strictly respects visibility rules: unpublished or unapproved items are omitted.
   */
  public async warmIndex(): Promise<void> {
    const documents: SearchIndexDocument[] = [];

    try {
      // 1. Marketplace Products
      const products = await commerceService.getAllProductsForManagement();
      for (const p of products) {
        // Enforce visibility: only PUBLISHED and approved products are publicly searchable
        const isPublished = p.productStatus === 'PUBLISHED';
        const isApproved = p.isApproved !== false;

        if (isPublished && isApproved) {
          const ratingSummary = reviewService.computeRatingSummary('PRODUCT', p.productId);
          documents.push({
            id: `prod_${p.productId}`,
            type: 'PRODUCT',
            title: p.name,
            slug: p.slug || p.productId,
            description: p.shortDescription || p.fullDescription || '',
            category: p.category,
            categoryLabel: p.category,
            imageUrl: p.productImages && p.productImages[0] ? p.productImages[0].url : undefined,
            price: p.discountPrice || p.price,
            currency: p.currency || 'NGN',
            availability: p.availabilityStatus,
            rating: ratingSummary.totalReviews > 0 ? ratingSummary.averageRating : undefined,
            badge: p.brand ? `${p.brand}` : undefined,
            destinationUrl: `/marketplace/product/${p.slug || p.productId}`,
            isPublic: true,
            createdAt: p.createdAt,
          });
        }
      }

      // 2. Marketplace Categories
      for (const cat of INITIAL_CATEGORIES) {
        documents.push({
          id: `mcat_${cat.categoryId}`,
          type: 'CATEGORY',
          title: cat.name,
          slug: cat.slug,
          description: cat.description || `Browse all ${cat.name} in the Nexovira Marketplace.`,
          category: 'marketplace',
          categoryLabel: 'Marketplace Category',
          currency: 'NGN',
          badge: 'Marketplace',
          destinationUrl: `/marketplace?category=${cat.slug}`,
          isPublic: true,
        });
      }

      // 3. Academy Courses
      const courses = academyService.getCourses();
      for (const crs of courses) {
        if (crs.status === 'PUBLISHED') {
          const ratingSummary = reviewService.computeRatingSummary('COURSE', crs.courseId);
          documents.push({
            id: `crs_${crs.courseId}`,
            type: 'COURSE',
            title: crs.title,
            slug: crs.slug || crs.courseId,
            description: crs.shortDescription || crs.fullDescription || '',
            category: crs.category || 'academy',
            categoryLabel: crs.categoryName || 'Academy Course',
            imageUrl: crs.courseImage,
            price: crs.scholarshipFee || 4500,
            currency: 'NGN',
            availability: crs.applicationsOpen ? 'OPEN' : 'CLOSED',
            rating: ratingSummary.totalReviews > 0 ? ratingSummary.averageRating : undefined,
            badge: `${crs.level} · Scholarship Track`,
            destinationUrl: `/academy/courses/${crs.slug || crs.courseId}`,
            isPublic: true,
            createdAt: crs.createdAt,
          });
        }
      }

      // 4. Academy Categories
      for (const cat of INITIAL_COURSE_CATEGORIES) {
        documents.push({
          id: `acscat_${cat.id}`,
          type: 'CATEGORY',
          title: cat.name,
          slug: cat.slug,
          description: cat.description || `Explore ${cat.name} scholarship curricula.`,
          category: 'academy',
          categoryLabel: 'Academy Category',
          currency: 'NGN',
          badge: 'Academy',
          destinationUrl: `/academy/courses?category=${cat.slug}`,
          isPublic: true,
        });
      }

      // 5. Tech & Digital Services
      const serviceCategories = await servicesService.getCategories();
      for (const srv of serviceCategories) {
        if (srv.isActive) {
          documents.push({
            id: `srv_${srv.id}`,
            type: 'SERVICE',
            title: srv.name,
            slug: srv.slug,
            description: srv.description || '',
            category: srv.slug,
            categoryLabel: 'Tech Service',
            currency: 'NGN',
            skills: srv.skills,
            badge: `${srv.skills?.length || 0} Specializations`,
            destinationUrl: `/services`,
            isPublic: true,
            createdAt: srv.createdAt,
          });
        }
      }

      // 6. Public Verified Experts
      const experts = await servicesService.getPublicExperts();
      for (const exp of experts) {
        if (exp.verificationStatus === 'VERIFIED' && exp.profileVisibility === 'PUBLIC') {
          const ratingSummary = reviewService.computeRatingSummary('EXPERT', exp.expertId);
          documents.push({
            id: `exp_${exp.expertId}`,
            type: 'EXPERT',
            title: exp.fullName,
            slug: exp.expertId,
            description: `${exp.professionalTitle}. ${exp.bio || ''}`,
            category: exp.serviceCategories && exp.serviceCategories[0] ? exp.serviceCategories[0] : 'tech-services',
            categoryLabel: exp.professionalTitle,
            imageUrl: exp.profileImage,
            price: undefined,
            currency: 'NGN',
            availability: exp.availabilityStatus,
            rating: ratingSummary.totalReviews > 0 ? ratingSummary.averageRating : exp.rating,
            skills: exp.skills,
            badge: 'Verified Expert',
            destinationUrl: `/services/experts/${exp.expertId}`,
            isPublic: true,
            createdAt: exp.createdAt,
          });
        }
      }

      // 7. Published Digital Products
      const dpResult = await digitalProductService.getPublicProducts({ limit: 100 });
      for (const dp of dpResult.products) {
        const ratingSummary = reviewService.computeRatingSummary('DIGITAL_PRODUCT', dp.productId);
        documents.push({
          id: `dp_${dp.productId}`,
          type: 'DIGITAL_PRODUCT',
          title: dp.title,
          slug: dp.slug,
          description: dp.shortDescription || dp.description,
          category: dp.categorySlug,
          categoryLabel: `${dp.categoryName} · ${dp.productType}`,
          imageUrl: dp.coverImage,
          price: dp.price,
          currency: dp.currency,
          availability: 'INSTANT_DOWNLOAD',
          rating: ratingSummary.totalReviews > 0 ? ratingSummary.averageRating : dp.rating,
          badge: dp.isFree ? 'Free Access' : `${dp.productType}`,
          destinationUrl: `/digital-products/${dp.slug}`,
          isPublic: true,
          createdAt: dp.createdAt,
        });
      }

      this.indexCache = documents;
      this.lastIndexedAt = new Date().toISOString();
      this.isIndexWarm = true;
    } catch (err) {
      console.error('Error refreshing search index:', err);
      this.isIndexWarm = false;
    }
  }

  /**
   * Helper: Normalize text by stripping non-alphanumeric punctuation and lowercasing.
   */
  private normalize(str: string): string {
    return (str || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Helper: Levenshtein distance for typo tolerance on words of length >= 4.
   */
  private isFuzzyMatch(wordA: string, wordB: string): boolean {
    if (wordA === wordB) return true;
    if (Math.abs(wordA.length - wordB.length) > 1) return false;
    if (wordA.length < 4 || wordB.length < 4) return false;

    // Check 1-edit distance
    let diff = 0;
    let i = 0;
    let j = 0;
    while (i < wordA.length && j < wordB.length) {
      if (wordA[i] !== wordB[j]) {
        diff++;
        if (diff > 1) return false;
        if (wordA.length > wordB.length) {
          i++;
          continue;
        } else if (wordB.length > wordA.length) {
          j++;
          continue;
        }
      }
      i++;
      j++;
    }
    return true;
  }

  /**
   * Calculate search relevance score.
   */
  private calculateScore(doc: SearchIndexDocument, query: string, queryWords: string[]): number {
    const normTitle = this.normalize(doc.title);
    const normDesc = this.normalize(doc.description);
    const normCategory = this.normalize(doc.category);
    const normCategoryLabel = this.normalize(doc.categoryLabel);
    const normSkills = (doc.skills || []).map((s) => this.normalize(s));

    let score = 0;

    // 1. Exact title match
    if (normTitle === query) {
      score += 150;
    } else if (normTitle.startsWith(query)) {
      score += 80;
    } else if (normTitle.includes(query)) {
      score += 50;
    }

    // 2. Query words in Title
    const titleWords = normTitle.split(' ');
    let allWordsInTitle = true;
    for (const qw of queryWords) {
      const directWordMatch = titleWords.includes(qw);
      const partialWordMatch = titleWords.some((tw) => tw.startsWith(qw) || this.isFuzzyMatch(tw, qw));

      if (directWordMatch) {
        score += 30;
      } else if (partialWordMatch) {
        score += 18;
      } else {
        allWordsInTitle = false;
      }
    }
    if (allWordsInTitle && queryWords.length > 1) {
      score += 40;
    }

    // 3. Category match
    if (normCategory === query || normCategoryLabel === query) {
      score += 45;
    } else if (normCategory.includes(query) || normCategoryLabel.includes(query)) {
      score += 25;
    }

    // 4. Skills match (for services and experts)
    for (const skill of normSkills) {
      if (skill === query) {
        score += 40;
      } else if (queryWords.some((qw) => skill.includes(qw) || this.isFuzzyMatch(skill, qw))) {
        score += 20;
      }
    }

    // 5. Description match
    if (normDesc.includes(query)) {
      score += 15;
    } else {
      for (const qw of queryWords) {
        if (normDesc.includes(qw)) {
          score += 5;
        }
      }
    }

    return score;
  }

  /**
   * Executes a unified multi-entity search.
   */
  public async search(filters: SearchQueryFilters): Promise<SearchResponse> {
    const startTime = Date.now();

    // Ensure index is warm and fresh (auto-revalidate every 3 minutes)
    const isStale = Date.now() - new Date(this.lastIndexedAt).getTime() > 180000;
    if (!this.isIndexWarm || this.indexCache.length === 0 || isStale) {
      await this.warmIndex();
    }

    const rawQuery = filters.query ? filters.query.slice(0, 100) : '';
    const normQuery = this.normalize(rawQuery);
    const queryWords = normQuery.split(' ').filter((w) => w.length > 0);

    // Initial Filter by public visibility
    let items = this.indexCache.filter((doc) => doc.isPublic);

    // Score & Rank items
    let scoredItems: Array<SearchResultItem & { score: number }> = [];

    if (queryWords.length === 0) {
      // Empty query: return featured ecosystem records
      scoredItems = items.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        category: doc.category,
        categoryLabel: doc.categoryLabel,
        imageUrl: doc.imageUrl,
        price: doc.price,
        currency: doc.currency,
        availability: doc.availability,
        badge: doc.badge,
        destinationUrl: doc.destinationUrl,
        score: 1,
      }));
    } else {
      for (const doc of items) {
        const score = this.calculateScore(doc, normQuery, queryWords);
        if (score > 0) {
          scoredItems.push({
            id: doc.id,
            type: doc.type,
            title: doc.title,
            slug: doc.slug,
            description: doc.description,
            category: doc.category,
            categoryLabel: doc.categoryLabel,
            imageUrl: doc.imageUrl,
            price: doc.price,
            currency: doc.currency,
            availability: doc.availability,
            badge: doc.badge,
            destinationUrl: doc.destinationUrl,
            score,
          });
        }
      }
    }

    // Tab Type Filter
    const targetType = filters.type || 'ALL';
    if (targetType !== 'ALL') {
      scoredItems = scoredItems.filter((item) => item.type === targetType);
    }

    // Category Filter
    if (filters.category && filters.category !== 'ALL') {
      const catSlug = filters.category.toLowerCase();
      scoredItems = scoredItems.filter(
        (item) => item.category.toLowerCase() === catSlug || item.slug.toLowerCase() === catSlug
      );
    }

    // Price Range Filter (where price exists)
    if (typeof filters.minPrice === 'number' && filters.minPrice > 0) {
      scoredItems = scoredItems.filter((item) => typeof item.price === 'number' && item.price >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0) {
      scoredItems = scoredItems.filter((item) => typeof item.price === 'number' && item.price <= filters.maxPrice!);
    }

    // Availability Filter
    if (filters.availability && filters.availability !== 'ALL') {
      scoredItems = scoredItems.filter((item) => item.availability === filters.availability);
    }

    // Compute Counts by Type across all matched results (prior to type filtering)
    const countsByType: Record<string, number> = {
      ALL: 0,
      PRODUCT: 0,
      COURSE: 0,
      SERVICE: 0,
      EXPERT: 0,
      CATEGORY: 0,
    };

    // Calculate counts accurately
    for (const item of scoredItems) {
      countsByType.ALL = (countsByType.ALL || 0) + 1;
      countsByType[item.type] = (countsByType[item.type] || 0) + 1;
    }

    // Sorting
    const sort = filters.sort || 'relevance';
    if (sort === 'relevance') {
      scoredItems.sort((a, b) => b.score - a.score);
    } else if (sort === 'price_asc') {
      scoredItems.sort((a, b) => (a.price ?? 99999999) - (b.price ?? 99999999));
    } else if (sort === 'price_desc') {
      scoredItems.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'newest') {
      scoredItems.sort((a, b) => b.id.localeCompare(a.id));
    }

    // Available categories in the matching result set for filter sidebar
    const catMap = new Map<string, { slug: string; name: string; count: number; entityType: string }>();
    for (const item of scoredItems) {
      if (item.category) {
        const existing = catMap.get(item.category);
        if (existing) {
          existing.count++;
        } else {
          catMap.set(item.category, {
            slug: item.category,
            name: item.categoryLabel || item.category,
            count: 1,
            entityType: item.type,
          });
        }
      }
    }
    const availableCategories = Array.from(catMap.values()).sort((a, b) => b.count - a.count);

    // Server Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const total = scoredItems.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedResults = scoredItems.slice(offset, offset + limit);

    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      query: rawQuery,
      total,
      page,
      limit,
      totalPages,
      results: paginatedResults,
      countsByType,
      availableCategories,
      executionTimeMs,
    };
  }

  /**
   * Fast, lightweight search suggestions for header autocomplete.
   */
  public async getSuggestions(rawQuery: string): Promise<AutocompleteSuggestion[]> {
    const isStale = Date.now() - new Date(this.lastIndexedAt).getTime() > 180000;
    if (!this.isIndexWarm || this.indexCache.length === 0 || isStale) {
      await this.warmIndex();
    }

    const query = this.normalize(rawQuery);
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions: AutocompleteSuggestion[] = [];
    const seen = new Set<string>();

    for (const doc of this.indexCache) {
      if (!doc.isPublic) continue;

      const normTitle = this.normalize(doc.title);
      const normCat = this.normalize(doc.categoryLabel || doc.category);

      let isMatch = false;
      if (normTitle.includes(query) || this.isFuzzyMatch(normTitle, query)) {
        isMatch = true;
      } else if (normCat.includes(query)) {
        isMatch = true;
      }

      if (isMatch && !seen.has(doc.title.toLowerCase())) {
        seen.add(doc.title.toLowerCase());
        suggestions.push({
          text: doc.title,
          type: doc.type,
          category: doc.categoryLabel,
          destinationUrl: doc.destinationUrl,
        });

        if (suggestions.length >= 6) break;
      }
    }

    return suggestions;
  }

  /**
   * Management: Retrieves current search index status and health.
   */
  public getStatus(): SearchIndexStatus {
    const counts = {
      products: 0,
      digitalProducts: 0,
      courses: 0,
      services: 0,
      experts: 0,
      categories: 0,
    };

    for (const doc of this.indexCache) {
      if (doc.type === 'PRODUCT') counts.products++;
      else if (doc.type === 'DIGITAL_PRODUCT') counts.digitalProducts++;
      else if (doc.type === 'COURSE') counts.courses++;
      else if (doc.type === 'SERVICE') counts.services++;
      else if (doc.type === 'EXPERT') counts.experts++;
      else if (doc.type === 'CATEGORY') counts.categories++;
    }

    return {
      totalIndexed: this.indexCache.length,
      countsByType: counts,
      lastReindexedAt: this.lastIndexedAt,
      isHealthy: this.isIndexWarm && this.indexCache.length > 0,
    };
  }
}

export const searchService = new SearchService();

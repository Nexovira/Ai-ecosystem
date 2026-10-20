import { Product, ProductVariant, ProductImage, ProductSpecification } from '../types/marketplace';
import { ProductFormInput } from '../types/seller';

/**
 * Recursively sanitizes any data payload targeted for Firestore,
 * ensuring NO `undefined` values exist anywhere in top-level or nested objects and arrays.
 * 
 * Invariants strictly preserved:
 * - `0` (numbers like price, stock, order, zero balances)
 * - `false` (booleans like isPrimary, isApproved, affiliateEligible)
 * - `""` (intentional empty strings where acceptable)
 * - `[]` (empty arrays such as variants: [] or specifications: [])
 * - `null` (intentional null values or schema-sanctioned clears)
 * - `Date` instances and Firestore FieldValues (serverTimestamp, deleteField)
 */
export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) {
    return undefined as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  // Preserve Date instances and Firestore sentinel objects (serverTimestamp, deleteField, etc.)
  if (data instanceof Date || ('_methodName' in (data as Record<string, unknown>))) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = sanitizeFirestoreData(value);
    }
  }
  return result as T;
}

/**
 * Validates and normalizes product variants.
 * Guarantees every variant has required identifiers, numerical price and stock,
 * and valid non-undefined attributes dictionary.
 */
export function normalizeVariants(
  variants?: unknown[] | null
): ProductVariant[] {
  if (!Array.isArray(variants) || variants.length === 0) {
    return [];
  }

  const normalizedList: ProductVariant[] = [];

  for (let i = 0; i < variants.length; i++) {
    const raw = variants[i];
    if (!raw || typeof raw !== 'object') continue;

    const v = raw as Partial<ProductVariant>;
    const name = typeof v.name === 'string' ? v.name.trim() : `Variant ${i + 1}`;
    const sku = typeof v.sku === 'string' ? v.sku.trim() : `VAR-${i + 1}`;
    const price = typeof v.price === 'number' && !isNaN(v.price) ? Math.max(0, v.price) : 0;
    const stockQuantity =
      typeof v.stockQuantity === 'number' && !isNaN(v.stockQuantity) ? Math.max(0, v.stockQuantity) : 0;

    // Attributes map
    const attributes: Record<string, string> = {};
    if (v.attributes && typeof v.attributes === 'object') {
      for (const [attrKey, attrVal] of Object.entries(v.attributes)) {
        if (attrKey && attrVal !== undefined && attrVal !== null) {
          attributes[String(attrKey).trim()] = String(attrVal).trim();
        }
      }
    }

    normalizedList.push({
      variantId: v.variantId || `var-${Date.now()}-${i}`,
      name,
      sku,
      price,
      stockQuantity,
      attributes,
    });
  }

  return normalizedList;
}

/**
 * Normalizes product images array, ensuring at least one image exists,
 * exactly one is primary, and all properties are valid.
 */
export function normalizeProductImages(
  images?: unknown[] | null,
  fallbackTitle: string = 'Product Image'
): ProductImage[] {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const normalized: ProductImage[] = [];
  let foundPrimary = false;

  for (let i = 0; i < images.length; i++) {
    const raw = images[i];
    if (!raw || typeof raw !== 'object') continue;
    const img = raw as Partial<ProductImage>;
    if (!img.url || typeof img.url !== 'string' || !img.url.trim()) continue;

    const isPrimary = Boolean(img.isPrimary) && !foundPrimary;
    if (isPrimary) foundPrimary = true;

    normalized.push({
      id: img.id || `img-${i + 1}`,
      url: img.url.trim(),
      alt: img.alt?.trim() || `${fallbackTitle} view ${i + 1}`,
      isPrimary,
      order: typeof img.order === 'number' && !isNaN(img.order) ? img.order : i + 1,
    });
  }

  // Ensure first image is marked primary if none was
  if (normalized.length > 0 && !foundPrimary) {
    normalized[0].isPrimary = true;
  }

  return normalized;
}

/**
 * Normalizes product specifications, filtering out incomplete entries.
 */
export function normalizeSpecifications(
  specs?: unknown[] | null
): ProductSpecification[] {
  if (!Array.isArray(specs) || specs.length === 0) {
    return [];
  }

  const result: ProductSpecification[] = [];
  for (const s of specs) {
    if (!s || typeof s !== 'object') continue;
    const spec = s as Partial<ProductSpecification>;
    const label = typeof spec.label === 'string' ? spec.label.trim() : '';
    const value = typeof spec.value === 'string' ? spec.value.trim() : '';
    if (label && value) {
      result.push({ label, value });
    }
  }

  return result;
}

/**
 * Comprehensive Product normalizer for Firestore writes.
 * Produces a pristine, schema-compliant dictionary with:
 * - NO undefined fields in top-level or nested objects
 * - `variants: []` guaranteed if no variants exist
 * - `specifications: []` guaranteed if no specifications exist
 * - `productImages: []` guaranteed with validated structure
 * - Explicit omission of empty optional fields (subcategory, discountPrice)
 * - Clean numerical enforcement for price, stock, discountPrice
 */
export function normalizeProductForFirestore(
  productId: string,
  sellerId: string,
  input: ProductFormInput,
  options?: {
    isPublished?: boolean;
    existingProduct?: Partial<Product>;
    timestamps?: {
      createdAt?: unknown;
      updatedAt?: unknown;
      publishedAt?: unknown;
    };
  }
): Record<string, unknown> {
  const name = input.name.trim();
  const slug = input.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const brand = input.brand.trim();
  const sku = input.sku.trim();
  const price = typeof input.price === 'number' && !isNaN(input.price) ? Math.max(0, input.price) : 0;
  const stockQuantity = typeof input.stockQuantity === 'number' && !isNaN(input.stockQuantity) ? Math.max(0, input.stockQuantity) : 0;
  const currency = input.currency?.trim() || 'NGN';
  const category = input.category?.trim() || 'Other';
  const availabilityStatus = stockQuantity === 0 ? 'OUT_OF_STOCK' : input.availabilityStatus || 'IN_STOCK';
  const productStatus = input.productStatus || 'DRAFT';
  const shortDescription = input.shortDescription?.trim() || name;
  const fullDescription = input.fullDescription?.trim() || shortDescription;

  // Normalized collections
  const productImages = normalizeProductImages(input.productImages, name);
  const specifications = normalizeSpecifications(input.specifications);
  const variants = normalizeVariants(input.variants);

  // Construct raw base record
  const record: Record<string, unknown> = {
    productId,
    sellerId,
    name,
    slug,
    category,
    brand,
    sku,
    price,
    currency,
    stockQuantity,
    availabilityStatus,
    productStatus,
    shortDescription,
    fullDescription,
    productImages,
    specifications,
    variants, // Always normalized as an array, NEVER undefined
  };

  // Optional subcategory: include only if present and non-empty
  if (input.subcategory && input.subcategory.trim()) {
    record.subcategory = input.subcategory.trim();
  }

  // Optional discountPrice: include only if valid positive number less than price
  if (input.discountPrice !== undefined && input.discountPrice !== null && String(input.discountPrice).trim() !== '') {
    const numDiscount = Number(input.discountPrice);
    if (!isNaN(numDiscount) && numDiscount > 0) {
      record.discountPrice = numDiscount;
    }
  }

  // Timestamps
  if (options?.timestamps) {
    if (options.timestamps.createdAt !== undefined) {
      record.createdAt = options.timestamps.createdAt;
    }
    if (options.timestamps.updatedAt !== undefined) {
      record.updatedAt = options.timestamps.updatedAt;
    }
    if (options.timestamps.publishedAt !== undefined) {
      record.publishedAt = options.timestamps.publishedAt;
    }
  }

  // Deep sanitize to guarantee no undefined values exist
  return sanitizeFirestoreData(record);
}

/**
 * Normalizes an update payload for a Product, ensuring only valid, non-undefined fields
 * are included in the Firestore update dictionary.
 */
export function normalizeProductUpdatesForFirestore(
  updates: Partial<ProductFormInput>,
  existingProduct?: Product
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    const name = updates.name.trim();
    result.name = name;
    if (updates.slug !== undefined) {
      result.slug = updates.slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  } else if (updates.slug !== undefined) {
    result.slug = updates.slug.trim();
  }

  if (updates.brand !== undefined) result.brand = updates.brand.trim();
  if (updates.category !== undefined) result.category = updates.category.trim();
  if (updates.sku !== undefined) result.sku = updates.sku.trim();
  if (updates.currency !== undefined) result.currency = updates.currency.trim();

  if (updates.subcategory !== undefined) {
    const trimmed = updates.subcategory.trim();
    if (trimmed) {
      result.subcategory = trimmed;
    } else {
      // If cleared, either delete or set to null if allowed, or omit
      result.subcategory = '';
    }
  }

  if (updates.price !== undefined) {
    const p = Number(updates.price);
    if (!isNaN(p)) result.price = Math.max(0, p);
  }

  if (updates.discountPrice !== undefined) {
    if (updates.discountPrice === null || String(updates.discountPrice).trim() === '') {
      result.discountPrice = null;
    } else {
      const dp = Number(updates.discountPrice);
      if (!isNaN(dp) && dp > 0) {
        result.discountPrice = dp;
      } else {
        result.discountPrice = null;
      }
    }
  }

  if (updates.stockQuantity !== undefined) {
    const sq = Number(updates.stockQuantity);
    if (!isNaN(sq)) {
      result.stockQuantity = Math.max(0, sq);
      if (sq === 0 && updates.availabilityStatus === undefined) {
        result.availabilityStatus = 'OUT_OF_STOCK';
      }
    }
  }

  if (updates.availabilityStatus !== undefined) result.availabilityStatus = updates.availabilityStatus;
  if (updates.productStatus !== undefined) result.productStatus = updates.productStatus;
  if (updates.shortDescription !== undefined) result.shortDescription = updates.shortDescription.trim();
  if (updates.fullDescription !== undefined) result.fullDescription = updates.fullDescription.trim();

  if (updates.productImages !== undefined) {
    result.productImages = normalizeProductImages(updates.productImages);
  }

  if (updates.specifications !== undefined) {
    result.specifications = normalizeSpecifications(updates.specifications);
  }

  if (updates.variants !== undefined) {
    // Variants are normalized as an array, NEVER undefined
    result.variants = normalizeVariants(updates.variants);
  }

  return sanitizeFirestoreData(result);
}

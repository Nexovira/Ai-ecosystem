import {
  normalizeProductForFirestore,
  normalizeProductUpdatesForFirestore,
  normalizeVariants,
  normalizeProductImages,
  normalizeSpecifications,
  sanitizeFirestoreData,
} from '../src/utils/productNormalization';
import { ProductFormInput } from '../src/types/seller';
import { Product } from '../src/types/marketplace';

// Deep inspection helper to verify no undefined values anywhere
function findUndefinedFields(obj: unknown, path = ''): string[] {
  const issues: string[] = [];
  if (obj === undefined) {
    issues.push(path || 'ROOT');
    return issues;
  }
  if (obj === null || typeof obj !== 'object') {
    return issues;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      if (item === undefined) {
        issues.push(`${path}[${idx}]`);
      } else {
        issues.push(...findUndefinedFields(item, `${path}[${idx}]`));
      }
    });
    return issues;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (value === undefined) {
      issues.push(currentPath);
    } else {
      issues.push(...findUndefinedFields(value, currentPath));
    }
  }
  return issues;
}

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, extra?: string) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ''}`);
    failed++;
  }
}

console.log('=== NEXOVIRA FIRESTORE NORMALIZATION TEST SUITE ===\n');

// -------------------------------------------------------------------------
// TEST 1: Creating a product WITHOUT variants
// -------------------------------------------------------------------------
const productWithoutVariantsInput: ProductFormInput = {
  name: 'Sony WH-1000XM5 Studio Headphones',
  slug: 'sony-wh-1000xm5-studio-headphones',
  category: 'Electronics',
  subcategory: undefined, // Notice optional undefined
  brand: 'Sony',
  sku: 'SNY-WH1000-XM5',
  price: 450000,
  currency: 'NGN',
  discountPrice: undefined, // Notice optional undefined
  stockQuantity: 15,
  availabilityStatus: 'IN_STOCK',
  productStatus: 'PUBLISHED',
  shortDescription: 'Industry-leading noise cancelling with two processors and 8 microphones.',
  fullDescription: 'Full studio audio clarity engineered for high-fidelity monitoring and low latency.',
  productImages: [
    { id: 'img-1', url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', alt: 'Front view', isPrimary: true, order: 1 },
  ],
  specifications: [
    { label: 'Battery Life', value: '30 Hours' },
    { label: 'Weight', value: '250g' },
  ],
  variants: [], // Empty variants array
};

const normalizedNoVariants = normalizeProductForFirestore(
  'prod-test-01',
  'seller-123',
  productWithoutVariantsInput,
  {
    isPublished: true,
    timestamps: {
      createdAt: '2026-10-18T10:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
      publishedAt: '2026-10-18T10:00:00Z',
    },
  }
);

const undefinedInNoVariants = findUndefinedFields(normalizedNoVariants);
assert('Test 1.1: No undefined values in product without variants', undefinedInNoVariants.length === 0, undefinedInNoVariants.join(', '));
assert('Test 1.2: Variants field is normalized to an empty array []', Array.isArray(normalizedNoVariants.variants) && (normalizedNoVariants.variants as any[]).length === 0);
assert('Test 1.3: Subcategory undefined is safely omitted', !('subcategory' in normalizedNoVariants));
assert('Test 1.4: DiscountPrice undefined is safely omitted', !('discountPrice' in normalizedNoVariants));
assert('Test 1.5: Stock quantity (15) and price (450000) preserved', normalizedNoVariants.stockQuantity === 15 && normalizedNoVariants.price === 450000);

// -------------------------------------------------------------------------
// TEST 2: Creating a product WITH valid variants
// -------------------------------------------------------------------------
const productWithVariantsInput: ProductFormInput = {
  name: 'LG 55-Inch OLED evo 4K Smart Cinema Display',
  slug: 'lg-55-inch-oled-evo-4k',
  category: 'Electronics',
  subcategory: 'Smart TVs',
  brand: 'LG',
  sku: 'LG-OLED-EVO',
  price: 1850000,
  currency: 'NGN',
  discountPrice: 1720000,
  stockQuantity: 10,
  availabilityStatus: 'IN_STOCK',
  productStatus: 'PUBLISHED',
  shortDescription: 'Self-lit OLED pixels with alpha-9 Gen6 AI Processor.',
  fullDescription: 'High dynamic range cinema screen.',
  productImages: [
    { id: 'img-tv-1', url: 'https://res.cloudinary.com/demo/image/upload/tv55.jpg', alt: '55-inch view', isPrimary: true, order: 1 },
  ],
  specifications: [{ label: 'Screen', value: 'OLED' }],
  variants: [
    {
      variantId: 'var-55',
      name: '55-Inch Screen',
      sku: 'LG-OLED-55',
      price: 1850000,
      stockQuantity: 6,
      attributes: { size: '55-inch' },
    },
    {
      variantId: 'var-65',
      name: '65-Inch Screen',
      sku: 'LG-OLED-65',
      price: 2450000,
      stockQuantity: 4,
      attributes: { size: '65-inch' },
    },
  ],
};

const normalizedWithVariants = normalizeProductForFirestore(
  'prod-test-02',
  'seller-123',
  productWithVariantsInput
);

const undefinedInWithVariants = findUndefinedFields(normalizedWithVariants);
assert('Test 2.1: No undefined values in product with variants', undefinedInWithVariants.length === 0, undefinedInWithVariants.join(', '));
assert('Test 2.2: Variants array has exactly 2 items', Array.isArray(normalizedWithVariants.variants) && (normalizedWithVariants.variants as any[]).length === 2);
assert('Test 2.3: Nested variant attributes preserved properly', (normalizedWithVariants.variants as any[])[0].attributes.size === '55-inch');
assert('Test 2.4: Discount price preserved as valid number (1720000)', normalizedWithVariants.discountPrice === 1720000);
assert('Test 2.5: Subcategory preserved as string "Smart TVs"', normalizedWithVariants.subcategory === 'Smart TVs');

// -------------------------------------------------------------------------
// TEST 3: Editing an existing product (Partial update normalization)
// -------------------------------------------------------------------------
const partialUpdates: Partial<ProductFormInput> = {
  price: 1690000,
  discountPrice: null as any, // Explicitly clearing discountPrice
  stockQuantity: 0, // Invariant: stock 0 must NOT be stripped or turned into undefined!
  availabilityStatus: 'OUT_OF_STOCK',
  variants: [], // User removed all variants
};

const normalizedUpdates = normalizeProductUpdatesForFirestore(partialUpdates);
const undefinedInUpdates = findUndefinedFields(normalizedUpdates);

assert('Test 3.1: No undefined values in partial update dictionary', undefinedInUpdates.length === 0, undefinedInUpdates.join(', '));
assert('Test 3.2: Numerical zero (0) stockQuantity is strictly preserved', normalizedUpdates.stockQuantity === 0);
assert('Test 3.3: Cleared discountPrice sets null to remove old discount in Firestore', normalizedUpdates.discountPrice === null);
assert('Test 3.4: Cleared variants normalizes to empty array []', Array.isArray(normalizedUpdates.variants) && (normalizedUpdates.variants as any[]).length === 0);
assert('Test 3.5: Updated price (1690000) preserved', normalizedUpdates.price === 1690000);

// -------------------------------------------------------------------------
// TEST 4: Saving multiple product image URLs
// -------------------------------------------------------------------------
const rawImages = [
  { id: 'img-1', url: 'https://res.cloudinary.com/demo/tv1.jpg', alt: 'View 1', isPrimary: true, order: 1 },
  { id: 'img-2', url: 'https://res.cloudinary.com/demo/tv2.jpg', alt: 'View 2', isPrimary: false, order: 2 },
  { id: 'img-3', url: 'https://res.cloudinary.com/demo/tv3.jpg', alt: 'View 3', isPrimary: false, order: 3 },
  { id: 'img-4', url: 'https://res.cloudinary.com/demo/tv4.jpg', alt: 'View 4', isPrimary: false, order: 4 },
];

const normalizedImages = normalizeProductImages(rawImages, 'Smart TV');
assert('Test 4.1: Exactly 4 normalized images produced', normalizedImages.length === 4);
assert('Test 4.2: First image is primary, others are not', normalizedImages[0].isPrimary === true && normalizedImages[1].isPrimary === false);
assert('Test 4.3: Order indices preserved correctly', normalizedImages[3].order === 4);
assert('Test 4.4: No undefined in normalized images array', findUndefinedFields(normalizedImages).length === 0);

// -------------------------------------------------------------------------
// TEST 5: Digital product normalization with optional externalFileUrl & preview
// -------------------------------------------------------------------------
const rawDigitalProduct = {
  productId: 'dig-arch-001',
  title: 'Microservices Resiliency Blueprint',
  price: 0, // Invariant: free digital product must preserve 0
  isFree: true, // Invariant: boolean false/true preserved
  externalFileUrl: undefined, // Optional link
  downloadLimit: -1, // Unlimited
  fileMetadata: {
    fileName: 'blueprint.pdf',
    fileSize: 4500000,
    fileType: 'pdf',
    version: '1.0',
    checksum: undefined, // Notice undefined in nested object
  },
  previewInfo: {
    previewType: 'EXCERPT',
    excerptText: undefined, // Notice undefined in nested object
    previewImages: [],
  },
  salesCount: 0,
  affiliateEligible: false, // Invariant: false must NOT be stripped
};

const sanitizedDigital = sanitizeFirestoreData(rawDigitalProduct);
const undefinedInDigital = findUndefinedFields(sanitizedDigital);

assert('Test 5.1: No undefined values in digital product', undefinedInDigital.length === 0, undefinedInDigital.join(', '));
assert('Test 5.2: price: 0 is preserved', sanitizedDigital.price === 0);
assert('Test 5.3: affiliateEligible: false is preserved', sanitizedDigital.affiliateEligible === false);
assert('Test 5.4: isFree: true is preserved', sanitizedDigital.isFree === true);
assert('Test 5.5: Nested undefined checksum is eliminated from fileMetadata', !('checksum' in sanitizedDigital.fileMetadata));
assert('Test 5.6: Nested undefined excerptText is eliminated from previewInfo', !('excerptText' in sanitizedDigital.previewInfo));

// -------------------------------------------------------------------------
// TEST 6: Invariant preservation (false, 0, "", [], null, Date)
// -------------------------------------------------------------------------
const trickyPayload = {
  zeroNumber: 0,
  falseBool: false,
  emptyStr: '',
  emptyArr: [],
  nullVal: null,
  validDate: new Date('2026-10-18T10:00:00Z'),
  undefinedProp: undefined,
  nested: {
    zero: 0,
    subUndef: undefined,
    deepArray: [0, false, null, { valid: true, undef: undefined }],
  },
};

const cleansed = sanitizeFirestoreData(trickyPayload);
const undefInCleansed = findUndefinedFields(cleansed);

assert('Test 6.1: Zero undefined properties remain in tricky payload', undefInCleansed.length === 0, undefInCleansed.join(', '));
assert('Test 6.2: zeroNumber: 0 survived', cleansed.zeroNumber === 0);
assert('Test 6.3: falseBool: false survived', cleansed.falseBool === false);
assert('Test 6.4: emptyStr: "" survived', cleansed.emptyStr === '');
assert('Test 6.5: emptyArr: [] survived', Array.isArray(cleansed.emptyArr) && cleansed.emptyArr.length === 0);
assert('Test 6.6: nullVal: null survived', cleansed.nullVal === null);
assert('Test 6.7: validDate instance survived', cleansed.validDate instanceof Date);
assert('Test 6.8: undefinedProp is deleted', !('undefinedProp' in cleansed));
assert('Test 6.9: nested.subUndef is deleted', !('subUndef' in cleansed.nested));
assert('Test 6.10: deepArray[3].undef is deleted', !('undef' in (cleansed.nested.deepArray[3] as any)));

// -------------------------------------------------------------------------
// TEST 7: JSON serialization compatibility
// -------------------------------------------------------------------------
const jsonString = JSON.stringify(normalizedNoVariants);
const reloaded = JSON.parse(jsonString);
assert('Test 7.1: Reloaded product from JSON has variants: []', Array.isArray(reloaded.variants) && reloaded.variants.length === 0);
assert('Test 7.2: Reloaded product has valid name and price', reloaded.name === 'Sony WH-1000XM5 Studio Headphones' && reloaded.price === 450000);

console.log(`\n==================================================`);
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`==================================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

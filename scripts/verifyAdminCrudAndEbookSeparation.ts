import { db } from '../src/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../src/data/marketplaceCatalog';
import { servicesService } from '../src/server/servicesService';
import { digitalProductService } from '../src/server/digitalProductService';
import { antiResurrectionService } from '../src/server/antiResurrectionService';
import { commerceService } from '../src/server/commerceService';

async function runAudit() {
  console.log('========================================================================');
  console.log('NEXOVIRA — ADMIN CRUD API, TECH SERVICE CATEGORIES & EBOOK AUDIT');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: Physical Marketplace Strict Separation
    // ---------------------------------------------------------
    console.log('--- TEST GROUP 1: Physical Marketplace Catalog Separation ---');
    const hasDigitalCatInMarketplace = INITIAL_CATEGORIES.some(
      (c) =>
        c.categoryId === 'digital-products-ebooks' ||
        c.slug === 'digital-products-ebooks' ||
        c.name.toLowerCase().includes('ebook') ||
        c.name.toLowerCase().includes('digital')
    );
    assert(!hasDigitalCatInMarketplace, 'Marketplace INITIAL_CATEGORIES excludes digital & ebook categories');

    const hasDigitalProdInMarketplace = INITIAL_PRODUCTS.some(
      (p) =>
        p.isDigital === true ||
        p.category.toLowerCase().includes('ebook') ||
        p.sku.startsWith('DP-') ||
        p.sku.startsWith('NEXO-EBK-')
    );
    assert(!hasDigitalProdInMarketplace, 'Marketplace INITIAL_PRODUCTS contains ZERO digital ebooks');

    const physicalHardwareProductsExist = INITIAL_PRODUCTS.length >= 2 && INITIAL_PRODUCTS.every((p) => p.isDigital === false);
    assert(physicalHardwareProductsExist, 'Marketplace contains verified physical technology hardware products');

    // ---------------------------------------------------------
    // TEST 2: Tech Service Category CRUD & Deletion
    // ---------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Tech Service Category CRUD & Deletion ---');
    const testCatId = `sc-test-${Date.now()}`;
    const testCatSlug = `test-tech-${Date.now()}`;

    // 1. Create test category
    const createdCat = await servicesService.createOrUpdateCategory({
      id: testCatId,
      name: 'Test Autonomous Robotics',
      slug: testCatSlug,
      description: 'Robotics and autonomous embedded control systems',
      icon: 'Cpu',
      isActive: true,
      displayOrder: 99,
      skills: ['ROS2', 'Embedded C', 'Hardware Integration'],
    });
    assert(createdCat && createdCat.id === testCatId, 'ServicesService creates new service category with complete metadata');

    // 2. Verify category exists in Firestore
    const catSnap = await getDoc(doc(db, 'serviceCategories', testCatId));
    assert(catSnap.exists() && catSnap.data().name === 'Test Autonomous Robotics', 'New category persisted into authoritative Firestore');

    // 3. Delete category
    const deleteResult = await servicesService.deleteCategory(testCatId);
    assert(deleteResult.success === true && deleteResult.mode === 'DELETED', 'deleteCategory succeeds and returns clean JSON without throwing');

    // 4. Verify tombstone created to prevent resurrection
    const isTombstoned = antiResurrectionService.isTombstoned('service_category', testCatId);
    assert(isTombstoned, 'Deleted service category recorded in anti-resurrection tombstone registry');

    // 5. Test idempotency: deleting an already-deleted or non-existent category returns clean response without throwing
    const idempotentDelete = await servicesService.deleteCategory(testCatId);
    assert(idempotentDelete.success === true, 'Deleting non-existent or previously deleted category returns clean result without crashing');

    // ---------------------------------------------------------
    // TEST 3: Digital Ebook Administration Lifecycle
    // ---------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Digital Ebook Administration & Persistence ---');
    const testEbookId = `dp-test-${Date.now()}`;
    const testEbookSlug = `test-ebook-${Date.now()}`;

    // 1. Create digital ebook with external cover image and external reading URL (Publuu)
    const createdEbook = await digitalProductService.createDigitalProduct(
      'admin-nexovira-owner',
      'Nexovira Executive Administrator',
      'MANAGEMENT',
      {
        title: 'Mastering AI Studio & Cloud Deployments',
        shortDescription: 'Production architecture masterclass for AI applications.',
        description: 'Complete blueprint for multi-domain cloud hosting, Firestore synchronization, and zero-downtime releases.',
        categorySlug: 'cloud-systems',
        productType: 'EBOOK',
        price: 9500,
        currency: 'NGN',
        coverImage: 'https://res.cloudinary.com/wvhlx8ym/image/upload/v1793810440/AI-Driven_Business_Blueprint.png',
        publuuUrl: 'https://publuu.com/flip-book/1209759/2692765',
        externalReadingUrl: 'https://publuu.com/flip-book/1209759/2692765',
        fileMetadata: {
          fileName: 'mastering-ai-studio-cloud.pdf',
          fileSize: 15420000,
          fileType: 'pdf',
          mimeType: 'application/pdf',
          version: '1.0',
          pageCount: 120,
        },
        storagePath: 'protected/digital-products/mastering-ai-studio-cloud.pdf',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      }
    );
    assert(createdEbook && createdEbook.productId.length > 0, 'DigitalProductService creates new ebook with external cover and Publuu URL');

    // 2. Verify publication in Firestore
    const ebookDocSnap = await getDoc(doc(db, 'digitalProducts', createdEbook.productId));
    assert(ebookDocSnap.exists(), 'New digital ebook persisted to authoritative Firestore');

    // 3. Edit digital ebook (price update and status change)
    const updatedEbook = await digitalProductService.updateDigitalProduct(
      createdEbook.productId,
      'admin-nexovira-owner',
      {
        price: 8500,
        status: 'DRAFT',
      },
      true
    );
    assert(updatedEbook.price === 8500 && updatedEbook.status === 'DRAFT', 'Digital ebook successfully updated with price & draft status');

    // 4. Delete digital ebook permanently (0 customer entitlements)
    const ebookDeleteResult = await digitalProductService.deleteDigitalProduct(
      createdEbook.productId,
      'admin-nexovira-owner',
      true,
      true
    );
    assert(ebookDeleteResult.success === true && ebookDeleteResult.mode === 'PERMANENT', 'Digital ebook permanently deleted when 0 customer entitlements exist');

    // 5. Verify tombstone created
    const isEbookTombstoned = antiResurrectionService.isTombstoned('digital_product', createdEbook.productId);
    assert(isEbookTombstoned, 'Deleted digital ebook recorded in anti-resurrection tombstone registry');

    // ---------------------------------------------------------
    // TEST 4: Customer Entitlement Preservation Guarantee
    // ---------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Customer Entitlement Preservation Guarantee ---');
    const entitledEbook = await digitalProductService.createDigitalProduct(
      'admin-nexovira-owner',
      'Nexovira Executive Administrator',
      'MANAGEMENT',
      {
        title: 'Customer Entitlement Protected Playbook',
        shortDescription: 'Playbook with customer purchases.',
        description: 'Customer protected publication masterclass.',
        categorySlug: 'cloud-systems',
        productType: 'EBOOK',
        price: 5000,
        currency: 'NGN',
        coverImage: 'https://res.cloudinary.com/wvhlx8ym/image/upload/v1793810440/AI-Driven_Business_Blueprint.png',
        fileMetadata: {
          fileName: 'customer-entitlement-playbook.pdf',
          fileSize: 8200000,
          fileType: 'pdf',
          mimeType: 'application/pdf',
          version: '1.0',
        },
        storagePath: 'protected/digital-products/customer-entitlement-playbook.pdf',
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      }
    );
    const entitledEbookId = entitledEbook.productId;

    // Grant customer entitlement
    const entitlement = await digitalProductService.grantEntitlement(
      'customer-user-123',
      entitledEbookId,
      'order-ref-987'
    );
    assert(entitlement && entitlement.entitlementId.length > 0, 'Customer entitlement granted successfully for digital ebook');

    // Attempt deletion: Must archive safely instead of deleting so customer never loses access
    const archiveResult = await digitalProductService.deleteDigitalProduct(
      entitledEbookId,
      'admin-nexovira-owner',
      true,
      true
    );
    assert(archiveResult.success === true && archiveResult.mode === 'ARCHIVED', 'Archival safety enforced: Publication with customer entitlements is ARCHIVED, not permanently destroyed');

    // Verify customer entitlement is still valid
    const userEntitlements = await digitalProductService.getUserEntitlements('customer-user-123');
    const stillHasAccess = userEntitlements.some((e) => e.productId === entitledEbookId);
    assert(stillHasAccess, 'Customer retains full lifetime reading and download access even after administrator withdraws/archives publication');

    // Cleanup test entitlement
    await deleteDoc(doc(db, 'digitalEntitlements', entitlement.entitlementId)).catch(() => {});
    await deleteDoc(doc(db, 'digitalProducts', entitledEbookId)).catch(() => {});

    // ---------------------------------------------------------
    // TEST 5: Active Production Digital Ebooks Verification
    // ---------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Active Production Ebooks in Firestore ---');
    const activeEbooksSnap = await getDocs(collection(db, 'digitalProducts'));
    const activeEbooks = activeEbooksSnap.docs.map((d) => d.data());
    const aiBlueprint = activeEbooks.find((e) => e.slug === 'the-ai-driven-business-blueprint' || e.productId === 'dp-ai-driven-business-blueprint');
    const phoneWebsite = activeEbooks.find((e) => e.slug === 'build-a-website-for-free-from-your-phone' || e.productId === 'dp-build-website-free-from-phone');

    assert(Boolean(aiBlueprint), 'The AI-Driven Business Blueprint ebook exists in authoritative Firestore');
    if (aiBlueprint) {
      assert(Boolean(aiBlueprint.coverImage && (aiBlueprint.publuuUrl || aiBlueprint.externalReadingUrl)), 'AI Blueprint ebook contains valid coverImage and Publuu reading URL');
    }

    assert(Boolean(phoneWebsite), 'Build A Website For Free From Your Phone ebook exists in authoritative Firestore');
    if (phoneWebsite) {
      assert(Boolean(phoneWebsite.coverImage && (phoneWebsite.publuuUrl || phoneWebsite.externalReadingUrl)), 'Build Website From Phone ebook contains valid coverImage and Publuu reading URL');
    }

    console.log('\n========================================================================');
    console.log(`AUDIT RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('========================================================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  }
}

runAudit();

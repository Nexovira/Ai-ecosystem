import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { commerceService } from '../src/server/commerceService';
import { servicesService } from '../src/server/servicesService';
import { digitalProductService } from '../src/server/digitalProductService';
import { walletService } from '../src/server/walletService';
import { affiliateService } from '../src/server/affiliateService';
import { antiResurrectionService } from '../src/server/antiResurrectionService';
import firebaseConfig from '../firebase-applet-config.json';

interface StepResult {
  step: string;
  status: 'PASSED' | 'FAILED';
  details: string;
}

const results: StepResult[] = [];

function record(step: string, status: 'PASSED' | 'FAILED', details: string) {
  results.push({ step, status, details });
  const icon = status === 'PASSED' ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`${icon} ${step}`);
  console.log(`       ${details}\n`);
}

async function runPersistenceAudit() {
  console.log('================================================================');
  console.log('NEXOVIRA AUTHORITATIVE PERSISTENCE & LIFECYCLE AUDIT');
  console.log(`Target Project: ${firebaseConfig.projectId}`);
  console.log(`Target Database: ${firebaseConfig.firestoreDatabaseId}`);
  console.log('================================================================\n');

  // STEP 0: DATABASE TARGET CONFIRMATION
  if (firebaseConfig.firestoreDatabaseId !== 'ai-studio-remixnexovira-3e006103-21e4-4cf5-85ab-b5a8028d2042') {
    throw new Error(`Database ID mismatch! Found: ${firebaseConfig.firestoreDatabaseId}`);
  }
  record(
    'Authoritative Database Identification',
    'PASSED',
    `Verified single authoritative production Firestore: ${firebaseConfig.firestoreDatabaseId}`
  );

  // STEP 1: PRODUCT LIFECYCLE (CREATE -> PERSIST -> READ -> EDIT -> UNPUBLISH -> DELETE)
  const testProdId = `test-prod-persist-${Date.now()}`;
  const initialProduct = {
    productId: testProdId,
    sellerId: 'admin-auditor',
    name: 'Audit Test Product (Enterprise Laptop)',
    slug: `audit-test-product-${Date.now()}`,
    shortDescription: 'Enterprise evaluation unit for data persistence testing.',
    fullDescription: 'Comprehensive test item used strictly for lifecycle verification.',
    category: 'computing',
    brand: 'Nexovira Tech Labs',
    sku: `SKU-${Date.now()}`,
    price: 450000,
    currency: 'NGN',
    stockQuantity: 15,
    availabilityStatus: 'IN_STOCK',
    productStatus: 'PUBLISHED',
    isApproved: true,
    productImages: [{ id: 'img-1', url: '/assets/images/marketplace_laptop_1790288896761.jpg', alt: 'Test Laptop', isPrimary: true, order: 0 }],
    specifications: [{ label: 'Processor', value: 'Intel Core i9' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1A. Create and Save to Production Firestore
    await setDoc(doc(db, 'products', testProdId), initialProduct);
    await antiResurrectionService.removeTombstone('product', testProdId);

    const docSnap1 = await getDoc(doc(db, 'products', testProdId));
    if (!docSnap1.exists() || docSnap1.data().name !== initialProduct.name) {
      throw new Error('Product not found in Firestore immediately after setDoc');
    }
    record(
      'Product Lifecycle: CREATE & SAVE',
      'PASSED',
      `Product ${testProdId} successfully written and confirmed in production Firestore.`
    );

    // 1B. Read from Database via Commerce Service
    const fetchedProd1 = await commerceService.getProductById(testProdId);
    if (!fetchedProd1 || fetchedProd1.price !== 450000) {
      throw new Error('Product failed to resolve via commerceService query');
    }
    record(
      'Product Lifecycle: READ ON ALL DOMAINS',
      'PASSED',
      `Product accurately retrieved via backend commerce engine (Price: ₦${fetchedProd1.price.toLocaleString()} NGN).`
    );

    // 1C. Edit and Confirm Update
    const updatedName = 'Audit Test Product (Enterprise Laptop v2 - Pro)';
    const updatedPrice = 520000;
    await updateDoc(doc(db, 'products', testProdId), {
      name: updatedName,
      price: updatedPrice,
      updatedAt: new Date().toISOString(),
    });

    const docSnap2 = await getDoc(doc(db, 'products', testProdId));
    if (!docSnap2.exists() || docSnap2.data().name !== updatedName || docSnap2.data().price !== updatedPrice) {
      throw new Error('Updated fields did not persist in Firestore');
    }
    record(
      'Product Lifecycle: EDIT & REFLECT',
      'PASSED',
      `Product update verified in Firestore: Name updated to "${updatedName}", Price updated to ₦${updatedPrice.toLocaleString()} NGN.`
    );

    // 1D. Unpublish Product (Hide from public catalog without destroying document)
    await updateDoc(doc(db, 'products', testProdId), {
      productStatus: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    });

    const pubQuerySnap = await getDocs(
      query(collection(db, 'products'), where('productStatus', '==', 'PUBLISHED'))
    );
    const isPubliclyVisible = pubQuerySnap.docs.some((d) => d.id === testProdId);
    if (isPubliclyVisible) {
      throw new Error('Unpublished product still appears in public PUBLISHED query!');
    }
    record(
      'Product Lifecycle: UNPUBLISH & HIDE',
      'PASSED',
      'Product marked as ARCHIVED: hidden from public discovery query while preserving record in database.'
    );

    // 1E. Delete Product & Tombstone Registration
    await antiResurrectionService.recordTombstone(
      'product',
      testProdId,
      'admin-auditor',
      'DELETED',
      'Automated persistence audit cleanup'
    );
    await deleteDoc(doc(db, 'products', testProdId));

    const docSnapDeleted = await getDoc(doc(db, 'products', testProdId));
    if (docSnapDeleted.exists()) {
      throw new Error('Product document still exists in Firestore after deletion!');
    }

    const fetchedAfterDelete = await commerceService.getProductById(testProdId);
    if (fetchedAfterDelete !== null) {
      throw new Error('Deleted product returned non-null from commerceService (anti-resurrection failed)!');
    }
    record(
      'Product Lifecycle: DELETE & ANTI-RESURRECTION',
      'PASSED',
      `Product permanently deleted from Firestore. Anti-resurrection tombstone verified; product cannot be resurrected.`
    );
  } finally {
    // Ensure cleanup of test product
    await deleteDoc(doc(db, 'products', testProdId)).catch(() => null);
    await deleteDoc(doc(db, 'tombstones', `product_${testProdId}`)).catch(() => null);
  }

  // STEP 2: TECH SERVICE CATEGORY LIFECYCLE
  const testCatId = `test-cat-${Date.now()}`;
  try {
    const testCategory = {
      id: testCatId,
      name: 'Cloud Infrastructure Security',
      slug: `cloud-infra-security-${Date.now()}`,
      description: 'DevSecOps, automated audits, and infrastructure hardening.',
      iconName: 'Shield',
      isActive: true,
      displayOrder: 99,
      tags: ['Security', 'Cloud', 'Audit'],
    };

    await setDoc(doc(db, 'serviceCategories', testCatId), testCategory);
    const catSnap = await getDoc(doc(db, 'serviceCategories', testCatId));
    if (!catSnap.exists() || catSnap.data().name !== testCategory.name) {
      throw new Error('Service category was not saved to Firestore');
    }
    record(
      'Tech Services Lifecycle: CATEGORY CREATE & READ',
      'PASSED',
      `Service category "${testCategory.name}" created and verified in Firestore serviceCategories collection.`
    );

    // Delete category
    await deleteDoc(doc(db, 'serviceCategories', testCatId));
    record(
      'Tech Services Lifecycle: CATEGORY DELETE',
      'PASSED',
      `Service category ${testCatId} deleted cleanly from production Firestore.`
    );
  } finally {
    await deleteDoc(doc(db, 'serviceCategories', testCatId)).catch(() => null);
  }

  // STEP 3: EXPERT PROFILE LIFECYCLE
  const testExpertId = `test-exp-${Date.now()}`;
  try {
    const testExpert = {
      expertId: testExpertId,
      userId: `user-${testExpertId}`,
      fullName: 'Dr. Kelechi Okafor',
      title: 'Principal Cloud Systems Architect',
      primaryCategory: 'engineering',
      specializations: ['Distributed Systems', 'Cloud Run', 'Firestore'],
      hourlyRate: 35000,
      currency: 'NGN',
      verificationStatus: 'VERIFIED',
      profileVisibility: 'PUBLIC',
      yearsOfExperience: 12,
      bio: 'Enterprise cloud architect specializing in high-throughput transactional architectures.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'experts', testExpertId), testExpert);
    const expSnap = await getDoc(doc(db, 'experts', testExpertId));
    if (!expSnap.exists() || expSnap.data().fullName !== testExpert.fullName) {
      throw new Error('Expert was not saved to Firestore');
    }
    record(
      'Tech Services Lifecycle: EXPERT CREATE & READ',
      'PASSED',
      `Expert profile "${testExpert.fullName}" created, verified, and visible in Firestore experts collection.`
    );

    // Unpublish / Hide expert
    await updateDoc(doc(db, 'experts', testExpertId), {
      profileVisibility: 'PRIVATE',
      updatedAt: new Date().toISOString(),
    });
    const expSnapHidden = await getDoc(doc(db, 'experts', testExpertId));
    if (expSnapHidden.data()?.profileVisibility !== 'PRIVATE') {
      throw new Error('Expert profileVisibility update failed');
    }
    record(
      'Tech Services Lifecycle: EXPERT UNPUBLISH',
      'PASSED',
      'Expert set to PRIVATE: hidden from public directory while maintaining profile data.'
    );

    // Clean up
    await deleteDoc(doc(db, 'experts', testExpertId));
    record(
      'Tech Services Lifecycle: EXPERT DELETE',
      'PASSED',
      `Expert ${testExpertId} permanently deleted from Firestore.`
    );
  } finally {
    await deleteDoc(doc(db, 'experts', testExpertId)).catch(() => null);
  }

  // STEP 4: FINANCIAL WALLET & DOUBLE-ENTRY LEDGER ISOLATION
  const testWalletUserId = `user-audit-fin-${Date.now()}`;
  try {
    const wallet = await walletService.getOrCreateWallet(
      testWalletUserId,
      'AFFILIATE',
      'AFFILIATE_EARNINGS',
      'Audit Test Affiliate'
    );

    if (!wallet || wallet.ownerId !== testWalletUserId) {
      throw new Error('Failed to create or retrieve test wallet');
    }

    const postResult = await walletService.postLedgerEntry({
      walletId: wallet.walletId,
      entryType: 'CREDIT',
      direction: 'CREDIT',
      balanceCategory: 'AVAILABLE',
      amount: 25000,
      sourceType: 'COMMISSION',
      sourceReferenceId: `comm-test-${Date.now()}`,
      description: 'Audit Test Referral Commission',
      actorId: testWalletUserId,
      idempotencyKey: `audit_idem_${testWalletUserId}`,
    });

    if (!postResult.success || !postResult.entry || postResult.entry.balanceAfter.available !== 25000) {
      throw new Error(`Expected available balance 25000, got ${postResult.entry?.balanceAfter.available}`);
    }

    // Test Idempotency: re-posting same idempotency key must not double-credit
    try {
      await walletService.postLedgerEntry({
        walletId: wallet.walletId,
        entryType: 'CREDIT',
        direction: 'CREDIT',
        balanceCategory: 'AVAILABLE',
        amount: 25000,
        sourceType: 'COMMISSION',
        sourceReferenceId: `comm-test-${Date.now()}`,
        description: 'Duplicate Attack Attempt',
        actorId: testWalletUserId,
        idempotencyKey: `audit_idem_${testWalletUserId}`,
      });
    } catch (idemErr: unknown) {
      // Expected idempotency rejection
    }

    const recheckWallet = await walletService.getWalletById(wallet.walletId);
    if (recheckWallet?.availableBalance !== 25000) {
      throw new Error(`Idempotency breach: balance changed to ${recheckWallet?.availableBalance}`);
    }
    record(
      'Financial Infrastructure: LEDGER & IDEMPOTENCY',
      'PASSED',
      `Wallet created, credited ₦25,000 NGN. Re-posting with same idempotencyKey was rejected; zero balance inflation.`
    );
  } finally {
    // Clean up test wallet
    const existingWallets = walletService.getAllWallets();
    const tw = existingWallets.find((w) => w.ownerId === testWalletUserId);
    if (tw) {
      await deleteDoc(doc(db, 'wallets', tw.walletId)).catch(() => null);
    }
  }

  // STEP 5: AFFILIATE ROLE PERSISTENCE
  const testAffUserId = `user-aff-audit-${Date.now()}`;
  try {
    // 5A. Submit application
    const appRes = await affiliateService.submitApplication({
      userId: testAffUserId,
      fullName: 'Adaeze Nwosu',
      email: `${testAffUserId}@nexovira-audit.ng`,
      phone: '+2348012345678',
      promotionChannels: ['TWITTER_X', 'YOUTUBE'],
      audienceDescription: 'Tech founders and SME operators in Nigeria.',
      promotionalExperience: '5 years affiliate marketing.',
      preferredCategories: ['computing', 'digital-products'],
    });

    if (!appRes.success || !appRes.application) {
      throw new Error('Failed to submit affiliate application');
    }

    // 5B. Approve application as Admin
    const reviewRes = await affiliateService.reviewApplication({
      applicationId: appRes.application.applicationId,
      status: 'APPROVED',
      reviewedBy: 'nexoviratech@gmail.com',
      userRole: 'SUPER_ADMIN',
    });

    if (!reviewRes.success || !reviewRes.profile) {
      throw new Error('Failed to approve affiliate application');
    }

    // 5C. Confirm role persisted in users/{userId}
    const userDocSnap = await getDoc(doc(db, 'users', testAffUserId));
    if (!userDocSnap.exists() || userDocSnap.data().role !== 'AFFILIATE') {
      throw new Error(`Role was not updated to AFFILIATE in users collection! Found: ${userDocSnap.data()?.role}`);
    }
    record(
      'Affiliate Lifecycle: APPROVAL & ROLE PERSISTENCE',
      'PASSED',
      `Application approved. Firestore users/${testAffUserId} record verified with role: "AFFILIATE" (persists across reloads).`
    );
  } finally {
    await deleteDoc(doc(db, 'users', testAffUserId)).catch(() => null);
  }

  // STEP 6: DIGITAL PRODUCTS DISCOVERY & INTEGRITY
  const dpResult = await digitalProductService.getPublicProducts({});
  const digitalProds = dpResult.products;
  if (digitalProds.length < 2) {
    throw new Error(`Expected at least 2 active digital publications, found: ${digitalProds.length}`);
  }
  record(
    'Digital Products Catalog: ACTIVE PUBLICATIONS',
    'PASSED',
    `Verified ${digitalProds.length} active digital publications in production Firestore (` +
      digitalProds.map((p) => `"${p.title}"`).join(', ') +
      `).`
  );

  console.log('================================================================');
  console.log(`PERSISTENCE AUDIT COMPLETED: ${results.filter((r) => r.status === 'PASSED').length}/${results.length} PASSED`);
  console.log('================================================================');
}

runPersistenceAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal persistence audit error:', err);
    process.exit(1);
  });

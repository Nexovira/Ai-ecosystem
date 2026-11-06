import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/marketplaceCatalog';
import { INITIAL_COURSES, INITIAL_COURSE_CATEGORIES } from '../data/academyCatalog';
import { INITIAL_SERVICE_CATEGORIES, INITIAL_EXPERTS } from '../data/servicesCatalog';
import { sanitizeFirestoreData } from '../utils/productNormalization';

export interface Tombstone {
  id: string; // e.g. "product_nexo-prod-laptop-studio-16"
  resourceType:
    | 'product'
    | 'expert'
    | 'service'
    | 'service_category'
    | 'course'
    | 'course_category'
    | 'category'
    | 'digital_product'
    | 'digital_category'
    | 'offer'
    | 'banner'
    | 'announcement'
    | 'faq';
  resourceId: string;
  status: 'DELETED' | 'ARCHIVED';
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class AntiResurrectionService {
  private tombstones: Map<string, Tombstone> = new Map();
  private isLoaded = false;
  private isSeeding = false;

  constructor() {
    this.init().catch((err) => {
      console.warn('[AntiResurrectionService] Background initialization warning:', err);
    });
  }

  /**
   * Initializes tombstones from Firestore and ensures database bootstrap is executed only once.
   */
  public async init(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // 1. Hydrate all universal tombstones from Firestore
      const snap = await getDocs(collection(db, 'tombstones')).catch(() => null);
      if (snap && snap.docs) {
        snap.forEach((d) => {
          const t = d.data() as Tombstone;
          this.tombstones.set(t.id, t);
          // Also index by bare resourceId for fast lookup
          this.tombstones.set(t.resourceId, t);
        });
      }

      // Also hydrate legacy deletedProducts collection
      const legacySnap = await getDocs(collection(db, 'deletedProducts')).catch(() => null);
      if (legacySnap && legacySnap.docs) {
        legacySnap.forEach((d) => {
          const data = d.data();
          const pId = data.productId || d.id;
          const tomb: Tombstone = {
            id: `product_${pId}`,
            resourceType: 'product',
            resourceId: pId,
            status: data.mode === 'ARCHIVED' ? 'ARCHIVED' : 'DELETED',
            deletedAt: data.deletedAt || new Date().toISOString(),
            deletedBy: data.deletedBy || 'admin',
            reason: 'Legacy deleted product migration',
          };
          this.tombstones.set(tomb.id, tomb);
          this.tombstones.set(pId, tomb);
        });
      }

      this.isLoaded = true;
    } catch (err) {
      console.error('[AntiResurrectionService] Init error:', err);
    }
  }

  /**
   * Checks if a resource has been tombstoned (permanently deleted or archived).
   */
  public isTombstoned(resourceType: string, resourceId: string): boolean {
    if (!resourceId) return false;
    const compoundKey = `${resourceType}_${resourceId}`;
    return this.tombstones.has(compoundKey) || this.tombstones.has(resourceId);
  }

  /**
   * Returns all active tombstones.
   */
  public async getTombstones(): Promise<Tombstone[]> {
    if (!this.isLoaded) {
      await this.init();
    }
    const unique = new Map<string, Tombstone>();
    this.tombstones.forEach((t) => {
      unique.set(t.id, t);
    });
    return Array.from(unique.values());
  }

  /**
   * Records a permanent deletion tombstone in Firestore and memory.
   */
  public async recordTombstone(
    resourceType: Tombstone['resourceType'],
    resourceId: string,
    deletedBy: string,
    status: 'DELETED' | 'ARCHIVED' = 'DELETED',
    reason = 'Deleted by administrator'
  ): Promise<Tombstone> {
    const tombstoneId = `${resourceType}_${resourceId}`;
    const tombstone: Tombstone = {
      id: tombstoneId,
      resourceType,
      resourceId,
      status,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || 'admin',
      reason,
    };

    // Update in-memory registry immediately
    this.tombstones.set(tombstoneId, tombstone);
    this.tombstones.set(resourceId, tombstone);

    // Persist to authoritative Firestore tombstones collection
    try {
      await setDoc(doc(db, 'tombstones', tombstoneId), tombstone);

      // Also persist to deletedProducts collection if product for backwards compatibility
      if (resourceType === 'product') {
        await setDoc(doc(db, 'deletedProducts', resourceId), {
          productId: resourceId,
          deletedBy,
          deletedAt: tombstone.deletedAt,
          mode: status,
          reason,
        });
      }
    } catch (err) {
      console.error(`[AntiResurrectionService] Failed to persist tombstone for ${tombstoneId}:`, err);
    }

    return tombstone;
  }

  /**
   * Removes a tombstone (explicit admin-only restoration).
   */
  public async removeTombstone(resourceType: string, resourceId: string): Promise<boolean> {
    const tombstoneId = `${resourceType}_${resourceId}`;
    this.tombstones.delete(tombstoneId);
    this.tombstones.delete(resourceId);

    try {
      await deleteDoc(doc(db, 'tombstones', tombstoneId));
      if (resourceType === 'product') {
        await deleteDoc(doc(db, 'deletedProducts', resourceId)).catch(() => null);
      }
      return true;
    } catch (err) {
      console.error(`[AntiResurrectionService] Failed to remove tombstone ${tombstoneId}:`, err);
      return false;
    }
  }
}

export const antiResurrectionService = new AntiResurrectionService();

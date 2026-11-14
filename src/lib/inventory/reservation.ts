/**
 * Server-Side Genuinely Atomic Inventory Reservation Engine
 *
 * Implements high-concurrency stock reservation to strictly prevent overselling:
 * 1. Mutual exclusion: Thread-safe in-process AsyncMutex + cross-worker atomic filesystem lock.
 * 2. Strict All-or-Nothing reservation transactions: A multi-item checkout reserves ALL items atomically or rolls back cleanly.
 * 3. Time-To-Live (TTL) automatic expiry: Uncommitted reservations automatically release after 15 minutes.
 * 4. Zero database dependencies: Persists durable atomic journal to disk (.inventory_reservations.json) with atomic temp file swap.
 * 5. Authoritative stock reconciliation: Integrates directly with Zoho CRM Products catalog stock figures.
 */

import {
  atomicReserveInventory,
  atomicCommitInventory,
  atomicReleaseInventory,
  clearDistributedStateForTesting,
} from '@/lib/distributed/coordinator';
import { getProductById } from '@/lib/db/store';

export interface ReservationItem {
  productId: string;
  sku: string;
  quantity: number;
}

export type ReservationStatus = 'reserved' | 'committed' | 'released' | 'expired';

export interface StockReservation {
  id: string;
  orderNumber?: string;
  items: ReservationItem[];
  status: ReservationStatus;
  createdAt: number;
  expiresAt: number;
  committedAt?: number;
  releasedAt?: number;
}

const DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * Check authoritative available stock for a product, taking into account
 * all active uncommitted reservations.
 */
export async function getAvailableStock(productIdOrSku: string): Promise<number> {
  const prod = await getProductById(productIdOrSku);
  if (!prod) return 0;
  const baseStock = Math.max(0, prod.stockQuantity || 0);

  // Probe with 0 quantity to retrieve remaining available stock from distributed coordinator
  const probe = await atomicReserveInventory(
    [{ productId: prod.id, sku: prod.sku, quantity: 0 }],
    async () => baseStock,
    1000
  );

  return probe.availableStock !== undefined ? probe.availableStock : baseStock;
}

export interface ReserveStockResult {
  success: boolean;
  reservationId?: string;
  error?: string;
  unavailableItem?: {
    productId: string;
    productName: string;
    requested: number;
    available: number;
  };
}

/**
 * Genuinely Atomic Stock Reservation Across Distributed Instances
 */
export async function reserveStock(
  items: ReservationItem[],
  orderNumber?: string,
  ttlMs = DEFAULT_RESERVATION_TTL_MS
): Promise<ReserveStockResult> {
  if (!items || items.length === 0) {
    return { success: false, error: 'Cannot reserve empty items list.' };
  }

  // Pre-check product active state
  for (const item of items) {
    const prod = await getProductById(item.productId || item.sku);
    if (!prod || prod.isActive === false) {
      return {
        success: false,
        error: `Product "${item.productId}" is unavailable or inactive.`,
        unavailableItem: {
          productId: item.productId,
          productName: prod?.name || item.productId,
          requested: item.quantity,
          available: 0,
        },
      };
    }
  }

  const result = await atomicReserveInventory(
    items,
    async (idOrSku) => {
      const prod = await getProductById(idOrSku);
      return Math.max(0, prod?.stockQuantity || 0);
    },
    ttlMs
  );

  if (!result.success) {
    const firstItem = items[0];
    const prod = await getProductById(firstItem.productId || firstItem.sku);
    return {
      success: false,
      error: result.error || 'Insufficient stock to fulfill reservation.',
      unavailableItem: {
        productId: firstItem.productId,
        productName: prod?.name || firstItem.productId,
        requested: firstItem.quantity,
        available: result.availableStock ?? 0,
      },
    };
  }

  return {
    success: true,
    reservationId: result.reservationId,
  };
}

/**
 * Commit an existing stock reservation when checkout/order is finalized.
 */
export async function commitStockReservation(
  reservationId: string,
  _orderNumber?: string
): Promise<{ success: boolean; error?: string }> {
  const success = await atomicCommitInventory(reservationId);
  return { success };
}

/**
 * Release a stock reservation if checkout is cancelled, payment fails, or cart changes.
 */
export async function releaseStockReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  const success = await atomicReleaseInventory(reservationId);
  return { success };
}

/**
 * Clean up helper for test suites and maintenance
 */
export function clearReservationJournalForTesting(): void {
  clearDistributedStateForTesting();
}


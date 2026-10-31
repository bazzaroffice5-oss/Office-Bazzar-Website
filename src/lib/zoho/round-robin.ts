/**
 * Server-Side Round-Robin Customer Lead Assignment Service
 *
 * Implements alternating customer lead assignment between Sales and Marketing:
 *   Customer 1 -> Sales (sales4@officebazzar.com)
 *   Customer 2 -> Marketing (marketing@officebazzar.com)
 *   Customer 3 -> Sales (sales4@officebazzar.com)
 *   Customer 4 -> Marketing (marketing@officebazzar.com)
 *   ...continuing alternating sequentially.
 *
 * Concurrency & Persistence Architecture:
 * 1. Async Mutex (in-process serialized critical section) to guarantee simultaneous
 *    customer submissions in the same Node.js tick/process do not interleave.
 * 2. Persistent Local Disk Cache (`.zoho_lead_round_robin.json`) for instant
 *    low-latency reads and writes across warm invocations.
 * 3. Zoho CRM Settings Organization Variable `ob_lead_round_robin` (`/crm/v6/settings/variables`)
 *    and Zoho CRM Quotes history synchronization to share state across Vercel serverless containers.
 * 4. Stored in Zoho CRM Quotes metadata, human-readable Description, and immutable audit Note.
 * 5. Notification is dispatched ONLY to the assigned admin (no dual/duplicate blast).
 */

import { zohoFetch, isZohoConfigured } from './client';
import { extractStructuredMeta } from './quotes';

export type LeadAssigneeName = 'Sales' | 'Marketing';
export type LeadAssigneeRole = 'ADMIN_1_SALES' | 'ADMIN_2_MARKETING';

export interface LeadAssignee {
  name: LeadAssigneeName;
  email: string;
  label: string;
  role: LeadAssigneeRole;
  sequenceNumber: number;
  assignedAt: string;
}

interface StoredRoundRobinState {
  lastAssigned: LeadAssigneeName;
  lastEmail: string;
  sequenceNumber: number;
  updatedAt: string;
}

const VAR_API_NAME = 'ob_lead_round_robin';
let cachedVarId: string | null = null;

// In-memory state
let memoryState: StoredRoundRobinState | null = null;

// Mutex for concurrency safety
class AsyncMutex {
  private current: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const wait = this.current;
    this.current = this.current.then(() => next);
    await wait;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const assignmentMutex = new AsyncMutex();

function getServerNodeFs(): { fs: any; path: any; os: any } | null {
  if (typeof window !== 'undefined') return null;
  try {
    const req = eval('require');
    return {
      fs: req('fs'),
      path: req('path'),
      os: req('os'),
    };
  } catch {
    return null;
  }
}

function getCacheFilePath(): string | null {
  const mod = getServerNodeFs();
  if (!mod) return null;
  const { fs, path, os } = mod;
  const localPath = path.join(process.cwd(), '.zoho_lead_round_robin.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return localPath;
  } catch {
    return path.join(os.tmpdir(), '.zoho_lead_round_robin.json');
  }
}

function readDiskCache(): StoredRoundRobinState | null {
  try {
    const mod = getServerNodeFs();
    const filePath = getCacheFilePath();
    if (!mod || !filePath || !mod.fs.existsSync(filePath)) return null;
    const raw = mod.fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      (parsed.lastAssigned === 'Sales' || parsed.lastAssigned === 'Marketing') &&
      typeof parsed.sequenceNumber === 'number'
    ) {
      return parsed as StoredRoundRobinState;
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

function writeDiskCache(state: StoredRoundRobinState): void {
  try {
    const mod = getServerNodeFs();
    const filePath = getCacheFilePath();
    if (!mod || !filePath) return;
    mod.fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Ignore cache write errors
  }
}

export function getAdminRecipients(): { salesEmail: string; marketingEmail: string } {
  const salesEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    'sales4@officebazzar.com'
  )
    .trim()
    .toLowerCase();

  const marketingEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL_2 ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL_2 ||
    'marketing@officebazzar.com'
  )
    .trim()
    .toLowerCase();

  return { salesEmail, marketingEmail };
}

/**
 * Read the persistent Round-Robin state from Zoho CRM Settings Organization Variable
 */
async function readStateFromZohoVariable(): Promise<StoredRoundRobinState | null> {
  if (!(await isZohoConfigured())) return null;

  try {
    const res = await zohoFetch<any>('/settings/variables');
    const variables: any[] = res?.variables || [];
    const target = variables.find(
      (v: any) => v.api_name === VAR_API_NAME || v.name === VAR_API_NAME
    );

    if (!target) return null;
    if (target.id) cachedVarId = String(target.id);
    if (!target.value) return null;

    const parsed = JSON.parse(target.value);
    if (
      parsed &&
      (parsed.lastAssigned === 'Sales' || parsed.lastAssigned === 'Marketing') &&
      typeof parsed.sequenceNumber === 'number'
    ) {
      return parsed as StoredRoundRobinState;
    }
  } catch {
    // Variable doesn't exist yet or json parse failed
  }
  return null;
}

/**
 * Persist the Round-Robin state to Zoho CRM Settings Organization Variable
 */
async function writeStateToZohoVariable(state: StoredRoundRobinState): Promise<void> {
  if (!(await isZohoConfigured())) return;

  const valueStr = JSON.stringify(state);

  try {
    if (cachedVarId) {
      await zohoFetch(`/settings/variables/${cachedVarId}`, {
        method: 'PUT',
        body: JSON.stringify({
          variables: [
            {
              id: cachedVarId,
              value: valueStr,
            },
          ],
        }),
      });
      return;
    }

    // Try finding by reading first
    const existing = await readStateFromZohoVariable();
    if (cachedVarId) {
      await zohoFetch(`/settings/variables/${cachedVarId}`, {
        method: 'PUT',
        body: JSON.stringify({
          variables: [
            {
              id: cachedVarId,
              value: valueStr,
            },
          ],
        }),
      });
      return;
    }

    // Create the variable if it doesn't exist
    const groupsRes = await zohoFetch<any>('/settings/variable_groups').catch(() => null);
    const groupId = groupsRes?.variable_groups?.[0]?.id;
    const groupPayload = groupId ? { id: groupId } : { api_name: 'General' };

    const createRes = await zohoFetch<any>('/settings/variables', {
      method: 'POST',
      body: JSON.stringify({
        variables: [
          {
            name: VAR_API_NAME,
            api_name: VAR_API_NAME,
            type: 'text',
            value: valueStr,
            variable_group: groupPayload,
          },
        ],
      }),
    });

    const createdId = createRes?.variables?.[0]?.details?.id;
    if (createdId) cachedVarId = String(createdId);
  } catch (err: any) {
    console.warn('[RoundRobin] Non-blocking warning: Failed to persist variable to Zoho:', err?.message);
  }
}

/**
 * Read the most recently created formal Quote in Zoho CRM to determine who was assigned
 */
async function getLatestAssignmentFromZohoQuotes(): Promise<{
  assignedTo: LeadAssigneeName | null;
  count: number;
}> {
  if (!(await isZohoConfigured())) return { assignedTo: null, count: 0 };

  try {
    const res = await zohoFetch<any>(
      '/Quotes?fields=id,Subject,Description,Created_Time&sort_order=desc&per_page=10'
    );
    const quotes: any[] = Array.isArray(res?.data) ? res.data : [];

    for (const q of quotes) {
      if (!q.Subject || !q.Subject.includes('OB-RFQ')) continue;
      const meta = extractStructuredMeta(q.Description);
      const assigned = meta?.editableQuote?.assignedTo;
      if (assigned) {
        if (/marketing/i.test(assigned)) {
          return { assignedTo: 'Marketing', count: quotes.length };
        }
        if (/sales/i.test(assigned)) {
          return { assignedTo: 'Sales', count: quotes.length };
        }
      }
    }
  } catch {
    // Ignore quote fetch error
  }

  return { assignedTo: null, count: 0 };
}

/**
 * Concurrency-Safe Round-Robin Lead Assignment:
 * Sequential alternation:
 * Customer 1 -> Sales
 * Customer 2 -> Marketing
 * Customer 3 -> Sales
 * Customer 4 -> Marketing
 */
export async function getNextLeadAssignee(): Promise<LeadAssignee> {
  return await assignmentMutex.runExclusive(async () => {
    const { salesEmail, marketingEmail } = getAdminRecipients();

    // 1. Resolve current state from fastest to most authoritative:
    // Priority: memory -> disk cache -> Zoho Org Variable -> Zoho Quotes History
    let currentState = memoryState || readDiskCache();

    if (!currentState) {
      currentState = await readStateFromZohoVariable();
    }

    if (!currentState) {
      const fromQuotes = await getLatestAssignmentFromZohoQuotes();
      if (fromQuotes.assignedTo) {
        currentState = {
          lastAssigned: fromQuotes.assignedTo,
          lastEmail: fromQuotes.assignedTo === 'Sales' ? salesEmail : marketingEmail,
          sequenceNumber: fromQuotes.count,
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // 2. Determine Next Assignee:
    // Customer 1 -> Sales
    // Customer 2 -> Marketing
    // Customer 3 -> Sales
    // ...
    let nextName: LeadAssigneeName = 'Sales';
    let nextEmail = salesEmail;
    let nextRole: LeadAssigneeRole = 'ADMIN_1_SALES';
    let nextSequence = 1;

    if (currentState) {
      nextSequence = currentState.sequenceNumber + 1;
      if (currentState.lastAssigned === 'Sales') {
        nextName = 'Marketing';
        nextEmail = marketingEmail;
        nextRole = 'ADMIN_2_MARKETING';
      } else {
        nextName = 'Sales';
        nextEmail = salesEmail;
        nextRole = 'ADMIN_1_SALES';
      }
    }

    const assignedAt = new Date().toISOString();
    const label = `${nextName} (${nextEmail})`;

    const newState: StoredRoundRobinState = {
      lastAssigned: nextName,
      lastEmail: nextEmail,
      sequenceNumber: nextSequence,
      updatedAt: assignedAt,
    };

    // 3. Immediately persist state to memory & disk
    memoryState = newState;
    writeDiskCache(newState);

    // 4. Asynchronously sync to Zoho CRM Settings Variable
    writeStateToZohoVariable(newState).catch((err) => {
      console.warn('[RoundRobin] Async variable sync error:', err?.message);
    });

    console.log(
      `[RoundRobin] Assigned Customer Lead #${nextSequence} -> ${label} [${nextRole}] at ${assignedAt}`
    );

    return {
      name: nextName,
      email: nextEmail,
      label,
      role: nextRole,
      sequenceNumber: nextSequence,
      assignedAt,
    };
  });
}

/**
 * Peek at the current assignment state without incrementing
 */
export async function getCurrentLeadState(): Promise<StoredRoundRobinState | null> {
  return memoryState || readDiskCache() || (await readStateFromZohoVariable());
}

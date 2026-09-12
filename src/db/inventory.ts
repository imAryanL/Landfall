// Writes the supply rows onboarding seeds. Screens call this instead of writing SQL.
// Runs from the summary screen, after the checklist, so its rows can be pointed at.

import type { SQLiteDatabase } from 'expo-sqlite';

import { SUPPLY_SECTIONS } from '@/app/onboarding/supplies';
import type { OnboardingDraft } from '@/components/onboarding/onboarding-draft';
import { getChecklistIdsByTemplate, getTargetTemplateIds } from '@/db/checklist';

// No id — SQLite assigns it. quantity is always written, never left to the column
// default: a target item starts at 0, and so does anything the user didn't tap.
const INSERT_ITEM = `
  INSERT INTO inventory_items (
    name, category, quantity, checklist_item_id, created_at, updated_at
  ) VALUES (
    $name, $category, $quantity, $checklist_item_id, $created_at, $updated_at
  )
`;

// Screen 4 hands back ids like 'water'. The table wants the label the user actually read,
// and the section it sat under works as a category for free.
function draftToRows(draft: OnboardingDraft) {
  const now = new Date().toISOString();
  const rows = [];

  // Every supply gets a row, tapped or not — the merged checklist opens a detail screen
  // for all of them, so all of them need somewhere to open. owned decides the count.
  for (const section of SUPPLY_SECTIONS) {
    for (const item of section.items) {
      rows.push({
        templateId: item.id,
        name: item.label,
        category: section.title,
        owned: draft.owned.includes(item.id),
        created_at: now,
        updated_at: now,
      });
    }
  }

  return rows;
}

// Seeds the inventory from what onboarding collected. There is no update path here — the
// first-launch gate is what keeps this from running a second time.
export async function saveInventory(db: SQLiteDatabase, draft: OnboardingDraft) {
  const rows = draftToRows(draft);

  // The checklist is written first, so its rows already exist to be pointed at. Anything
  // with no matching checklist item just stores null.
  const byTemplate = await getChecklistIdsByTemplate(db);

  const targetIds = await getTargetTemplateIds(db);

  // A short, fixed list, so a plain loop beats building one statement with a changing
  // number of rows.
  for (const row of rows) {
    // A target item starts at 0 regardless — owning bottled water isn't having 25 gallons.
    // A binary item is complete at 1, but only if they actually tapped it.
    let quantity = 0;
    if (!targetIds.includes(row.templateId) && row.owned) {
      quantity = 1;
    }

    await db.runAsync(INSERT_ITEM, {
      $name: row.name,
      $category: row.category,
      $quantity: quantity,
      $checklist_item_id: byTemplate[row.templateId] ?? null,
      $created_at: row.created_at,
      $updated_at: row.updated_at,
    });
  }
}

// One inventory row as the table stores it, plus the target and done state from the
// checklist item it stocks. Those and checklist_item_id are null for anything not linked.
export type InventoryItemRow = {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  storage_location: string | null;
  expires_at: string | null;
  checklist_item_id: number | null;
  template_id: string | null;
  target_qty: number | null;
  unit: string | null;
  done: number | null;
};

// The columns both reads want, kept in one place so the list and the detail screen can't
// end up asking for different things. LEFT JOIN rather than JOIN so an item with no
// checklist link still comes back, just without a target.
const SELECT_ITEMS = `
  SELECT inventory_items.id,
         inventory_items.name,
         inventory_items.category,
         inventory_items.quantity,
         inventory_items.storage_location,
         inventory_items.expires_at,
         inventory_items.checklist_item_id,
         checklist_items.template_id,
         checklist_items.target_qty,
         checklist_items.unit,
         checklist_items.done
    FROM inventory_items
    LEFT JOIN checklist_items
           ON checklist_items.id = inventory_items.checklist_item_id
`;

/**
 * Every supply the user has, with the target it is stocking towards.
 * Ordered by id, which is the order onboarding wrote them in.
 */
export async function getInventory(db: SQLiteDatabase) {
  return db.getAllAsync<InventoryItemRow>(`${SELECT_ITEMS} ORDER BY inventory_items.id`);
}

/**
 * One supply, for the detail screen. Comes back null when the id doesn't exist.
 */
export async function getInventoryItem(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<InventoryItemRow>(
    `${SELECT_ITEMS} WHERE inventory_items.id = $id`,
    { $id: id }
  );
}

export type SupplyCoverage = {
  stocked: number;
  target: number;
};

/**
 * How stocked the countable supplies are, for Home's Supplies bar. MIN clamps each item
 * so an overstocked one can't push the total past its target; binary items have no
 * quantity to measure and are left out.
 */
export async function getSupplyCoverage(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<SupplyCoverage>(
    `SELECT COALESCE(SUM(MIN(inventory_items.quantity, checklist_items.target_qty)), 0) AS stocked,
            COALESCE(SUM(checklist_items.target_qty), 0) AS target
       FROM checklist_items
       JOIN inventory_items ON inventory_items.checklist_item_id = checklist_items.id
      WHERE checklist_items.target_qty IS NOT NULL`
  );

  return row ?? { stocked: 0, target: 0 };
}

/**
 * Saves a new count for one supply, then keeps the checklist row it stocks in step. The
 * minus button already stops at zero; the floor is repeated here so nothing else can
 * write a negative quantity later.
 */
export async function setInventoryQuantity(
  db: SQLiteDatabase,
  id: number,
  quantity: number
) {
  let safeQuantity = quantity;
  if (safeQuantity < 0) {
    safeQuantity = 0;
  }

  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE inventory_items
        SET quantity = $quantity, updated_at = $updated_at
      WHERE id = $id`,
    {
      $quantity: safeQuantity,
      $updated_at: now,
      $id: id,
    }
  );

  // The linked count item ticks itself once fully stocked and unticks below target.
  // Binary items (target_qty NULL) are left to the row tap. COALESCE holds the first
  // done_at rather than bumping it each time a stocked item goes higher.
  await db.runAsync(
    `UPDATE checklist_items
        SET done = CASE WHEN $quantity >= target_qty THEN 1 ELSE 0 END,
            done_at = CASE WHEN $quantity >= target_qty THEN COALESCE(done_at, $now) ELSE NULL END,
            updated_at = $now
      WHERE target_qty IS NOT NULL
        AND id = (SELECT checklist_item_id FROM inventory_items WHERE id = $id)`,
    {
      $quantity: safeQuantity,
      $now: now,
      $id: id,
    }
  );
}

/**
 * Sets or clears one supply's expiry date. Null clears it — the same path a "not set"
 * item already reads as.
 */
export async function setExpiryDate(db: SQLiteDatabase, id: number, expiresAt: string | null) {
  await db.runAsync(
    `UPDATE inventory_items SET expires_at = $expires_at, updated_at = $updated_at WHERE id = $id`,
    { $expires_at: expiresAt, $updated_at: new Date().toISOString(), $id: id }
  );
}

export type LowestSupply = {
  id: number;
  name: string;
  quantity: number;
  target_qty: number;
  unit: string | null;
  template_id: string | null;
};

/**
 * The countable supply furthest from its target (as a fraction, not a raw amount, so a
 * short-3-of-25 doesn't lose to a short-1-of-3). Whether it's actually LOW is Home's call.
 */
export async function getLowestSupply(db: SQLiteDatabase) {
  return db.getFirstAsync<LowestSupply>(
    `SELECT inventory_items.id,
            inventory_items.name,
            inventory_items.quantity,
            checklist_items.target_qty,
            checklist_items.unit,
            checklist_items.template_id
       FROM inventory_items
       JOIN checklist_items ON checklist_items.id = inventory_items.checklist_item_id
      WHERE checklist_items.target_qty IS NOT NULL
      ORDER BY (CAST(inventory_items.quantity AS REAL) / checklist_items.target_qty) ASC,
               inventory_items.id ASC
      LIMIT 1`
  );
}

export type SoonestExpiring = {
  id: number;
  name: string;
  expires_at: string;
};

/**
 * The one supply expiring soonest, for Home's needs-attention card. Null once nothing
 * has a date set. Whether it's actually SOON is Home's call, not this query's.
 */
export async function getSoonestExpiring(db: SQLiteDatabase) {
  return db.getFirstAsync<SoonestExpiring>(
    `SELECT id, name, expires_at
       FROM inventory_items
      WHERE expires_at IS NOT NULL
      ORDER BY expires_at ASC
      LIMIT 1`
  );
}

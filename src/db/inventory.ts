// Writes the supply rows onboarding seeds. Screens call this instead of writing SQL.
// Runs from the summary screen, after the checklist, so its rows can be pointed at.

import type { SQLiteDatabase } from 'expo-sqlite';

import { SUPPLY_SECTIONS } from '@/app/onboarding/supplies';
import type { OnboardingDraft } from '@/components/onboarding/onboarding-draft';
import { getChecklistIdsByTemplate, getTargetTemplateIds } from '@/db/checklist';

// No id — SQLite assigns it. quantity is written here rather than left to the column
// default, because items with a target have to start at 0.
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

  // Looping the source list rather than draft.owned means every row is guaranteed a real
  // label and category, and they come out in screen order instead of tap order.
  for (const section of SUPPLY_SECTIONS) {
    for (const item of section.items) {
      if (draft.owned.includes(item.id)) {
        rows.push({
          // Kept so the row can be matched to the checklist item it stocks.
          templateId: item.id,
          name: item.label,
          category: section.title,
          created_at: now,
          updated_at: now,
        });
      }
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

  // Ten items at most, so a plain loop beats building one statement with a changing
  // number of value rows.
  for (const row of rows) {
    // Tapping 'Bottled water' says the user owns some, not that they have 25 gallons, so
    // anything with a target starts empty. A can opener at 1 is already complete.
    let quantity = 1;
    if (targetIds.includes(row.templateId)) {
      quantity = 0;
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

// One inventory row as the table stores it, plus the target from the checklist item it
// stocks. The last three are null for anything not linked to one.
export type InventoryItemRow = {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  storage_location: string | null;
  expires_at: string | null;
  template_id: string | null;
  target_qty: number | null;
  unit: string | null;
};

/**
 * Every supply the user has, with the target it is stocking towards. LEFT JOIN rather
 * than JOIN so an item with no checklist link still comes back, just without a target.
 * Ordered by id, which is the order onboarding wrote them in.
 */
export async function getInventory(db: SQLiteDatabase) {
  return db.getAllAsync<InventoryItemRow>(
    `SELECT inventory_items.id,
            inventory_items.name,
            inventory_items.category,
            inventory_items.quantity,
            inventory_items.storage_location,
            inventory_items.expires_at,
            checklist_items.template_id,
            checklist_items.target_qty,
            checklist_items.unit
       FROM inventory_items
       LEFT JOIN checklist_items
              ON checklist_items.id = inventory_items.checklist_item_id
      ORDER BY inventory_items.id`
  );
}

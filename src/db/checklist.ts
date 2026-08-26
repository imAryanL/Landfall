// Writes the starting checklist. Screens call this instead of writing SQL themselves.
// The rules that decide what goes in it live in checklist-template.ts, not here.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { OnboardingDraft } from '@/components/onboarding/onboarding-draft';
import { buildChecklist } from '@/lib/checklist-template';

// is_custom is left out — these all come from the template, and the column defaults to 0.
const INSERT_ITEM = `
  INSERT INTO checklist_items (
    template_id, name, category, rationale,
    target_qty, unit, done, done_at, sort_order,
    created_at, updated_at
  ) VALUES (
    $template_id, $name, $category, $rationale,
    $target_qty, $unit, $done, $done_at, $sort_order,
    $created_at, $updated_at
  )
`;

// Seeds the checklist from what onboarding collected. Like the inventory seed, this runs
// once — the first-launch gate is what stops it happening twice.
export async function saveChecklist(db: SQLiteDatabase, draft: OnboardingDraft) {
  const items = buildChecklist(draft.adults, draft.kids, draft.pets, draft.owned);
  const now = new Date().toISOString();

  for (const item of items) {
    await db.runAsync(INSERT_ITEM, {
      $template_id: item.templateId,
      $name: item.name,
      $category: item.category,
      $rationale: item.rationale,
      $target_qty: item.targetQty,
      $unit: item.unit,

      // No boolean type in SQLite, so 0 or 1 like every other flag in the schema.
      $done: item.done ? 1 : 0,

      // The moment it became true, so Home can eventually show what moved this week.
      // Null for anything starting unchecked.
      $done_at: item.done ? now : null,

      $sort_order: item.sortOrder,
      $created_at: now,
      $updated_at: now,
    });
  }
}

export type ChecklistProgress = {
  done: number;
  total: number;
};

/**
 * How much of the checklist is finished. `done` is stored as 0 or 1, so adding the column
 * up counts the ticked ones. COALESCE covers the empty table, where SUM returns null
 * rather than zero.
 */
export async function getChecklistProgress(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<ChecklistProgress>(
    'SELECT COUNT(*) AS total, COALESCE(SUM(done), 0) AS done FROM checklist_items'
  );

  if (row === null) {
    return { done: 0, total: 0 };
  }

  return row;
}

// One checklist row as the table stores it — snake_case, same reasoning as Household.
export type ChecklistItemRow = {
  id: number;
  template_id: string | null;
  name: string;
  category: string | null;
  rationale: string | null;
  target_qty: number | null;
  unit: string | null;
  done: number;
  sort_order: number;
};

// Every item, in the order the template laid them out. Ordering here rather than in the
// screen means the list can't shuffle between launches.
export async function getChecklist(db: SQLiteDatabase) {
  return db.getAllAsync<ChecklistItemRow>(
    `SELECT id, template_id, name, category, rationale,
            target_qty, unit, done, sort_order
       FROM checklist_items
      ORDER BY sort_order`
  );
}

/**
 * Ticks or unticks one item. done_at is cleared on the way back down, so it always means
 * 'when this was last finished' rather than 'when it was last touched'.
 */
export async function setChecklistItemDone(
  db: SQLiteDatabase,
  id: number,
  done: boolean
) {
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE checklist_items
        SET done = $done, done_at = $done_at, updated_at = $updated_at
      WHERE id = $id`,
    {
      $done: done ? 1 : 0,
      $done_at: done ? now : null,
      $updated_at: now,
      $id: id,
    }
  );
}

/**
 * Every template id mapped to the row it produced, so other tables can point at it.
 * Only rows that came from the template have one — anything the user typed has none.
 */
export async function getChecklistIdsByTemplate(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ id: number; template_id: string }>(
    'SELECT id, template_id FROM checklist_items WHERE template_id IS NOT NULL'
  );

  const byTemplate: Record<string, number> = {};
  for (const row of rows) {
    byTemplate[row.template_id] = row.id;
  }

  return byTemplate;
}

// Which checklist items ask for a number. Owning water doesn't finish 25 gallons.
export async function getTargetTemplateIds(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ template_id: string }>(
    'SELECT template_id FROM checklist_items WHERE target_qty IS NOT NULL'
  );

  const ids = [];
  for (const row of rows) {
    ids.push(row.template_id);
  }

  return ids;
}

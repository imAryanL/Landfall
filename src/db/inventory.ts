// Writes the supply rows onboarding seeds. Screens call this instead of writing SQL.
// Passive until the summary screen calls it — nothing imports this file yet.

import type { SQLiteDatabase } from 'expo-sqlite';

import { SUPPLY_SECTIONS } from '@/app/onboarding/supplies';
import type { OnboardingDraft } from '@/components/onboarding/onboarding-draft';

// No id — SQLite assigns it. No quantity either: the column already defaults to 1, which
// is all onboarding knows, since the user only said they own the thing.
const INSERT_ITEM = `
  INSERT INTO inventory_items (
    name, category, created_at, updated_at
  ) VALUES (
    $name, $category, $created_at, $updated_at
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

  // Ten items at most, so a plain loop beats building one statement with a changing
  // number of value rows.
  for (const row of rows) {
    await db.runAsync(INSERT_ITEM, {
      $name: row.name,
      $category: row.category,
      $created_at: row.created_at,
      $updated_at: row.updated_at,
    });
  }
}

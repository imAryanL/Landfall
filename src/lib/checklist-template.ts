// The prep checklist every household starts with.
//
// Plain data and plain math, no database and no React. The ten items are the same ten
// the onboarding supplies screen asks about, and they share the same ids on purpose —
// that is what lets 'I already own this' land on the right row with no translation.

import { computeTargets } from '@/lib/targets';

// Which figure from computeTargets fills this item's target, or null for the things you
// either have or you don't. Written out rather than derived from SupplyTargets: the list
// is three words long and sits right here.
type QuantitySource = 'waterGallons' | 'meals' | 'flashlights' | null;

type TemplateItem = {
  templateId: string;
  name: string;
  category: string;
  rationale: string;
  quantityFrom: QuantitySource;
  unit: string | null;
};

// Categories match the onboarding supplies screen word for word, so the two screens
// don't quietly disagree about where something belongs.
const TEMPLATE: TemplateItem[] = [
  {
    templateId: 'water',
    name: 'Drinking water',
    category: 'Water & food',
    rationale: 'One gallon per person, per day',
    quantityFrom: 'waterGallons',
    unit: 'gallons',
  },
  {
    templateId: 'food',
    name: 'Non-perishable food',
    category: 'Water & food',
    rationale: 'No cooking, no refrigeration',
    quantityFrom: 'meals',
    unit: 'meals',
  },
  {
    templateId: 'can_opener',
    name: 'Manual can opener',
    category: 'Water & food',
    rationale: 'No power required',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'flashlights',
    name: 'Flashlights',
    category: 'Power & light',
    rationale: 'Safer than candles indoors',
    quantityFrom: 'flashlights',
    unit: null,
  },
  {
    templateId: 'batteries',
    name: 'Batteries',
    category: 'Power & light',
    rationale: 'Powers the radio and the lights',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'radio',
    name: 'Battery or hand-crank radio',
    category: 'Power & light',
    rationale: 'Weather alerts with no signal',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'first_aid',
    name: 'First aid kit',
    category: 'Medical & documents',
    rationale: 'Pharmacies close before a storm',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'medicines',
    name: 'Prescription medicines',
    category: 'Medical & documents',
    rationale: 'Refills can take days afterwards',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'cash',
    name: 'Cash',
    category: 'Medical & documents',
    rationale: 'Card readers need power',
    quantityFrom: null,
    unit: null,
  },
  {
    templateId: 'documents',
    name: 'Important documents',
    category: 'Medical & documents',
    rationale: 'Insurance, IDs, prescriptions',
    quantityFrom: null,
    unit: null,
  },
];

// One checklist row, ready to be written to the database.
export type ChecklistDraftItem = {
  templateId: string;
  name: string;
  category: string;
  rationale: string;
  targetQty: number | null;
  unit: string | null;
  done: boolean;
  sortOrder: number;
};

/**
 * Builds the starting checklist for a household. `owned` is the list of supply ids the
 * user tapped during onboarding.
 */
export function buildChecklist(
  adults: number,
  kids: number,
  pets: number,
  owned: string[]
): ChecklistDraftItem[] {
  const targets = computeTargets(adults, kids, pets);
  const items: ChecklistDraftItem[] = [];

  let sortOrder = 0;
  for (const item of TEMPLATE) {
    let targetQty = null;
    if (item.quantityFrom !== null) {
      targetQty = targets[item.quantityFrom];
    }

    // Owning something only finishes the item when there is no number attached. Tapping
    // the water chip says they own bottled water, not that they have eighteen gallons —
    // so anything with a target starts unchecked and gets satisfied by the inventory.
    const isBinary = item.quantityFrom === null;
    const done = isBinary && owned.includes(item.templateId);

    items.push({
      templateId: item.templateId,
      name: item.name,
      category: item.category,
      rationale: item.rationale,
      targetQty: targetQty,
      unit: item.unit,
      done: done,
      sortOrder: sortOrder,
    });

    sortOrder = sortOrder + 1;
  }

  return items;
}

// The vault's four categories and their icons. A fixed list, not user-editable — same
// reasoning as the checklist's categories: a short, known set is what makes a "pick one"
// screen scannable.

import { type IconName } from '@/lib/supply-icons';

export const DOCUMENT_CATEGORIES = [
  { id: 'insurance', label: 'Insurance', icon: 'shield-outline' as IconName },
  { id: 'identification', label: 'Identification', icon: 'card-account-details-outline' as IconName },
  { id: 'medical', label: 'Medical', icon: 'medical-bag' as IconName },
  { id: 'home', label: 'Home & property', icon: 'home-outline' as IconName },
];

// Category is stored on the row as the label itself (e.g. "Insurance"), so a document's
// icon is looked up by that label rather than a separate id column.
export function iconForCategory(category: string): IconName {
  for (const entry of DOCUMENT_CATEGORIES) {
    if (entry.label === category) {
      return entry.icon;
    }
  }

  return 'file-document-outline';
}

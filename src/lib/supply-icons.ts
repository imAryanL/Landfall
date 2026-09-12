// Which icon each supply gets on the detail screen, keyed by template_id so renaming a
// label can't break it. No can opener in the icon set — cutlery is the closest.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

// Exported — Home's needs-attention cards pick their own icon and want the same type.
export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const ICONS: Record<string, IconName> = {
  water: "water",
  food: "food-variant",
  can_opener: "silverware-fork-knife",
  flashlights: "flashlight",
  batteries: "battery",
  radio: "radio",
  first_aid: "medical-bag",
  medicines: "pill",
  cash: "cash",
  documents: "file-document-outline",
  shutters: "window-shutter",
  sandbags: "sack",
  tarp: "home-roof",
  tie_downs: "anchor",
};

// A custom item the user added has no template_id — it gets a plain box.
const FALLBACK_ICON: IconName = "package-variant-closed";

export function iconFor(templateId: string | null) {
  if (templateId === null) {
    return FALLBACK_ICON;
  }

  return ICONS[templateId] ?? FALLBACK_ICON;
}

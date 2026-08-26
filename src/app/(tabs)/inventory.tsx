// Inventory tab — the supplies you have on hand, read from the database.
// Storage locations and expiration dates have nowhere to come from yet, so neither shows.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { ComponentProps, useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { getInventory, type InventoryItemRow } from "@/db/inventory";
import { useTheme } from "@/hooks/use-theme";

// The set of valid MaterialCommunityIcons names (so TypeScript checks our icon spelling).
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Which icon each supply gets, keyed by template_id rather than name, so renaming a
// label can't break the icon. There is no can opener in the icon set — cutlery is the
// closest thing to it.
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
};

// Anything with no checklist link — an item the user adds themselves later — gets a box.
const FALLBACK_ICON: IconName = "package-variant-closed";

function iconFor(item: InventoryItemRow) {
  if (item.template_id === null) {
    return FALLBACK_ICON;
  }

  return ICONS[item.template_id] ?? FALLBACK_ICON;
}

// The pill text. With no target the number stands alone — '1 / 1' would invent a goal the
// checklist never set. The unit is separate because a target can exist without one:
// flashlights need 3, measured in nothing.
function quantityLabel(item: InventoryItemRow) {
  if (item.target_qty === null) {
    return `${item.quantity}`;
  }

  if (item.unit === null) {
    return `${item.quantity} / ${item.target_qty}`;
  }

  return `${item.quantity} / ${item.target_qty} ${item.unit}`;
}

// Category on its own until the item has a storage location. Onboarding never asks for
// one, so every row starts without it.
function metaLabel(item: InventoryItemRow) {
  if (item.storage_location === null) {
    return item.category;
  }

  return `${item.category} · ${item.storage_location}`;
}

// One supply card — a category icon on the left, then the item's details on the right.
function InventoryCard({ item }: { item: InventoryItemRow }) {
  // Get the theme so the icon can use our green (theme.primary).
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Whole card is a horizontal row: icon circle on the left, content column on the right. */}
      <View style={styles.cardRow}>
        {/* Leading icon in a soft-green circle. */}
        <ThemedView type="backgroundSelected" style={styles.iconCircle}>
          <MaterialCommunityIcons name={iconFor(item)} size={22} color={theme.primary} />
        </ThemedView>

        {/* Content column takes the remaining width (flex: 1). */}
        <View style={styles.content}>
          {/* A horizontal row: name pushed left, pill pushed right. */}
          <View style={styles.topRow}>
            <ThemedText type="smallBold">{item.name}</ThemedText>
            <ThemedView type="backgroundSelected" style={styles.pill}>
              <ThemedText type="small" themeColor="textSecondary">
                {quantityLabel(item)}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Meta line: category, plus the storage location once the item has one. */}
          <ThemedText type="small" themeColor="textSecondary">
            {metaLabel(item)}
          </ThemedText>
        </View>

        {/* Muted chevron hinting the whole card is tappable (opens the detail screen later). */}
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textSecondary} />
      </View>
    </ThemedView>
  );
}

export default function InventoryScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<InventoryItemRow[]>([]);

  // Tab screens stay mounted, so a plain useEffect would read once at launch and never
  // again. useFocusEffect re-reads every time the tab is opened, same as Home.
  useFocusEffect(
    // Memoised, or the callback is a new function every render and the effect loops.
    useCallback(() => {
      async function load() {
        setItems(await getInventory(db));
      }

      load();
    }, [db])
  );

  // Build one card per supply item, in order.
  const cards = [];
  for (const item of items) {
    cards.push(<InventoryCard key={item.id} item={item} />);
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* ScrollView so the list can scroll once it's taller than the screen. */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Screen header: big bold title + a calm subtitle. */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Inventory</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              What you have on hand
            </ThemedText>
            {/* The amber 'expiring soon' pill lives here. Nothing can set an expiration
                date yet, so counting them would mean inventing them. */}
          </View>

          {/* All the supply cards we built above. */}
          {cards}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three, // space between the header and the cards we'll add next
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  expiringPill: {
    flexDirection: "row",
    alignItems: "center", // vertically center the icon against the text
    gap: Spacing.one, // small space between the icon and the words
    alignSelf: "flex-start", // pill hugs its content instead of filling the row
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    marginTop: Spacing.one, // a little breathing room below the subtitle
  },
  headerTitle: {
    fontFamily: Fonts.serif, // editorial serif — display headings only, body stays sans
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500", // serifs carry weight in the letterforms, so they read better light
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center", // vertically center the icon against the text block
    gap: Spacing.three, // space between the icon circle and the content
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22, // half of width/height = a perfect circle
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1, // take all remaining width beside the icon
    gap: Spacing.one, // small gap between the lines of text
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // name left, pill right
  },
  pill: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});

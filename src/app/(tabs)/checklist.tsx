// The prep checklist, read from the database. The rows are written once during
// onboarding by the template engine, which is where the items and targets are decided.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import {
  getChecklist,
  setChecklistItemDone,
  type ChecklistItemRow,
} from "@/db/checklist";
import { useTheme } from "@/hooks/use-theme";

// Empty green circle when unchecked, filled with a ✓ when checked.
function Checkbox({ checked }: { checked: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.checkbox,
        { borderColor: theme.primary },
        checked && { backgroundColor: theme.primary },
      ]}
    >
      {checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
    </View>
  );
}

// '7 / 25'. The unit ('gallons') lives on the detail screen, where there's room for it.
function countLabel(onHand: number, target: number | null) {
  return `${onHand} / ${target}`;
}

// Capped at 100 so an overstocked item doesn't run past the end of the track.
function fillPercent(onHand: number, target: number | null) {
  if (target === null || target === 0) {
    return 0;
  }

  return Math.min(100, Math.round((onHand / target) * 100));
}

// The thin fill bar under a count item's name — same treatment as Home's breakdown bars.
function ProgressBar({ percent }: { percent: number }) {
  return (
    <ThemedView type="backgroundSelected" style={styles.barTrack}>
      <ThemedView type="primary" style={[styles.barFill, { width: `${percent}%` }]} />
    </ThemedView>
  );
}

// One row. An item with a target (water, food, flashlights) shows a count and a fill bar,
// and the whole row opens the supply detail screen — that's where the number gets changed.
// Everything else is a plain tick with its reason underneath.
function ChecklistRow({
  item,
  onToggle,
}: {
  item: ChecklistItemRow;
  onToggle: () => void;
}) {
  const theme = useTheme();

  const isCount = item.target_qty !== null;
  const onHand = item.on_hand ?? 0;

  function handlePress() {
    if (isCount && item.inventory_id !== null) {
      router.push(`/supply/${item.inventory_id}`);
    } else {
      onToggle();
    }
  }

  // A count row is a button into the detail screen; a binary row is the checkbox itself.
  const a11yProps = isCount
    ? { accessibilityRole: "button" as const }
    : {
        accessibilityRole: "checkbox" as const,
        accessibilityState: { checked: item.done === 1 },
      };

  return (
    <Pressable
      onPress={handlePress}
      {...a11yProps}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Checkbox checked={item.done === 1} />

      <View style={styles.rowText}>
        <View style={styles.nameRow}>
          <ThemedText type="small" style={styles.nameText}>
            {item.name}
          </ThemedText>

          {isCount && (
            <ThemedView type="backgroundSelected" style={styles.pill}>
              <ThemedText type="small" themeColor="textSecondary">
                {countLabel(onHand, item.target_qty)}
              </ThemedText>
            </ThemedView>
          )}
        </View>

        {isCount && <ProgressBar percent={fillPercent(onHand, item.target_qty)} />}

        {/* Custom items have no rationale, so there's nothing to draw under the name. */}
        {!isCount && item.rationale && (
          <ThemedText type="small" themeColor="textSecondary">
            {item.rationale}
          </ThemedText>
        )}
      </View>

      {isCount && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
        />
      )}
    </Pressable>
  );
}

// The header above a group of items: category name on the left, "2/3" progress on the right.
function CategoryHeader({ name, items }: { name: string; items: ChecklistItemRow[] }) {
  // Count how many items in this category are ticked off. done is 0 or 1, not a boolean.
  let checkedCount = 0;
  for (const item of items) {
    if (item.done === 1) {
      checkedCount = checkedCount + 1;
    }
  }

  const totalCount = items.length;

  return (
    // A horizontal row: name pushed to the left, count pushed to the right.
    <View style={styles.categoryHeader}>
      {/* Left side: the category name, e.g. "Water & Food" */}
      <ThemedText type="smallBold">{name}</ThemedText>

      {/* Right side: progress like "2/3" (checked out of total) */}
      <ThemedText type="small" themeColor="textSecondary">
        {checkedCount}/{totalCount}
      </ThemedText>
    </View>
  );
}

// Groups the flat list into categories, keeping the order the template laid them out in.
function groupByCategory(items: ChecklistItemRow[]) {
  const groups: { name: string; items: ChecklistItemRow[] }[] = [];

  for (const item of items) {
    const name = item.category ?? "Other";

    let group = null;
    for (const existing of groups) {
      if (existing.name === name) {
        group = existing;
      }
    }

    if (group === null) {
      group = { name: name, items: [] as ChecklistItemRow[] };
      groups.push(group);
    }

    group.items.push(item);
  }

  return groups;
}

export default function ChecklistScreen() {
  // Get the theme so the section border can use our border color.
  const theme = useTheme();
  const db = useSQLiteContext();

  // Null until the read comes back, so an empty list never flashes before the real one.
  const [checklist, setChecklist] = useState<ChecklistItemRow[] | null>(null);

  // useFocusEffect, not useEffect: the tab stays mounted, so a plain mount effect would
  // never pick up a count changed over on the supply detail screen and back.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        setChecklist(await getChecklist(db));
      }

      load();
    }, [db]),
  );

  // Write first, then read the whole list back. Re-reading costs one query over a
  // handful of local rows and keeps the screen and the database from ever disagreeing.
  async function toggleItem(item: ChecklistItemRow) {
    await setChecklistItemDone(db, item.id, item.done !== 1);
    setChecklist(await getChecklist(db));
  }

  // Build one bordered card per category.
  const sections = [];
  for (const category of groupByCategory(checklist ?? [])) {
    // 1. Build this category's item rows, with a thin divider before each row except the first.
    const rows = [];
    for (const item of category.items) {
      // rows.length > 0 means we've already added a row, so this isn't the first one.
      if (rows.length > 0) {
        rows.push(
          <View
            key={`divider-${item.id}`}
            style={[styles.rowDivider, { backgroundColor: theme.border }]}
          />,
        );
      }
      rows.push(
        <ChecklistRow key={item.id} item={item} onToggle={() => toggleItem(item)} />,
      );
    }

    // 2. Header sits ABOVE the box (outside the border); only the rows go inside the bordered box.
    //    borderColor comes from the theme (added inline, since StyleSheet can't read the theme).
    sections.push(
      <View key={category.name} style={styles.categorySection}>
        <CategoryHeader name={category.name} items={category.items} />
        <View style={[styles.categoryCard, { borderColor: theme.border }]}>
          {rows}
        </View>
      </View>,
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Prep checklist</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tailored to your household
            </ThemedText>
          </View>

          {sections}

          <Pressable
            onPress={() => router.push("/add-item")}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addRow,
              { borderColor: theme.border },
              pressed && styles.rowPressed,
            ]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              Add item
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 8,
    marginBottom: 8,
  },
  categorySection: {
    marginBottom: 20, // gap between one whole category section and the next
  },
  categoryCard: {
    borderWidth: 2, // borderColor is set inline from the theme
    borderRadius: 16,
    paddingHorizontal: 16, // top/bottom spacing comes from the rows' own paddingVertical
  },
  headerTitle: {
    fontFamily: Fonts.serif, // editorial serif — display headings only, body stays sans
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500", // serifs carry weight in the letterforms, so they read better light
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "700",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14, // space above/below each row's content (was marginBottom)
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowDivider: {
    height: 1, // thin horizontal line; its color is set inline from the theme
  },
  rowText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameText: {
    flex: 1, // pushes the pill to the right edge and lets a long name wrap first
  },
  pill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  barTrack: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden", // clips the fill to the rounded track
    marginTop: 4,
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 14,
  },
});

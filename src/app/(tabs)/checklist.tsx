// The prep checklist, read from the database. The rows are written once during
// onboarding by the template engine, which is where the items and targets are decided.

import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
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

// A small round tap target. Empty circle when unchecked, filled green with a ✓ when checked.
function Checkbox({ checked }: { checked: boolean }) {
  // Get the theme colors object so we can use theme.primary (our green) below.
  const theme = useTheme();

  return (
    // This View is the circle itself. Its style is an ARRAY of style objects, combined in order:
    <View
      style={[
        styles.checkbox, // 1. base look: size, roundness, border thickness (defined below in `styles`)
        { borderColor: theme.primary }, // 2. always give it a green border
        checked && { backgroundColor: theme.primary }, // 3. ONLY if checked, also fill it green
      ]}
    >
      {/* Only show the ✓ text if checked is true. Same {condition && <Thing/>} trick as web React. */}
      {checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
    </View>
  );
}

// '42 gallons', or '5' when the item has no unit. Binary things like a can opener have
// no target at all, so they get no pill rather than a made-up '1'.
function formatTarget(item: ChecklistItemRow) {
  if (item.target_qty === null) {
    return null;
  }

  if (item.unit === null) {
    return String(item.target_qty);
  }

  return item.target_qty + " " + item.unit;
}

// One full row: checkbox on the left, name + subtitle in the middle, quantity pill on the right.
function ChecklistRow({
  item,
  onToggle,
}: {
  item: ChecklistItemRow;
  onToggle: () => void;
}) {
  const target = formatTarget(item);
  return (
    // The whole row is the tap target, not just the little circle — a 24pt circle is well
    // under Apple's 44pt minimum, and nobody aims for the checkbox anyway.
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.done === 1 }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {/* 1. The checkbox we already built, reused here. SQLite has no boolean, so done
             arrives as 0 or 1. */}
      <Checkbox checked={item.done === 1} />

      {/* 2. Name and target on one line, reason underneath on its own full-width line.
             The pill used to sit beside the whole text block, which squeezed the reason
             into two lines on any item with a long one. */}
      <View style={styles.rowText}>
        <View style={styles.nameRow}>
          <ThemedText type="small" style={styles.nameText}>
            {item.name}
          </ThemedText>

          {/* Only items with a number get a pill. */}
          {target !== null && (
            <ThemedView type="backgroundSelected" style={styles.pill}>
              <ThemedText type="small" themeColor="textSecondary">
                {target}
              </ThemedText>
            </ThemedView>
          )}
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {item.rationale}
        </ThemedText>
      </View>
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

  useEffect(() => {
    async function load() {
      setChecklist(await getChecklist(db));
    }

    load();
  }, [db]);

  // Write first, then read the whole list back. Re-reading costs one query over ten local
  // rows and keeps the screen and the database from ever holding different answers.
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
        {/* ScrollView lets the list scroll once it's taller than the screen.
            paddingHorizontal keeps content off the edges; paddingBottom gives
            breathing room above the tab bar when scrolled to the end. */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Screen header: big serif title + a calm, personalized subtitle. */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Prep checklist</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tailored to your household
            </ThemedText>
          </View>

          {/* Drop in all the headers + rows we built above, in order. */}
          {sections}
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
});

// Placeholder screen for the Checklist tab — will hold the prep checklist (categories, items, progress).

import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ChecklistItem = {
  id: string;
  name: string;
  subtitle: string; // short reason, e.g. "No power required"
  targetQty: string; // e.g. "8 gallons"
  checked: boolean;
};

type ChecklistCategory = {
  name: string;
  items: ChecklistItem[];
};

const CATEGORIES: ChecklistCategory[] = [
  {
    name: "Water & Food",
    items: [
      {
        id: "water",
        name: "Drinking water",
        subtitle: "1 gallon per person, per day",
        targetQty: "8 gallons",
        checked: true,
      },
      {
        id: "food",
        name: "Non-perishable food",
        subtitle: "3-day supply minimum",
        targetQty: "9 meals",
        checked: true,
      },
      {
        id: "can-opener",
        name: "Manual can opener",
        subtitle: "No power required",
        targetQty: "1",
        checked: false,
      },
    ],
  },
  {
    name: "Power & Light",
    items: [
      {
        id: "flashlights",
        name: "Flashlights",
        subtitle: "Safer than candles indoors",
        targetQty: "2",
        checked: true,
      },
      {
        id: "batteries",
        name: "Backup batteries",
        subtitle: "Powers radios and lights",
        targetQty: "12",
        checked: false,
      },
      {
        id: "power-bank",
        name: "Power bank",
        subtitle: "Charges phones off-grid",
        targetQty: "1",
        checked: true,
      },
    ],
  },
];

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

// One full row: checkbox on the left, name + subtitle in the middle, quantity pill on the right.
function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    // The outer View lays out its 3 children in a horizontal row (see styles.row below).
    <View style={styles.row}>
      {/* 1. The checkbox we already built, reused here. */}
      <Checkbox checked={item.checked} />

      {/* 2. A View holding the two lines of text, stacked vertically (default View behavior). */}
      <View style={styles.rowText}>
        <ThemedText type="small">{item.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.subtitle}
        </ThemedText>
      </View>

      {/* 3. The rounded "pill" badge showing the target quantity, e.g. "8 gallons". */}
      <ThemedView type="backgroundSelected" style={styles.pill}>
        <ThemedText type="small" themeColor="textSecondary">
          {item.targetQty}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

// The header above a group of items: category name on the left, "2/3" progress on the right.
function CategoryHeader({ category }: { category: ChecklistCategory }) {
  // Count how many items in this category are checked off.
  // Start the counter at 0, then add 1 for every item whose `checked` is true.
  let checkedCount = 0;
  for (const item of category.items) {
    if (item.checked) {
      checkedCount = checkedCount + 1;
    }
  }

  // The total number of items in this category (e.g. 3 for Water & Food).
  const totalCount = category.items.length;

  return (
    // A horizontal row: name pushed to the left, count pushed to the right.
    <View style={styles.categoryHeader}>
      {/* Left side: the category name, e.g. "Water & Food" */}
      <ThemedText type="smallBold">{category.name}</ThemedText>

      {/* Right side: progress like "2/3" (checked out of total) */}
      <ThemedText type="small" themeColor="textSecondary">
        {checkedCount}/{totalCount}
      </ThemedText>
    </View>
  );
}

export default function ChecklistScreen() {
  // Get the theme so the section border can use our border color.
  const theme = useTheme();

  // Build one bordered card per category.
  const sections = [];
  for (const category of CATEGORIES) {
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
      rows.push(<ChecklistRow key={item.id} item={item} />);
    }

    // 2. Header sits ABOVE the box (outside the border); only the rows go inside the bordered box.
    //    borderColor comes from the theme (added inline, since StyleSheet can't read the theme).
    sections.push(
      <View key={category.name} style={styles.categorySection}>
        <CategoryHeader category={category} />
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
              Tailored to a family of four
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
  rowDivider: {
    height: 1, // thin horizontal line; its color is set inline from the theme
  },
  rowText: {
    flex: 1,
  },
  pill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

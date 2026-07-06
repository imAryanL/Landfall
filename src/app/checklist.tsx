// Placeholder screen for the Checklist tab — will hold the prep checklist (categories, items, progress).

import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

export default function ChecklistScreen() {
  // Just testing one real row for now, using the first mock item.
  const firstItem = CATEGORIES[0].items[0];

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <ChecklistRow item={firstItem} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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

// "What you can do now" — the user's next unfinished checklist items, each opening that item.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { SectionHeading } from "@/components/alerts/section-heading";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { type ChecklistItemRow } from "@/db/checklist";
import { useTheme } from "@/hooks/use-theme";

type NextStepsProps = {
  items: ChecklistItemRow[];
};

// Same rule as the checklist: a linked item has a detail screen, a custom one doesn't.
function openItem(item: ChecklistItemRow) {
  if (item.inventory_id !== null) {
    router.push(`/supply/${item.inventory_id}`);
  } else {
    router.push("/checklist");
  }
}

export function NextSteps({ items }: NextStepsProps) {
  const theme = useTheme();

  const stepRows = [];
  for (const item of items) {
    stepRows.push(
      <View key={item.id}>
        {/* Above every row but the first, so none dangles at the end. */}
        {stepRows.length > 0 && (
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        )}

        <Pressable
          onPress={() => openItem(item)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.number}>
            <ThemedText themeColor="primaryDeep" style={styles.numberText}>
              {stepRows.length + 1}
            </ThemedText>
          </ThemedView>

          <ThemedText style={styles.text}>{item.name}</ThemedText>

          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textTertiary}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeading>What you can do now</SectionHeading>
      <ThemedView type="backgroundElement" style={styles.card}>
        {stepRows}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
  },
  number: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
});

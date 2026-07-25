// "What you can do now" — numbered rows that point into the prep checklist. A chevron,
// not a checkbox: the card points at the checklist rather than being a second copy of it.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { SectionHeading } from "@/components/alerts/section-heading";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type NextStepsProps = {
  steps: string[];
};

export function NextSteps({ steps }: NextStepsProps) {
  const theme = useTheme();

  // Build the numbered rows with a plain loop, a divider between them (never after the last).
  const stepRows = [];
  for (const step of steps) {
    stepRows.push(
      <View key={step}>
        {/* Divider sits ABOVE each row except the first, so none dangles at the end. */}
        {stepRows.length > 0 && (
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        )}

        <View style={styles.row}>
          {/* The step's position, in a soft circle. */}
          <ThemedView type="backgroundSelected" style={styles.number}>
            <ThemedText themeColor="primaryDeep" style={styles.numberText}>
              {stepRows.length + 1}
            </ThemedText>
          </ThemedView>

          <ThemedText style={styles.text}>{step}</ThemedText>

          {/* Hints that the row opens the matching checklist item. */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textTertiary}
          />
        </View>
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
    gap: Spacing.two, // same heading-to-card spacing as the timeline section
    marginTop: Spacing.three,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: "row", // number, text, chevron across
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  number: {
    width: 26,
    height: 26,
    borderRadius: 13, // half the width makes it a circle
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  text: {
    flex: 1, // takes the space between the number and the chevron
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
});

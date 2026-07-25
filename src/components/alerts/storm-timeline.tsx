// "What to expect" — a 3-row timeline of the storm's timing, in its own white card.
// Three rows only: NWS publishes no hour-by-hour breakdown, so more would be guessing.

import { StyleSheet, View } from "react-native";

import { SectionHeading } from "@/components/alerts/section-heading";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// One step in the timeline. `isNow` marks the current step (a solid dot) vs. a later one.
type TimelineStep = {
  time: string;
  detail: string;
  isNow: boolean;
};

type StormTimelineProps = {
  steps: TimelineStep[];
};

export function StormTimeline({ steps }: StormTimelineProps) {
  const theme = useTheme();

  // Build one row per step, using a plain loop so it's easy to follow.
  const rows = [];
  for (const step of steps) {
    // The last row has nothing below it, so it skips the connecting line and the gap.
    const isLastRow = rows.length === steps.length - 1;

    rows.push(
      <View key={step.time} style={styles.row}>
        {/* Column 1: when it happens. Right-aligned so the times line up as a column. */}
        <ThemedText themeColor="textTertiary" style={styles.time}>
          {step.time}
        </ThemedText>

        {/* Column 2: this step's dot, plus the line running down to the next one. */}
        <View style={styles.marker}>
          {/* The current step is a solid green dot; later steps are hollow outlines. */}
          <View
            style={[
              styles.dot,
              step.isNow
                ? { backgroundColor: theme.primary }
                : { borderWidth: 2, borderColor: theme.border },
            ]}
          />
          {!isLastRow && (
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          )}
        </View>

        {/* Column 3: what happens then. */}
        <View style={[styles.text, !isLastRow && styles.textSpacing]}>
          <ThemedText style={styles.detail}>{step.detail}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Heading sits ABOVE the card, matching how Checklist labels its category boxes. */}
      <SectionHeading>What to expect</SectionHeading>
      {/* No gap inside the card — the rows space themselves, so the connecting line can
          run unbroken from one dot to the next. */}
      <ThemedView type="backgroundElement" style={styles.card}>
        {rows}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two, // space between the heading and the card it labels
    marginTop: Spacing.three, // stacks on the ScrollView's gap to separate this from the alert card
  },
  card: {
    borderRadius: 16,
    padding: Spacing.four,
  },
  row: {
    flexDirection: "row", // dot column on the left, text column on the right
    gap: Spacing.three,
  },
  marker: {
    width: 12,
    alignItems: "center", // keeps the dot and the line on the same vertical axis
    marginTop: 4, // centers the 12px dot against the first line of text beside it
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6, // half the width makes it a circle
  },
  line: {
    width: 2,
    flex: 1, // stretches down to fill whatever height the row's text takes
    marginVertical: Spacing.one, // gap at BOTH ends so the line never touches a dot
  },
  text: {
    flex: 1, // takes the rest of the row's width
  },
  textSpacing: {
    paddingBottom: Spacing.five, // gap to the next row; the line runs through it
  },
  time: {
    width: 62, // fixed width so every time lands on the same right edge
    textAlign: "right",
    fontSize: 12,
    lineHeight: 20, // matches the description's line height so the two align
    fontWeight: "600", // light, so the times read as quiet markers not labels
  },
  detail: {
    fontSize: 12, // matches the alert card's body so no line outranks it
    lineHeight: 20,
    fontWeight: "400", // heavier than the light time beside it, so the content leads
  },
});

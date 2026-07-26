// The calm "all clear" state — what people see on most days. Frameless on purpose:
// cards are reserved for real watch/warning states, so a card appearing means something.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { SeasonBar } from "@/components/alerts/season-bar";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type CalmStateProps = {
  // How far into hurricane season today is (0–100), forwarded to the season bar below.
  seasonTodayPercent: number;
};

export function CalmState({ seasonTodayPercent }: CalmStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.calmState}>
      {/* Green check inside soft rings — a calm "radar is quiet" signal. */}
      <View style={[styles.ring1, { borderColor: theme.primarySoft }]}>
        <View style={[styles.ring2, { borderColor: theme.primarySoft }]}>
          <View style={[styles.ring3, { borderColor: theme.primarySoft }]}>
            <View
              style={[
                styles.innerCircle,
                { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <MaterialCommunityIcons
                name="check"
                size={30}
                color={theme.primaryDeep}
              />
            </View>
          </View>
        </View>
      </View>

      {/* The headline people are hoping to see. */}
      <ThemedText style={styles.calmTitle}>No active alerts</ThemedText>

      {/* Plain-language explanation, crediting NWS as the official source. */}
      <ThemedText themeColor="textSecondary" style={styles.calmBody}>
        The National Weather Service hasn&apos;t issued any watches or warnings
        for Broward County.
      </ThemedText>

      {/* Says out loud that the app keeps working without signal. */}
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.calmFootnote}
      >
        Landfall checks every hour and saves the newest update, so it&apos;s here
        even if you lose signal.
      </ThemedText>

      {/* Where we are in hurricane season — a pure calendar, no forecast. */}
      <SeasonBar todayPercent={seasonTodayPercent} />

      {/* Calm-day nudge — gives the empty state a small job by pointing back into prep.
          Soft green tint, not a card: it's an FYI, not an alert. Icon + centered text
          echo the rings-over-text rhythm of the hero above. */}
      <View style={[styles.nudge, { backgroundColor: theme.backgroundSelected }]}>
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={25}
          color={theme.primaryDeep}
        />
        <ThemedText themeColor="primaryDeep" style={styles.nudgeText}>
          Quiet week, a good time to test flashlights, restock batteries, and refresh your water.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calmState: {
    paddingTop: Spacing.three, // sits the rings closer to the header
    paddingBottom: Spacing.two, // small, so the nudge sits near the disclaimer below
    // no horizontal padding: lets the nudge span the same width as the season bar below
    alignItems: "center", // centers everything horizontally — calm, not urgent
    gap: Spacing.three,
  },
  calmTitle: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    lineHeight: 28, // always >= fontSize or the text clips
    fontWeight: "600",
  },
  calmBody: {
    textAlign: "center", // matches the centered rings and heading above it
    lineHeight: 22,
    maxWidth: 300, // keeps the line short so it wraps into a tidy block, not edge-to-edge
  },
  calmFootnote: {
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280, // slightly narrower than the body above, so it reads as secondary
  },
  nudge: {
    alignSelf: "stretch", // full width inside the center-aligned column
    alignItems: "center", // icon over centered text, matching the hero above
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
  },
  nudgeText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center", // matches the centered copy up the screen
  },
  // Three rings, outermost to innermost. Each borderRadius is exactly half the width.
  ring1: {
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 1,
    alignItems: "center", // centers the next ring horizontally
    justifyContent: "center", // and vertically
  },
  ring2: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring3: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});

// The calm "all clear" state — what people see on most days. Frameless on purpose:
// cards are reserved for real watch/warning states, so a card appearing means something.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function CalmState() {
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

      {/* Attribution — we organize prep, NWS is the official authority. */}
      <ThemedText themeColor="textSecondary" style={styles.calmSource}>
        Source: National Weather Service, Miami
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  calmState: {
    paddingVertical: Spacing.six, // room to breathe now that there's no border holding it
    paddingHorizontal: Spacing.four,
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
  calmSource: {
    fontSize: 12, // smaller than ThemedText's "small" (14) — this is the quietest line
    lineHeight: 16,
    textAlign: "center",
    marginTop: Spacing.six, // extra space so it detaches from the copy above it
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

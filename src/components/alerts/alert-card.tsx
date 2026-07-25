// The active alert card — amber for a watch (conditions possible), red for a warning
// (conditions expected). Both share this component; only the colors and wording change.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AlertCardProps = {
  // "watch" = conditions possible (amber); "warning" = conditions expected (red).
  severity: "watch" | "warning";
};

export function AlertCard({ severity }: AlertCardProps) {
  const theme = useTheme();

  // Only the colors and label change between a watch and a warning. The light amber fill
  // takes dark text; the dark red fill takes white — that's the badgeTextColor flip.
  const isWarning = severity === "warning";
  const cardBackground = isWarning ? theme.dangerBackground : theme.warningBackground;
  const badgeFill = isWarning ? theme.dangerFill : theme.warningFill;
  const badgeTextColor = isWarning ? "#FFFFFF" : theme.text;
  const badgeLabel = isWarning ? "HURRICANE WARNING" : "TROPICAL STORM WATCH";

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      {/* Severity badge — the first thing your eye should land on. */}
      <View style={[styles.badge, { backgroundColor: badgeFill }]}>
        {/* Storm symbol — a placeholder for the signal-flag system coming later. */}
        <MaterialCommunityIcons
          name="weather-hurricane"
          size={13}
          color={badgeTextColor}
        />
        <ThemedText style={[styles.badgeText, { color: badgeTextColor }]}>
          {badgeLabel}
        </ThemedText>
      </View>

      {/* Headline — the one line someone reads if they read nothing else.
          A watch says conditions are POSSIBLE; a warning says EXPECTED. */}
      {isWarning ? (
        <ThemedText style={styles.headline}>
          Hurricane conditions expected by Friday night
        </ThemedText>
      ) : (
        <ThemedText style={styles.headline}>
          Tropical storm conditions possible by Friday afternoon
        </ThemedText>
      )}

      {/* The details: fact → what the classification means → what to do.
          Calm-but-serious for a warning; we mirror the NWS wording exactly. */}
      {isWarning ? (
        <ThemedText style={styles.body}>
          Sustained winds of{" "}
          <ThemedText style={styles.stat}>74+ mph</ThemedText> are
          expected across Broward County. A warning means these
          conditions are on the way within{" "}
          <ThemedText style={styles.stat}>36 hours</ThemedText> —
          it&apos;s time to finish every task and follow local emergency
          guidance.
        </ThemedText>
      ) : (
        <ThemedText style={styles.body}>
          Sustained winds of{" "}
          <ThemedText style={styles.stat}>39–57 mph</ThemedText> are
          possible across Broward County. A watch means conditions are
          possible within{" "}
          <ThemedText style={styles.stat}>48 hours</ThemedText> —
          it&apos;s the signal to finish preparing, not a reason to panic.
        </ThemedText>
      )}

      {/* Who issued this and when — builds trust, and matches the calm state's
          source line. Not textSecondary: muted gray washes out on the card. */}
      <ThemedText style={styles.issued}>
        Issued 5:03 AM · National Weather Service, Miami
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: "flex-start", // left-aligned: this card is for reading, not admiring
  },
  headline: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26, // scaled down with the font size to keep the wrap tight
    fontWeight: "600",
  },
  body: {
    fontSize: 15,
    lineHeight: 22, // still generous, since this is the paragraph people read under stress
  },
  stat: {
    fontWeight: "700", // bold instead of a color — scannable without looking like a link
    lineHeight: 22, // must match the paragraph or the line spacing jumps
  },
  issued: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7, // quieter than the body without relying on textSecondary's gray
  },
  badge: {
    alignSelf: "flex-start", // hugs its text instead of stretching the card's width
    flexDirection: "row", // icon and text side by side
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5, // small caps read better with a little breathing room
  },
});

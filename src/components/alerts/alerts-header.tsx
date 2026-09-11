// Alerts header: serif title, freshness pill, and the place line.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AlertsHeaderProps = {
  isOffline: boolean;
  // When NWS last answered. Null before it ever has — then there's no pill.
  checkedAt: string | null;
  // "Plantation, FL". Null when onboarding never reached NWS.
  place: string | null;
};

export function AlertsHeader({ isOffline, checkedAt, place }: AlertsHeaderProps) {
  const theme = useTheme();

  const pillLabel = isOffline ? `LAST · ${checkedAt}` : `Updated ${checkedAt}`;
  const pillBackground = isOffline ? theme.offlineBanner : theme.backgroundElement;
  const pillTextColor = isOffline ? "#FFFFFF" : theme.textSecondary;

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.title}>Alerts</ThemedText>

        {checkedAt !== null && (
          <View style={[styles.updatedPill, { backgroundColor: pillBackground }]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={pillTextColor}
            />
            <ThemedText style={[styles.updatedPillText, { color: pillTextColor }]}>
              {pillLabel}
            </ThemedText>
          </View>
        )}
      </View>

      {/* No place, no row — a pin with nothing beside it says nothing. */}
      {place !== null && (
        <View style={styles.placeRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={15}
            color={theme.textSecondary}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {place}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.two,
    gap: Spacing.half,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500",
  },
  updatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
  },
  updatedPillText: {
    fontSize: 12,
    lineHeight: 16,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});

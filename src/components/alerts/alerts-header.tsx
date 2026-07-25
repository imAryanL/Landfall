// The Alerts screen header: the serif title, a freshness pill, and the county line.
// The pill flips between online and offline styling — how fresh the data is always matters.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type AlertsHeaderProps = {
  isOffline: boolean;
  // When the cached NWS data was last successfully fetched.
  cachedAt: string;
};

export function AlertsHeader({ isOffline, cachedAt }: AlertsHeaderProps) {
  const theme = useTheme();

  // The pill is the same either way; online and offline differ only in these values.
  // Offline swaps in the neutral slate + "LAST" wording so staleness reads at a glance.
  const pillLabel = isOffline ? `LAST · ${cachedAt}` : "Updated 9:32 AM";
  const pillBackground = isOffline ? theme.offlineBanner : theme.backgroundElement;
  const pillTextColor = isOffline ? "#FFFFFF" : theme.textSecondary;

  return (
    <View style={styles.header}>
      {/* Title on the left, freshness pill pushed to the far right. */}
      <View style={styles.titleRow}>
        <ThemedText style={styles.title}>Alerts</ThemedText>

        {/* Freshness pill — always visible, since stale storm data is dangerous. */}
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
      </View>

      {/* County line: a location pin next to the county name, so people know it's their area. */}
      <View style={styles.countyRow}>
        <MaterialCommunityIcons
          name="map-marker"
          size={15}
          color={theme.textSecondary}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Broward County, FL
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.two,
    gap: Spacing.half, // tight, even spacing between the title row and the county line
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center", // vertically centers the small pill against the big title
    justifyContent: "space-between", // title left, pill pushed to the far right
  },
  title: {
    fontFamily: Fonts.serif, // testing an editorial serif for display headings
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500",
  },
  updatedPill: {
    flexDirection: "row", // clock icon next to the text
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 999, // anything larger than half the height gives a full round end
  },
  updatedPillText: {
    fontSize: 12, // 11 is the practical floor for readable UI text; this needs to stay legible
    lineHeight: 16,
  },
  countyRow: {
    flexDirection: "row", // put the pin and text side by side (RN defaults to column)
    alignItems: "center", // vertically center the pin against the text
    gap: Spacing.one, // small space between the pin and the county name
  },
});

// Alerts tab — storm watches/warnings for your county, from the National Weather Service.
// Building the calm "no active alerts" look first, one piece at a time; mock data for now.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  Fonts,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function AlertsScreen() {
  // Get the theme so the location pin can use our muted color.
  const theme = useTheme();

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header group: title, county, and last-updated — kept close together. */}
          <View style={styles.header}>
            {/* Screen title. */}
            <ThemedText style={styles.headerTitle}>Storm alerts</ThemedText>

            {/* County line: a location pin next to the county name, so people know it's their area. */}
            <View style={styles.countyRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={15}
                color={theme.textSecondary}
              />
              <ThemedText type="small" themeColor="textSecondary">
                Pinellas County, FL
              </ThemedText>
            </View>

            {/* How fresh the info is — important because stale storm data is dangerous. */}
            <ThemedText type="small" themeColor="textSecondary">
              Updated 9:32 AM · just now
            </ThemedText>
          </View>

          {/* The calm "all clear" state — what people see on most days.
              Deliberately frameless: a card would only draw a box around "nothing is wrong".
              The watch/warning states DO get cards, so a card appearing means something real. */}
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
            <ThemedText
              themeColor="textSecondary"
              style={styles.calmBody}
            >
              The National Weather Service hasn&apos;t issued any watches or
              warnings for Pinellas County.
            </ThemedText>

            {/* Says out loud that the app keeps working without signal — the one place
                offline-first is visible to the user. */}
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.calmFootnote}
            >
              Landfall checks every hour and saves the newest update, so it&apos;s
              here even if you lose signal.
            </ThemedText>

            {/* Attribution — we organize prep, NWS is the official authority. */}
            <ThemedText themeColor="textSecondary" style={styles.calmSource}>
              Source: National Weather Service, Tampa Bay
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    marginTop: Spacing.two,
    gap: Spacing.half, // tight, even spacing between the title, county, and updated lines
  },
  headerTitle: {
    fontFamily: Fonts.sans, // matches the Checklist and Inventory titles
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
  },
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
  countyRow: {
    flexDirection: "row", // put the pin and text side by side (RN defaults to column)
    alignItems: "center", // vertically center the pin against the text
    gap: Spacing.one, // small space between the pin and the county name
  },
});

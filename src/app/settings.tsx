// Settings, opened from the gear on Home. Notifications and About for now; household editing comes later.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { requestNotificationPermission } from "@/lib/notifications";

export default function SettingsScreen() {
  const theme = useTheme();

  // Null until the phone answers.
  const [isOn, setIsOn] = useState<boolean | null>(null);
  const [canAsk, setCanAsk] = useState(false);

  async function readPermission() {
    const permission = await Notifications.getPermissionsAsync();
    setIsOn(permission.granted);
    setCanAsk(permission.canAskAgain);
  }

  // Reads again when the user comes back from the phone's Settings app.
  useEffect(() => {
    readPermission();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        readPermission();
      }
    });

    return () => subscription.remove();
  }, []);

  // The popup only shows once (iOS) or twice (Android). After that, only Settings can turn them on.
  async function turnOn() {
    if (canAsk) {
      await requestNotificationPermission();
      await readPermission();
    } else {
      await Linking.openSettings();
    }
  }

  let statusText = "";
  if (isOn === true) {
    statusText = "On";
  } else if (isOn === false) {
    statusText = "Off";
  }

  let actionRow = null;
  if (isOn === false) {
    let actionLabel = "Open Settings";
    let actionIcon: "open-in-new" | "chevron-right" = "open-in-new";
    if (canAsk) {
      actionLabel = "Turn on notifications";
      actionIcon = "chevron-right";
    }

    actionRow = (
      <View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          onPress={turnOn}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
          <ThemedText themeColor="primaryDeep" style={styles.actionText}>
            {actionLabel}
          </ThemedText>
          <MaterialCommunityIcons name={actionIcon} size={20} color={theme.primaryDeep} />
        </Pressable>
      </View>
    );
  }

  // Falls back to Home when opened by a deep link with no history.
  function leave() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Pressable
              onPress={leave}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ThemedText style={styles.title}>Settings</ThemedText>

          <View style={styles.section}>
            <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
              Notifications
            </ThemedText>

            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.row}>
                <View style={[styles.iconDisc, { backgroundColor: theme.backgroundSelected }]}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color={theme.primaryDeep} />
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={styles.rowTitle}>Storm and supply alerts</ThemedText>
                </View>
                <ThemedText themeColor="textSecondary" style={styles.rowValue}>
                  {statusText}
                </ThemedText>
              </View>

              {actionRow}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
              About
            </ThemedText>

            <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.row}>
                <View style={[styles.iconDisc, { backgroundColor: theme.backgroundSelected }]}>
                  <MaterialCommunityIcons name="weather-hurricane" size={20} color={theme.primaryDeep} />
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={styles.rowTitle}>Alerts from the National Weather Service</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.rowDetail}>
                    The official source. Landfall never invents a forecast.
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.row}>
                <View style={[styles.iconDisc, { backgroundColor: theme.backgroundSelected }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.primaryDeep} />
                </View>
                <View style={styles.rowText}>
                  <ThemedText style={styles.rowTitle}>Always follow official guidance</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.rowDetail}>
                    From the NWS, FEMA, and your local emergency management.
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "500",
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  sectionLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  iconDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  rowDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowValue: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.three + 36 + Spacing.three,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    paddingRight: Spacing.three,
    marginLeft: Spacing.three + 36 + Spacing.three,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

// Alerts tab — active watches and warnings for your zone, from the National Weather Service.
// The severity now comes from NWS; everything below it is still mock.

import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AlertCard } from "@/components/alerts/alert-card";
import { AlertsHeader } from "@/components/alerts/alerts-header";
import { CalmState } from "@/components/alerts/calm-state";
import { OfflineAvailability } from "@/components/alerts/offline-availability";
import { NextSteps } from "@/components/alerts/next-steps";
import { OfflineBanner } from "@/components/alerts/offline-banner";
import { StormTimeline } from "@/components/alerts/storm-timeline";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";
import { getHousehold } from "@/db/household";
import {
  levelFor,
  timelineFor,
  topAlert,
  type AlertLevel,
} from "@/lib/alert-rules";
import { fetchActiveAlerts, type AlertData } from "@/lib/nws";

// Kept separate from the severity above: connectivity and severity are independent — you
// can be offline on a calm day or during a warning — so offline is a banner layered on
// any state, never a fourth one. Still mock, and it stays mock until there is somewhere
// to cache alerts; the banner names a time, and we have no honest time to put in it yet.
const IS_OFFLINE = false;
const CACHED_AT = "8:41 AM";

// How far into hurricane season today is, as a percent (Jun 1 = 0, Nov 30 = 100). Mock
// for now — the real value gets computed from today's date in the functionality pass.
const SEASON_TODAY_PERCENT = 30;

// The few things worth doing right now. Mock data — later these come from the
// user's own unchecked checklist items, which is the part no article can give them.
const NEXT_STEPS = [
  "Charge phones and power banks tonight",
  "Top off your vehicle's fuel",
  "Review your family meeting point",
];

// What still works with no signal. Every row is a REAL v1 feature — naming something
// the app doesn't actually have would be the exact opposite of what this list is for.
// The last row is the one honest exception: alerts need a connection by nature.
const OFFLINE_FEATURES = [
  { name: "Prep checklist & inventory", note: "Saved on this device", isAvailable: true },
  { name: "Document vault", note: "Saved on this device", isAvailable: true },
  { name: "Live alerts", note: "Needs a connection to refresh", isAvailable: false },
];

export default function AlertsScreen() {
  const db = useSQLiteContext();

  // calm = nothing active · watch = conditions POSSIBLE (amber) · warning = EXPECTED (red).
  const [level, setLevel] = useState<AlertLevel>("calm");

  // The alert driving that level, so the card can quote it. Null on a calm day.
  const [alert, setAlert] = useState<AlertData | null>(null);

  // Re-checks whenever the tab is opened, so a storm that started while the app was
  // closed still shows up. Same reason Home re-reads its numbers on focus.
  useFocusEffect(
    useCallback(() => {
      async function load() {
        const household = await getHousehold(db);

        // No zone means onboarding finished on the offline path — nothing to ask about.
        if (!household?.nws_zone_id) {
          return;
        }

        const alerts = await fetchActiveAlerts(household.nws_zone_id);

        // null means NWS was never reached. Leave the last known state alone rather than
        // quietly downgrading a real warning to calm because the signal dropped.
        if (alerts === null) {
          return;
        }

        setLevel(levelFor(alerts));
        setAlert(topAlert(alerts));
      }

      load();
    }, [db]),
  );

  // Built from the alert's own times, so the rows can't describe a different storm than
  // the card above them. Empty on a calm day, when there's nothing to lay out.
  const timeline = alert === null ? [] : timelineFor(alert);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header: serif title, freshness pill, county line. See the component. */}
          <AlertsHeader isOffline={IS_OFFLINE} cachedAt={CACHED_AT} />

          {/* Offline banner — layers on top of whatever state shows below (calm, watch, or
              a cached warning). See the component for why it's neutral slate, never amber/red. */}
          {IS_OFFLINE && <OfflineBanner cachedAt={CACHED_AT} />}

          {/* The calm "all clear" state — the season bar and nudge live inside it. */}
          {level === "calm" && (
            <CalmState seasonTodayPercent={SEASON_TODAY_PERCENT} />
          )}

          {/* The active alert card — amber for a watch, red for a warning. The colors and
              the wording live inside the component, keyed off severity. */}
          {level !== "calm" && alert !== null && (
            <AlertCard severity={level} alert={alert} />
          )}

          {/* "What to expect" — its own white card, kept separate from the amber/red one:
              amber says what IS happening, white says what happens next. See the component. */}
          {level !== "calm" && <StormTimeline steps={timeline} />}

          {/* "What you can do now" — comes last so the screen ends on action. Only Landfall
              can answer this, since it knows what's already checked off. See the component. */}
          {level !== "calm" && <NextSteps steps={NEXT_STEPS} />}

          {/* "Still available offline" — layers onto any severity state below, gated on
              IS_OFFLINE alone. Answers "what can I still use?" See the component. */}
          {IS_OFFLINE && <OfflineAvailability features={OFFLINE_FEATURES} />}

          {/* Sits outside both states on purpose — it has to show whether or not
              there's an alert. Landfall organizes prep; it is not an emergency service. */}
          <ThemedText themeColor="textSecondary" style={styles.disclaimer}>
            Landfall helps you prepare. Always follow official emergency guidance.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: Spacing.three, // detaches it from the content it follows
    paddingHorizontal: Spacing.three, // keeps the line from running edge to edge
  },
});

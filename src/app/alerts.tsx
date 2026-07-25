// Alerts tab — active watches and warnings for your county, from the National Weather Service.
// Not storms only: NWS also issues tornado, flood, heat and winter alerts through the same feed.
// Mock data for now; the real NWS wiring comes in the functionality pass.

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

// Which alert is showing. Temporary switch for building — real NWS data sets this later.
//   "calm"    = no active alert (the all-clear state)
//   "watch"   = conditions POSSIBLE (amber — prepare calmly)
//   "warning" = conditions EXPECTED (red — act now)
const ALERT_STATE: "calm" | "watch" | "warning" = "warning";

// Whether we're showing cached data because the device has no connection. This is a
// SEPARATE switch from ALERT_STATE on purpose: connectivity and severity are two
// independent things — you can be offline on a calm day OR during a warning — so
// "offline" is a banner layered on top of any state, never a fourth alert state.
// Temporary switch for building; the real network check sets this later.
const IS_OFFLINE = true;

// When the cached NWS data was last successfully fetched. Mock for now.
const CACHED_AT = "8:41 AM";

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

// Two versions of the timeline — a watch and a warning describe different storms,
// so the wording differs (tropical-storm-force winds "possible" vs hurricane-force
// winds "expected"). Each row maps to a field the NWS alert actually returns — "now"
// is the alert being in effect, then `onset` (when conditions may begin), then `ends`
// (when the alert is over). Still three rows each: NWS publishes no hour-by-hour breakdown.
const WATCH_TIMELINE = [
  { time: "Now", detail: "Watch in effect", isNow: true },
  { time: "Fri 2 PM", detail: "Sustained tropical-storm-force winds begin across the county", isNow: false },
  { time: "Sat 8 AM", detail: "Watch expires", isNow: false },
];

const WARNING_TIMELINE = [
  { time: "Now", detail: "Warning in effect", isNow: true },
  { time: "Fri 9 PM", detail: "Sustained hurricane-force winds begin across the county", isNow: false },
  { time: "Sat 10 AM", detail: "Warning expires", isNow: false },
];

export default function AlertsScreen() {
  // Which timeline the "What to expect" card shows — a watch and a warning describe
  // different storms, so the wording differs. The data stays here in the screen; the
  // card that renders it is presentational.
  const timeline = ALERT_STATE === "warning" ? WARNING_TIMELINE : WATCH_TIMELINE;

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header: serif title, freshness pill, county line. See the component. */}
          <AlertsHeader isOffline={IS_OFFLINE} cachedAt={CACHED_AT} />

          {/* Offline banner — layers on top of whatever state shows below (calm, watch, or
              a cached warning). See the component for why it's neutral slate, never amber/red. */}
          {IS_OFFLINE && <OfflineBanner cachedAt={CACHED_AT} />}

          {/* The calm "all clear" state — frameless on purpose (see the component). */}
          {ALERT_STATE === "calm" && <CalmState />}

          {/* The active alert card — amber for a watch, red for a warning. The colors and
              the wording live inside the component, keyed off severity. */}
          {ALERT_STATE !== "calm" && <AlertCard severity={ALERT_STATE} />}

          {/* "What to expect" — its own white card, kept separate from the amber/red one:
              amber says what IS happening, white says what happens next. See the component. */}
          {ALERT_STATE !== "calm" && <StormTimeline steps={timeline} />}

          {/* "What you can do now" — comes last so the screen ends on action. Only Landfall
              can answer this, since it knows what's already checked off. See the component. */}
          {ALERT_STATE !== "calm" && <NextSteps steps={NEXT_STEPS} />}

          {/* "Still available offline" — layers onto any severity state below, gated on
              IS_OFFLINE alone. Answers "what can I still use?" See the component. */}
          {IS_OFFLINE && <OfflineAvailability features={OFFLINE_FEATURES} />}

          {/* Sits outside both states on purpose — it has to show whether or not
              there's an alert. Landfall organizes prep; it is not an emergency service. */}
          <ThemedText themeColor="textSecondary" style={styles.disclaimer}>
            Landfall helps you prepare. Always follow official emergency
            guidance.
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

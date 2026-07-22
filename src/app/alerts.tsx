// Alerts tab — active watches and warnings for your county, from the National Weather Service.
// Not storms only: NWS also issues tornado, flood, heat and winter alerts through the same feed.
// Mock data for now; the real NWS wiring comes in the functionality pass.

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

// Temporary switch so we can build and check both looks.
// Real NWS data replaces this later — flip it to false to see the calm state.
const HAS_ACTIVE_ALERT = true;

// The storm's timing, in order. Mock data for now, but each row maps to a field the
// NWS alert actually returns — "now" is the alert being in effect, then `onset`
// (when conditions may begin), then `ends` (when the alert is over).
// Deliberately only three rows: NWS does not publish an hour-by-hour breakdown,
// so inventing more phases would mean guessing about storm timing.
// The few things worth doing right now. Mock data — later these come from the
// user's own unchecked checklist items, which is the part no article can give them.
const NEXT_STEPS = [
  "Charge phones and power banks tonight",
  "Top off your vehicle's fuel",
  "Review your family meeting point",
];

const TIMELINE = [
  { time: "Now", detail: "Watch in effect", isNow: true },
  { time: "Fri 2 PM", detail: "Sustained tropical-storm-force winds begin across the county", isNow: false },
  { time: "Sat 8 AM", detail: "Watch expires", isNow: false },
];

export default function AlertsScreen() {
  // Get the theme so the location pin can use our muted color.
  const theme = useTheme();

  // Build one row per timeline step, using a plain loop so it's easy to follow.
  const timelineRows = [];
  for (const step of TIMELINE) {
    // The last row has nothing below it, so it skips the connecting line and the gap.
    const isLastRow = timelineRows.length === TIMELINE.length - 1;

    timelineRows.push(
      <View key={step.time} style={styles.timelineRow}>
        {/* Column 1: when it happens. Right-aligned so the times line up as a column. */}
        <ThemedText themeColor="textTertiary" style={styles.timelineTime}>
          {step.time}
        </ThemedText>

        {/* Column 2: this step's dot, plus the line running down to the next one. */}
        <View style={styles.timelineMarker}>
          {/* The current step is a solid green dot; later steps are hollow outlines. */}
          <View
            style={[
              styles.timelineDot,
              step.isNow
                ? { backgroundColor: theme.primary }
                : { borderWidth: 2, borderColor: theme.border },
            ]}
          />
          {!isLastRow && (
            <View
              style={[styles.timelineLine, { backgroundColor: theme.border }]}
            />
          )}
        </View>

        {/* Column 3: what happens then. */}
        <View
          style={[
            styles.timelineText,
            !isLastRow && styles.timelineTextSpacing,
          ]}
        >
          <ThemedText style={styles.timelineDetail}>{step.detail}</ThemedText>
        </View>
      </View>
    );
  }

  // Build the numbered next-step rows, with a divider between them (never after the last).
  const nextStepRows = [];
  for (const step of NEXT_STEPS) {
    nextStepRows.push(
      <View key={step}>
        {/* Divider sits ABOVE each row except the first, so none dangles at the end. */}
        {nextStepRows.length > 0 && (
          <View style={[styles.nextStepDivider, { backgroundColor: theme.border }]} />
        )}

        <View style={styles.nextStepRow}>
          {/* The step's position, in a soft circle. */}
          <ThemedView type="backgroundSelected" style={styles.nextStepNumber}>
            <ThemedText themeColor="primaryDeep" style={styles.nextStepNumberText}>
              {nextStepRows.length + 1}
            </ThemedText>
          </ThemedView>

          <ThemedText style={styles.nextStepText}>{step}</ThemedText>

          {/* Hints that the row opens the matching checklist item. */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textTertiary}
          />
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header group: title with its freshness pill, then the county line. */}
          <View style={styles.header}>
            {/* Title on the left, freshness pill pushed to the far right. */}
            <View style={styles.titleRow}>
              <ThemedText style={styles.headerTitle}>Alerts</ThemedText>

              {/* How fresh the data is — stale storm data is dangerous, so this is
                  always visible. The pill can go amber later when the data is old. */}
              <ThemedView type="backgroundElement" style={styles.updatedPill}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={10}
                  color={theme.textSecondary}
                />
                <ThemedText
                  themeColor="textSecondary"
                  style={styles.updatedPillText}
                >
                  Updated 9:32 AM
                </ThemedText>
              </ThemedView>
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

          {/* The calm "all clear" state — what people see on most days.
              Deliberately frameless: a card would only draw a box around "nothing is wrong".
              The watch/warning states DO get cards, so a card appearing means something real. */}
          {!HAS_ACTIVE_ALERT && (
            <View style={styles.calmState}>
              {/* Green check inside soft rings — a calm "radar is quiet" signal. */}
              <View style={[styles.ring1, { borderColor: theme.primarySoft }]}>
                <View
                  style={[styles.ring2, { borderColor: theme.primarySoft }]}
                >
                  <View
                    style={[styles.ring3, { borderColor: theme.primarySoft }]}
                  >
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
                The National Weather Service hasn&apos;t issued any watches or
                warnings for Broward County.
              </ThemedText>

              {/* Says out loud that the app keeps working without signal — the one place
                offline-first is visible to the user. */}
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.calmFootnote}
              >
                Landfall checks every hour and saves the newest update, so
                it&apos;s here even if you lose signal.
              </ThemedText>

              {/* Attribution — we organize prep, NWS is the official authority. */}
              <ThemedText themeColor="textSecondary" style={styles.calmSource}>
                Source: National Weather Service, Miami
              </ThemedText>
            </View>
          )}

          {/* The active alert card. Amber = a watch (prepare calmly), never red —
              red is reserved for a real hurricane warning. */}
          {HAS_ACTIVE_ALERT && (
            <View
              style={[
                styles.alertCard,
                { backgroundColor: theme.warningBackground },
              ]}
            >
              {/* Severity badge — the first thing your eye should land on.
                  Yellow fill needs DARK text; white would be unreadable on it. */}
              <View
                style={[
                  styles.severityBadge,
                  { backgroundColor: theme.warningFill },
                ]}
              >
                {/* Storm symbol — a placeholder for the signal-flag system coming later. */}
                <MaterialCommunityIcons
                  name="weather-hurricane"
                  size={13}
                  color={theme.text}
                />
                <ThemedText style={styles.severityBadgeText}>
                  TROPICAL STORM WATCH
                </ThemedText>
              </View>

              {/* Says what is happening and when — the one line someone reads if they read nothing else. */}
              <ThemedText style={styles.alertHeadline}>
                Tropical storm conditions possible by Friday afternoon
              </ThemedText>

              {/* The details, ending on reassurance — panic makes people prepare worse, not better.
                  A watch means POSSIBLE (a warning means expected) — mirror the NWS wording exactly. */}
              <ThemedText style={styles.alertBody}>
                Sustained winds of{" "}
                <ThemedText style={styles.alertStat}>39–57 mph</ThemedText> are
                possible across Broward County. A watch means conditions are
                possible within{" "}
                <ThemedText style={styles.alertStat}>48 hours</ThemedText> —
                it&apos;s the signal to finish preparing, not a reason to panic.
              </ThemedText>

              {/* Who issued this and when — builds trust, and matches the calm state's
                  source line. Not textSecondary: muted gray washes out on the amber card. */}
              <ThemedText style={styles.alertIssued}>
                Issued 5:03 AM · National Weather Service, Miami
              </ThemedText>
            </View>
          )}

          {/* "What to expect" — its own white card, kept separate from the amber one on
              purpose: amber says what is happening, white says what happens next. */}
          {HAS_ACTIVE_ALERT && (
            <View style={styles.timelineSection}>
              {/* Heading sits ABOVE the card, matching how Checklist labels its
                  category boxes — the label names the box, it isn't inside it. */}
              <ThemedText
                themeColor="textSecondary"
                style={styles.timelineHeading}
              >
                What to expect
              </ThemedText>
              {/* No gap inside the card — the rows space themselves, so the
                  connecting line can run unbroken from one dot to the next. */}
              <ThemedView type="backgroundElement" style={styles.timelineCard}>
                {timelineRows}
              </ThemedView>
            </View>
          )}

          {/* "What you can do now" — the one question only Landfall can answer, since
              it knows what's already checked off. Comes last so the screen ends on action. */}
          {HAS_ACTIVE_ALERT && (
            <View style={styles.nextStepsSection}>
              <ThemedText
                themeColor="textSecondary"
                style={styles.timelineHeading}
              >
                What you can do now
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.nextStepsCard}>
                {nextStepRows}
              </ThemedView>
            </View>
          )}

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
  header: {
    marginTop: Spacing.two,
    gap: Spacing.half, // tight, even spacing between the title row and the county line
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center", // vertically centers the small pill against the big title
    justifyContent: "space-between", // title left, pill pushed to the far right
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
  headerTitle: {
    fontFamily: Fonts.serif, // testing an editorial serif for display headings
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500",
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
  alertCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: "flex-start", // left-aligned: this card is for reading, not admiring
  },
  alertHeadline: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26, // scaled down with the font size to keep the wrap tight
    fontWeight: "600",
  },
  alertBody: {
    fontSize: 15,
    lineHeight: 22, // still generous, since this is the paragraph people read under stress
  },
  alertStat: {
    fontWeight: "700", // bold instead of a color — scannable without looking like a link
    lineHeight: 22, // must match the paragraph or the line spacing jumps
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: Spacing.three, // detaches it from the content it follows
    paddingHorizontal: Spacing.three, // keeps the line from running edge to edge
  },
  nextStepsSection: {
    gap: Spacing.two, // same heading-to-card spacing as the timeline section
    marginTop: Spacing.three,
  },
  nextStepsCard: {
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
  },
  nextStepRow: {
    flexDirection: "row", // number, text, chevron across
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  nextStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13, // half the width makes it a circle
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepNumberText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
  },
  nextStepText: {
    flex: 1, // takes the space between the number and the chevron
    fontSize: 14,
    lineHeight: 20,
  },
  nextStepDivider: {
    height: 1,
  },
  timelineSection: {
    gap: Spacing.two, // space between the heading and the card it labels
    marginTop: Spacing.three, // stacks on the ScrollView's gap to separate this from the alert card
  },
  timelineCard: {
    borderRadius: 16,
    padding: Spacing.four,
  },
  timelineHeading: {
    fontFamily: Fonts.sans, // sans, not serif — serif is reserved for screen titles
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase", // caps as a style, so the text stays normal in the JSX
    letterSpacing: 0.8, // caps look cramped without extra tracking
  },
  timelineRow: {
    flexDirection: "row", // dot column on the left, text column on the right
    gap: Spacing.three,
  },
  timelineMarker: {
    width: 12,
    alignItems: "center", // keeps the dot and the line on the same vertical axis
    marginTop: 4, // centers the 12px dot against the first line of text beside it
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6, // half the width makes it a circle
  },
  timelineLine: {
    width: 2,
    flex: 1, // stretches down to fill whatever height the row's text takes
    marginVertical: Spacing.one, // gap at BOTH ends so the line never touches a dot
  },
  timelineText: {
    flex: 1, // takes the rest of the row's width
  },
  timelineTextSpacing: {
    paddingBottom: Spacing.five, // gap to the next row; the line runs through it
  },
  timelineTime: {
    width: 62, // fixed width so every time lands on the same right edge
    textAlign: "right",
    fontSize: 12,
    lineHeight: 20, // matches the description's line height so the two align
    fontWeight: "600", // light, so the times read as quiet markers not labels
  },
  timelineDetail: {
    fontSize: 12, // matches the alert card's body so no line outranks it
    lineHeight: 20,
    fontWeight: "400", // heavier than the light time beside it, so the content leads
  },
  alertIssued: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7, // quieter than the body without relying on textSecondary's gray
  },
  severityBadge: {
    alignSelf: "flex-start", // hugs its text instead of stretching the card's width
    flexDirection: "row", // icon and text side by side
    alignItems: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 6,
  },
  severityBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5, // small caps read better with a little breathing room
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

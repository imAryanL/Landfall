// Home screen — greeting, readiness score ring, and category breakdown.
// Uses placeholder/mock data for now; will connect to the real local database once it exists.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadinessRing } from '@/components/readiness-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The four parts of the readiness score. These are deliberately the only four things
// v1 can actually measure from real data: what's in the inventory, what's checked off,
// what's in the document vault, and whether alerts are set up for a county.
// Every design mockup we looked at used "Plan" and "Home" instead — but the app has no
// plan feature and no home-condition feature, so those numbers would be invented.
const BREAKDOWN = [
  { label: 'Supplies', percent: 68 },
  { label: 'Checklist', percent: 79 },
  { label: 'Documents', percent: 40 },
  { label: 'Alerts', percent: 100 },
];

// Each row carries an icon so it's readable at a glance, and every row has to point at
// a real screen — a chevron that opens nothing is a promise the app doesn't keep. Both
// of these are inventory problems (a quantity and an expiration), so both go there.
const NEEDS_ATTENTION = [
  {
    title: 'Water supply is low',
    subtitle: '3 of 8 gallons stored',
    icon: 'water' as const,
  },
  {
    title: 'Batteries expiring soon',
    subtitle: 'AA pack · 12 days left',
    icon: 'battery-alert' as const,
  },
];

// The current storm status, mirrored from the Alerts tab. Home shows one line and links
// across rather than repeating the whole alert card — Alerts stays the single place
// storm information lives, so there's only ever one copy to keep correct.
const STORM_STATUS = {
  severity: 'watch' as 'calm' | 'watch' | 'warning',
  label: 'Tropical Storm Watch in effect',
  detail: 'Broward County · National Weather Service',
};

function BreakdownBar({ label, percent }: { label: string; percent: number }) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLabelRow}>
        <ThemedText type="small">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {percent}%
        </ThemedText>
      </View>
      <ThemedView type="backgroundSelected" style={styles.barTrack}>
        <ThemedView type="primary" style={[styles.barFill, { width: `${percent}%` }]} />
      </ThemedView>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();

  // Build the four breakdown bars with a plain loop.
  const breakdownBars = [];
  for (const item of BREAKDOWN) {
    breakdownBars.push(
      <BreakdownBar key={item.label} label={item.label} percent={item.percent} />
    );
  }

  // The dot follows the severity ladder: green when calm, amber for a watch, red for a
  // warning. Only the dot takes the color — Home keeps neutral surfaces, because a red
  // card on the home screen would spend the loudest color the app has on a pointer.
  // Typed as string on purpose: without it TypeScript locks the variable to the exact
  // green it was created with, and the two reassignments below become errors.
  let stormDotColor: string = theme.primary;
  if (STORM_STATUS.severity === 'watch') {
    stormDotColor = theme.warningFill;
  }
  if (STORM_STATUS.severity === 'warning') {
    stormDotColor = theme.dangerFill;
  }

  // "1 items" reads wrong, so pick the word to match the count.
  const attentionCount = NEEDS_ATTENTION.length;
  const attentionLabel =
    attentionCount === 1 ? '1 item' : `${attentionCount} items`;

  // Build the amber cards with a plain loop: icon, the two lines of text, then a
  // chevron on the right showing the row opens something.
  const attentionCards = [];
  for (const item of NEEDS_ATTENTION) {
    attentionCards.push(
      <ThemedView
        key={item.title}
        type="warningBackground"
        style={styles.warningCard}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={22}
          color={theme.warning}
        />

        {/* flex: 1 lets the text take the middle, pushing the chevron to the edge. */}
        <View style={styles.warningCardText}>
          <ThemedText type="smallBold" themeColor="warning">
            {item.title}
          </ThemedText>
          <ThemedText type="small" themeColor="warning">
            {item.subtitle}
          </ThemedText>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={theme.warning}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header: the serif greeting, then a one-line read on where the household
              stands. The summary is mock for now — the real one gets built from the
              score plus whether an alert is active. */}
          <View style={styles.header}>
            {/* Greeting on the left, settings gear pushed to the far right — the same
                row pattern the Alerts header uses. Settings lives here rather than
                taking a 5th tab slot. Not wired yet; there's no screen to open. */}
            <View style={styles.titleRow}>
              <ThemedText style={styles.greeting}>Good evening, Aryan.</ThemedText>
              {/* The circle isn't only decoration — a bare icon is a smaller tap target
                  than Apple's 44pt minimum. The padding around it is what makes the gear
                  comfortably tappable once it's wired up. */}
              <View
                style={[
                  styles.settingsButton,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="cog"
                  size={22}
                  color={theme.textSecondary}
                />
              </View>
            </View>

            {/* Fact, then classification, then reassurance — reassurance last, because
                that's the part people hold onto. */}
            <ThemedText themeColor="textSecondary" style={styles.summary}>
              There&apos;s a watch out, and you&apos;re in good shape. Still time
              to prepare calmly.
            </ThemedText>
          </View>

          {/* Readiness card — the score and the four things that make it up, together
              in one card. They used to be two separate blocks, which said the same
              thing twice; side by side, the bars explain where the number came from. */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.readinessRow}>
              <ReadinessRing score={72} size={124} width={11} />

              {/* flex: 1 makes the bars take whatever width is left after the ring,
                  so this keeps working on a narrow phone or a wide tablet. */}
              <View style={styles.breakdownColumn}>{breakdownBars}</View>
            </View>

            {/* Says where the number came from. A score with no explanation reads as
                arbitrary — this one is built from the user's own data, so say so. */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText themeColor="textSecondary" style={styles.cardFootnote}>
              Built from your checklist and supplies — updates as you pack.
            </ThemedText>
          </ThemedView>

          <View style={styles.needsAttentionSection}>
            {/* Heading on the left, how many things need doing on the right. */}
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold">Needs attention</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {attentionLabel}
              </ThemedText>
            </View>

            {attentionCards}
          </View>

          {/* Storm status — one row that points into the Alerts tab, not a second copy
              of the alert card. Keeps Home a dashboard and leaves Alerts as the one
              screen that owns storm information. */}
          <ThemedView type="backgroundElement" style={styles.stormRow}>
            <View style={[styles.stormDot, { backgroundColor: stormDotColor }]} />

            <View style={styles.stormText}>
              <ThemedText type="smallBold">{STORM_STATUS.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {STORM_STATUS.detail}
              </ThemedText>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.textSecondary}
            />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginTop: Spacing.two,
    gap: Spacing.two, // space between the greeting and the line under it
  },
  titleRow: {
    flexDirection: 'row', // greeting and gear side by side
    alignItems: 'flex-start', // keeps the gear on the first line when the title wraps
    gap: Spacing.three,
  },
  greeting: {
    flex: 1, // takes the space left of the gear, so a long greeting wraps instead of
    // pushing the gear off the edge of the screen
    fontFamily: Fonts.serif, // same serif title treatment as the other three screens
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
  },
  settingsButton: {
    width: 44, // Apple's minimum comfortable tap target
    height: 44,
    borderRadius: 22, // half the width makes it a circle
    borderWidth: 2, // white on the light gray background is nearly invisible on its own
    alignItems: 'center', // centers the gear horizontally
    justifyContent: 'center', // and vertically
    marginTop: -3, // (38 line height - 44 circle) / 2, so it centers on the first line
  },
  summary: {
    lineHeight: 24, // roomy, so the wrapped second line doesn't feel cramped
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  readinessRow: {
    flexDirection: 'row', // ring on the left, bars on the right
    alignItems: 'center', // centers the ring against the stack of bars
    gap: Spacing.four, // breathing room between the ring and the bars
  },
  breakdownColumn: {
    flex: 1, // takes all the width left over after the ring
    gap: Spacing.two, // even spacing between the four bars
  },
  stormRow: {
    flexDirection: 'row', // dot, text, chevron in a row
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  stormDot: {
    width: 10,
    height: 10,
    borderRadius: 5, // half the width makes it a circle
  },
  stormText: {
    flex: 1, // takes the middle, pushing the chevron to the far edge
    gap: Spacing.half,
  },
  needsAttentionSection: {
    gap: Spacing.two,
  },
  divider: {
    height: 1,
  },
  cardFootnote: {
    fontSize: 12, // the quietest line in the card — it explains, it doesn't announce
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // heading left, count pushed to the right
    marginBottom: Spacing.one,
  },
  warningCard: {
    flexDirection: 'row', // icon, text, chevron in a row
    alignItems: 'center', // vertically centers the icons against the two lines of text
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  warningCardText: {
    flex: 1, // takes the middle, so the chevron sits at the far edge
    gap: Spacing.half,
  },
  breakdownRow: {
    gap: Spacing.half,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barTrack: {
    height: 8,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Spacing.two,
  },
});

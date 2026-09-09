// Home screen — greeting, readiness ring, category breakdown, storm row.
// Real so far: the greeting, the Checklist bar and the Alerts bar. The rest is mock.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadinessRing } from '@/components/readiness-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { getChecklistProgress, type ChecklistProgress } from '@/db/checklist';
import { getHousehold, type Household } from '@/db/household';
import { getSupplyCoverage, type SupplyCoverage } from '@/db/inventory';
import { useTheme } from '@/hooks/use-theme';

// Documents is the last hardcoded bar — there's no documents table yet. The other three
// are read from the database.
function buildBreakdown(
  progress: ChecklistProgress | null,
  household: Household | null,
  coverage: SupplyCoverage | null,
  notificationsGranted: boolean
) {
  let checklistPercent = 0;
  if (progress !== null && progress.total > 0) {
    checklistPercent = Math.round((progress.done / progress.total) * 100);
  }

  // Stocked against target across the countable supplies (water, food, flashlights).
  let suppliesPercent = 0;
  if (coverage !== null && coverage.target > 0) {
    suppliesPercent = Math.round((coverage.stocked / coverage.target) * 100);
  }

  // Both halves have to be true for an alert to land: a zone to watch, and iOS permission.
  let alertsPercent = 0;
  if (household !== null && household.nws_zone_id !== null) {
    alertsPercent += 50;
  }
  if (notificationsGranted) {
    alertsPercent += 50;
  }

  return [
    { label: 'Supplies', percent: suppliesPercent },
    { label: 'Checklist', percent: checklistPercent },
    { label: 'Documents', percent: 40 },
    { label: 'Alerts', percent: alertsPercent },
  ];
}

// Mock until quantities and expiry dates are real.
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

// Mock until the alert pipeline lands. Home mirrors one line; Alerts owns the full card.
const STORM_STATUS = {
  severity: 'watch' as 'calm' | 'watch' | 'warning',
  label: 'Tropical Storm Watch in effect',
};

// City and state, never the county — a county name is right for hundreds of ZIPs that aren't yours.
function buildStormDetail(place: string | null) {
  if (place === null || place === '') {
    return 'National Weather Service';
  }

  return place + ' · National Weather Service';
}

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

// The name is optional in onboarding, so an empty one drops the whole clause.
function buildGreeting(name: string | null) {
  const hour = new Date().getHours();

  let timeOfDay = 'evening';
  if (hour < 12) {
    timeOfDay = 'morning';
  } else if (hour < 18) {
    timeOfDay = 'afternoon';
  }

  if (name === null || name === '') {
    return `Good ${timeOfDay}.`;
  }

  return `Good ${timeOfDay}, ${name}.`;
}

export default function HomeScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();

  // Null only ever means 'not read yet' — the gate guarantees a row exists.
  const [household, setHousehold] = useState<Household | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [coverage, setCoverage] = useState<SupplyCoverage | null>(null);

  // Lives in iOS, not the database, so it gets re-read every time the tab is focused.
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // useFocusEffect, not useEffect: tab screens stay mounted, so a mount effect would read
  // once at launch and never again.
  useFocusEffect(
    // Memoised, or the effect re-runs on every render.
    useCallback(() => {
      async function load() {
        setHousehold(await getHousehold(db));
        setProgress(await getChecklistProgress(db));
        setCoverage(await getSupplyCoverage(db));

        const permission = await Notifications.getPermissionsAsync();
        setNotificationsGranted(permission.granted);
      }

      load();
    }, [db])
  );

  const breakdown = buildBreakdown(progress, household, coverage, notificationsGranted);

  const breakdownBars = [];
  for (const item of breakdown) {
    breakdownBars.push(
      <BreakdownBar key={item.label} label={item.label} percent={item.percent} />
    );
  }

  // Typed as string so the reassignments below aren't locked to the green it starts as.
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
          <View style={styles.header}>
            {/* Settings lives on this row rather than taking a 5th tab. Not wired yet. */}
            <View style={styles.titleRow}>
              <ThemedText style={styles.greeting}>{buildGreeting(household?.name ?? null)}</ThemedText>
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
                that's the part people hold onto. Mock for now. */}
            <ThemedText themeColor="textSecondary" style={styles.summary}>
              There&apos;s a watch out, and you&apos;re in good shape. Still time
              to prepare calmly.
            </ThemedText>
          </View>

          {/* Score and bars share one card: apart they said the same thing twice. */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.readinessRow}>
              <ReadinessRing score={72} size={124} width={11} />

              <View style={styles.breakdownColumn}>{breakdownBars}</View>
            </View>

            {/* A score with no explanation reads as arbitrary. */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText themeColor="textSecondary" style={styles.cardFootnote}>
              Built from your checklist and supplies — updates as you pack.
            </ThemedText>
          </ThemedView>

          <View style={styles.needsAttentionSection}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold">Needs attention</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {attentionLabel}
              </ThemedText>
            </View>

            {attentionCards}
          </View>

          {/* One row pointing into Alerts, not a second copy of the alert card. */}
          <ThemedView type="backgroundElement" style={styles.stormRow}>
            <View style={[styles.stormDot, { backgroundColor: stormDotColor }]} />

            <View style={styles.stormText}>
              <ThemedText type="smallBold">{STORM_STATUS.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {buildStormDetail(household?.place ?? null)}
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
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // keeps the gear on the first line when the title wraps
    gap: Spacing.three,
  },
  greeting: {
    flex: 1, // a long greeting wraps instead of pushing the gear off screen
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
  },
  settingsButton: {
    width: 44, // Apple's minimum tap target
    height: 44,
    borderRadius: 22,
    borderWidth: 2, // white on light grey is nearly invisible without it
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -3, // (38 line height - 44 circle) / 2, so it centers on the first line
  },
  summary: {
    lineHeight: 24,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  breakdownColumn: {
    flex: 1, // takes whatever width is left after the ring
    gap: Spacing.two,
  },
  stormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  stormDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stormText: {
    flex: 1, // pushes the chevron to the far edge
    gap: Spacing.half,
  },
  needsAttentionSection: {
    gap: Spacing.two,
  },
  divider: {
    height: 1,
  },
  cardFootnote: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  warningCardText: {
    flex: 1, // pushes the chevron to the far edge
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

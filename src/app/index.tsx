// Home screen — greeting, readiness score ring, and category breakdown.
// Uses placeholder/mock data for now; will connect to the real local database once it exists.

import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReadinessRing } from '@/components/readiness-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const BREAKDOWN = [
  { label: 'Supplies', percent: 84 },
  { label: 'Plan', percent: 65 },
  { label: 'Home', percent: 58 },
  { label: 'Docs', percent: 80 },
];

const NEEDS_ATTENTION = [
  { title: 'Water supply is low', subtitle: '3 of 8 gallons stored' },
  { title: 'Batteries expiring soon', subtitle: 'AA pack · 12 days left' },
];

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
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Good evening, Maya.
          </ThemedText>

          <View style={styles.ringRow}>
            <ReadinessRing score={72} />
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Readiness breakdown
            </ThemedText>
            {BREAKDOWN.map((item) => (
              <BreakdownBar key={item.label} {...item} />
            ))}
          </ThemedView>

          <View style={styles.needsAttentionSection}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Needs attention
            </ThemedText>
            {NEEDS_ATTENTION.map((item) => (
              <ThemedView key={item.title} type="warningBackground" style={styles.warningCard}>
                <ThemedText type="smallBold" themeColor="warning">
                  {item.title}
                </ThemedText>
                <ThemedText type="small" themeColor="warning">
                  {item.subtitle}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  ringRow: {
    alignItems: 'center',
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    marginBottom: Spacing.one,
  },
  needsAttentionSection: {
    gap: Spacing.two,
  },
  warningCard: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
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

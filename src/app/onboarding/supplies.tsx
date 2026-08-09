// Screen 4 of 6 — supplies the user already owns, so the app doesn't open at 0%.
// Nothing here writes to the database; screen 6 saves everything at once.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader, TOTAL_STEPS } from '@/components/onboarding/onboarding-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CURRENT_STEP = 3;

// All ten are on Florida's official disaster supply checklist. No icons and no subtext,
// so they fit two per line without scrolling.
const SUPPLY_SECTIONS = [
  {
    title: 'Water & food',
    items: [
      { id: 'water', label: 'Bottled water' },
      { id: 'food', label: 'Non-perishable food' },
      { id: 'can_opener', label: 'Manual can opener' },
    ],
  },
  {
    title: 'Power & light',
    items: [
      { id: 'flashlights', label: 'Flashlights' },
      { id: 'batteries', label: 'Batteries' },
      { id: 'radio', label: 'Battery or hand-crank radio' },
    ],
  },
  {
    title: 'Medical & documents',
    items: [
      { id: 'first_aid', label: 'First aid kit' },
      { id: 'medicines', label: 'Prescription medicines' },
      { id: 'cash', label: 'Cash' },
      { id: 'documents', label: 'Important documents' },
    ],
  },
];

export default function SuppliesScreen() {
  const theme = useTheme();

  const [owned, setOwned] = useState<string[]>([]);

  // Multi-select here, unlike the single home type on screen 3.
  function toggleItem(id: string) {
    if (owned.includes(id)) {
      setOwned(owned.filter((ownedId) => ownedId !== id));
    } else {
      setOwned([...owned, id]);
    }
  }

  // Two loops: one per section, one for its chips.
  const sectionBlocks = [];
  for (const section of SUPPLY_SECTIONS) {
    const chips = [];
    for (const item of section.items) {
      const isOn = owned.includes(item.id);
      chips.push(
        <Pressable
          key={item.id}
          onPress={() => toggleItem(item.id)}
          style={({ pressed }) => [
            styles.chip,
            {
              borderColor: isOn ? theme.primary : theme.border,
              backgroundColor: isOn ? theme.backgroundSelected : theme.backgroundElement,
            },
            pressed && styles.pressed,
          ]}>
          {/* Only render the check when it's on. Reserving the space widens every
              unselected chip and breaks the two-per-line fit. */}
          {isOn ? (
            <MaterialCommunityIcons name="check" size={16} color={theme.primaryDeep} />
          ) : null}

          <ThemedText themeColor={isOn ? 'primaryDeep' : 'text'} style={styles.chipLabel}>
            {item.label}
          </ThemedText>
        </Pressable>
      );
    }

    sectionBlocks.push(
      <View key={section.title} style={styles.section}>
        <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
          {section.title}
        </ThemedText>

        <View style={styles.chips}>{chips}</View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <OnboardingHeader step={CURRENT_STEP} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <ThemedText themeColor="textSecondary" style={styles.stepLabel}>
              Step {CURRENT_STEP} of {TOTAL_STEPS}
            </ThemedText>

            <ThemedText style={styles.title}>What do you already have?</ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
             Tap anything you already keep at home — most households are further along than they think.
            </ThemedText>
          </View>

          <View style={styles.sections}>{sectionBlocks}</View>
        </ScrollView>

        <View style={styles.footer}>
          {/* Inert until screen 5 exists. */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.primaryDeep },
              pressed && styles.buttonPressed,
            ]}>
            <ThemedText style={styles.buttonText}>Continue</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  content: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  stepLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  sections: {
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  button: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

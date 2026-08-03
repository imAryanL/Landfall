// Onboarding screen 2 of 6 — who lives in the household.
//
// This is the first screen that actually collects anything. What gets typed and tapped
// here sets every target quantity on the checklist.
//
// Nothing on this screen writes to the database. Every answer is held in state until
// screen 6 saves them together, because a half-finished household row would make the app
// think onboarding had already run.

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader, TOTAL_STEPS } from '@/components/onboarding/onboarding-header';
import { StepperRow } from '@/components/onboarding/stepper-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The first of the five screens that ask something — the welcome screen isn't a step.
const CURRENT_STEP = 1;

export default function HouseholdScreen() {
  const theme = useTheme();

  // Held in this screen only. Nothing is saved until screen 6, for the reason at the
  // top of the file.
  const [name, setName] = useState('');

  // Starts at one adult and nothing else — the smallest true household. Counting up from
  // there is a deliberate tap, where starting at 2 would quietly ship a wrong number for
  // anyone living alone who doesn't notice it.
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [pets, setPets] = useState(0);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <OnboardingHeader step={CURRENT_STEP} />

        <View style={styles.content}>
          {/* The dots show progress at a glance, but dots alone leave people counting.
              The label says the same thing in words so nobody has to. */}
          <ThemedText themeColor="textSecondary" style={styles.stepLabel}>
            Step {CURRENT_STEP} of {TOTAL_STEPS}
          </ThemedText>

          <ThemedText style={styles.title}>Who&apos;s going to be with you?</ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Your answers set the quantities on your checklist, so you&apos;re never working
            them out in a store aisle.
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Your name
          </ThemedText>

          {/* A controlled input, exactly like on the web: value comes from state, and
              every keystroke calls onChangeText to put it back. React Native has no
              onChange event here — the text itself is handed straight to the function. */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Aryan"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words" // names are written capitalised
            autoCorrect={false} // stops an unusual name being 'fixed' into a real word
            returnKeyType="done"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          />

          <ThemedText themeColor="textSecondary" style={styles.fieldHelp}>
            Only used to greet you on the home screen. You can leave it blank.
          </ThemedText>
        </View>

        <View
          style={[
            styles.card,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
          ]}>
          <StepperRow label="Adults" hint="Including you" value={adults} onChange={setAdults} min={1} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <StepperRow label="Children" hint="Under 18" value={kids} onChange={setKids} min={0} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <StepperRow label="Pets" hint="Cats and dogs drink too" value={pets} onChange={setPets} min={0} />
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
  content: {
    // Sits directly under the header rather than centering in the leftover space —
    // the rest of the screen is about to fill in below this block.
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  stepLabel: {
    fontFamily: Fonts.sans, // sans, like every label in the app — serif means page title
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase', // caps as a style, so the text stays normal in the JSX
    letterSpacing: 0.8, // caps look cramped without a little extra tracking
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
  field: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  fieldLabel: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
  },
  fieldHelp: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    marginTop: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
  },
  divider: {
    height: 1,
  },
});

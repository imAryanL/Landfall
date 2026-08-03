// Onboarding screen 2 of 6 — who lives in the household.
//
// This is the first screen that actually collects anything. What gets typed and tapped
// here sets every target quantity on the checklist.
//
// Nothing on this screen writes to the database. Every answer is held in state until
// screen 6 saves them together, because a half-finished household row would make the app
// think onboarding had already run.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Onboarding is six screens, but the welcome screen isn't a step — it asks nothing. So
// the dots count the five screens that do ask something, and this is the first of them.
const TOTAL_STEPS = 5;
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

  // Build the row of progress dots before the JSX, so the screen below reads as a plain
  // list of blocks instead of having a loop buried inside it.
  const dots = [];
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    const isFilled = step <= CURRENT_STEP;
    dots.push(
      <View
        key={step}
        style={[styles.dot, { backgroundColor: isFilled ? theme.primaryDeep : theme.border }]}
      />
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {/* Goes back to the welcome screen. router.back() pops this screen off the
              stack, which is the same thing the swipe-from-the-edge gesture does. */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.dots}>{dots}</View>

          {/* Not wired up yet — it needs the screen after this one to exist first. */}
          <Pressable style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <ThemedText themeColor="textSecondary" style={styles.skip}>
              Skip
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* The dots show progress at a glance, but dots alone leave people counting.
              The label says the same thing in words so nobody has to. */}
          <ThemedText themeColor="textSecondary" style={styles.stepLabel}>
            Step {CURRENT_STEP} of {TOTAL_STEPS}
          </ThemedText>

          <ThemedText style={styles.title}>Who&apos;s riding it out with you?</ThemedText>

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

// Nobody has a hundred people in the house, and an absurd number would only produce an
// absurd shopping list. The cap keeps the targets believable.
const MAX_PER_ROW = 12;

type StepperRowProps = {
  label: string;
  /** The short line under the label, explaining what to count. */
  hint: string;
  value: number;
  onChange: (next: number) => void;
  /** The lowest this row is allowed to go — 1 for adults, 0 for the rest. */
  min: number;
};

// One '− 2 +' row. Written once and used three times, so the three rows can never drift
// apart from each other.
function StepperRow({ label, hint, value, onChange, min }: StepperRowProps) {
  const theme = useTheme();

  const canGoDown = value > min;
  const canGoUp = value < MAX_PER_ROW;

  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.rowHint}>
          {hint}
        </ThemedText>
      </View>

      <View style={styles.stepper}>
        <Pressable
          onPress={() => onChange(value - 1)}
          disabled={!canGoDown}
          // The circle is drawn at 36 but hitSlop stretches the touch area 6px in every
          // direction, so the real target is 48 — above Apple's 44pt minimum without
          // making the button look heavy.
          hitSlop={6}
          style={({ pressed }) => [
            styles.bump,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            !canGoDown && styles.bumpDisabled,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name="minus" size={20} color={theme.textSecondary} />
        </Pressable>

        <ThemedText style={styles.count}>{value}</ThemedText>

        <Pressable
          onPress={() => onChange(value + 1)}
          disabled={!canGoUp}
          hitSlop={6}
          style={({ pressed }) => [
            styles.bump,
            { backgroundColor: theme.primaryDeep, borderColor: theme.primaryDeep },
            !canGoUp && styles.bumpDisabled,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  skip: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.6,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  rowText: {
    flex: 1, // takes the leftover width, pushing the stepper to the right edge
  },
  rowLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  rowHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bump: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bumpDisabled: {
    opacity: 0.35, // dimmed rather than hidden, so the row never changes shape
  },
  count: {
    fontSize: 19,
    fontWeight: '600',
    minWidth: 18, // holds its width from 1 to 12, so nothing shifts as the number changes
    textAlign: 'center',
    fontVariant: ['tabular-nums'], // every digit the same width
  },
});

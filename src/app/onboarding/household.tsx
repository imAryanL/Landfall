// Onboarding screen 2 of 6 — who lives in the household.
//
// This is the first screen that actually collects anything. What gets typed and tapped
// here sets every target quantity on the checklist.
//
// Nothing on this screen writes to the database. Every answer is held in state until
// screen 6 saves them together, because a half-finished household row would make the app
// think onboarding had already run.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader, TOTAL_STEPS } from '@/components/onboarding/onboarding-header';
import { StepperRow } from '@/components/onboarding/stepper-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeTargets, PLANNING_DAYS } from '@/lib/targets';

// The first of the five screens that ask something — the welcome screen isn't a step.
const CURRENT_STEP = 1;

// Three only. A generator and storm shutters keep turning up in other people's versions
// of this screen, but both are cut from v1, so neither belongs here.
const CONCERNS = [
  { id: 'prescriptions', label: 'Daily prescriptions', icon: 'pill' },
  { id: 'infant', label: 'Infant or formula', icon: 'baby-bottle-outline' },
  { id: 'mobility', label: 'Mobility or medical device', icon: 'wheelchair-accessibility' },
] as const;

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

  // Worked out fresh on every render, so the card below moves the moment a stepper is
  // tapped. It's plain arithmetic on three small numbers, so there's nothing to cache.
  const targets = computeTargets(adults, kids, pets);

  // Which concern chips are switched on. Any number of them can be, so this holds a list
  // of ids rather than a single value.
  const [concerns, setConcerns] = useState<string[]>([]);

  // Turns one chip on or off. Both branches build a brand new array instead of changing
  // the old one — React only re-renders when it's handed a different array.
  function toggleConcern(id: string) {
    if (concerns.includes(id)) {
      setConcerns(concerns.filter((concernId) => concernId !== id));
    } else {
      setConcerns([...concerns, id]);
    }
  }

  // Built before the JSX, the same way the progress dots are, so the screen below stays
  // a readable list of blocks.
  const chips = [];
  for (const concern of CONCERNS) {
    const isOn = concerns.includes(concern.id);
    chips.push(
      <Pressable
        key={concern.id}
        onPress={() => toggleConcern(concern.id)}
        style={({ pressed }) => [
          styles.chip,
          {
            borderColor: isOn ? theme.primary : theme.border,
            backgroundColor: isOn ? theme.backgroundSelected : theme.backgroundElement,
          },
          pressed && styles.chipPressed,
        ]}>
        {/* The icon carries the meaning at a glance; picking one turns it green along
            with the fill, so a chosen chip reads as chosen from across the screen. */}
        <MaterialCommunityIcons
          name={concern.icon}
          size={18}
          color={isOn ? theme.primaryDeep : theme.textSecondary}
        />
        <ThemedText themeColor={isOn ? 'primaryDeep' : 'text'} style={styles.chipLabel}>
          {concern.label}
        </ThemedText>

        {/* Only shows once picked. The fill and the green already say 'on', but a tick is
            the thing people look for to be sure it took. */}
        {isOn ? (
          <MaterialCommunityIcons name="check" size={18} color={theme.primaryDeep} />
        ) : null}
      </Pressable>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <OnboardingHeader step={CURRENT_STEP} />

        {/* The header stays put and everything below it scrolls, so the progress dots and
            the way out are always on screen no matter how far down the user is.
            keyboardShouldPersistTaps lets a stepper be tapped while the name keyboard is
            still open — without it the first tap only dismisses the keyboard.
            automaticallyAdjustKeyboardInsets keeps the keyboard from covering the field. */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
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

          {/* Its own tinted panel rather than a row inside the card above — the card is
              where you answer, this is what the answer produces. Soft green with no border
              is the same treatment the calm-day nudge uses on Alerts: it reads as the app
              telling you something, not as another thing to fill in.
              Florida is cited alone because its guidance covers both halves of our math:
              a gallon per person a day, for seven days. ready.gov agrees on the gallon but
              asks for three days, so naming it would mean explaining the gap here. */}
          <View style={[styles.summary, { backgroundColor: theme.backgroundSelected }]}>
            <MaterialCommunityIcons name="water-outline" size={20} color={theme.primaryDeep} />

            <View style={styles.summaryText}>
              <ThemedText style={styles.targetsText}>
                That&apos;s about{' '}
                <ThemedText style={styles.targetsNumber}>{targets.waterGallons} gallons</ThemedText>{' '}
                of water and{' '}
                <ThemedText style={styles.targetsNumber}>{targets.meals}</ThemedText> no-cook meals.
              </ThemedText>

              <ThemedText themeColor="textSecondary" style={styles.footnote}>
                {PLANNING_DAYS} days at a gallon per person, per day — Florida emergency management
              </ThemedText>
            </View>
          </View>

          <View style={styles.concernsBlock}>
            <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
              Anything else to plan for
            </ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.fieldHelp}>
              These add items to your checklist.
            </ThemedText>

            {/* flexWrap lets the chips fall onto a second line by themselves, so a long
                label never squeezes the others or runs off the edge. */}
            <View style={styles.chipRow}>{chips}</View>
          </View>
        </ScrollView>

        {/* Outside the ScrollView, so it stays pinned to the bottom instead of sitting at
            the end of a long page the user has to reach. Same deep-green pill as the
            welcome screen's button. */}
        <View style={styles.footer}>
          {/* No onPress yet — screen 3 doesn't exist, and sending someone to a route that
              isn't there is worse than a button that waits. Wired up next session. */}
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
    // Breathing room under the last card, so it never sits flush against the bottom edge.
    paddingBottom: Spacing.four,
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
  summary: {
    flexDirection: 'row',
    // Top-aligned, so the drop sits beside the first line instead of drifting to the
    // middle of a block of text.
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.three,
    borderRadius: 14,
    padding: Spacing.three,
    // No border on purpose — the tint alone separates it, which keeps it lighter than the
    // bordered cards it sits between.
  },
  summaryText: {
    flex: 1, // takes the width left over beside the icon, so the text wraps under itself
    gap: Spacing.one,
  },
  targetsText: {
    fontSize: 16,
    lineHeight: 24,
  },
  targetsNumber: {
    // Only the numbers go bold, so the eye lands on the part that moves.
    fontWeight: '700',
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
  },
  concernsBlock: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  chipRow: {
    // Stacked rather than wrapped. Three labels of very different lengths always left a
    // ragged edge when they wrapped, so full-width rows read as a deliberate list.
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  chip: {
    flexDirection: 'row', // icon and label sit side by side
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999, // anything past half the height gives a full pill
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2, // lands the chip at 44 tall, Apple's tap minimum
  },
  chipPressed: {
    opacity: 0.6,
  },
  chipLabel: {
    flex: 1, // takes the leftover width, which pushes the tick to the right edge
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  button: {
    borderRadius: 999, // anything larger than half the height gives a full pill
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85, // dims while held, so a tap feels acknowledged
  },
  buttonText: {
    color: '#FFFFFF', // fixed white, because the button fill is always dark green
    fontSize: 17,
    fontWeight: '600',
  },
});

// The row that sits at the top of every onboarding screen that asks something: a back
// button, the progress dots, and a skip link.
//
// It lives in its own file because screens 3 through 6 all need the same row. Five copies
// of it would be five chances to forget to bump the step number, so the count of steps is
// kept here and the screen only says which one it is.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Onboarding is six screens, but the welcome screen isn't a step — it asks nothing. So
// the dots count the five screens that do ask something.
export const TOTAL_STEPS = 5;

type OnboardingHeaderProps = {
  /** Which of the five asking screens this is, counting from 1. */
  step: number;
};

export function OnboardingHeader({ step }: OnboardingHeaderProps) {
  const theme = useTheme();

  // Build the row of progress dots before the JSX, so the markup below reads as a plain
  // list of blocks instead of having a loop buried inside it.
  const dots = [];
  for (let dotNumber = 1; dotNumber <= TOTAL_STEPS; dotNumber++) {
    const isFilled = dotNumber <= step;
    dots.push(
      <View
        key={dotNumber}
        style={[styles.dot, { backgroundColor: isFilled ? theme.primaryDeep : theme.border }]}
      />
    );
  }

  return (
    <View style={styles.header}>
      {/* Goes back to the previous screen. router.back() pops this screen off the
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
  );
}

const styles = StyleSheet.create({
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
});

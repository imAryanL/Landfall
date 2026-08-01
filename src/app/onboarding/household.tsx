// Onboarding screen 2 of 6 — who lives in the household.
//
// PLACEHOLDER for now. This is where the name field, the adults/kids/pets steppers, the
// live supply targets and the concern chips will go. It exists at this stage so the flow
// is navigable end to end and the welcome screen has somewhere real to send people.

import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HouseholdScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Who&apos;s riding it out with you?</ThemedText>
          <ThemedText themeColor="textSecondary">Coming next.</ThemedText>
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
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '500',
  },
});

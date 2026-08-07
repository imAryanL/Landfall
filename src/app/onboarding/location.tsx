// Onboarding screen 3 of 6 — where the household lives.
//
// The ZIP typed here is the only answer in the whole flow that reaches the network. It
// becomes coordinates from a table bundled in the app, and those coordinates go to the
// National Weather Service to find out which county and alert zone cover this address.
//
// Nothing on this screen writes to the database. Screen 6 saves every answer together.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingHeader, TOTAL_STEPS } from '@/components/onboarding/onboarding-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CURRENT_STEP = 2;

// Mobile and manufactured homes are the reason this question is worth asking — Florida
// evacuates them first, and their prep advice genuinely differs from a house's.
const HOME_TYPES = [
  { id: 'house', label: 'House or townhouse', icon: 'home-outline' },
  { id: 'apartment', label: 'Apartment or condo', icon: 'office-building-outline' },
  { id: 'mobile', label: 'Mobile or manufactured home', icon: 'caravan' },
] as const;

export default function LocationScreen() {
  const theme = useTheme();

  const [zip, setZip] = useState('');
  const [homeType, setHomeType] = useState<string | null>(null);

  // The number pad still offers characters we don't want stored, so anything that isn't a
  // digit is dropped as it's typed rather than validated later.
  function handleZipChange(text: string) {
    setZip(text.replace(/[^0-9]/g, ''));
  }

  // Built before the JSX, the same way screen 2 builds its chips.
  const homeRows = [];
  for (const home of HOME_TYPES) {
    const isOn = homeType === home.id;
    homeRows.push(
      <Pressable
        key={home.id}
        onPress={() => setHomeType(home.id)}
        style={({ pressed }) => [
          styles.homeRow,
          {
            borderColor: isOn ? theme.primary : theme.border,
            backgroundColor: isOn ? theme.backgroundSelected : theme.backgroundElement,
          },
          pressed && styles.pressed,
        ]}>
        <MaterialCommunityIcons
          name={home.icon}
          size={18}
          color={isOn ? theme.primaryDeep : theme.textSecondary}
        />
        <ThemedText themeColor={isOn ? 'primaryDeep' : 'text'} style={styles.homeLabel}>
          {home.label}
        </ThemedText>

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.content}>
            <ThemedText themeColor="textSecondary" style={styles.stepLabel}>
              Step {CURRENT_STEP} of {TOTAL_STEPS}
            </ThemedText>

            <ThemedText style={styles.title}>Where is home?</ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              We use this to find which county&apos;s watches and warnings apply to you.
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
              Your ZIP code
            </ThemedText>

            <TextInput
              value={zip}
              onChangeText={handleZipChange}
              placeholder="33322"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              maxLength={5}
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
              Use the ZIP for your home address, not a PO box.
            </ThemedText>
          </View>

          <View style={styles.homeBlock}>
            <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
              Type of home
            </ThemedText>

            <ThemedText themeColor="textSecondary" style={styles.fieldHelp}>
              Hurricane guidance differs for each, especially mobile homes.
            </ThemedText>

            <View style={styles.homeRows}>{homeRows}</View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {/* Still inert — the lookup that has to run before moving on lands next. */}
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
    // Wider than the name field's tracking, so five digits read as digits at a glance.
    letterSpacing: 1,
  },
  fieldHelp: {
    fontSize: 13,
    lineHeight: 18,
  },
  homeBlock: {
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  homeRows: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2, // lands the row at 44 tall, Apple's tap minimum
  },
  homeLabel: {
    flex: 1,
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

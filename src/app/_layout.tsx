import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    // Opens the database once for the whole app and runs any missing migration steps
    // before anything renders. Same idea as a React context provider on the web: any
    // screen inside can reach the database without it being passed down by hand.
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />

        {/* The stack is the root of the app now, and the tab bar is one branch of it.
            That's what lets onboarding open later as a full screen with no tabs.
            Headers are off because every screen draws its own title. */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}

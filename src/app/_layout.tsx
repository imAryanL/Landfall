import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/schema';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    // Opens the database once for the whole app and runs any missing migration steps
    // before the tabs render. Same idea as a React context provider on the web: any
    // screen inside can reach the database without it being passed down by hand.
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </SQLiteProvider>
  );
}

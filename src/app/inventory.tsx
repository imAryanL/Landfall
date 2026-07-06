// Placeholder screen for the Inventory tab — will hold the supply list (quantities, expiration, photos).

import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function InventoryScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThemedText type="title">Inventory</ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

// One supply, opened by tapping a card on the Inventory tab. The square brackets in the
// filename make the id part of the address, so /supply/3 lands here with id = "3".
//
// It sits beside the tabs rather than inside them, like onboarding does, so it pushes
// over the whole screen and the tab bar steps out of the way while you edit an item.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import {
  getInventoryItem,
  setInventoryQuantity,
  type InventoryItemRow,
} from "@/db/inventory";
import { useTheme } from "@/hooks/use-theme";
import { iconFor } from "@/lib/supply-icons";

// The line under the big number. Only items linked to a checklist row have a target, and
// a target can exist without a unit — flashlights need 3, measured in nothing.
function targetLabel(item: InventoryItemRow) {
  if (item.target_qty === null) {
    return "No target — you either have one or you don't.";
  }

  if (item.unit === null) {
    return `Target for your household: ${item.target_qty}`;
  }

  return `Target for your household: ${item.target_qty} ${item.unit}`;
}

export default function SupplyDetailScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();

  // Whatever sat in the address bar. It arrives as text, since an address is text, so it
  // has to be turned into a number before the database will match on it.
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);

  // Null while the read is in flight. It also covers an id with no row behind it, which
  // can't happen by tapping a card — you'd have to open the address by hand.
  const [item, setItem] = useState<InventoryItemRow | null>(null);

  // A plain useEffect, unlike the tabs. This screen is pushed fresh every time it opens
  // and thrown away when you go back, so there's no stale copy hanging around to re-read.
  useEffect(() => {
    async function load() {
      setItem(await getInventoryItem(db, itemId));
    }

    load();
  }, [db, itemId]);

  // Save the new count, then read the row back rather than adjusting the number on screen
  // ourselves. Same call as ticking a checklist item: one small local query, and the
  // screen can never end up showing something the database disagrees with.
  async function changeQuantity(delta: number) {
    if (item === null) {
      return;
    }

    await setInventoryQuantity(db, item.id, item.quantity + delta);
    setItem(await getInventoryItem(db, itemId));
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back to the inventory list. Same circular button as onboarding uses. */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>

          {/* Nothing to draw until the row arrives. */}
          {item !== null && (
            <>
              {/* The item's own header: icon, name, category. */}
              <View style={styles.itemHeader}>
                <ThemedView type="backgroundSelected" style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={iconFor(item.template_id)}
                    size={30}
                    color={theme.primary}
                  />
                </ThemedView>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.category}
                </ThemedText>
              </View>

              {/* How many you have, and the only thing on this screen you can change. */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="small" themeColor="textTertiary" style={styles.cardLabel}>
                  ON HAND
                </ThemedText>

                <View style={styles.stepper}>
                  {/* Nothing below zero — you can't own less than none of something. */}
                  <Pressable
                    onPress={() => changeQuantity(-1)}
                    disabled={item.quantity === 0}
                    accessibilityRole="button"
                    accessibilityLabel="Remove one"
                    // Drawn at 48 and stretched another 6px by hitSlop, so the real
                    // target clears Apple's 44pt minimum comfortably.
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.bump,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                      item.quantity === 0 && styles.bumpDisabled,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons
                      name="minus"
                      size={24}
                      color={theme.textSecondary}
                    />
                  </Pressable>

                  <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>

                  {/* No ceiling: a real target can be 25 gallons, so a cap would be a
                      guess about how much somebody is allowed to have. */}
                  <Pressable
                    onPress={() => changeQuantity(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Add one"
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.bump,
                      { backgroundColor: theme.primaryDeep, borderColor: theme.primaryDeep },
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
                  </Pressable>
                </View>

                <ThemedText type="small" themeColor="textSecondary">
                  {targetLabel(item)}
                </ThemedText>
              </ThemedView>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  itemHeader: {
    alignItems: "center", // centered, so this reads as a different kind of screen than the list
    gap: Spacing.two,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontFamily: Fonts.serif, // serif is for screen titles, and here the item is the title
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: "center",
    gap: Spacing.two,
  },
  cardLabel: {
    letterSpacing: 1, // caps labels get a little air, same as the section labels elsewhere
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.four,
  },
  bump: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bumpDisabled: {
    opacity: 0.35, // dimmed rather than hidden, so the row never changes shape
  },
  quantity: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "600",
    minWidth: 72, // holds its width into three digits, so the buttons don't shuffle
    textAlign: "center",
    fontVariant: ["tabular-nums"], // every digit the same width
  },
});

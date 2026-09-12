// One supply, opened by tapping a row on the Checklist tab. The square brackets in the
// filename make the id part of the address, so /supply/3 lands here with id = "3".
//
// It sits beside the tabs rather than inside them, like onboarding does, so it pushes
// over the whole screen and the tab bar steps out of the way while you edit an item.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Checkbox } from "@/app/(tabs)/checklist";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { setChecklistItemDone } from "@/db/checklist";
import {
  getInventoryItem,
  setExpiryDate,
  setInventoryQuantity,
  type InventoryItemRow,
} from "@/db/inventory";
import { useTheme } from "@/hooks/use-theme";
import { daysUntil, expiryLabel, isExpiringSoon } from "@/lib/expiry";
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

// Only these actually go bad. Cash, documents, rope, a tarp, shutters — none of them
// expire, and offering a date for them would be inventing a fact about the item.
const EXPIRABLE_TEMPLATE_IDS = ["water", "food", "batteries", "first_aid", "medicines"];

// Quick-pick spans instead of a date-picker library — keeps this screen on the same
// no-native-modules footing as the rest of v1. "1 year" is just 12 months.
const EXPIRY_CHOICES = [
  { label: "1 month", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "1 year", months: 12 },
];

// Replaces this item's two reminders. Fixed, deterministic ids so canceling first is
// always safe — expo-notifications treats an unknown id as a no-op, even the first time.
async function scheduleExpiryReminders(id: number, name: string, expiresAt: string | null) {
  const thirtyDayId = `expiry-30-${id}`;
  const sevenDayId = `expiry-7-${id}`;

  await Notifications.cancelScheduledNotificationAsync(thirtyDayId);
  await Notifications.cancelScheduledNotificationAsync(sevenDayId);

  if (expiresAt === null) {
    return;
  }

  // The date's real either way; the reminder is a bonus on top of it — same rule as the
  // Alerts bar not counting a zone without notification permission too.
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    return;
  }

  const expiry = new Date(expiresAt);
  const now = new Date();

  const thirtyDaysBefore = new Date(expiry);
  thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);

  const sevenDaysBefore = new Date(expiry);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

  // Skip a reminder that would already be in the past — it would just fire immediately.
  if (thirtyDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: thirtyDayId,
      content: {
        title: `${name} expires in 30 days`,
        body: "Plan to restock or rotate it soon.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: thirtyDaysBefore },
    });
  }

  if (sevenDaysBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: sevenDayId,
      content: {
        title: `${name} expires in 7 days`,
        body: "Time to restock or rotate it.",
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: sevenDaysBefore },
    });
  }
}

export default function SupplyDetailScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();

  // Whatever sat in the address bar. It arrives as text, since an address is text, so it
  // has to be turned into a number before the database will match on it.
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);

  // Null while the read is in flight. It also covers an id with no row behind it, which
  // can't happen by tapping a row — you'd have to open the address by hand.
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

  // The checklist row used to be the toggle for a binary item; now its tap opens this
  // screen instead, so the toggle needs to live somewhere — here.
  async function toggleDone() {
    if (item === null || item.checklist_item_id === null) {
      return;
    }

    await setChecklistItemDone(db, item.checklist_item_id, item.done !== 1);
    setItem(await getInventoryItem(db, itemId));
  }

  async function pickExpiry(months: number) {
    if (item === null) {
      return;
    }

    const date = new Date();
    date.setMonth(date.getMonth() + months);
    const expiresAt = date.toISOString();

    await setExpiryDate(db, item.id, expiresAt);
    await scheduleExpiryReminders(item.id, item.name, expiresAt);
    setItem(await getInventoryItem(db, itemId));
  }

  const isCount = item !== null && item.target_qty !== null;
  const isExpirable = item !== null && EXPIRABLE_TEMPLATE_IDS.includes(item.template_id ?? "");
  const daysLeft = item?.expires_at != null ? daysUntil(item.expires_at, new Date()) : null;
  const expiringSoon = daysLeft !== null && isExpiringSoon(daysLeft);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back to the checklist. Same circular button as onboarding uses. */}
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

              {/* Count items get the stepper, same as always. Binary items get a plain
                  done toggle instead — "how many tarps" was never the real question. */}
              {isCount ? (
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
              ) : (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="small" themeColor="textTertiary" style={styles.cardLabel}>
                    STATUS
                  </ThemedText>

                  <Pressable
                    onPress={toggleDone}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.done === 1 }}
                    style={({ pressed }) => [styles.doneRow, pressed && styles.pressed]}>
                    <Checkbox checked={item.done === 1} />
                    <ThemedText>{item.done === 1 ? "Done" : "Mark as done"}</ThemedText>
                  </Pressable>
                </ThemedView>
              )}

              {/* Only for the items that actually go bad — see EXPIRABLE_TEMPLATE_IDS.
                  Amber once it's close, never red. */}
              {isExpirable && (
                <ThemedView
                  type={expiringSoon ? "warningBackground" : "backgroundElement"}
                  style={styles.card}>
                  <ThemedText
                    type="small"
                    themeColor={expiringSoon ? "warning" : "textTertiary"}
                    style={styles.cardLabel}>
                    EXPIRES
                  </ThemedText>

                  <ThemedText themeColor={expiringSoon ? "warning" : undefined}>
                    {daysLeft === null ? "Not set" : expiryLabel(daysLeft)}
                  </ThemedText>

                  <View style={styles.chipRow}>
                    {EXPIRY_CHOICES.map((choice) => (
                      <Pressable
                        key={choice.label}
                        onPress={() => pickExpiry(choice.months)}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.chip,
                          { borderColor: theme.border },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="small">{choice.label}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ThemedView>
              )}
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
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    alignSelf: "stretch",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});

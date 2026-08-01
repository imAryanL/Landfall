// Inventory tab — a list of your emergency supplies (quantities, storage, expiration).
// Building it up one piece at a time; mock data for now.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// The set of valid MaterialCommunityIcons names (so TypeScript checks our icon spelling).
type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

// The shape of one supply item.
type InventoryItem = {
  id: string;
  name: string;
  icon: IconName; // which category icon to show, e.g. "water"
  quantity: string; // on-hand vs target, e.g. "3 / 8 gal"
  category: string; // e.g. "Water & Food"
  location: string; // where it's kept, e.g. "Garage shelf B"
  // Expiration note. `soon: true` shows it in amber; null = nothing to show (non-perishable).
  expiry: { label: string; soon: boolean } | null;
};

// Fake supply data for now — later this comes from the local database.
const ITEMS: InventoryItem[] = [
  { id: "water", name: "Drinking water", icon: "water", quantity: "3 / 8 gal", category: "Water & Food", location: "Garage shelf B", expiry: { label: "Expires in 6 days", soon: true } },
  { id: "food", name: "Canned food", icon: "food-variant", quantity: "9 / 9 meals", category: "Water & Food", location: "Pantry", expiry: { label: "Good until Aug 2027", soon: false } },
  { id: "batteries", name: "AA batteries", icon: "battery", quantity: "8 / 12", category: "Power & Light", location: "Kitchen drawer", expiry: { label: "Expires in 12 days", soon: true } },
  { id: "flashlights", name: "Flashlights", icon: "flashlight", quantity: "2 / 2", category: "Power & Light", location: "Hall closet", expiry: null },
  { id: "first-aid", name: "First-aid kit", icon: "medical-bag", quantity: "1 / 1", category: "Medical & Safety", location: "Bathroom cabinet", expiry: { label: "Good until 2028", soon: false } },
];

// One supply card — a category icon on the left, then the item's details on the right.
function InventoryCard({ item }: { item: InventoryItem }) {
  // Get the theme so the icon can use our green (theme.primary).
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Whole card is a horizontal row: icon circle on the left, content column on the right. */}
      <View style={styles.cardRow}>
        {/* Leading icon in a soft-green circle. */}
        <ThemedView type="backgroundSelected" style={styles.iconCircle}>
          <MaterialCommunityIcons name={item.icon} size={22} color={theme.primary} />
        </ThemedView>

        {/* Content column takes the remaining width (flex: 1). */}
        <View style={styles.content}>
          {/* A horizontal row: name pushed left, pill pushed right. */}
          <View style={styles.topRow}>
            <ThemedText type="smallBold">{item.name}</ThemedText>
            <ThemedView type="backgroundSelected" style={styles.pill}>
              <ThemedText type="small" themeColor="textSecondary">
                {item.quantity}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Meta line: category and where it's stored, in muted text. */}
          <ThemedText type="small" themeColor="textSecondary">
            {item.category} · {item.location}
          </ThemedText>

          {/* Expiration line. Only shown if the item has one (non-perishables are null).
              Amber when expiring soon, calm muted text otherwise — never red. */}
          {item.expiry && (
            <ThemedText
              type="small"
              themeColor={item.expiry.soon ? "warning" : "textSecondary"}
            >
              {item.expiry.label}
            </ThemedText>
          )}
        </View>

        {/* Muted chevron hinting the whole card is tappable (opens the detail screen later). */}
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textSecondary} />
      </View>
    </ThemedView>
  );
}

export default function InventoryScreen() {
  // Get the theme so the amber pill can use our warning colors.
  const theme = useTheme();

  // Build one card per supply item, in order.
  const cards = [];
  for (const item of ITEMS) {
    cards.push(<InventoryCard key={item.id} item={item} />);
  }

  // Count how many supplies are expiring soon (shown as an amber pill in the header).
  let expiringCount = 0;
  for (const item of ITEMS) {
    if (item.expiry && item.expiry.soon) {
      expiringCount = expiringCount + 1;
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        {/* ScrollView so the list can scroll once it's taller than the screen. */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Screen header: big bold title + a calm subtitle. */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Inventory</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              What you have on hand
            </ThemedText>
            {/* Amber pill — only shows when something is expiring soon. Calm days stay clean. */}
            {expiringCount > 0 && (
              <View style={[styles.expiringPill, { backgroundColor: theme.warningBackground }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={14} color={theme.warning} />
                <ThemedText type="small" themeColor="warning">
                  {expiringCount} expiring soon
                </ThemedText>
              </View>
            )}
          </View>

          {/* All the supply cards we built above. */}
          {cards}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three, // space between the header and the cards we'll add next
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  expiringPill: {
    flexDirection: "row",
    alignItems: "center", // vertically center the icon against the text
    gap: Spacing.one, // small space between the icon and the words
    alignSelf: "flex-start", // pill hugs its content instead of filling the row
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    marginTop: Spacing.one, // a little breathing room below the subtitle
  },
  headerTitle: {
    fontFamily: Fonts.serif, // editorial serif — display headings only, body stays sans
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "500", // serifs carry weight in the letterforms, so they read better light
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center", // vertically center the icon against the text block
    gap: Spacing.three, // space between the icon circle and the content
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22, // half of width/height = a perfect circle
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1, // take all remaining width beside the icon
    gap: Spacing.one, // small gap between the lines of text
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // name left, pill right
  },
  pill: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});

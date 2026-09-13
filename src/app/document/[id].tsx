// One document, opened by tapping a row on the Documents tab. Mirrors supply/[id].tsx's
// shape, but the photo itself is the hero — this is the first screen in the app where a
// real photo, not an icon, is what the user actually came to look at.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhotoViewer } from "@/components/photo-viewer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { deleteDocument, getDocument, type DocumentRow } from "@/db/documents";
import { useTheme } from "@/hooks/use-theme";

// 'Sep 3', matching the list row's short date.
function addedLabel(createdAt: string) {
  const date = new Date(createdAt);
  return `Added ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function DocumentDetailScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const photoWidth = Math.min(useWindowDimensions().width, MaxContentWidth);

  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Number(id);

  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [page, setPage] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const heroScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function load() {
      setDoc(await getDocument(db, documentId));
    }

    load();
  }, [db, documentId]);

  // Keeps the hero's own paging in sync when the full-screen viewer changes the page —
  // a no-op scroll when the hero caused the change itself.
  useEffect(() => {
    heroScrollRef.current?.scrollTo({ x: page * photoWidth, animated: false });
  }, [page, photoWidth]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(event.nativeEvent.contentOffset.x / photoWidth));
  }

  // Normally pops back to the Documents tab. The fallback covers this screen being opened
  // as the first route (a deep link), where there's no history to pop — same guard
  // add-item.tsx already uses for the same reason.
  function leave() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/documents");
    }
  }

  async function handleShare() {
    if (doc === null) {
      return;
    }

    const photos: string[] = JSON.parse(doc.photo_uris);
    if (!(await Sharing.isAvailableAsync())) {
      return;
    }
    await Sharing.shareAsync(photos[page]);
  }

  async function handleDelete() {
    await deleteDocument(db, documentId);
    leave();
  }

  const photos: string[] = doc !== null ? JSON.parse(doc.photo_uris) : [];

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {doc !== null && (
            <>
              <View style={{ width: photoWidth, height: photoWidth, alignSelf: "center" }}>
                <ScrollView
                  ref={heroScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScrollEnd}>
                  {photos.map((uri) => (
                    <Pressable key={uri} onPress={() => setViewerOpen(true)} accessibilityRole="button" accessibilityLabel="View full screen">
                      <Image source={{ uri }} style={{ width: photoWidth, height: photoWidth }} contentFit="cover" />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {photos.length > 1 && (
                <View style={styles.dots}>
                  {photos.map((uri, index) => (
                    <View
                      key={uri}
                      style={[
                        styles.dot,
                        { backgroundColor: index === page ? theme.primary : theme.border },
                      ]}
                    />
                  ))}
                </View>
              )}

              <View style={styles.body}>
                <View style={styles.titleBlock}>
                  <ThemedText style={styles.title}>{doc.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {doc.category} &middot; {addedLabel(doc.created_at)}
                  </ThemedText>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <Pressable
                  onPress={handleDelete}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.deleteRow, pressed && styles.pressed]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.textSecondary} />
                  <ThemedText themeColor="textSecondary">Delete document</ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        {doc !== null && (
          <>
            <SafeAreaView edges={["top"]} style={[styles.floatingButton, styles.backButton]}>
              <Pressable
                onPress={leave}
                accessibilityRole="button"
                accessibilityLabel="Back"
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.text} />
              </Pressable>
            </SafeAreaView>

            <SafeAreaView edges={["top"]} style={[styles.floatingButton, styles.shareButton]}>
              <Pressable
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share"
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="export-variant" size={19} color={theme.text} />
              </Pressable>
            </SafeAreaView>
          </>
        )}

        {viewerOpen && photos.length > 0 && (
          <PhotoViewer photos={photos} index={page} onChangeIndex={setPage} onClose={() => setViewerOpen(false)} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: Spacing.three,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    padding: Spacing.four,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.two,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  floatingButton: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  backButton: {
    alignItems: "flex-start",
  },
  shareButton: {
    alignItems: "flex-end",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginTop: Spacing.two,
    marginHorizontal: Spacing.three,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});

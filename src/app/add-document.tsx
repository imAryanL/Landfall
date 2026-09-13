// Adds a document to the vault. Reached from the "+ Add document" row on the Documents
// tab. One screen, two steps held in local state — picking a category and a photo source,
// then confirming a title — rather than two routes, since there's nothing to navigate back
// to mid-flow except the step before it.

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts, MaxContentWidth, Spacing } from "@/constants/theme";
import { saveDocument } from "@/db/documents";
import { useTheme } from "@/hooks/use-theme";
import { DOCUMENT_CATEGORIES } from "@/lib/document-categories";

type Step = "picker" | "confirm";

// Keeps photos from ballooning the vault's storage — a phone camera's full-quality shot is
// far more detail than a document photo needs.
const PHOTO_QUALITY = 0.6;

export default function AddDocumentScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();

  const [step, setStep] = useState<Step>("picker");
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0].label);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Normally pops back to the Documents tab. The fallback covers the screen being opened
  // as the first route (a deep link), where there's no history to pop.
  function leave() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/documents");
    }
  }

  // On the confirm step, back means "pick a different photo," not "leave the flow."
  function handleBack() {
    if (step === "confirm") {
      setStep("picker");
      return;
    }
    leave();
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPermissionNotice("Camera access is off — turn it on in Settings to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: PHOTO_QUALITY });
    if (result.canceled || result.assets === null) {
      return;
    }

    startConfirming(result.assets.map((asset) => asset.uri));
  }

  async function handleChooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPermissionNotice("Photo access is off — turn it on in Settings to choose one.");
      return;
    }

    // Multiple selection so front-and-back of a card can be added in one pass.
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: PHOTO_QUALITY,
      allowsMultipleSelection: true,
    });
    if (result.canceled || result.assets === null) {
      return;
    }

    startConfirming(result.assets.map((asset) => asset.uri));
  }

  function startConfirming(uris: string[]) {
    setPhotoUris(uris);
    setTitle(category); // a real starting point beats an empty field — renamed in one tap
    setPermissionNotice(null);
    setStep("confirm");
  }

  async function handleSave() {
    if (title.trim().length === 0 || saving) {
      return;
    }

    setSaving(true);
    await saveDocument(db, title.trim(), category, photoUris);
    leave();
  }

  const categoryRows = [];
  for (const option of DOCUMENT_CATEGORIES) {
    const isOn = category === option.label;
    categoryRows.push(
      <Pressable
        key={option.id}
        onPress={() => setCategory(option.label)}
        accessibilityRole="radio"
        accessibilityState={{ selected: isOn }}
        style={({ pressed }) => [
          styles.optionRow,
          {
            borderColor: isOn ? theme.primary : theme.border,
            backgroundColor: isOn ? theme.backgroundSelected : theme.backgroundElement,
          },
          pressed && styles.pressed,
        ]}>
        <ThemedView type="backgroundElement" style={styles.optionIcon}>
          <MaterialCommunityIcons name={option.icon} size={18} color={theme.primary} />
        </ThemedView>

        <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>

        {isOn ? (
          <View style={[styles.radioFilled, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
          </View>
        ) : (
          <View style={[styles.radioEmpty, { borderColor: theme.border }]} />
        )}
      </Pressable>,
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.textSecondary} />
          </Pressable>

          {step === "picker" ? (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.title}>Add document</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Choose a category, then take or choose a photo
                </ThemedText>
              </View>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textTertiary" style={styles.fieldLabel}>
                  CATEGORY
                </ThemedText>
                <View style={styles.optionRows}>{categoryRows}</View>
              </View>

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textTertiary" style={styles.fieldLabel}>
                  ADD A PHOTO
                </ThemedText>

                <View style={styles.optionRows}>
                  <Pressable
                    onPress={handleTakePhoto}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.photoSourceRow,
                      { backgroundColor: theme.primaryDeep },
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons name="camera" size={22} color="#FFFFFF" />
                    <ThemedText style={styles.photoSourceLabel}>Take Photo</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleChooseFromLibrary}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.photoSourceRow,
                      { backgroundColor: theme.primaryDeep },
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons name="image-multiple-outline" size={22} color="#FFFFFF" />
                    <ThemedText style={styles.photoSourceLabel}>Choose from Library</ThemedText>
                  </Pressable>
                </View>

                {permissionNotice !== null && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {permissionNotice}
                  </ThemedText>
                )}
              </View>
            </>
          ) : (
            <>
              <View style={styles.confirmPhoto}>
                <Image source={{ uri: photoUris[0] }} style={styles.confirmImage} contentFit="cover" />
              </View>

              {photoUris.length > 1 && (
                <ThemedText type="small" themeColor="textSecondary">
                  +{photoUris.length - 1} more photo{photoUris.length > 2 ? "s" : ""}
                </ThemedText>
              )}

              <View style={styles.field}>
                <ThemedText type="small" themeColor="textTertiary" style={styles.fieldLabel}>
                  TITLE
                </ThemedText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  returnKeyType="done"
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
                  ]}
                />
              </View>

              <View style={styles.categoryDisplay}>
                <MaterialCommunityIcons
                  name={DOCUMENT_CATEGORIES.find((entry) => entry.label === category)?.icon ?? "file-document-outline"}
                  size={16}
                  color={theme.textSecondary}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {category}
                </ThemedText>
              </View>
            </>
          )}
        </ScrollView>

        {step === "confirm" && (
          <View style={styles.footer}>
            <Pressable
              onPress={handleSave}
              disabled={title.trim().length === 0 || saving}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.primaryDeep },
                pressed && styles.buttonPressed,
              ]}>
              <ThemedText style={styles.saveButtonText}>Save</ThemedText>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  header: {
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "500",
  },
  field: {
    gap: Spacing.two,
  },
  fieldLabel: {
    letterSpacing: 0.5,
  },
  optionRows: {
    gap: Spacing.two,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderWidth: 2,
    borderRadius: 14,
    padding: Spacing.three,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
  },
  // The two photo-source buttons are this screen's actual call to action — same solid
  // fill as Add document and Save, not the outlined look the category rows use.
  photoSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderRadius: 14,
    padding: Spacing.three,
  },
  photoSourceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  radioFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmPhoto: {
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
    fontFamily: Fonts.serif,
  },
  categoryDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
  },
  saveButton: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});

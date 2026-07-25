// A small gray uppercase label that sits outside a card, naming the section below it —
// the same way the Checklist screen labels its category boxes.

import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Fonts } from "@/constants/theme";

type SectionHeadingProps = {
  children: ReactNode;
};

export function SectionHeading({ children }: SectionHeadingProps) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.sectionHeading}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    fontFamily: Fonts.sans, // sans, not serif — serif is reserved for screen titles
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "uppercase", // caps as a style, so the text stays normal in the JSX
    letterSpacing: 0.8, // caps look cramped without extra tracking
  },
});

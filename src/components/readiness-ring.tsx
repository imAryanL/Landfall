// Draws the circular readiness-score ring shown on the Home screen, using the
// react-native-circular-progress library (handles the ring math for us).

import { StyleSheet, View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ReadinessRingProps = {
  /** 0–100 readiness score */
  score: number;
  size?: number;
  width?: number;
};

export function ReadinessRing({ score, size = 140, width = 12 }: ReadinessRingProps) {
  const theme = useTheme();

  return (
    <AnimatedCircularProgress
      size={size}
      width={width}
      fill={score}
      tintColor={theme.primary}
      backgroundColor={theme.backgroundSelected}
      lineCap="round">
      {() => (
        <View style={styles.centerLabel}>
          <ThemedText type="title" style={styles.scoreText}>
            {Math.round(score)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Ready
          </ThemedText>
        </View>
      )}
    </AnimatedCircularProgress>
  );
}

const styles = StyleSheet.create({
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 40,
    lineHeight: 44,
  },
});

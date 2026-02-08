import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useMeals } from '@/contexts/MealsContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const { getProgressData, getDailyProgress } = useMeals();
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(30);

  const colors = Colors[colorScheme ?? 'light'];

  const progressData = useMemo(() => {
    return getProgressData(timeRange);
  }, [timeRange, getProgressData]);

  const dailyProgress = useMemo(() => {
    return getDailyProgress();
  }, [getDailyProgress]);

  const stats = useMemo(() => {
    if (dailyProgress.length === 0) {
      return {
        avgCalories: 0,
        maxCalories: 0,
        minCalories: 0,
        totalProtein: 0,
        avgProtein: 0,
      };
    }

    const recentProgress = dailyProgress.slice(-timeRange);
    const calorieValues = recentProgress.map((d) => d.totalCalories).filter((v) => v > 0);
    const proteinValues = recentProgress.map((d) => d.totalProtein);

    return {
      avgCalories: calorieValues.length > 0 ? Math.round(calorieValues.reduce((a, b) => a + b, 0) / calorieValues.length) : 0,
      maxCalories: calorieValues.length > 0 ? Math.max(...calorieValues) : 0,
      minCalories: calorieValues.length > 0 ? Math.min(...calorieValues.filter((v) => v > 0)) : 0,
      totalProtein: Math.round(proteinValues.reduce((a, b) => a + b, 0)),
      avgProtein: Math.round(proteinValues.reduce((a, b) => a + b, 0) / timeRange),
    };
  }, [dailyProgress, timeRange]);

  const maxValue = useMemo(() => {
    if (progressData.length === 0) return 2000;
    const max = Math.max(...progressData.map((d) => d.value));
    return Math.ceil(max * 1.1 / 100) * 100; // Round up to nearest 100
  }, [progressData]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F5E9', dark: '#121212' }}
      headerImage={
        <Image
          source={require('@/assets/images/images.jpg')}
          style={styles.headerImage}
          contentFit="cover"
        />
      }>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <ThemedText type="title">Your Progress</ThemedText>
          <ThemedText style={styles.subtitle}>Track your nutrition over time</ThemedText>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {([7, 14, 30] as const).map((range) => (
            <Pressable
              key={range}
              style={[
                styles.timeButton,
                timeRange === range && [styles.activeTimeButton, { backgroundColor: colors.tint }],
              ]}
              onPress={() => setTimeRange(range)}>
              <Text
                style={[
                  styles.timeButtonText,
                  { color: timeRange === range ? '#fff' : colors.text },
                ]}>
                {range}D
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        {progressData.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={{ width: '100%' }}>
              {/* Y-Axis Scale */}
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ width: 40 }}>
                  <ThemedText style={{ fontSize: 10, textAlign: 'right', marginBottom: -5 }}>
                    {Math.round(maxValue)}
                  </ThemedText>
                </View>
              </View>

              {/* Chart Bars */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 200 }}>
                {progressData.map((item, index) => {
                  const heightPercent = (item.value / maxValue) * 100;
                  const shouldShowLabel =
                    progressData.length <= 7 ||
                    index % Math.ceil(progressData.length / 5) === 0 ||
                    index === progressData.length - 1;

                  return (
                    <View
                      key={index}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                      }}>
                      {/* Bar */}
                      <View
                        style={{
                          width: '80%',
                          height: `${heightPercent}%`,
                          backgroundColor: colors.tint,
                          borderRadius: 4,
                          opacity: 0.8,
                        }}
                      />
                      {/* Label */}
                      {shouldShowLabel && (
                        <ThemedText
                          style={{
                            fontSize: 9,
                            marginTop: 4,
                            textAlign: 'center',
                          }}>
                          {item.date.split('-')[2]}
                        </ThemedText>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* X-Axis */}
              <View style={{ height: 1, backgroundColor: colors.text, opacity: 0.2, marginTop: 8 }} />
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText>No data available yet. Start logging meals!</ThemedText>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { borderColor: '#ddd', backgroundColor: colors.background },
            ]}>
            <ThemedText style={styles.statLabel}>Avg Calories</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.tint }]}>
              {stats.avgCalories}
            </ThemedText>
            <ThemedText style={styles.statUnit}>kcal/day</ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { borderColor: '#ddd', backgroundColor: colors.background },
            ]}>
            <ThemedText style={styles.statLabel}>Max Calories</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.tint }]}>
              {stats.maxCalories}
            </ThemedText>
            <ThemedText style={styles.statUnit}>kcal</ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { borderColor: '#ddd', backgroundColor: colors.background },
            ]}>
            <ThemedText style={styles.statLabel}>Avg Protein</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.tint }]}>
              {stats.avgProtein}
            </ThemedText>
            <ThemedText style={styles.statUnit}>g/day</ThemedText>
          </View>

          <View
            style={[
              styles.statCard,
              { borderColor: '#ddd', backgroundColor: colors.background },
            ]}>
            <ThemedText style={styles.statLabel}>Total Protein</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.tint }]}>
              {stats.totalProtein}
            </ThemedText>
            <ThemedText style={styles.statUnit}>g ({timeRange}d)</ThemedText>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 278,
    width: '100%',
  },
  contentContainer: {
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  activeTimeButton: {
    borderColor: 'transparent',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statUnit: {
    fontSize: 11,
    opacity: 0.5,
    marginTop: 4,
  },
});

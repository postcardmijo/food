import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useMeals } from '@/contexts/MealsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const { getProgressData, getDailyProgress } = useMeals();
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

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
      avgProtein: proteinValues.length > 0 ? Math.round(proteinValues.reduce((a, b) => a + b, 0) / proteinValues.length) : 0,
    };
  }, [dailyProgress, timeRange]);

  const maxValue = useMemo(() => {
    if (progressData.length === 0) return 2000;
    const values = progressData.map((d) => d.value);
    const max = Math.max(...values);
    if (max <= 0) return 2000;
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
          {([7, 30] as const).map((range) => (
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
                  { color: timeRange === range ? '#000' : colors.text },
                ]}>
                {range}D
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Chart */}
        {progressData.length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Svg width={Dimensions.get('window').width} height={300}>
                {/* Grid Lines */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = (i / 4) * 250 + 20;
                  return (
                    <Line
                      key={`grid-${i}`}
                      x1="50"
                      y1={y}
                      x2={Dimensions.get('window').width - 50}
                      y2={y}
                      stroke={colors.text}
                      strokeWidth="0.5"
                      opacity="0.15"
                      strokeDasharray="4,4"
                    />
                  );
                })}

                {/* Y-Axis */}
                <Line
                  x1="50"
                  y1="20"
                  x2="50"
                  y2="270"
                  stroke={colors.text}
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* X-Axis */}
                <Line
                  x1="50"
                  y1="270"
                  x2={Dimensions.get('window').width - 20}
                  y2="270"
                  stroke={colors.text}
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* Y-Axis Labels */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = Math.round((4 - i) * (maxValue / 4));
                  const y = (i / 4) * 250 + 20;
                  return (
                    <SvgText
                      key={`y-label-${i}`}
                      x="40"
                      y={y + 4}
                      fontSize="10"
                      fill={colors.text}
                      opacity="0.6"
                      textAnchor="end">
                      {value}
                    </SvgText>
                  );
                })}

                {/* Line Chart Path */}
                {progressData.length > 1 && (
                  <Polyline
                    points={progressData
                      .map((item, index) => {
                        const xSpacing =
                          (Dimensions.get('window').width - 70) / (progressData.length - 1);
                        const x = 50 + index * xSpacing;
                        const yPercent = item.value / maxValue;
                        const y = 270 - yPercent * 250;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    stroke={colors.tint}
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points (Dots) */}
                {progressData.map((item, index) => {
                  const xSpacing =
                    (Dimensions.get('window').width - 70) / Math.max(progressData.length - 1, 1);
                  const x = 50 + index * xSpacing;
                  const yPercent = item.value / maxValue;
                  const y = 270 - yPercent * 250;

                  return (
                    <Circle
                      key={`point-${index}`}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill={colors.tint}
                      opacity="0.9"
                    />
                  );
                })}
              </Svg>
            </View>
            <ThemedText style={{ textAlign: 'center', fontSize: 11, marginTop: 8, opacity: 0.6 }}>
              Calorie Intake Over {timeRange} Days
            </ThemedText>
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

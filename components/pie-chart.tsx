import { ThemedText } from "@/components/themed-text";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";

interface PieChartProps {
  fat: number;
  protein: number;
  carbs: number;
  size?: number;
}

export const SimplePieChart: React.FC<PieChartProps> = ({
  fat,
  protein,
  carbs,
  size = 200,
}) => {
  const total = fat + protein + carbs;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate percentages
  const fatPercent = fat / total;
  const proteinPercent = protein / total;

  // Colors
  const fatColor = "#FF6B6B";
  const proteinColor = "#4ECDC4";
  const carbsColor = "#FFE66D";

  // Helper function to convert polar to cartesian
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Helper function to create arc path
  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
      "M",
      x,
      y,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");

    return d;
  };

  // Calculate angles
  const fatAngle = fatPercent * 360;
  const proteinAngle = fatAngle + proteinPercent * 360;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Fat segment */}
        <Path
          d={describeArc(centerX, centerY, radius, 0, fatAngle)}
          fill={fatColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Protein segment */}
        <Path
          d={describeArc(centerX, centerY, radius, fatAngle, proteinAngle)}
          fill={proteinColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Carbs segment */}
        <Path
          d={describeArc(centerX, centerY, radius, proteinAngle, 360)}
          fill={carbsColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Center circle for donut effect */}
        <Circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#F5F5F5" />

        {/* Center text */}
        <SvgText
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dy="0.3em"
          fontSize="16"
          fontWeight="bold"
          fill="#333"
        >
          {total}g
        </SvgText>
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: fatColor }]} />
          <ThemedText>Fat ({fat}g)</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendColor, { backgroundColor: proteinColor }]}
          />
          <ThemedText>Protein ({protein}g)</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: carbsColor }]} />
          <ThemedText>Carbs ({carbs}g)</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  legend: {
    width: "100%",
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
});

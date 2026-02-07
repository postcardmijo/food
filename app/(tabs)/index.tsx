import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

// 1. Realistic Meal Data (Replacing the sample import)
const dailyMeals = [
  {
    id: 1,
    title: "Avocado Toast & Eggs",
    protein: 24,
    carbs: 30,
    fat: 18,
  },
  {
    id: 2,
    title: "Grilled Chicken Salad",
    protein: 45,
    carbs: 12,
    fat: 15,
  },
  {
    id: 3,
    title: "Greek Yogurt Parfait",
    protein: 18,
    carbs: 28,
    fat: 6,
  },
  {
    id: 4,
    title: "Salmon & Quinoa Bowl",
    protein: 38,
    carbs: 45,
    fat: 22,
  },
];

// 2. Define Colors (Updated Button to Red)
const Colors = {
  light: {
    primary: "#4CAF50", // Keep theme green for headers/icons
    button: "#D32F2F",  // RED for the button
    background: "#f8f9fa",
    card: "#ffffff",
    textSecondary: "#6c757d",
    iconBg: "#E8F5E9",
    border: "#f0f0f0",
  },
  dark: {
    primary: "#66BB6A",
    button: "#FF5252",  // Lighter RED for dark mode visibility
    background: "#000000",
    card: "#1E1E1E",
    textSecondary: "#9BA1A6",
    iconBg: "#2C3E50",
    border: "#333333",
  },
};

const MACRO_COLORS = {
  protein: "#FF7043",
  carbs: "#42A5F5",
  fat: "#FFCA28",
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#E8F5E9", dark: "#121212" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.headerImage}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <View>
          <ThemedText type="subtitle" style={{ color: theme.textSecondary }}>
            Friday, Feb 6
          </ThemedText>
          <ThemedText type="title" style={styles.mainHeader}>
            Daily Intake
          </ThemedText>
        </View>
        <HelloWave />
      </ThemedView>

      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Today's Meals
      </ThemedText>

      <ScrollView
        scrollEnabled={false}
        style={styles.boxesContainer}
        contentContainerStyle={styles.boxesContent}
      >
        {dailyMeals.map((item) => (
          <View
            key={item.id}
            style={[styles.card, { backgroundColor: theme.card }]}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="restaurant" size={18} color={theme.primary} />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Macros Row */}
            <View style={styles.macrosContainer}>
              <MacroPill
                label="Protein"
                value={item.protein}
                color={MACRO_COLORS.protein}
                textColor={theme.textSecondary}
              />
              <MacroPill
                label="Carbs"
                value={item.carbs}
                color={MACRO_COLORS.carbs}
                textColor={theme.textSecondary}
              />
              <MacroPill
                label="Fat"
                value={item.fat}
                color={MACRO_COLORS.fat}
                textColor={theme.textSecondary}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Action Button Section */}
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal" asChild>
            {/* Explicitly using the theme.button (Red) color here */}
            <View style={[styles.actionButton, { backgroundColor: theme.button }]}>
              <Ionicons name="add" size={26} color="#fff" style={{ fontWeight: 'bold' }} />
              <ThemedText style={styles.actionButtonText}>LOG NEW MEAL</ThemedText>
            </View>
        </Link>
      </ThemedView>
    </ParallaxScrollView>
  );
}

function MacroPill({
  label,
  value,
  color,
  textColor,
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
}) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText style={styles.macroValue}>{value}g</ThemedText>
      <ThemedText style={[styles.macroLabel, { color: textColor }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: "100%",
    width: "100%",
    bottom: 0,
    left: 0,
    position: "absolute",
    opacity: 0.5,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mainHeader: {
    fontSize: 28,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  boxesContainer: {
    marginBottom: 20,
  },
  boxesContent: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  macroPill: {
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 6,
  },
  macroValue: {
    fontWeight: "700",
    fontSize: 15,
  },
  macroLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  stepContainer: {
    marginBottom: 40, // Added extra bottom margin for scrolling
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 100, // Fully rounded pill shape
    gap: 8,
    width: "100%",
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "800", // Extra bold for visibility
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
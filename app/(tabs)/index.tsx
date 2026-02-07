import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

// 1. Realistic Meal Data
const dailyMeals = [
  { id: 1, title: "Avocado Toast & Eggs", protein: 24, carbs: 30, fat: 18 },
  { id: 2, title: "Grilled Chicken Salad", protein: 45, carbs: 12, fat: 15 },
  { id: 3, title: "Greek Yogurt Parfait", protein: 18, carbs: 28, fat: 6 },
  { id: 4, title: "Salmon & Quinoa Bowl", protein: 38, carbs: 45, fat: 22 },
];

// 2. Define Colors
const Colors = {
  light: {
    primary: "#4CAF50",
    background: "#f8f9fa",
    card: "#ffffff",
    textSecondary: "#6c757d",
    iconBg: "#E8F5E9",
    border: "#f0f0f0",
  },
  dark: {
    primary: "#66BB6A",
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
          <View key={item.id} style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
                <Ionicons name="restaurant" size={18} color={theme.primary} />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.macrosContainer}>
              <MacroPill label="Protein" value={item.protein} color={MACRO_COLORS.protein} textColor={theme.textSecondary} />
              <MacroPill label="Carbs" value={item.carbs} color={MACRO_COLORS.carbs} textColor={theme.textSecondary} />
              <MacroPill label="Fat" value={item.fat} color={MACRO_COLORS.fat} textColor={theme.textSecondary} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FIXED BUTTON SECTION */}
      {/* We use a specific container to ensure full width */}
      <View style={styles.buttonContainer}>
        <Link href="/modal" asChild>
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.8 : 1 }
            ]}
          >
            {/* CRITICAL FIX: 
              We wrap the content in a View with strict row styling 
              to prevent vertical stacking.
            */}
            <View style={styles.buttonContent}>
              <Ionicons name="add" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>LOG NEW MEAL</Text>
            </View>
          </Pressable>
        </Link>
      </View>
    </ParallaxScrollView>
  );
}

function MacroPill({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText style={styles.macroValue}>{value}g</ThemedText>
      <ThemedText style={[styles.macroLabel, { color: textColor }]}>{label}</ThemedText>
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
  
  // --- BUTTON STYLES FIXED ---
  buttonContainer: {
    marginTop: 10,
    marginBottom: 50,
    width: "100%", // Ensure the container spans the screen width
    paddingHorizontal: 20, // Add spacing from screen edges
  },
  actionButton: {
    backgroundColor: "#D32F2F", // Explicit Red
    borderRadius: 100,
    height: 56, // Explicit height helps alignment
    justifyContent: "center",
    alignItems: "center",
    
    // Shadow
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    // This View strictly forces the Row layout
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
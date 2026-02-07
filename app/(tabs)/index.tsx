import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from "react-native";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

// 1. Initial Data
const initialMeals = [
  { id: 1, title: "Avocado Toast & Eggs", protein: 24, carbs: 30, fat: 18 },
  { id: 2, title: "Grilled Chicken Salad", protein: 45, carbs: 12, fat: 15 },
  { id: 3, title: "Greek Yogurt Parfait", protein: 18, carbs: 28, fat: 6 },
  { id: 4, title: "Salmon & Quinoa Bowl", protein: 38, carbs: 45, fat: 22 },
];

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
  const [meals, setMeals] = useState(initialMeals);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // Function to handle deletion
  const deleteMeal = (id: number) => {
    setMeals((currentMeals) => currentMeals.filter((meal) => meal.id !== id));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

        <View style={styles.boxesContainer}>
          <View style={styles.boxesContent}>
            {meals.map((item) => (
              <SwipeableMealCard
                key={item.id}
                item={item}
                theme={theme}
                onDelete={() => deleteMeal(item.id)}
              />
            ))}
            
            {meals.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="nutrition-outline" size={48} color={theme.textSecondary} style={{opacity: 0.5}} />
                    <ThemedText style={{color: theme.textSecondary, marginTop: 10}}>No meals logged.</ThemedText>
                </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Link href="/modal" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="add" size={28} color="#fff" />
                <Text style={styles.actionButtonText}>LOG NEW MEAL</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </ParallaxScrollView>
    </GestureHandlerRootView>
  );
}

// --- UPDATED COMPONENT: Auto-Delete on Swipe ---
function SwipeableMealCard({
  item,
  theme,
  onDelete,
}: {
  item: any;
  theme: any;
  onDelete: () => void;
}) {
  
  // This renders the red background when you drag
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    // Animate the trash icon sliding in
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteActionContainer}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={30} color="white" />
            <Text style={styles.deleteButtonText}>Deleted!</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      // CRITICAL CHANGE: This fires the delete function automatically
      // when the user swipes "open" (swipes left).
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
            onDelete();
        }
      }}
      // Determines how far you have to swipe to trigger the delete
      friction={2}
      rightThreshold={80} // Must swipe 80px to trigger
    >
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
            <Ionicons name="restaurant" size={18} color={theme.primary} />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            {item.title}
          </ThemedText>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} style={{opacity: 0.3}} /> 
          <Text style={{fontSize: 10, color: theme.textSecondary}}>Swipe to Delete</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

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
    </Swipeable>
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
  buttonContainer: {
    marginTop: 10,
    marginBottom: 50,
    width: "100%",
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
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
  // Swipe Styles
  deleteActionContainer: {
    flex: 1,
    backgroundColor: "#FF5252", 
    justifyContent: "center",
    alignItems: "flex-end", 
    marginBottom: 16,
    marginTop: 1, 
    borderRadius: 16,
    paddingRight: 32, // Padding ensures the icon isn't too close to the edge
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 4,
  },
  emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
  }
});
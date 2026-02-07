import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMeals } from "@/contexts/MealsContext";

// --- 1. DEFINE COLOR PALETTE ---
const Colors = {
  light: {
    background: "#ffffff",
    surface: "#ffffff", // Cards, Bottom Bar
    surfaceHighlight: "#f5f5f5", // Light grey for inputs/steppers
    text: "#000000",
    textSecondary: "#666666",
    border: "#eeeeee",
    primary: "#4CAF50",
    primaryLight: "#E8F5E9", // Light green background for selected items
    pillBg: "#f0f0f0",
    pillText: "#333333",
    icon: "#333333",
    danger: "#FF5252",
  },
  dark: {
    background: "#000000",
    surface: "#1E1E1E", // Dark Grey for distinct cards
    surfaceHighlight: "#2C2C2E", // Slightly lighter for inputs
    text: "#ffffff",
    textSecondary: "#A1A1AA",
    border: "#333333",
    primary: "#66BB6A", // Brighter green for dark mode
    primaryLight: "#1B3A22", // Dark green background for selected items
    pillBg: "#2C2C2E",
    pillText: "#E5E5E5",
    icon: "#ffffff",
    danger: "#FF5252",
  },
};

// --- MOCK DATA ---
const DINING_HALLS = ["North Campus", "South Campus", "Central Commons"];

const STATIONS: Record<string, string[]> = {
  "North Campus": ["The Grill", "Pasta Station", "Salad Bar"],
  "South Campus": ["Homestyle", "Pizza Oven", "Deli"],
  "Central Commons": ["Wok", "Vegan Corner", "Dessert"],
};

const FOOD_ITEMS: Record<string, any[]> = {
  "The Grill": [
    {
      id: "g1",
      name: "Cheeseburger",
      protein: 25,
      carbs: 30,
      fat: 18,
      calories: 450,
    },
    {
      id: "g2",
      name: "Grilled Chicken Breast",
      protein: 30,
      carbs: 0,
      fat: 4,
      calories: 180,
    },
    {
      id: "g3",
      name: "Fries (Small)",
      protein: 3,
      carbs: 40,
      fat: 14,
      calories: 320,
    },
  ],
  "Pasta Station": [
    {
      id: "p1",
      name: "Alfredo Pasta",
      protein: 12,
      carbs: 60,
      fat: 22,
      calories: 550,
    },
    {
      id: "p2",
      name: "Marinara Pasta",
      protein: 8,
      carbs: 55,
      fat: 8,
      calories: 380,
    },
    {
      id: "p3",
      name: "Garlic Bread",
      protein: 4,
      carbs: 20,
      fat: 8,
      calories: 180,
    },
  ],
  default: [
    {
      id: "d1",
      name: "Generic Meal A",
      protein: 20,
      carbs: 40,
      fat: 10,
      calories: 400,
    },
    {
      id: "d2",
      name: "Generic Meal B",
      protein: 15,
      carbs: 30,
      fat: 12,
      calories: 350,
    },
  ],
};

export default function ModalScreen() {
  const router = useRouter();

  // --- DETECT THEME ---
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // --- STATE ---
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<string>>(
    new Set(),
  );
  const [servingSize, setServingSize] = useState(1);

  // --- CALCULATIONS ---
  const currentStationFoods = selectedStation
    ? FOOD_ITEMS[selectedStation] || FOOD_ITEMS["default"]
    : [];

  const totals = useMemo(() => {
    let p = 0,
      c = 0,
      f = 0,
      cal = 0;
    currentStationFoods.forEach((item) => {
      if (selectedFoodIds.has(item.id)) {
        p += item.protein;
        c += item.carbs;
        f += item.fat;
        cal += item.calories;
      }
    });
    return {
      protein: Math.round(p * servingSize),
      carbs: Math.round(c * servingSize),
      fat: Math.round(f * servingSize),
      calories: Math.round(cal * servingSize),
    };
  }, [selectedFoodIds, servingSize, currentStationFoods]);

  // --- HANDLERS ---
  const toggleFood = (id: string) => {
    const next = new Set(selectedFoodIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFoodIds(next);
  };

  const { addMeal } = useMeals();

  const handleAddFood = () => {
    if (totals.calories === 0) {
      Alert.alert("Select Items", "Please select at least one food item.");
      return;
    }

    // Build title from selected food names when available
    const selectedNames = currentStationFoods
      .filter((it) => selectedFoodIds.has(it.id))
      .map((it) => it.name);

    const title =
      selectedNames.length > 0
        ? selectedNames.join(", ")
        : selectedStation
          ? `${selectedStation} (${selectedHall ?? "Dining"})`
          : "Custom Meal";

    const newMeal = {
      id: Date.now(),
      title,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    };

    addMeal(newMeal);
    router.dismiss();
  };

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="title">Log Meal</ThemedText>
        <Pressable onPress={() => router.dismiss()}>
          <ThemedText style={{ color: theme.danger, fontSize: 16 }}>
            Cancel
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. DINING HALL SELECTOR */}
        <ThemedText type="subtitle" style={styles.sectionLabel}>
          Dining Hall
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillScroll}
        >
          {DINING_HALLS.map((hall) => (
            <Pressable
              key={hall}
              onPress={() => {
                setSelectedHall(hall);
                setSelectedStation(null);
                setSelectedFoodIds(new Set());
              }}
              style={[
                styles.pill,
                {
                  backgroundColor:
                    selectedHall === hall ? theme.primary : theme.pillBg,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.pillText,
                  {
                    color: selectedHall === hall ? "#fff" : theme.pillText,
                    fontWeight: selectedHall === hall ? "bold" : "normal",
                  },
                ]}
              >
                {hall}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* 2. STATION SELECTOR */}
        {selectedHall && (
          <>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Station
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillScroll}
            >
              {STATIONS[selectedHall].map((station) => (
                <Pressable
                  key={station}
                  onPress={() => {
                    setSelectedStation(station);
                    setSelectedFoodIds(new Set());
                  }}
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        selectedStation === station
                          ? theme.primary
                          : theme.pillBg,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.pillText,
                      {
                        color:
                          selectedStation === station ? "#fff" : theme.pillText,
                        fontWeight:
                          selectedStation === station ? "bold" : "normal",
                      },
                    ]}
                  >
                    {station}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* 3. FOOD LIST */}
        {selectedStation && (
          <>
            <View style={styles.listHeader}>
              <ThemedText type="subtitle" style={styles.sectionLabel}>
                Available Items
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                (Tap to select)
              </ThemedText>
            </View>

            <View style={styles.foodList}>
              {currentStationFoods.map((item) => {
                const isSelected = selectedFoodIds.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleFood(item.id)}
                    style={[
                      styles.foodItem,
                      {
                        backgroundColor: isSelected
                          ? theme.primaryLight
                          : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.foodInfo}>
                      <ThemedText type="defaultSemiBold">
                        {item.name}
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 12,
                          color: theme.textSecondary,
                          marginTop: 4,
                        }}
                      >
                        {item.calories} kcal • P: {item.protein}g • C:{" "}
                        {item.carbs}g • F: {item.fat}g
                      </ThemedText>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={24}
                      color={isSelected ? theme.primary : theme.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* BOTTOM ACTION BAR - Dynamic Background */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        {/* Serving Multiplier */}
        <View style={styles.multiplierRow}>
          <ThemedText style={styles.totalLabel}>Servings:</ThemedText>
          <View
            style={[
              styles.stepper,
              { backgroundColor: theme.surfaceHighlight },
            ]}
          >
            <Pressable
              onPress={() => setServingSize(Math.max(0.5, servingSize - 0.5))}
              style={[styles.stepBtn, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="remove" size={20} color={theme.icon} />
            </Pressable>

            <ThemedText style={styles.servingText}>{servingSize}x</ThemedText>

            <Pressable
              onPress={() => setServingSize(servingSize + 0.5)}
              style={[styles.stepBtn, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="add" size={20} color={theme.icon} />
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View>
            <ThemedText type="subtitle">{totals.calories} Calories</ThemedText>
            <ThemedText
              style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}
            >
              P: {totals.protein}g C: {totals.carbs}g F: {totals.fat}g
            </ThemedText>
          </View>

          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddFood}
          >
            <ThemedText style={styles.addButtonText}>Add Food</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 20 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    marginBottom: 10,
    marginTop: 10,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  // PILLS
  pillScroll: {
    marginBottom: 10,
    maxHeight: 50,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  pillText: {
    fontSize: 14,
  },

  // FOOD ITEMS
  foodList: {
    gap: 10,
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  foodInfo: {
    flex: 1,
  },

  // BOTTOM BAR
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  multiplierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 4,
  },
  stepBtn: {
    padding: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  servingText: {
    marginHorizontal: 15,
    fontWeight: "bold",
    fontSize: 16,
    minWidth: 30,
    textAlign: "center",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

// Single merged function returning raw, filtered and layout data.
export async function getFoodItems(): Promise<any> {

  const ORG = "uga";
  const HALL_MAP: any = {
    "dining-hall-1": "Bolton Dining Commons",
    "dining-hall-2": "Oglethorpe Dining Commons",
    "dining-hall-3": "Snelling Dining Commons",
    "dining-hall-4": "The Niche (Health Sciences Campus)",
    "dining-hall-5": "The Village Summit (Joe Frank Harris)",
  };

  const DINING_HALLS = Object.keys(HALL_MAP);
  const MEALS = [
    "breakfast",
    "lunch",
    "dinner",
    "late-1",
    "late-2",
    "over-night",
  ];

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  const urlFor = (hall: any, meal: any) =>
    `https://${ORG}.api.nutrislice.com/menu/api/weeks/school/${hall}/menu-type/${meal}/${year}/${month}/${day}/?format=json`;

  const tasks: Promise<any>[] = [];

  for (const hall of DINING_HALLS) {
    for (const meal of MEALS) {
      tasks.push(
        (async () => {
          const url = urlFor(hall, meal);
          try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`Status ${resp.status}`);
            const data: any = await resp.json();
            const todayData = (data.days || []).find((d: any) => d.date === dateString);
            if (!todayData) return { hallId: hall, meal, items: [], stationsLookup: {} };

            const stationsLookup: any = {};
            if (todayData.menu_info) {
              for (const id of Object.keys(todayData.menu_info)) {
                const info: any = todayData.menu_info[id];
                stationsLookup[id] = info.section_options?.display_name || `Station ${id}`;
              }
            }

            const items: any[] = (todayData.menu_items || []).filter((it: any) => Boolean(it.food));
            return { hallId: hall, meal, items, stationsLookup };
          } catch (err: any) {
            return { hallId: hall, meal, items: [], stationsLookup: {}, error: err?.message ?? String(err) };
          }
        })(),
      );
    }
  }

  const results = await Promise.all(tasks);

  const finalData: any = { date: dateString, updated_at: new Date().toISOString(), dining_halls: {} };

  for (const res of results) {
    if (!finalData.dining_halls[res.hallId]) {
      finalData.dining_halls[res.hallId] = { info: { id: res.hallId, name: HALL_MAP[res.hallId] }, meals: {} };
    }

    if (res.items && res.items.length > 0) {
      const grouped: any = {};
      for (const item of res.items) {
        const stationName = res.stationsLookup[item.menu_id] || `Unknown Station (${item.menu_id})`;
        if (!grouped[stationName]) grouped[stationName] = [];

        let dietary: any[] = [];
        if (item.food && item.food.icons && typeof item.food.icons === 'object') {
          dietary = Object.values(item.food.icons).map((ic: any) => ic.external_name || ic.label).filter(Boolean);
        }

        grouped[stationName].push({ name: item.food.name, description: item.food.description, dietary_info: dietary, nutrition: item.food.rounded_nutrition_info || {} });
      }

      finalData.dining_halls[res.hallId].meals[res.meal] = grouped;
    }
  }

  const filtered: any = Object.entries(finalData.dining_halls).reduce((acc: any, [id, hall]: any) => {
    console.log(hall.meals);
    hall.meals = Object.entries(hall.meals).reduce((accMeal: any, [mealName, stations]: any) => {
      if (mealName[0] != "*") accMeal[mealName] = stations;
      return accMeal;
    }, {});
    console.log(hall.meals);
    if (Object.keys(hall.meals).length > 0) acc[HALL_MAP[id]] = { meals: hall.meals };
    return acc;
  }, {});

  const layout = Object.keys(filtered);

  return {filtered};
}

export default function ModalScreen() {
  const router = useRouter();

  // --- DETECT THEME ---
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // --- STATE ---
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<string>>(
    new Set(),
  );
  const [servingSize, setServingSize] = useState(1);

  // --- FETCH API DATA WITH CACHING ---
  useEffect(() => {
    async function fetchFoodWithCache() {
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;
        const cacheKey = `foodData_${dateString}`;

        // Try to get cached data
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          console.log("Using cached food data from", dateString);
          setApiData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        // Fetch fresh data if not cached
        console.log("Fetching fresh food data for", dateString);
        const data = await getFoodItems();
        setApiData(data);

        // Cache the data
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching food data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFoodWithCache();
  }, []);

  const HALL_MAP: any = {
    "dining-hall-1": "Bolton Dining Commons",
    "dining-hall-2": "Oglethorpe Dining Commons",
    "dining-hall-3": "Snelling Dining Commons",
    "dining-hall-4": "The Niche (Health Sciences Campus)",
    "dining-hall-5": "The Village Summit (Joe Frank Harris)",
  };

  // --- DERIVED DATA FROM API ---
  const availableHalls = apiData?.filtered ? Object.keys(apiData.filtered) : [];
  const availableMeals = selectedHall && apiData?.filtered?.[selectedHall]?.meals
    ? Object.keys(apiData.filtered[selectedHall].meals)
    : [];
  const availableStations = selectedHall && selectedMeal && apiData?.filtered?.[selectedHall]?.meals?.[selectedMeal]
    ? Object.keys(apiData.filtered[selectedHall].meals[selectedMeal])
    : [];
  const currentStationFoods = selectedHall && selectedMeal && selectedStation && apiData?.filtered?.[selectedHall]?.meals?.[selectedMeal]?.[selectedStation]
    ? apiData.filtered[selectedHall].meals[selectedMeal][selectedStation]
    : [];



  const totals = useMemo(() => {
    let p = 0,
      c = 0,
      f = 0;
    currentStationFoods.forEach((item: any) => {
      if (selectedFoodIds.has(item.name || "")) {
        const nutrition = item.nutrition || {};
        p += nutrition.g_protein || 0;
        c += nutrition.g_carbs || 0;
        f += nutrition.g_fat || 0;
      }
    });
    // Calculate calories: 4 cal/g protein, 4 cal/g carbs, 9 cal/g fat
    const calories = (p * 4) + (c * 4) + (f * 9);
    return {
      protein: Math.round(p * servingSize),
      carbs: Math.round(c * servingSize),
      fat: Math.round(f * servingSize),
      calories: Math.round(calories * servingSize),
    };
  }, [selectedFoodIds, servingSize, currentStationFoods]);

  // --- HANDLERS ---
  const toggleFood = (foodId: string) => {
    const next = new Set(selectedFoodIds);
    if (next.has(foodId)) {
      next.delete(foodId);
    } else {
      next.add(foodId);
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
      .filter((item: any) => selectedFoodIds.has(item.name || ""))
      .map((item: any) => item.name);

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
        {loading ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surfaceHighlight }]}>
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Loading dining halls...
            </ThemedText>
          </View>
        ) : availableHalls.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surfaceHighlight }]}>
            <Ionicons name="warning-outline" size={40} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary, marginTop: 10 }]}>
              No dining halls available
            </ThemedText>
            <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
              Please check back later
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
          >
            {availableHalls.map((hall) => (
              <Pressable
                key={hall}
                onPress={() => {
                  setSelectedHall(hall);
                  setSelectedMeal(null);
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
        )}

        {/* 2. MEAL SELECTOR */}
        {selectedHall && (
          <>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Meal
            </ThemedText>
            {availableMeals.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surfaceHighlight }]}>
                <Ionicons name="information-circle-outline" size={40} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary, marginTop: 10 }]}>
                  No meals available
                </ThemedText>
                <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                  No meals found for this dining hall
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
              >
                {availableMeals.map((meal) => (
                  <Pressable
                    key={meal}
                    onPress={() => {
                      setSelectedMeal(meal);
                      setSelectedStation(null);
                      setSelectedFoodIds(new Set());
                    }}
                    style={[
                      styles.pill,
                      {
                        backgroundColor:
                          selectedMeal === meal ? theme.primary : theme.pillBg,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.pillText,
                        {
                          color: selectedMeal === meal ? "#fff" : theme.pillText,
                          fontWeight: selectedMeal === meal ? "bold" : "normal",
                        },
                      ]}
                    >
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* 3. STATION SELECTOR */}
        {selectedHall && selectedMeal && (
          <>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Station
            </ThemedText>
            {availableStations.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surfaceHighlight }]}>
                <Ionicons name="information-circle-outline" size={40} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary, marginTop: 10 }]}>
                  No stations available
                </ThemedText>
                <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                  {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)} has no food stations at the moment
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
              >
                {availableStations.map((station) => (
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
            )}
          </>
        )}

        {/* 4. FOOD LIST */}
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

            {currentStationFoods.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surfaceHighlight }]}>
                <Ionicons name="information-circle-outline" size={40} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary, marginTop: 10 }]}>
                  No items available
                </ThemedText>
              </View>
            ) : (
              <View style={styles.foodList}>
                {currentStationFoods.map((item: any, index: number) => {
                  const itemId = item.name || `item_${index}`;
                  const isSelected = selectedFoodIds.has(itemId);
                  const foodName = item.name || "Unknown Item";
                  const nutrition = item.nutrition || {};
                  const protein = nutrition.g_protein || 0;
                  const carbs = nutrition.g_carbs || 0;
                  const fat = nutrition.g_fat || 0;
                  const calories = (protein * 4) + (carbs * 4) + (fat * 9);

                  return (
                    <Pressable
                      key={itemId}
                      onPress={() => toggleFood(itemId)}
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
                          {foodName}
                        </ThemedText>
                        {item.description && (
                          <ThemedText
                            style={{
                              fontSize: 11,
                              color: theme.textSecondary,
                              marginTop: 2,
                            }}
                          >
                            {item.description}
                          </ThemedText>
                        )}
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: theme.textSecondary,
                            marginTop: 4,
                          }}
                        >
                          {calories} kcal • P: {protein}g • C:{" "}
                          {carbs}g • F: {fat}g
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
            )}
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 6,
  },
});

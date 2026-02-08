import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMeals } from "@/contexts/MealsContext";

// --- FIREBASE IMPORTS ---
import { db } from "../constants/firebaseConfig.js"; // Ensure this path matches where you saved Step 1

// --- 1. DEFINE COLOR PALETTE ---
const Colors = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    surfaceHighlight: "#f5f5f5",
    text: "#000000",
    textSecondary: "#666666",
    border: "#eeeeee",
    primary: "#4CAF50",
    primaryLight: "#E8F5E9",
    pillBg: "#f0f0f0",
    pillText: "#333333",
    icon: "#333333",
    danger: "#FF5252",
  },
  dark: {
    background: "#000000",
    surface: "#1E1E1E",
    surfaceHighlight: "#2C2C2E",
    text: "#ffffff",
    textSecondary: "#A1A1AA",
    border: "#333333",
    primary: "#66BB6A",
    primaryLight: "#1B3A22",
    pillBg: "#2C2C2E",
    pillText: "#E5E5E5",
    icon: "#ffffff",
    danger: "#FF5252",
  },
};

// --- MAPPING: Nutrislice API IDs -> Firebase IDs ---
const DB_HALL_MAPPING: Record<string, string> = {
  "dining-hall-1": "bolton_dining",
  "dining-hall-2": "oglethorpe_dining",
  "dining-hall-3": "snelling_dining",
  "dining-hall-4": "niche_dining",
  "dining-hall-5": "village_summit",
};

// ... [Your existing getFoodItems function remains unchanged] ...
export async function getFoodItems(): Promise<any> {
  // ... Keep your existing API logic here ...
  // (Collapsed for brevity, paste your original getFoodItems code here)
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
            const todayData = (data.days || []).find(
              (d: any) => d.date === dateString,
            );
            if (!todayData)
              return { hallId: hall, meal, items: [], stationsLookup: {} };

            const stationsLookup: any = {};
            if (todayData.menu_info) {
              for (const id of Object.keys(todayData.menu_info)) {
                const info: any = todayData.menu_info[id];
                stationsLookup[id] =
                  info.section_options?.display_name || `Station ${id}`;
              }
            }

            const items: any[] = (todayData.menu_items || []).filter(
              (it: any) => Boolean(it.food),
            );
            return { hallId: hall, meal, items, stationsLookup };
          } catch (err: any) {
            return {
              hallId: hall,
              meal,
              items: [],
              stationsLookup: {},
              error: err?.message ?? String(err),
            };
          }
        })(),
      );
    }
  }

  const results = await Promise.all(tasks);

  const finalData: any = {
    date: dateString,
    updated_at: new Date().toISOString(),
    dining_halls: {},
  };

  for (const res of results) {
    if (!finalData.dining_halls[res.hallId]) {
      finalData.dining_halls[res.hallId] = {
        info: { id: res.hallId, name: HALL_MAP[res.hallId] },
        meals: {},
      };
    }

    if (res.items && res.items.length > 0) {
      const grouped: any = {};
      for (const item of res.items) {
        const stationName =
          res.stationsLookup[item.menu_id] ||
          `Unknown Station (${item.menu_id})`;
        if (!grouped[stationName]) grouped[stationName] = [];

        let dietary: any[] = [];
        if (
          item.food &&
          item.food.icons &&
          typeof item.food.icons === "object"
        ) {
          dietary = Object.values(item.food.icons)
            .map((ic: any) => ic.external_name || ic.label)
            .filter(Boolean);
        }

        grouped[stationName].push({
          name: item.food.name,
          description: item.food.description,
          dietary_info: dietary,
          nutrition: item.food.rounded_nutrition_info || {},
        });
      }

      finalData.dining_halls[res.hallId].meals[res.meal] = grouped;
    }
  }

  const filtered: any = Object.entries(finalData.dining_halls).reduce(
    (acc: any, [id, hall]: any) => {
      // console.log(hall.meals); // Commented out for cleaner logs
      hall.meals = Object.entries(hall.meals).reduce(
        (accMeal: any, [mealName, stations]: any) => {
          if (mealName[0] != "*") accMeal[mealName] = stations;
          return accMeal;
        },
        {},
      );
      // console.log(hall.meals);
      if (Object.keys(hall.meals).length > 0) acc[id] = { ...hall }; // Store ID to access it later for Mapping
      return acc;
    },
    {},
  );

  // We modify this slightly to return the object so we can access IDs
  return { filtered };
}

export default function ModalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // --- STATE ---
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null); // Store ID instead of Name for easier DB mapping
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<string>>(
    new Set(),
  );
  const [servingSize, setServingSize] = useState(1);

  // --- FETCH API DATA ---
  useEffect(() => {
    async function fetchFoodWithCache() {
      try {
        const today = new Date();
        const dateString = today.toISOString().split("T")[0];
        const cacheKey = `foodData_${dateString}`;

        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          setApiData(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const data = await getFoodItems();
        setApiData(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching food data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFoodWithCache();
  }, []);

  // --- DERIVED DATA ---
  // Helper to get Human Name from ID
  const getHallName = (id: string) => apiData?.filtered?.[id]?.info?.name || id;

  const availableHallIds = apiData?.filtered
    ? Object.keys(apiData.filtered)
    : [];

  const availableMeals =
    selectedHallId && apiData?.filtered?.[selectedHallId]?.meals
      ? Object.keys(apiData.filtered[selectedHallId].meals)
      : [];

  const availableStations =
    selectedHallId &&
    selectedMeal &&
    apiData?.filtered?.[selectedHallId]?.meals?.[selectedMeal]
      ? Object.keys(apiData.filtered[selectedHallId].meals[selectedMeal])
      : [];

  const currentStationFoods =
    selectedHallId &&
    selectedMeal &&
    selectedStation &&
    apiData?.filtered?.[selectedHallId]?.meals?.[selectedMeal]?.[
      selectedStation
    ]
      ? apiData.filtered[selectedHallId].meals[selectedMeal][selectedStation]
      : [];

  // --- CALCULATE TOTALS ---
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
    const calories = p * 4 + c * 4 + f * 9;
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
    if (next.has(foodId)) next.delete(foodId);
    else next.add(foodId);
    setSelectedFoodIds(next);
  };

  const { addMeal } = useMeals();

  // --- FIREBASE SYNC FUNCTION ---
  const syncWithDatabase = async (foodNames: string[]) => {
    if (!selectedHallId) return;

    // 1. Map the ID (e.g. "dining-hall-3" -> "snelling_dining")
    const firebaseHallId = DB_HALL_MAPPING[selectedHallId];
    if (!firebaseHallId) {
      console.warn("No Firebase mapping for hall:", selectedHallId);
      return;
    }

    for (const foodName of foodNames) {
      try {
        const inventoryRef = collection(db, "inventory");
        const q = query(
          inventoryRef,
          where("hall_id", "==", firebaseHallId),
          where("item_name", "==", foodName),
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // UPDATE
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            quantity_consumed_today: increment(servingSize),
            quantity_remaining: increment(-servingSize),
            last_updated: serverTimestamp(), // Generates timestamp on server side
          });
          console.log(`✅ Updated: ${foodName}`);
        } else {
          // CREATE
          console.log(`⚠️ Creating new item: ${foodName}`);
          await addDoc(inventoryRef, {
            hall_id: firebaseHallId,
            item_name: foodName,
            quantity_remaining: 50 - servingSize,
            quantity_consumed_today: servingSize,
            last_updated: serverTimestamp(), // Generates timestamp on server side
          });
          console.log(`✨ Created: ${foodName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to sync ${foodName}:`, error);
      }
    }
  };

  const handleAddFood = () => {
    if (totals.calories === 0) {
      Alert.alert("Select Items", "Please select at least one food item.");
      return;
    }

    const selectedFoods = currentStationFoods.filter((item: any) =>
      selectedFoodIds.has(item.name || ""),
    );

    const selectedNames = selectedFoods.map((item: any) => item.name);

    // --- TRIGGER DATABASE SYNC ---
    // This runs in parallel, we don't await it to keep the UI snappy
    syncWithDatabase(selectedNames);

    const title =
      selectedNames.length > 0
        ? selectedNames.join(", ")
        : selectedStation
          ? `${selectedStation} (${getHallName(selectedHallId ?? "")})`
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

  // ... [RETURN STATEMENT STARTS HERE] ...
  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <ThemedText type="title">Log Meal</ThemedText>
        <Pressable onPress={() => router.dismiss()}>
          <ThemedText style={{ color: theme.danger, fontSize: 16 }}>
            Cancel
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* DINING HALL SELECTOR */}
        <ThemedText type="subtitle" style={styles.sectionLabel}>
          Dining Hall
        </ThemedText>
        {loading ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.surfaceHighlight },
            ]}
          >
            <ThemedText>Loading...</ThemedText>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillScroll}
          >
            {availableHallIds.map((hallId) => (
              <Pressable
                key={hallId}
                onPress={() => {
                  setSelectedHallId(hallId);
                  setSelectedMeal(null);
                  setSelectedStation(null);
                  setSelectedFoodIds(new Set());
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      selectedHallId === hallId ? theme.primary : theme.pillBg,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.pillText,
                    {
                      color:
                        selectedHallId === hallId ? "#fff" : theme.pillText,
                      fontWeight: selectedHallId === hallId ? "bold" : "normal",
                    },
                  ]}
                >
                  {getHallName(hallId)}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* MEAL SELECTOR */}
        {selectedHallId && (
          <>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Meal
            </ThemedText>
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
                      },
                    ]}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* STATION SELECTOR */}
        {selectedHallId && selectedMeal && (
          <>
            <ThemedText type="subtitle" style={styles.sectionLabel}>
              Station
            </ThemedText>
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

        {/* FOOD LIST */}
        {selectedStation && (
          <>
            <View style={styles.listHeader}>
              <ThemedText type="subtitle" style={styles.sectionLabel}>
                Available Items
              </ThemedText>
            </View>
            <View style={styles.foodList}>
              {currentStationFoods
                .filter((item: any) => item.name[0] != "*")
                .map((item: any, index: number) => {
                  const itemId = item.name || `item_${index}`;
                  const isSelected = selectedFoodIds.has(itemId);
                  const nutrition = item.nutrition || {};
                  // Calculate calories just for display
                  const cal =
                    (nutrition.g_protein || 0) * 4 +
                    (nutrition.g_carbs || 0) * 4 +
                    (nutrition.g_fat || 0) * 9;

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
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.foodInfo}>
                        <ThemedText type="defaultSemiBold">
                          {item.name || "Unknown"}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: theme.textSecondary,
                            marginTop: 4,
                          }}
                        >
                          {cal} kcal • P: {nutrition.g_protein || 0}g • C:{" "}
                          {nutrition.g_carbs || 0}g
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
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
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
            <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
              P: {totals.protein}g C: {totals.carbs}g
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

// ... [STYLES REMAIN EXACTLY THE SAME] ...
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

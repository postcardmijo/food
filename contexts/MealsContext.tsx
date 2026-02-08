import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Meal = {
  id: number | string;
  title: string;
  protein: number;
  carbs: number;
  fat: number;
  date?: string; // YYYY-MM-DD format
};

export type DailyProgress = {
  date: string; // YYYY-MM-DD format
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalCalories: number;
};

type MealsContextType = {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: Meal["id"]) => void;
  getDailyProgress: () => DailyProgress[];
  getProgressData: (days?: number) => Array<{ date: string; value: number }>;
};

const MealsContext = createContext<MealsContextType | undefined>(undefined);

const STORAGE_KEY = "@meals_storage";

export const MealsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load meals from storage on mount
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const storedMeals = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedMeals) {
          setMeals(JSON.parse(storedMeals));
        }
      } catch (error) {
        console.error("Failed to load meals from storage:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadMeals();
  }, []);

  // Save meals to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      const saveMeals = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
        } catch (error) {
          console.error("Failed to save meals to storage:", error);
        }
      };
      saveMeals();
    }
  }, [meals, isLoaded]);

  const addMeal = (meal: Meal) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    setMeals((prev) => [{ ...meal, date: meal.date || dateStr }, ...prev]);
  };

  const deleteMeal = (id: Meal["id"]) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  const getDailyProgress = (): DailyProgress[] => {
    const dailyMap = new Map<string, DailyProgress>();

    meals.forEach((meal) => {
      const date = meal.date || new Date().toISOString().split('T')[0];
      const existing = dailyMap.get(date) || {
        date,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalCalories: 0,
      };

      const caloriesFromMeal = meal.protein * 4 + meal.carbs * 4 + meal.fat * 9;

      dailyMap.set(date, {
        ...existing,
        totalProtein: existing.totalProtein + meal.protein,
        totalCarbs: existing.totalCarbs + meal.carbs,
        totalFat: existing.totalFat + meal.fat,
        totalCalories: existing.totalCalories + caloriesFromMeal,
      });
    });

    return Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getProgressData = (days: number = 30) => {
    const dailyProgress = getDailyProgress();
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    // Create an array of dates with progress data
    const dataMap = new Map<string, number>();
    dailyProgress.forEach((progress) => {
      const progressDate = new Date(progress.date);
      if (progressDate >= startDate && progressDate <= today) {
        dataMap.set(progress.date, progress.totalCalories);
      }
    });

    // Fill in missing dates with 0 or previous value
    const result: Array<{ date: string; value: number }> = [];
    let currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const value = dataMap.get(dateStr) ?? 0;
      result.push({ date: dateStr, value });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  };

  return (
    <MealsContext.Provider value={{ meals, addMeal, deleteMeal, getDailyProgress, getProgressData }}>
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = (): MealsContextType => {
  const ctx = useContext(MealsContext);
  if (!ctx) throw new Error("useMeals must be used within MealsProvider");
  return ctx;
};

export default MealsContext;

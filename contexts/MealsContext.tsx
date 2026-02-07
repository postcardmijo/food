import React, { createContext, useContext, useState } from "react";

export type Meal = {
  id: number | string;
  title: string;
  protein: number;
  carbs: number;
  fat: number;
};

type MealsContextType = {
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: Meal["id"]) => void;
};

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export const MealsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Start with an empty list -- meals are added via the modal
  const [meals, setMeals] = useState<Meal[]>([]);

  const addMeal = (meal: Meal) => {
    setMeals((prev) => [meal, ...prev]);
  };

  const deleteMeal = (id: Meal["id"]) => {
    setMeals((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <MealsContext.Provider value={{ meals, addMeal, deleteMeal }}>
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

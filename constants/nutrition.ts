export interface BoxItem {
  id: string;
  title: string;
  fat: number;
  protein: number;
  carbs: number;
}

export const boxItems: BoxItem[] = [
  {
    id: "1",
    title: "Quick Start",
    fat: 12,
    protein: 25,
    carbs: 45,
  },
  {
    id: "2",
    title: "Features",
    fat: 18,
    protein: 32,
    carbs: 60,
  },
  {
    id: "3",
    title: "Documentation",
    fat: 8,
    protein: 20,
    carbs: 35,
  },
  {
    id: "4",
    title: "Community",
    fat: 15,
    protein: 28,
    carbs: 55,
  },
];

export const calculateTotals = (items: BoxItem[]) => {
  return items.reduce(
    (totals, item) => ({
      fat: totals.fat + item.fat,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
    }),
    { fat: 0, protein: 0, carbs: 0 }
  );
};

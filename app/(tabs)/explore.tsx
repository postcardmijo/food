import { StyleSheet } from "react-native";
import { Image } from "expo-image";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { SimplePieChart } from "@/components/pie-chart";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useMeals } from "@/contexts/MealsContext";

// compute totals from shared meals context so view updates live
export default function TabTwoScreen() {
  const { meals } = useMeals();

  const totals = meals.reduce(
    (acc, m) => ({
      fat: acc.fat + (m.fat ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
    }),
    { fat: 0, protein: 0, carbs: 0 },
  );

  const totalSum = totals.fat + totals.protein + totals.carbs;
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <Image
          source={require("@/assets/images/images.jpg")}
          style={styles.headerImage}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Nutrition Totals
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.subtitle}>
        Total Macronutrients from All Items
      </ThemedText>

      <ThemedView style={styles.macroContainer}>
        <ThemedView style={styles.macroBox}>
          <ThemedText type="subtitle" style={styles.macroValue}>
            {totals.fat}g
          </ThemedText>
          <ThemedText style={styles.macroLabel}>Fat</ThemedText>
        </ThemedView>

        <ThemedView style={styles.macroBox}>
          <ThemedText type="subtitle" style={styles.macroValue}>
            {totals.protein}g
          </ThemedText>
          <ThemedText style={styles.macroLabel}>Protein</ThemedText>
        </ThemedView>

        <ThemedView style={styles.macroBox}>
          <ThemedText type="subtitle" style={styles.macroValue}>
            {totals.carbs}g
          </ThemedText>
          <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.chartContainer}>
        <ThemedText type="subtitle" style={styles.chartTitle}>
          Macronutrient Distribution
        </ThemedText>
        {totalSum > 0 ? (
          <SimplePieChart
            fat={totals.fat}
            protein={totals.protein}
            carbs={totals.carbs}
            size={250}
          />
        ) : (
          <ThemedText style={{ opacity: 0.7 }}>No meals logged.</ThemedText>
        )}
      </ThemedView>

      {/* <ThemedView style={styles.itemsContainer}>
        <ThemedText type="subtitle" style={styles.itemsTitle}>
          Items Breakdown
        </ThemedText>
        {meals.length === 0 ? (
          <ThemedText style={{ opacity: 0.7 }}>No meals logged.</ThemedText>
        ) : (
          meals.map((item) => (
            <ThemedView key={item.id} style={styles.itemRow}>
              <ThemedText style={styles.itemName}>{item.title}</ThemedText>
              <ThemedText style={styles.itemMacros}>
                F: {item.fat}g | P: {item.protein}g | C: {item.carbs}g
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView> */}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  subtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  macroContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  macroBox: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A1CEDC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  macroValue: {
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "700",
  },
  macroLabel: {
    opacity: 0.7,
    fontSize: 12,
  },
  itemsContainer: {
    marginTop: 16,
  },
  itemsTitle: {
    marginBottom: 12,
  },
  chartContainer: {
    marginVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 12,
  },
  chartTitle: {
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A1CEDC",
    opacity: 0.8,
  },
  itemName: {
    fontWeight: "600",
  },
  itemMacros: {
    fontSize: 12,
    opacity: 0.7,
  },
});

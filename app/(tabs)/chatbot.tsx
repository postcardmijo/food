import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useMeals } from "@/contexts/MealsContext";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const Colors = {
  light: {
    primary: "#4CAF50",
    background: "#f8f9fa",
    card: "#ffffff",
    userMessage: "#4CAF50",
    botMessage: "#E8F5E9",
    textSecondary: "#6c757d",
    inputBg: "#f0f0f0",
    border: "#e0e0e0",
  },
  dark: {
    primary: "#66BB6A",
    background: "#000000",
    card: "#1E1E1E",
    userMessage: "#66BB6A",
    botMessage: "#2C3E50",
    textSecondary: "#9BA1A6",
    inputBg: "#2C2C2C",
    border: "#333333",
  },
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  },
});

// System prompt to make it nutrition-focused
const SYSTEM_CONTEXT = `You are a helpful nutrition assistant. You provide accurate, science-based advice about nutrition, meal planning, healthy eating, macronutrients, calories, and dietary recommendations. Be friendly, concise, and supportive.`;

export default function ChatbotScreen() {
  const { meals } = useMeals();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your nutrition assistant powered by Google Gemini. Ask me anything about nutrition, meal planning, or healthy eating!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  const mealsContextText = useMemo(() => {
    if (!meals.length) return "No logged meals yet.";

    const MAX_MEALS = 20;
    const today = new Date().toISOString().split('T')[0];
    
    const sorted = [...meals].sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      if (da !== db) return db.localeCompare(da);
      return String(b.id).localeCompare(String(a.id));
    });

    const recent = sorted.slice(0, MAX_MEALS);
    const lines: string[] = [];
    const byDate = new Map<string, (typeof recent)>();

    recent.forEach((meal) => {
      const dateKey = meal.date ?? "unknown-date";
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)?.push(meal);
    });

    Array.from(byDate.entries()).forEach(([date, items]) => {
      const isToday = date === today;
      const dateLabel = isToday ? `**TODAY (${date})**` : `${date}`;
      lines.push(dateLabel);
      
      let dayProtein = 0, dayCarbs = 0, dayFat = 0;
      items.forEach((meal) => {
        dayProtein += meal.protein;
        dayCarbs += meal.carbs;
        dayFat += meal.fat;
        lines.push(
          `  - ${meal.title} (P ${meal.protein}g, C ${meal.carbs}g, F ${meal.fat}g)`
        );
      });
      
      const calories = dayProtein * 4 + dayCarbs * 4 + dayFat * 9;
      lines.push(
        `  Daily Total: P ${dayProtein}g, C ${dayCarbs}g, F ${dayFat}g, ${calories} kcal`
      );
      lines.push("");
    });

    return lines.join("\n");
  }, [meals]);

  const handleSend = async () => {
    if (inputText.trim() === "" || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText;
    setInputText("");
    setIsLoading(true);

    try {
      // Create a chat with context
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [
              {
                text: `${SYSTEM_CONTEXT}\n\nUser's meal log (most recent 20 meals, organized by date):\n${mealsContextText}\nBased on this log, help the user with nutrition advice and recommendations.`,
              },
            ],
          },
          {
            role: "model",
            parts: [{ text: "Understood! I've reviewed your meal log. I'm here to help with nutrition advice based on what you've been eating. What would you like to know?" }],
          },
        ],
      });

      const result = await chat.sendMessage(userInput);
      const response = await result.response;
      const text = response.text();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please check your API key and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#E8F5E9", dark: "#121212" }}
      headerImage={
        <Image
          source={require("@/assets/images/images.jpg")}
          style={styles.headerImage}
          contentFit="cover"
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">AI Nutrition Assistant</ThemedText>
      </ThemedView>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Powered by Google Gemini
      </ThemedText>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView style={styles.messagesContainer}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser
                  ? [
                      styles.userMessage,
                      { backgroundColor: theme.userMessage },
                    ]
                  : [
                      styles.botMessage,
                      { backgroundColor: theme.botMessage },
                    ],
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  message.isUser && { color: "#ffffff" },
                ]}
              >
                {message.text}
              </ThemedText>
              <ThemedText
                style={[
                  styles.timestamp,
                  message.isUser && { color: "#ffffff", opacity: 0.7 },
                ]}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </ThemedText>
            </View>
          ))}
          {isLoading && (
            <View
              style={[
                styles.messageBubble,
                styles.botMessage,
                { backgroundColor: theme.botMessage },
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={[styles.messageText, { opacity: 0.7, marginTop: 8 }]}>
                Thinking...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: colorScheme === "dark" ? "#ffffff" : "#000000" },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about nutrition..."
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />
          <Pressable
            style={[
              styles.sendButton,
              { 
                backgroundColor: theme.primary,
                opacity: isLoading ? 0.5 : 1,
              }
            ]}
            onPress={handleSend}
            disabled={isLoading}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    opacity: 0.5,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 20,
    opacity: 0.7,
  },
  container: {
    flex: 1,
    minHeight: 400,
  },
  messagesContainer: {
    flex: 1,
    gap: 12,
    paddingBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "80%",
    marginVertical: 6,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    marginRight: 12,
  },
  botMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    marginLeft: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

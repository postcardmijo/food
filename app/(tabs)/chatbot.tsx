import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
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
import { getFoodItems } from "../modal"; // <-- Adjusted import path

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

// ---------------- GEMINI SETUP ----------------
const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

// ---------------- COMPONENT ----------------
export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI nutrition assistant. Ask me anything about today's dining options 😊",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foodContext, setFoodContext] = useState<string>("");

  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];

  // ---------------- FETCH FOOD ITEMS ----------------
  useEffect(() => {
    async function fetchFood() {
      try {
        const data = await getFoodItems();
        const halls = data.filtered;
        let contextStr = "Today's available food items:\n\n";
        for (const hallName in halls) {
          const meals = halls[hallName].meals;
          contextStr += `Dining Hall: ${hallName}\n`;
          for (const mealName in meals) {
            contextStr += `  Meal: ${mealName}\n`;
            const stations = meals[mealName];
            for (const stationName in stations) {
              contextStr += `    Station: ${stationName}\n`;
              const foods = stations[stationName];
              for (const food of foods) {
                const dietary = food.dietary_info?.length
                  ? ` [${food.dietary_info.join(", ")}]`
                  : "";
                contextStr += `      - ${food.name}${dietary}: ${food.description || "No description"}\n`;
              }
            }
          }
        }
        setFoodContext(contextStr);
      } catch (error) {
        console.error("Failed to fetch food context:", error);
        setFoodContext("No food items available today.");
      }
    }
    fetchFood();
  }, []);

  // ---------------- SEND MESSAGE ----------------
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const filteredMessages = messages.filter(
        (m) => m.text && m.text.trim() !== "",
      );

      let history = filteredMessages.map((m) => ({
        role: m.isUser ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      while (history.length && history[0].role !== "user") {
        history.shift();
      }

      const SYSTEM_CONTEXT = `
You are a friendly, science-based nutrition assistant.
Answer user questions using ONLY the following food items from today's dining halls.
Do NOT make up items that aren’t listed.
Keep answers safe, short, and practical.

${foodContext}
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_CONTEXT,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(inputText);
      const text = result.response.text();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Gemini API error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "⚠️ Something went wrong. Please check your API key or internet connection.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- UI ----------------
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
                  ? [styles.userMessage, { backgroundColor: theme.userMessage }]
                  : [styles.botMessage, { backgroundColor: theme.botMessage }],
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
              <ThemedText
                style={[styles.messageText, { opacity: 0.7, marginTop: 8 }]}
              >
                Thinking...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* INPUT BAR */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: colorScheme === "dark" ? "#ffffff" : "#000000" },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about today's meals..."
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            editable={!isLoading}
          />

          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: theme.primary, opacity: isLoading ? 0.5 : 1 },
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

// ---------------- STYLES ----------------
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

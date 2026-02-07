import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function LoginScreen() {
  const router = useRouter();
  const windowDimensions = useWindowDimensions();

  const handleGoogleLogin = () => {
    // Navigate to the home tabs
    router.replace("/(tabs)");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.logo}
        />

        <ThemedText type="title" style={styles.title}>
          FoodApp
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Track your nutrition journey with ease
        </ThemedText>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          activeOpacity={0.7}
        >
          <ThemedView style={styles.googleButtonContent}>
            <Image
              source={require("@/assets/images/react-logo.png")}
              style={styles.googleIcon}
            />
            <ThemedText type="defaultSemiBold" style={styles.googleButtonText}>
              Sign in with Google
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <ThemedText style={styles.disclaimer}>
          We'll use Google to securely verify your identity
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    alignItems: "center",
    gap: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 12,
  },
  googleButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    marginTop: 20,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    marginTop: 12,
  },
});

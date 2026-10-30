import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/lettuce-login-bg.png")}
        style={styles.background}
      />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/images/lettuce-logo.png")}
            style={styles.logo}
          />
        </View>

        <Text style={styles.brand}>
          LettuceCare
        </Text>

        <Text style={styles.title}>
          Deteksi Penyakit Selada{"\n"}
          dengan Teknologi AI
        </Text>

        <Text style={styles.subtitle}>
          Pantau kesehatan tanaman hidroponik{"\n"}
          secara cepat dan mudah.
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginText}>Login</Text>
          </Pressable>

          <Pressable
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerText}>Buat Akun Baru</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Smart Farming • Artificial Intelligence
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.88)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  logo: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },

  brand: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 0.3,
    color: "#238B45",
    textAlign: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#245B32",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3E5E46",
    textAlign: "center",
    lineHeight: 24,
  },

  buttonContainer: {
    marginTop: 40,
    alignItems: "center",
  },

  loginButton: {
    width: 260,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#238B45",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#238B45",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  registerButton: {
    width: 260,
    height: 56,
    marginTop: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#238B45",
    backgroundColor: "rgba(255,255,255,0.78)",
    justifyContent: "center",
    alignItems: "center",
  },

  registerText: {
    color: "#238B45",
    fontSize: 18,
    fontWeight: "800",
  },

  footer: {
    position: "absolute",
    bottom: 35,
    fontSize: 13,
    color: "#55705C",
    fontWeight: "600",
  },
});
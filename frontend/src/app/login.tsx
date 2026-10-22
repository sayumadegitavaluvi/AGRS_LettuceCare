import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
} from "react-native";

import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.3:8000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validasi input
    if (!email.trim() || !password) {
      Alert.alert(
        "Login",
        "Email dan password wajib diisi."
      );
      return;
    }

    try {
      setLoading(true);

      // Kirim email dan password ke backend
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      // Menangani error dari backend
      if (!response.ok) {
        const detail = data.detail;

        const message = Array.isArray(detail)
          ? detail
              .map(
                (item: { msg?: string }) =>
                  item.msg
              )
              .join("\n")
          : typeof detail === "string"
            ? detail
            : "Periksa email dan password kamu.";

        throw new Error(message);
      }

      // Pastikan token tersedia
      if (!data.access_token) {
        throw new Error(
          "Token login tidak ditemukan dari backend."
        );
      }

      // Simpan token untuk akses endpoint protected
      await AsyncStorage.setItem(
        "access_token",
        data.access_token
      );

      // Simpan email user
      await AsyncStorage.setItem(
        "user_email",
        email.trim()
      );

      // Masuk ke halaman Home
      router.replace("/home");

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      Alert.alert(
        "Login Gagal",
        message.includes(
          "Network request failed"
        )
          ? "Tidak dapat terhubung ke server. Pastikan laptop dan HP berada di jaringan yang sama dan backend masih berjalan."
          : message
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Background */}
      <Image
        source={require(
          "../../assets/images/lettuce-bg.jpeg"
        )}
        style={styles.background}
      />

      <View style={styles.overlay} />

      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require(
              "../../assets/images/lettuce-logo.png"
            )}
            style={styles.logo}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Selamat Datang
        </Text>

        <Text style={styles.subtitle}>
          Masuk untuk memantau kesehatan{"\n"}
          tanaman selada kamu
        </Text>

        {/* Login Card */}
        <View style={styles.card}>

          {/* Email */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="#7A8F7D"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Password */}
          <TextInput
            placeholder="Password"
            placeholderTextColor="#7A8F7D"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          {/* Login Button */}
          <Pressable
            style={[
              styles.loginButton,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading
                ? "Memproses..."
                : "Login"}
            </Text>
          </Pressable>

          {/* Register */}
          <Pressable
            onPress={() =>
              router.push("/register")
            }
            disabled={loading}
          >
            <Text style={styles.registerText}>
              Belum punya akun? Buat Akun Baru
            </Text>
          </Pressable>

        </View>
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
    backgroundColor:
      "rgba(255,255,255,0.45)",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  logo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#1E7A3B",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#355A42",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },

  card: {
    width: 380,
    backgroundColor:
      "rgba(255,255,255,0.95)",
    borderRadius: 30,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
  },

  input: {
    width: "100%",
    height: 55,
    borderRadius: 18,
    backgroundColor: "#EEF7EF",
    borderWidth: 1,
    borderColor: "#C8DEC8",
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },

  loginButton: {
    width: 230,
    height: 54,
    borderRadius: 28,
    backgroundColor: "#238B45",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  registerText: {
    textAlign: "center",
    marginTop: 22,
    color: "#238B45",
    fontSize: 15,
    fontWeight: "700",
  },
});
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";

import { router } from "expo-router";
import { useState } from "react";

const API_URL = "http://192.168.1.3:8000";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Ketentuan password
  const checks = [
    {
      label: "Minimal 12 karakter",
      valid: password.length >= 12,
    },
    {
      label: "Mengandung huruf besar (A-Z)",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Mengandung huruf kecil (a-z)",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Mengandung angka (0-9)",
      valid: /[0-9]/.test(password),
    },
    {
      label: "Mengandung simbol (!@#$, dll.)",
      valid: /[^A-Za-z0-9\s]/.test(password),
    },
  ];

  const passwordIsStrong =
    password.length > 0 && checks.every((item) => item.valid);

  // Registrasi ke backend FastAPI
  const handleRegister = async () => {
    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert("Data belum lengkap", "Silakan isi semua kolom.");
      return;
    }

    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert(
        "Email tidak valid",
        "Masukkan alamat email yang benar."
      );
      return;
    }

    if (!passwordIsStrong) {
      Alert.alert(
        "Password belum kuat",
        "Penuhi semua ketentuan password sebelum mendaftar."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password tidak cocok",
        "Password dan konfirmasi password harus sama."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: normalizedEmail,
          password: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "Pendaftaran gagal. Periksa kembali data kamu.";

        Alert.alert("Registrasi gagal", detail);
        return;
      }

      Alert.alert(
        "Registrasi berhasil",
        "Akun berhasil dibuat. Silakan login menggunakan akun kamu.",
        [
          {
            text: "Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Koneksi gagal",
        "Tidak dapat terhubung ke server. Pastikan backend FastAPI aktif dan HP terhubung ke jaringan Wi-Fi yang sama dengan laptop."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require("../../assets/images/lettuce-bg.jpeg")}
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

        <Text style={styles.title}>Buat Akun Baru</Text>

        <Text style={styles.subtitle}>
          Daftar untuk mulai memantau kesehatan{"\n"}
          tanaman selada kamu
        </Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Username"
            placeholderTextColor="#7A8F7D"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#7A8F7D"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#7A8F7D"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* Ketentuan muncul saat pengguna mulai mengetik */}
          {password.length > 0 && (
            <View style={styles.passwordRules}>
              <Text style={styles.rulesTitle}>
                Ketentuan Password
              </Text>

              {checks.map((item, index) => (
                <View style={styles.ruleRow} key={index}>
                  <Text
                    style={[
                      styles.ruleIcon,
                      {
                        color: item.valid ? "#238B45" : "#D93025",
                      },
                    ]}
                  >
                    {item.valid ? "✓" : "✕"}
                  </Text>

                  <Text
                    style={[
                      styles.ruleText,
                      {
                        color: item.valid ? "#238B45" : "#D93025",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}

              <Text
                style={[
                  styles.strengthText,
                  {
                    color: passwordIsStrong ? "#238B45" : "#D93025",
                  },
                ]}
              >
                {passwordIsStrong
                  ? "Password kuat"
                  : "Password belum memenuhi semua ketentuan"}
              </Text>
            </View>
          )}

          <TextInput
            placeholder="Konfirmasi Password"
            placeholderTextColor="#7A8F7D"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {confirmPassword.length > 0 && (
            <Text
              style={[
                styles.matchText,
                {
                  color:
                    password === confirmPassword
                      ? "#238B45"
                      : "#D93025",
                },
              ]}
            >
              {password === confirmPassword
                ? "✓ Password cocok"
                : "✕ Password belum cocok"}
            </Text>
          )}

          <Pressable
            style={[
              styles.registerButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerText}>Register</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/login")}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              Sudah punya akun? Login
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
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
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
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
    fontSize: 34,
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
    marginBottom: 25,
  },

  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255,255,255,0.95)",
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
    marginBottom: 14,
  },

  passwordRules: {
    marginTop: -2,
    marginBottom: 20,
    paddingHorizontal: 6,
  },

  rulesTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#355A42",
    marginBottom: 12,
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },

  ruleIcon: {
    width: 22,
    fontSize: 19,
    fontWeight: "800",
    marginRight: 8,
  },

  ruleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },

  strengthText: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 7,
  },

  matchText: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: -5,
    marginBottom: 12,
    marginLeft: 5,
  },

  registerButton: {
    width: 230,
    height: 54,
    borderRadius: 28,
    backgroundColor: "#238B45",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  registerText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  loginText: {
    textAlign: "center",
    marginTop: 22,
    color: "#238B45",
    fontSize: 15,
    fontWeight: "700",
  },
});
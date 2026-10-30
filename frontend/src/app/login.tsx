import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
  Keyboard,
} from "react-native";

import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://172.20.10.4:8000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutBanner, setShowLogoutBanner] = useState(false);
  const insets = useSafeAreaInsets();

  // Tampilkan pesan logout satu kali saat halaman Login kembali dibuka.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let bannerTimer: ReturnType<typeof setTimeout> | null = null;

      const checkLogoutNotice = async () => {
        try {
          const shouldShow = await AsyncStorage.getItem(
            "show_logout_success_banner"
          );
          if (shouldShow === "true") {
            await AsyncStorage.removeItem("show_logout_success_banner");
            if (active) {
              setShowLogoutBanner(true);
              bannerTimer = setTimeout(() => {
                if (active) setShowLogoutBanner(false);
              }, 3500);
            }
          } else if (active) {
            setShowLogoutBanner(false);
          }
        } catch {
          if (active) setShowLogoutBanner(false);
        }
      };

      void checkLogoutNotice();

      return () => {
        active = false;
        if (bannerTimer) clearTimeout(bannerTimer);
      };
    }, [])
  );

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

      // Tandai login sukses untuk menampilkan banner sekali di Beranda.
      await AsyncStorage.setItem("show_login_success_banner", "true");

      // Langsung masuk ke Beranda tanpa popup konfirmasi.
      router.replace("/home");

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      Alert.alert(
        "Login Gagal",
        /Network request failed|fetch failed|Could not connect|UnexpectedException/i.test(message)
          ? "Tidak dapat terhubung ke server. Periksa alamat API, koneksi Wi-Fi, dan pastikan backend berjalan."
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
          "../../assets/images/lettuce-login-bg.png"
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

          {/* Password dengan tombol tampilkan/sembunyikan */}
          <View style={[styles.input, styles.passwordContainer]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#7A8F7D"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
              onSubmitEditing={() => Keyboard.dismiss()}
              returnKeyType="done"
            />
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              style={styles.eyeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              <SymbolView
                name={showPassword
                  ? { ios: "eye.slash", android: "visibility_off", web: "visibility_off" }
                  : { ios: "eye", android: "visibility", web: "visibility" }}
                size={22}
                tintColor="#355A42"
              />
            </Pressable>
          </View>

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

      {/* Notifikasi logout berhasil: tidak memerlukan tombol OK. */}
      {showLogoutBanner && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.logoutSuccessBanner, { top: insets.top + 16 }]}
        >
          <View style={styles.logoutSuccessIcon}>
            <Text style={styles.logoutSuccessCheck}>✓</Text>
          </View>
          <View style={styles.logoutSuccessBody}>
            <Text style={styles.logoutSuccessTitle}>Logout berhasil!</Text>
            <Text style={styles.logoutSuccessText}>
              Kamu sudah keluar dari akun LettuceCare.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoutSuccessBanner: {
    position: "absolute",
    left: 25,
    right: 25,
    zIndex: 50,
    elevation: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#205D38",
    shadowOpacity: 0.11,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },
  logoutSuccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#238B45",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  logoutSuccessCheck: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
  logoutSuccessBody: { flex: 1 },
  logoutSuccessTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E6B3D",
    marginBottom: 4,
  },
  logoutSuccessText: {
    fontSize: 13,
    color: "#276A43",
    lineHeight: 18,
  },
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
      "transparent",
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

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    minWidth: 0,
    fontSize: 16,
    color: "#333",
  },

  eyeButton: {
    width: 40,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
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

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

<<<<<<< HEAD
<<<<<<< HEAD
const API_URL = "http://172.20.10.4:8000";
=======
import { apiRequest } from "../utils/api";

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
const API_URL = "http://172.20.10.4:8000";
>>>>>>> origin/main

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
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
<<<<<<< HEAD

  const [showLogoutBanner, setShowLogoutBanner] =
    useState(false);

  const insets = useSafeAreaInsets();


  // =========================
  // Tampilkan pesan logout
  // =========================

  useFocusEffect(
    useCallback(() => {
      let active = true;

      let bannerTimer: ReturnType<
        typeof setTimeout
      > | null = null;

      const checkLogoutNotice = async () => {
        try {
          const shouldShow =
            await AsyncStorage.getItem(
              "show_logout_success_banner"
            );

          if (shouldShow === "true") {
            await AsyncStorage.removeItem(
              "show_logout_success_banner"
            );

            if (active) {
              setShowLogoutBanner(true);

              bannerTimer = setTimeout(() => {
                if (active) {
                  setShowLogoutBanner(false);
                }
              }, 3500);
            }
          } else if (active) {
            setShowLogoutBanner(false);
          }
        } catch {
          if (active) {
            setShowLogoutBanner(false);
          }
        }
      };

      void checkLogoutNotice();

      return () => {
        active = false;

        if (bannerTimer) {
          clearTimeout(bannerTimer);
        }
      };
    }, [])
  );


  // =========================
  // Login
  // =========================
=======
>>>>>>> origin/main

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

      const { response, data } = await apiRequest(
        "/auth/login",
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


      // =========================
      // Error dari backend
      // =========================

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


      // =========================
      // Cek token
      // =========================

      if (!data.access_token) {
        throw new Error(
          "Token login tidak ditemukan dari backend."
        );
      }


      // =========================
      // Simpan token
      // =========================

      await AsyncStorage.setItem(
        "access_token",
        data.access_token
      );


      // =========================
      // Simpan email
      // =========================

      await AsyncStorage.setItem(
        "user_email",
        email.trim()
      );

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/main
      // Tandai login sukses untuk menampilkan banner sekali di Beranda.
      await AsyncStorage.setItem("show_login_success_banner", "true");

      // Langsung masuk ke Beranda tanpa popup konfirmasi.
<<<<<<< HEAD
=======

      // =========================
      // Tandai login berhasil
      // =========================

      await AsyncStorage.setItem(
        "show_login_success_banner",
        "true"
      );


      // =========================
      // Masuk ke Home
      // =========================

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
      router.replace("/home");

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      /*
       * Jika error koneksi:
       *
       * apiRequest() akan meneruskannya
       * ke connection manager global.
       *
       * ConnectionModal ditampilkan
       * oleh _layout.tsx.
       */

      const isConnectionError =
        message === "CONNECTION_TIMEOUT" ||
        /Network request failed|fetch failed|Could not connect|UnexpectedException|Failed to fetch/i.test(
          message
        );

      if (isConnectionError) {
        return;
      }

      // Error login biasa

      Alert.alert(
        "Login Gagal",
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/main
        /Network request failed|fetch failed|Could not connect|UnexpectedException/i.test(message)
          ? "Tidak dapat terhubung ke server. Periksa alamat API, koneksi Wi-Fi, dan pastikan backend berjalan."
          : message
=======
        message
>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================
  // Navigasi Lupa Password
  // =========================

  const handleForgotPassword = () => {
    if (loading) return;

    router.push("/lupa-password");
  };


  // =========================
  // Navigasi Register
  // =========================

  const handleRegister = () => {
    if (loading) return;

    router.push("/register");
  };


  // =========================
  // Tampilan
  // =========================

  return (
    <View style={styles.container}>

      {/* =========================
          Background
      ========================= */}

      <Image
        source={require(
          "../../assets/images/lettuce-login-bg.png"
        )}
        style={styles.background}
      />

      <View style={styles.overlay} />


      <View style={styles.content}>

        {/* =========================
            Logo
        ========================= */}

        <View style={styles.logoWrapper}>
          <Image
            source={require(
              "../../assets/images/lettuce-logo.png"
            )}
            style={styles.logo}
          />
        </View>


        {/* =========================
            Title
        ========================= */}

        <Text style={styles.title}>
          Selamat Datang
        </Text>

        <Text style={styles.subtitle}>
          Masuk untuk memantau kesehatan{"\n"}
          tanaman selada kamu
        </Text>


        {/* =========================
            Login Card
        ========================= */}

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

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
=======
>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)

          {/* Password */}

          <View
            style={[
              styles.input,
              styles.passwordContainer,
            ]}
          >
            <TextInput
              placeholder="Password"
              placeholderTextColor="#7A8F7D"
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              editable={!loading}
              onSubmitEditing={() =>
                Keyboard.dismiss()
              }
              returnKeyType="done"
            />

            {/* Tombol tampil/sembunyikan password */}

            <Pressable
              onPress={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
              disabled={loading}
              style={styles.eyeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword
                  ? "Sembunyikan password"
                  : "Tampilkan password"
              }
            >
              <SymbolView
                name={
                  showPassword
                    ? {
                        ios: "eye.slash",
                        android: "visibility_off",
                        web: "visibility_off",
                      }
                    : {
                        ios: "eye",
                        android: "visibility",
                        web: "visibility",
                      }
                }
                size={22}
                tintColor="#355A42"
              />
            </Pressable>
          </View>


          {/* =========================
              Login Button
          ========================= */}
=======
>>>>>>> origin/main

          <Pressable
            style={[
              styles.loginButton,
              loading &&
                styles.loginButtonDisabled,
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


          {/* =========================
              Lupa Password
          ========================= */}

          <Pressable
            onPress={handleForgotPassword}
            disabled={loading}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>
              Lupa Password?
            </Text>
          </Pressable>


          {/* =========================
              Register
          ========================= */}

          <Pressable
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              Belum punya akun? Buat Akun Baru
            </Text>
          </Pressable>

        </View>
      </View>

<<<<<<< HEAD
<<<<<<< HEAD
      {/* Notifikasi logout berhasil: tidak memerlukan tombol OK. */}
=======

      {/* =========================
          Logout Success Banner
      ========================= */}

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
      {/* Notifikasi logout berhasil: tidak memerlukan tombol OK. */}
>>>>>>> origin/main
      {showLogoutBanner && (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/main
          style={[styles.logoutSuccessBanner, { top: insets.top + 16 }]}
        >
          <View style={styles.logoutSuccessIcon}>
            <Text style={styles.logoutSuccessCheck}>✓</Text>
          </View>
          <View style={styles.logoutSuccessBody}>
            <Text style={styles.logoutSuccessTitle}>Logout berhasil!</Text>
            <Text style={styles.logoutSuccessText}>
              Kamu sudah keluar dari akun LettuceCare.
<<<<<<< HEAD
=======
          style={[
            styles.logoutSuccessBanner,
            {
              top: insets.top + 16,
            },
          ]}
        >
          <View style={styles.logoutSuccessIcon}>
            <Text style={styles.logoutSuccessCheck}>
              ✓
            </Text>
          </View>

          <View style={styles.logoutSuccessBody}>
            <Text style={styles.logoutSuccessTitle}>
              Logout berhasil!
            </Text>

            <Text style={styles.logoutSuccessText}>
              Kamu sudah keluar dari akun
              LettuceCare.
>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
            </Text>
          </View>
        </View>
      )}
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
    </View>
  );
}


// =========================
// Styles
// =========================

const styles = StyleSheet.create({
<<<<<<< HEAD
<<<<<<< HEAD
=======

  // Logout Success Banner

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/main
    shadowColor: "#205D38",
    shadowOpacity: 0.11,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
  },
<<<<<<< HEAD
=======

    shadowColor: "#205D38",
    shadowOpacity: 0.11,
    shadowRadius: 9,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
  logoutSuccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#238B45",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
  logoutSuccessCheck: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
<<<<<<< HEAD
<<<<<<< HEAD
  logoutSuccessBody: { flex: 1 },
=======

  logoutSuccessBody: {
    flex: 1,
  },

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
  logoutSuccessBody: { flex: 1 },
>>>>>>> origin/main
  logoutSuccessTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E6B3D",
    marginBottom: 4,
  },
<<<<<<< HEAD
<<<<<<< HEAD
=======

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
  logoutSuccessText: {
    fontSize: 13,
    color: "#276A43",
    lineHeight: 18,
  },
<<<<<<< HEAD
<<<<<<< HEAD
=======


  // Container

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
    backgroundColor:
      "transparent",
<<<<<<< HEAD
=======
    backgroundColor: "transparent",
>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },


  // Logo

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


  // Title

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


  // Card

  card: {
    width: 380,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 30,
    padding: 28,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 15,

    elevation: 8,
  },


  // Input

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

<<<<<<< HEAD
<<<<<<< HEAD
=======

  // Login Button

>>>>>>> 22e3cee (feat: implement forgot password with email OTP and connection handling)
=======
>>>>>>> origin/main
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


  // Forgot Password

  forgotButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 5,
  },

  forgotText: {
    color: "#237B45",
    fontSize: 15,
    fontWeight: "700",
  },


  // Register

  registerText: {
    textAlign: "center",
    marginTop: 18,
    color: "#238B45",
    fontSize: 15,
    fontWeight: "700",
  },

});

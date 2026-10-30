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

import { useState } from "react";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";

import { apiRequest } from "../utils/api";
import ConnectionModal from "../components/ConnectionModal";


export default function LupaPasswordScreen() {
  // =========================
  // State
  // =========================

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [showConnectionError, setShowConnectionError] =
    useState(false);


  // =========================
  // Helper Error
  // =========================

  const getErrorMessage = (data: any) => {
    const detail = data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item: { msg?: string }) =>
            item.msg || ""
        )
        .join("\n");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return "Terjadi kesalahan. Silakan coba lagi.";
  };


  // =========================
  // STEP 1
  // Kirim OTP
  // =========================

  const handleSendOTP = async () => {
    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert(
        "Email belum diisi",
        "Masukkan email akun kamu."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      Alert.alert(
        "Email tidak valid",
        "Masukkan alamat email yang benar."
      );
      return;
    }

    try {
      setLoading(true);

      const { response, data } =
        await apiRequest(
          "/auth/forgot-password",
          {
            method: "POST",

            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data)
        );
      }

      setEmail(normalizedEmail);

      Alert.alert(
        "OTP Terkirim",
        "Kode OTP telah dikirim ke email kamu. Periksa inbox atau folder spam."
      );

      setStep(2);

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      if (
        message === "CONNECTION_TIMEOUT" ||
        /Network request failed|fetch failed|Could not connect|Failed to fetch/i.test(
          message
        )
      ) {
        setShowConnectionError(true);
        return;
      }

      Alert.alert(
        "Gagal Mengirim OTP",
        message
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================
  // STEP 2
  // Verifikasi OTP
  // =========================

  const handleVerifyOTP = async () => {
    const cleanOTP = otp.trim();

    if (!cleanOTP) {
      Alert.alert(
        "OTP belum diisi",
        "Masukkan kode OTP yang dikirim ke email kamu."
      );
      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      Alert.alert(
        "OTP tidak valid",
        "Kode OTP harus terdiri dari 6 angka."
      );
      return;
    }

    try {
      setLoading(true);

      const { response, data } =
        await apiRequest(
          "/auth/verify-reset-otp",
          {
            method: "POST",

            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              email: email,
              otp: cleanOTP,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data)
        );
      }

      Alert.alert(
        "OTP Benar",
        "Kode OTP berhasil diverifikasi."
      );

      setStep(3);

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      if (
        message === "CONNECTION_TIMEOUT" ||
        /Network request failed|fetch failed|Could not connect|Failed to fetch/i.test(
          message
        )
      ) {
        setShowConnectionError(true);
        return;
      }

      Alert.alert(
        "Verifikasi Gagal",
        message
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================
  // STEP 3
  // Reset Password
  // =========================

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(
        "Data belum lengkap",
        "Isi password baru dan konfirmasi password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password terlalu pendek",
        "Password baru minimal 8 karakter."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password tidak cocok",
        "Password dan konfirmasi password harus sama."
      );
      return;
    }

    try {
      setLoading(true);

      const { response, data } =
        await apiRequest(
          "/auth/reset-password",
          {
            method: "POST",

            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              email: email,
              otp: otp.trim(),
              new_password: newPassword,
            }),
          }
        );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data)
        );
      }

      Alert.alert(
        "Password Berhasil Diubah",
        "Password kamu sudah berhasil diperbarui. Silakan login kembali.",
        [
          {
            text: "Login",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Tidak dapat terhubung ke server.";

      if (
        message === "CONNECTION_TIMEOUT" ||
        /Network request failed|fetch failed|Could not connect|Failed to fetch/i.test(
          message
        )
      ) {
        setShowConnectionError(true);
        return;
      }

      Alert.alert(
        "Gagal Mengubah Password",
        message
      );

    } finally {
      setLoading(false);
    }
  };


  // =========================
  // Kembali
  // =========================

  const handleBack = () => {
    if (loading) return;

    if (step === 1) {
      router.back();
      return;
    }

    setStep(step - 1);
  };


  // =========================
  // Render
  // =========================

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


      {/* Content */}

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
          {step === 1
            ? "Lupa Password?"
            : step === 2
              ? "Verifikasi OTP"
              : "Password Baru"}
        </Text>


        {/* Subtitle */}

        <Text style={styles.subtitle}>
          {step === 1
            ? "Masukkan email akun LettuceCare kamu"
            : step === 2
              ? `Kode OTP telah dikirim ke\n${email}`
              : "Buat password baru untuk akun kamu"}
        </Text>


        {/* Card */}

        <View style={styles.card}>

          {/* =========================
              STEP 1
              ========================= */}

          {step === 1 && (
            <>
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

              <Pressable
                style={[
                  styles.button,
                  loading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? "Mengirim..."
                    : "Kirim OTP"}
                </Text>
              </Pressable>
            </>
          )}


          {/* =========================
              STEP 2
              ========================= */}

          {step === 2 && (
            <>
              <TextInput
                placeholder="Masukkan 6 digit OTP"
                placeholderTextColor="#7A8F7D"
                style={[
                  styles.input,
                  styles.otpInput,
                ]}
                value={otp}
                onChangeText={(text) =>
                  setOtp(
                    text
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />

              <Pressable
                style={[
                  styles.button,
                  loading &&
                    styles.buttonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? "Memverifikasi..."
                    : "Verifikasi OTP"}
                </Text>
              </Pressable>
            </>
          )}


          {/* =========================
              STEP 3
              ========================= */}

          {step === 3 && (
            <>
              {/* Password baru */}

              <View
                style={[
                  styles.input,
                  styles.passwordContainer,
                ]}
              >
                <TextInput
                  placeholder="Password Baru"
                  placeholderTextColor="#7A8F7D"
                  secureTextEntry={
                    !showPassword
                  }
                  style={
                    styles.passwordInput
                  }
                  value={newPassword}
                  onChangeText={
                    setNewPassword
                  }
                  autoCapitalize="none"
                  editable={!loading}
                  returnKeyType="next"
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  style={styles.eyeButton}
                >
                  <SymbolView
                    name={
                      showPassword
                        ? {
                            ios: "eye.slash",
                            android:
                              "visibility_off",
                            web: "visibility_off",
                          }
                        : {
                            ios: "eye",
                            android:
                              "visibility",
                            web: "visibility",
                          }
                    }
                    size={22}
                    tintColor="#355A42"
                  />
                </Pressable>
              </View>


              {/* Konfirmasi password */}

              <View
                style={[
                  styles.input,
                  styles.passwordContainer,
                ]}
              >
                <TextInput
                  placeholder="Konfirmasi Password"
                  placeholderTextColor="#7A8F7D"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  style={
                    styles.passwordInput
                  }
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  autoCapitalize="none"
                  editable={!loading}
                  onSubmitEditing={() =>
                    Keyboard.dismiss()
                  }
                  returnKeyType="done"
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  style={styles.eyeButton}
                >
                  <SymbolView
                    name={
                      showConfirmPassword
                        ? {
                            ios: "eye.slash",
                            android:
                              "visibility_off",
                            web: "visibility_off",
                          }
                        : {
                            ios: "eye",
                            android:
                              "visibility",
                            web: "visibility",
                          }
                    }
                    size={22}
                    tintColor="#355A42"
                  />
                </Pressable>
              </View>


              <Pressable
                style={[
                  styles.button,
                  loading &&
                    styles.buttonDisabled,
                ]}
                onPress={
                  handleResetPassword
                }
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? "Menyimpan..."
                    : "Ubah Password"}
                </Text>
              </Pressable>
            </>
          )}


          {/* Kembali */}

          <Pressable
            onPress={handleBack}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              {step === 1
                ? "Kembali ke Login"
                : "Kembali"}
            </Text>
          </Pressable>

        </View>
      </View>


      {/* Connection Modal */}

      <ConnectionModal
        visible={showConnectionError}
        onClose={() =>
          setShowConnectionError(false)
        }
        onRetry={() => {
          setShowConnectionError(false);

          if (step === 1) {
            handleSendOTP();
          } else if (step === 2) {
            handleVerifyOTP();
          } else {
            handleResetPassword();
          }
        }}
      />

    </View>
  );
}


// =========================
// Styles
// =========================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#EAF7E8",
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
      "rgba(234,247,232,0.25)",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 5,
  },

  logo: {
    width: 82,
    height: 82,
    resizeMode: "contain",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#137A3F",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#315B40",
    textAlign: "center",
    marginBottom: 26,
  },

  card: {
    width: "100%",
    maxWidth: 650,
    backgroundColor:
      "rgba(255,255,255,0.96)",
    borderRadius: 28,
    padding: 28,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 15,

    elevation: 7,
  },

  input: {
    height: 70,
    borderWidth: 1.5,
    borderColor: "#C8DDCE",
    borderRadius: 22,
    backgroundColor: "#F0F8F2",

    paddingHorizontal: 22,

    fontSize: 16,
    color: "#183D27",

    marginBottom: 16,
  },

  otpInput: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 6,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#183D27",
  },

  eyeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    height: 70,
    borderRadius: 35,
    backgroundColor: "#239447",

    justifyContent: "center",
    alignItems: "center",

    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 8,
  },

  backText: {
    color: "#237B45",
    fontSize: 16,
    fontWeight: "700",
  },
});
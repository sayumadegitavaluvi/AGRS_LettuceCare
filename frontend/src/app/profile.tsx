import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// Samakan dengan URL backend di login.tsx dan register.tsx.
// Jika IP laptop/server berubah, URL ini juga perlu diperbarui.
const API_URL = "http://172.20.10.4:8000";

type UserProfile = {
  username: string;
  email: string;
};

type PreferencePage = "notifications" | "about" | "help";

type PreferenceSection = {
  title: string;
  description: string;
};

// Konten informatif lokal; tidak membutuhkan backend atau izin push notification.
const PREFERENCE_PAGES: Record<
  PreferencePage,
  {
    icon: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    sections: PreferenceSection[];
    note: string;
  }
> = {
  notifications: {
    icon: "♧",
    eyebrow: "INFORMASI NOTIFIKASI",
    title: "Notifikasi LettuceCare",
    subtitle: "Pesan yang membantu kamu mengetahui hasil aktivitas aplikasi.",
    sections: [
      {
        title: "Akun pengguna",
        description: "LettuceCare menampilkan pemberitahuan saat login, registrasi, atau logout berhasil maupun gagal.",
      },
      {
        title: "Pemeriksaan tanaman",
        description: "Pesan akan muncul saat foto diproses atau jika pemeriksaan mengalami kendala.",
      },
      {
        title: "Riwayat pemeriksaan",
        description: "Kamu akan mendapat pemberitahuan setelah riwayat berhasil dihapus atau ketika penghapusan gagal.",
      },
    ],
    note: "Saat ini notifikasi berupa banner atau pesan di dalam aplikasi, bukan notifikasi push ke layar kunci HP.",
  },
  about: {
    icon: "i",
    eyebrow: "TENTANG APLIKASI",
    title: "LettuceCare AI",
    subtitle: "Grow Healthy, Harvest Better • Versi 1.0.0",
    sections: [
      {
        title: "Apa itu LettuceCare?",
        description: "LettuceCare membantu pengguna memeriksa kondisi tanaman selada melalui foto dan memperoleh informasi penanganan dari Knowledge Base.",
      },
      {
        title: "Fitur utama",
        description: "Deteksi kondisi daun selada, informasi penyebab dan saran perawatan, serta riwayat pemeriksaan pada akun pengguna.",
      },
      {
        title: "Tentang hasil AI",
        description: "Hasil AI merupakan perkiraan berdasarkan model yang digunakan. Jika gejala berat atau hasil tampak tidak sesuai, periksa kondisi tanaman secara langsung.",
      },
    ],
    note: "Informasi perawatan bersifat panduan awal dan bukan jaminan diagnosis yang selalu tepat.",
  },
  help: {
    icon: "?",
    eyebrow: "PANDUAN PENGGUNAAN",
    title: "Pusat Bantuan",
    subtitle: "Langkah singkat menggunakan LettuceCare dari awal sampai akhir.",
    sections: [
      {
        title: "1. Periksa tanaman",
        description: "Buka Deteksi, ambil atau pilih foto daun selada yang jelas, lalu tentukan umur dan kondisi tanaman.",
      },
      {
        title: "2. Lihat hasil pemeriksaan",
        description: "Tekan Analisis Penyakit. Setelah proses selesai, baca hasil deteksi beserta informasi penyebab dan saran perawatan.",
      },
      {
        title: "3. Buka riwayat",
        description: "Masuk ke menu Riwayat, lalu ketuk salah satu pemeriksaan untuk melihat detail. Gunakan Hapus riwayat jika ingin menghapus catatan tersebut.",
      },
      {
        title: "4. Jika pemeriksaan gagal",
        description: "Pastikan internet terhubung, foto dapat dibuka, dan server aplikasi tersedia. Coba lagi bila koneksi sudah stabil.",
      },
    ],
    note: "Jika kendala terus terjadi, sampaikan pesan error kepada pengelola aplikasi untuk membantu penelusuran masalah.",
  },
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activePreference, setActivePreference] = useState<PreferencePage | null>(null);

  const preferenceContent = activePreference
    ? PREFERENCE_PAGES[activePreference]
    : null;

  // Muat ulang profil saat halaman dibuka kembali (misalnya setelah login).
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        setLoadingProfile(true);
        setProfileError("");
        setProfile(null);

        try {
          const token = await AsyncStorage.getItem("access_token");
          if (!token) {
            if (active) {
              setProfileError("Belum ada sesi login. Silakan login untuk melihat data akun.");
            }
            return;
          }

          const response = await fetch(`${API_URL}/users/me`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 401 || response.status === 403) {
            await AsyncStorage.multiRemove(["access_token", "user_email"]);
            if (active) {
              Alert.alert(
                "Sesi login berakhir",
                "Silakan login kembali untuk melanjutkan.",
                [{ text: "Login", onPress: () => router.replace("/login") }]
              );
            }
            return;
          }

          if (!response.ok) {
            throw new Error(`Gagal memuat profil (HTTP ${response.status}).`);
          }

          const data: unknown = await response.json();
          if (
            typeof data !== "object" ||
            data === null ||
            !("username" in data) ||
            !("email" in data) ||
            typeof data.username !== "string" ||
            typeof data.email !== "string"
          ) {
            throw new Error("Format data profil dari backend tidak sesuai.");
          }

          if (active) {
            setProfile({ username: data.username, email: data.email });
          }
        } catch (error) {
          if (active) {
            const message =
              error instanceof Error ? error.message : "Terjadi kesalahan.";
            setProfileError(
              message.includes("Network request failed") || message.includes("Failed to fetch")
                ? "Tidak dapat terhubung ke backend. Pastikan server aktif dan alamat API benar."
                : message
            );
          }
        } finally {
          if (active) setLoadingProfile(false);
        }
      };

      void loadProfile();
      return () => {
        active = false;
      };
    }, [retryCount])
  );

  const performLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // Hapus sesi lokal sebelum berpindah ke halaman Login.
      // Hapus token dan status sukses login yang mungkin masih tersimpan.
      await AsyncStorage.multiRemove([
        "access_token",
        "user_email",
        "show_login_success_banner",
      ]);
      // Kirim notifikasi sekali pakai ke halaman Login.
      await AsyncStorage.setItem("show_logout_success_banner", "true");
      router.replace("/login");
    } catch {
      Alert.alert("Logout gagal", "Sesi belum dapat dihapus. Silakan coba lagi.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (loggingOut) return;
    Alert.alert(
      "Keluar dari akun?",
      "Apakah kamu yakin ingin keluar dari LettuceCare?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: () => { void performLogout(); },
        },
      ]
    );
  };

  const openInfo = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F8F0"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>LETTUCECARE AI</Text>
            <Text style={styles.headerTitle}>Profil Saya</Text>
            <Text style={styles.headerSubtitle}>
              Kelola akun dan preferensi aplikasi
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>♧</Text>
          </View>
        </View>

        {/* Profile hero */}
        <LinearGradient
          colors={["#176642", "#2D8B58", "#4DA76C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.decorCircle} />

          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>♧</Text>
            </View>

            <View style={styles.accountBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.accountBadgeText}>
                AKUN LETTUCECARE
              </Text>
            </View>
          </View>

          <Text style={styles.profileName}>
            {loadingProfile ? "Memuat profil..." : profile?.username ?? "Belum tersedia"}
          </Text>
          <Text style={styles.profileDescription}>
            Sahabat tanaman sehat dan panen berkualitas.
          </Text>

          <View style={styles.profileDivider} />

          <View style={styles.profileFooter}>
            <View>
              <Text style={styles.profileFooterLabel}>
                PLATFORM
              </Text>
              <Text style={styles.profileFooterValue}>
                LettuceCare AI
              </Text>
            </View>

            <View style={styles.profileFooterIcon}>
              <Text style={styles.profileFooterIconText}>
                LEAF
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <Text style={styles.sectionSubtitle}>
            Data pengguna
          </Text>
        </View>

        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>♙</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Nama pengguna</Text>
              <Text style={styles.menuValue}>
                {loadingProfile ? "Memuat..." : profile?.username ?? "Belum tersedia"}
              </Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() =>
              openInfo(
                "Email akun",
                profile?.email ?? "Data email belum tersedia."
              )
            }
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>✉</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Email akun</Text>
              <Text style={styles.menuValue}>
                {loadingProfile ? "Memuat..." : profile?.email ?? "Belum tersedia"}
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Status pengambilan data akun */}
        {loadingProfile && (
          <View style={styles.profileStatus}>
            <ActivityIndicator size="small" color="#28764C" />
            <Text style={styles.profileStatusText}>Mengambil informasi akun...</Text>
          </View>
        )}
        {!loadingProfile && Boolean(profileError) && (
          <View style={styles.profileStatus}>
            <Text style={styles.profileStatusText}>{profileError}</Text>
            <Pressable
              onPress={() => setRetryCount((count) => count + 1)}
              accessibilityRole="button"
              accessibilityLabel="Coba memuat profil lagi"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        )}

        {/* Preferences */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferensi</Text>
          <Text style={styles.sectionSubtitle}>
            Pengaturan aplikasi
          </Text>
        </View>

        <View style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => setActivePreference("notifications")}
          >
            <View style={[styles.menuIcon, styles.iconYellow]}>
              <Text style={styles.menuIconText}>♧</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Notifikasi</Text>
              <Text style={styles.menuValue}>
                Informasi kesehatan tanaman
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => setActivePreference("about")}
          >
            <View style={[styles.menuIcon, styles.iconBlue]}>
              <Text style={styles.menuIconText}>i</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>
                Tentang aplikasi
              </Text>
              <Text style={styles.menuValue}>
                Versi 1.0.0
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => setActivePreference("help")}
          >
            <View style={[styles.menuIcon, styles.iconPurple]}>
              <Text style={styles.menuIconText}>?</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Pusat bantuan</Text>
              <Text style={styles.menuValue}>
                Panduan penggunaan aplikasi
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
            loggingOut && styles.pressed,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>
            {loggingOut ? "Sedang keluar..." : "Keluar dari Akun"}
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          GROW HEALTHY, HARVEST BETTER
        </Text>

        <Text style={styles.version}>
          LettuceCare AI • Versi 1.0.0
        </Text>
      </ScrollView>

      {/* Lembar informasi Preferensi. Tidak mengubah desain halaman Profil. */}
      <Modal
        visible={activePreference !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActivePreference(null)}
      >
        <View style={styles.preferenceOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setActivePreference(null)}
            accessibilityRole="button"
            accessibilityLabel="Tutup informasi preferensi"
          />

          {preferenceContent && (
            <View style={styles.preferenceCard}>
              <View style={styles.preferenceCardHeader}>
                <View style={styles.preferenceIconBox}>
                  <Text style={styles.preferenceIconText}>
                    {preferenceContent.icon}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActivePreference(null)}
                  style={styles.preferenceClose}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup"
                >
                  <Text style={styles.preferenceCloseText}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.preferenceEyebrow}>
                {preferenceContent.eyebrow}
              </Text>
              <Text style={styles.preferenceTitle}>
                {preferenceContent.title}
              </Text>
              <Text style={styles.preferenceSubtitle}>
                {preferenceContent.subtitle}
              </Text>

              <ScrollView
                style={styles.preferenceScroll}
                contentContainerStyle={styles.preferenceScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {preferenceContent.sections.map((section, index) => (
                  <View key={`${activePreference}-${index}`}>
                    <View style={styles.preferenceSection}>
                      <View style={styles.preferenceSectionDot} />
                      <View style={styles.preferenceSectionContent}>
                        <Text style={styles.preferenceSectionTitle}>
                          {section.title}
                        </Text>
                        <Text style={styles.preferenceSectionDescription}>
                          {section.description}
                        </Text>
                      </View>
                    </View>
                    {index < preferenceContent.sections.length - 1 && (
                      <View style={styles.preferenceSeparator} />
                    )}
                  </View>
                ))}

                <View style={styles.preferenceNoteBox}>
                  <Text style={styles.preferenceNoteText}>
                    {preferenceContent.note}
                  </Text>
                </View>
              </ScrollView>

              <Pressable
                onPress={() => setActivePreference(null)}
                style={styles.preferenceDone}
                accessibilityRole="button"
              >
                <Text style={styles.preferenceDoneText}>Mengerti</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navText}>Beranda</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/riwayat")}
        >
          <Text style={styles.navIcon}>◷</Text>
          <Text style={styles.navText}>Riwayat</Text>
        </Pressable>

        <View style={styles.navItem}>
          <View style={styles.activeNavIcon}>
            <Text style={styles.activeNavIconText}>♙</Text>
          </View>
          <Text style={styles.navTextActive}>Profil</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F0",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#548367",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: "900",
    color: "#194A34",
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#78877B",
    marginTop: 5,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#E3EFDC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    color: "#28764C",
    fontSize: 30,
    fontWeight: "800",
  },
  profileCard: {
    borderRadius: 26,
    padding: 23,
    overflow: "hidden",
    marginBottom: 28,
  },
  decorCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -90,
    right: -55,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F0F7E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText: {
    fontSize: 47,
    color: "#28764C",
    fontWeight: "900",
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#C8F5A8",
    marginRight: 7,
  },
  accountBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 20,
    letterSpacing: -0.5,
  },
  profileDescription: {
    color: "#E0F1E4",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  profileDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginVertical: 20,
  },
  profileFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileFooterLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "#C6E3CF",
  },
  profileFooterValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },
  profileFooterIcon: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  profileFooterIconText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sectionHeader: {
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#214C36",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: "#849187",
    fontSize: 12,
    marginTop: 4,
  },
  profileStatus: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: -14,
    marginBottom: 22,
    paddingHorizontal: 10,
  },
  profileStatusText: {
    flexShrink: 1,
    color: "#78877B",
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: "#E3EFDC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: "#28764C",
    fontSize: 12,
    fontWeight: "800",
  },
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8EDE4",
    paddingHorizontal: 15,
    marginBottom: 27,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E8F3E5",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#28764C",
  },
  iconYellow: {
    backgroundColor: "#FFF3D7",
  },
  iconBlue: {
    backgroundColor: "#E2F0F8",
  },
  iconPurple: {
    backgroundColor: "#EEE7FA",
  },
  menuContent: {
    flex: 1,
    marginLeft: 13,
  },
  menuLabel: {
    fontSize: 14,
    color: "#294A37",
    fontWeight: "800",
  },
  menuValue: {
    fontSize: 11,
    color: "#89948B",
    marginTop: 5,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 26,
    color: "#8AA18D",
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#EEF1EB",
    marginLeft: 56,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1EE",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#F5DCD5",
    paddingVertical: 16,
    marginTop: 0,
  },
  logoutIcon: {
    fontSize: 21,
    color: "#C65346",
    marginRight: 10,
    fontWeight: "800",
  },
  logoutText: {
    color: "#B84D40",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    textAlign: "center",
    color: "#64816D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginTop: 27,
  },
  version: {
    textAlign: "center",
    color: "#A1AAA0",
    fontSize: 10,
    marginTop: 7,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8EDE5",
    paddingTop: 10,
    paddingBottom: 10,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  navIcon: {
    color: "#91A49A",
    fontSize: 25,
    marginBottom: 3,
  },
  navText: {
    fontSize: 10,
    color: "#84958A",
  },
  activeNavIcon: {
    width: 31,
    height: 27,
    borderRadius: 10,
    backgroundColor: "#E4F1DF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  activeNavIconText: {
    fontSize: 20,
    color: "#28764C",
    fontWeight: "900",
  },
  navTextActive: {
    fontSize: 10,
    color: "#28764C",
    fontWeight: "900",
  },
  // Styles tambahan untuk pop-up Preferensi; styles halaman lama tidak berubah.
  preferenceOverlay: {
    flex: 1,
    backgroundColor: "rgba(14, 37, 23, 0.56)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 19,
    paddingTop: 55,
    paddingBottom: 45,
  },
  preferenceCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "100%",
    backgroundColor: "#FBFCF8",
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#E4ECDF",
    overflow: "hidden",
  },
  preferenceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  preferenceIconBox: {
    width: 54,
    height: 54,
    backgroundColor: "#E7F2E1",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  preferenceIconText: {
    fontSize: 29,
    fontWeight: "900",
    color: "#286B43",
  },
  preferenceClose: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#EEF3E9",
    alignItems: "center",
    justifyContent: "center",
  },
  preferenceCloseText: {
    color: "#286B43",
    fontSize: 28,
    lineHeight: 31,
    marginTop: -2,
  },
  preferenceEyebrow: {
    color: "#709277",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  preferenceTitle: {
    color: "#204F36",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  preferenceSubtitle: {
    color: "#77877A",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 17,
  },
  preferenceScroll: {
    flexShrink: 1,
  },
  preferenceScrollContent: {
    paddingBottom: 9,
  },
  preferenceSection: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 11,
  },
  preferenceSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#68A875",
    marginTop: 5,
  },
  preferenceSectionContent: {
    flex: 1,
  },
  preferenceSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#265339",
    marginBottom: 5,
  },
  preferenceSectionDescription: {
    color: "#78877A",
    fontSize: 12,
    lineHeight: 19,
  },
  preferenceSeparator: {
    height: 1,
    backgroundColor: "#E8EEE3",
    marginLeft: 19,
  },
  preferenceNoteBox: {
    backgroundColor: "#EBF4E7",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 13,
  },
  preferenceNoteText: {
    color: "#4B7052",
    fontSize: 11,
    lineHeight: 17,
  },
  preferenceDone: {
    backgroundColor: "#286B43",
    borderRadius: 15,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  preferenceDoneText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

});
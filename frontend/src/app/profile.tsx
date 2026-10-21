import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function ProfileScreen() {
  const handleLogout = () => {
    Alert.alert(
      "Keluar dari akun?",
      "Apakah kamu yakin ingin keluar dari LettuceCare?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Keluar",
          style: "destructive",
          onPress: () => router.replace("/login"),
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

          <Text style={styles.profileName}>Petani Selada</Text>
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
                Petani Selada
              </Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() =>
              openInfo(
                "Informasi akun",
                "Informasi nama dan email akan ditampilkan setelah dihubungkan dengan data akun pengguna."
              )
            }
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>✉</Text>
            </View>

            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Email akun</Text>
              <Text style={styles.menuValue}>
                Lihat informasi akun
              </Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

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
            onPress={() =>
              openInfo(
                "Notifikasi",
                "Pengaturan notifikasi akan tersedia setelah fitur notifikasi diaktifkan."
              )
            }
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
            onPress={() =>
              openInfo(
                "Tentang LettuceCare",
                "LettuceCare AI membantu petani memantau kondisi tanaman selada dan memperoleh informasi perawatan."
              )
            }
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
            onPress={() =>
              openInfo(
                "Bantuan",
                "Untuk bantuan penggunaan aplikasi, silakan hubungi pengelola LettuceCare."
              )
            }
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
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>↪</Text>
          <Text style={styles.logoutText}>Keluar dari Akun</Text>
        </Pressable>

        <Text style={styles.footer}>
          GROW HEALTHY, HARVEST BETTER
        </Text>

        <Text style={styles.version}>
          LettuceCare AI • Versi 1.0.0
        </Text>
      </ScrollView>

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
});
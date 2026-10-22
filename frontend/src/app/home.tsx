import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { router, type Href } from "expo-router";

export default function HomeScreen() {
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch("http://192.168.1.3:8000/");

        if (!response.ok) {
          console.log(
            "Backend merespons dengan status:",
            response.status
          );
          return;
        }

        const data = await response.json();
        console.log("Backend terhubung:", data.message);
      } catch (error) {
        console.log("Backend tidak terhubung:", error);
      }
    };

    checkBackend();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FBF7"
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Dekorasi wave hijau */}
          <View style={styles.topDecoration} />
          <View style={styles.leftDecoration} />

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <Image
                source={require("../../assets/images/lettuce-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.brandName}>LettuceCare</Text>
            </View>

            <View style={styles.notification}>
              <Text style={styles.notificationIcon}>♧</Text>
            </View>
          </View>

          {/* SAPAAN DAN ILUSTRASI */}
          <View style={styles.hero}>
            <View style={styles.heroText}>
              <Text style={styles.greeting}>
                Halo,{"\n"}Petani Selada!
              </Text>

              <Text style={styles.description}>
                Pantau kesehatan tanaman hidroponik kamu
                dengan mudah dan cepat.
              </Text>
            </View>

            <View style={styles.illustrationArea}>
              <View style={styles.illustrationCircle} />

              <View style={styles.leafDecorationOne} />
              <View style={styles.leafDecorationTwo} />

              {/* Ilustrasi selada */}
              <View style={styles.plantIllustration}>
                <Text style={styles.lettuceEmoji}>🥬</Text>
              </View>

              {/* Ilustrasi ponsel */}
              <View style={styles.phone}>
                <View style={styles.phoneNotch} />

                <View style={styles.phoneScreen}>
                  <View style={styles.phoneBrand}>
                    <Image
                      source={require("../../assets/images/lettuce-logo.png")}
                      style={styles.phoneLogo}
                      resizeMode="contain"
                    />

                    <Text style={styles.phoneBrandText}>
                      LettuceCare
                    </Text>
                  </View>

                  <View style={styles.phoneImage}>
                    <Text style={styles.phoneLettuce}>🥬</Text>
                  </View>

                  <View style={styles.phoneButton}>
                    <Text style={styles.phoneButtonText}>
                      Periksa
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* KARTU DETEKSI */}
          <Pressable
            style={({ pressed }) => [
              styles.detectionCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/detect")}
          >
            <View style={styles.cameraCircle}>
              <Text style={styles.cameraIcon}>▣</Text>
            </View>

            <View style={styles.detectionText}>
              <Text style={styles.detectionTitle}>
                Deteksi Penyakit
              </Text>

              <Text style={styles.detectionSubtitle}>
                Mulai analisis daun selada sekarang
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>›</Text>
            </View>

            <View style={styles.cardLeafOne} />
            <View style={styles.cardLeafTwo} />
          </Pressable>

          {/* MENU UTAMA */}
          <Text style={styles.sectionTitle}>Menu Utama</Text>

          <View style={styles.menuRow}>
            <MenuCard
              icon="▣"
              title="Deteksi"
              subtitle="Penyakit"
              route="/detect"
            />

            <MenuCard
              icon="◷"
              title="Riwayat"
              subtitle="Pemeriksaan"
              route="/riwayat"
            />
          </View>

          {/* BANNER */}
          <View style={styles.banner}>
            <View style={styles.bannerWave} />

            <View style={styles.bannerTextContainer}>
              <View style={styles.bannerHeading}>
                <Image
                  source={require("../../assets/images/lettuce-logo.png")}
                  style={styles.bannerLogo}
                  resizeMode="contain"
                />

                <Text style={styles.bannerTitle}>
                  Jaga Kesehatan Selada
                </Text>
              </View>

              <Text style={styles.bannerDescription}>
                Hasil panen lebih optimal dengan
                perawatan yang tepat.
              </Text>
            </View>

            <View style={styles.bannerPlant}>
              <Text style={styles.bannerLettuce}>🥬</Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* NAVIGASI BAWAH */}
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem}>
            <Text style={styles.navIconActive}>⌂</Text>
            <Text style={styles.navTextActive}>Beranda</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/riwayat")}
          >
            <Text style={styles.navIcon}>◷</Text>
            <Text style={styles.navText}>Riwayat</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/profile" as Href)}
          >
            <Text style={styles.navIcon}>♙</Text>
            <Text style={styles.navText}>Profil</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

type MenuCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  route: Href;
};

function MenuCard({
  icon,
  title,
  subtitle,
  route,
}: MenuCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuCard,
        pressed && styles.pressed,
      ]}
      onPress={() => router.push(route)}
    >
      <View style={styles.menuIconBox}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>

      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>

      <View style={styles.menuArrow}>
        <Text style={styles.menuArrowText}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FBF7",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FBF7",
    overflow: "hidden",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
  },

  topDecoration: {
    position: "absolute",
    top: -85,
    right: -70,
    width: 250,
    height: 210,
    borderRadius: 120,
    backgroundColor: "#E2F0DE",
    transform: [{ rotate: "-20deg" }],
  },

  leftDecoration: {
    position: "absolute",
    top: 230,
    left: -65,
    width: 130,
    height: 90,
    borderRadius: 65,
    backgroundColor: "#EAF4E7",
    transform: [{ rotate: "-25deg" }],
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  logo: {
    width: 38,
    height: 38,
  },

  brandName: {
    color: "#205D38",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.6,
  },

  notification: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF4E7",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    color: "#287A45",
    fontSize: 25,
  },

  hero: {
    minHeight: 210,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  heroText: {
    flex: 1,
    paddingRight: 2,
    zIndex: 2,
  },

  greeting: {
    color: "#194C35",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  description: {
    color: "#61766A",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: 190,
  },

  illustrationArea: {
    flex: 1,
    height: 205,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  illustrationCircle: {
    position: "absolute",
    width: 170,
    height: 150,
    borderRadius: 85,
    backgroundColor: "#E7F2E1",
    bottom: 12,
    right: -10,
  },

  leafDecorationOne: {
    position: "absolute",
    top: 25,
    right: 10,
    width: 22,
    height: 34,
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#A9CD98",
    transform: [{ rotate: "25deg" }],
  },

  leafDecorationTwo: {
    position: "absolute",
    top: 65,
    left: 0,
    width: 16,
    height: 25,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: "#C3DDB6",
    transform: [{ rotate: "-25deg" }],
  },

  plantIllustration: {
    position: "absolute",
    left: -6,
    bottom: 26,
    width: 92,
    height: 88,
    borderRadius: 46,
    backgroundColor: "#D6EACB",
    alignItems: "center",
    justifyContent: "center",
  },

  lettuceEmoji: {
    fontSize: 66,
  },

  phone: {
    width: 86,
    height: 145,
    borderRadius: 17,
    backgroundColor: "#234E3A",
    padding: 5,
    borderWidth: 2,
    borderColor: "#B9D3B4",
    transform: [{ rotate: "8deg" }],
    zIndex: 2,
    elevation: 5,
  },

  phoneNotch: {
    position: "absolute",
    zIndex: 3,
    top: 5,
    alignSelf: "center",
    width: 28,
    height: 7,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: "#234E3A",
  },

  phoneScreen: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#FAFCF8",
    padding: 6,
    paddingTop: 13,
    alignItems: "center",
  },

  phoneBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  phoneLogo: {
    width: 10,
    height: 10,
  },

  phoneBrandText: {
    fontSize: 5,
    color: "#28623D",
    fontWeight: "700",
  },

  phoneImage: {
    marginTop: 10,
    width: 57,
    height: 62,
    borderRadius: 7,
    backgroundColor: "#E4F0DE",
    alignItems: "center",
    justifyContent: "center",
  },

  phoneLettuce: {
    fontSize: 38,
  },

  phoneButton: {
    marginTop: 9,
    backgroundColor: "#2E8048",
    borderRadius: 10,
    width: 53,
    paddingVertical: 4,
    alignItems: "center",
  },

  phoneButtonText: {
    color: "#FFFFFF",
    fontSize: 6,
    fontWeight: "600",
  },

  detectionCard: {
    minHeight: 102,
    borderRadius: 24,
    backgroundColor: "#287C46",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 17,
    marginBottom: 28,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#286B3E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 9,
  },

  cameraCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F2F8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  cameraIcon: {
    fontSize: 30,
    color: "#287C46",
    fontWeight: "700",
  },

  detectionText: {
    flex: 1,
  },

  detectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  detectionSubtitle: {
    color: "#E3F1E4",
    fontSize: 11,
    lineHeight: 16,
  },

  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  arrowText: {
    color: "#FFFFFF",
    fontSize: 29,
    lineHeight: 31,
  },

  cardLeafOne: {
    position: "absolute",
    top: 10,
    right: 28,
    width: 25,
    height: 40,
    borderTopLeftRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: "rgba(255,255,255,0.10)",
    transform: [{ rotate: "40deg" }],
  },

  cardLeafTwo: {
    position: "absolute",
    bottom: -17,
    right: 12,
    width: 40,
    height: 52,
    borderTopLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: "rgba(255,255,255,0.10)",
    transform: [{ rotate: "25deg" }],
  },

  sectionTitle: {
    color: "#204F36",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 15,
  },

  menuRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 25,
  },

  menuCard: {
    flex: 1,
    minHeight: 144,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#DCE9D9",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 15,
    justifyContent: "center",
  },

  menuIconBox: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: "#EAF4E7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  menuIcon: {
    color: "#287C46",
    fontSize: 30,
    fontWeight: "700",
  },

  menuTitle: {
    color: "#244F37",
    fontSize: 15,
    fontWeight: "700",
  },

  menuSubtitle: {
    color: "#244F37",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },

  menuArrow: {
    position: "absolute",
    right: 12,
    bottom: 39,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6EC",
    alignItems: "center",
    justifyContent: "center",
  },

  menuArrowText: {
    color: "#438252",
    fontSize: 24,
    lineHeight: 25,
  },

  banner: {
    minHeight: 116,
    borderRadius: 22,
    backgroundColor: "#E2F0D9",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },

  bannerWave: {
    position: "absolute",
    width: 145,
    height: 145,
    borderRadius: 80,
    right: -50,
    top: -70,
    backgroundColor: "#D1E7C6",
  },

  bannerTextContainer: {
    flex: 1,
    zIndex: 1,
  },

  bannerHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  bannerLogo: {
    width: 27,
    height: 27,
  },

  bannerTitle: {
    color: "#285C3A",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  bannerDescription: {
    color: "#617967",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 220,
  },

  bannerPlant: {
    width: 75,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  bannerLettuce: {
    fontSize: 55,
  },

  bottomSpace: {
    height: 12,
  },

  bottomNav: {
    height: 76,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAF0E7",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 5,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  navIconActive: {
    color: "#287C46",
    fontSize: 29,
    fontWeight: "700",
  },

  navIcon: {
    color: "#91A69B",
    fontSize: 27,
  },

  navTextActive: {
    color: "#287C46",
    fontSize: 11,
    fontWeight: "700",
  },

  navText: {
    color: "#83958B",
    fontSize: 11,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
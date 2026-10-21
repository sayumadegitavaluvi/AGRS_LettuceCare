import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    prediction?: string | string[];
  }>();

  const predictionParam = Array.isArray(params.prediction)
    ? params.prediction[0]
    : params.prediction;

  const [image, setImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Ambil foto dari penyimpanan lokal, bukan dari parameter URL.
  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem(
          "last_detection_image"
        );

        if (mounted) {
          setImage(savedImage);
          setImageLoadFailed(!savedImage);
        }
      } catch (error) {
        console.error("Gagal membaca foto tanaman:", error);

        if (mounted) {
          setImageLoadFailed(true);
        }
      } finally {
        if (mounted) {
          setImageLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, []);

  // Membaca hasil deteksi dari backend.
  let prediction: {
    class_id?: number | string;
    class_name?: string;
    diagnosis?: string;
    confidence?: number;
    cause?: string;
    treatment?: string[] | string;
    knowledge_base?: {
      id?: number;
      code?: string;
      name?: string;
      cause?: string;
      treatment?: string[] | string;
    } | null;
  } = {};

  try {
    prediction = predictionParam
      ? JSON.parse(predictionParam)
      : {};
  } catch (error) {
    console.error("Gagal membaca hasil deteksi:", error);
  }

  const diagnosis =
    prediction.class_name ||
    prediction.diagnosis ||
    prediction.knowledge_base?.name ||
    "Hasil tidak tersedia";

  const rawConfidence = Number(prediction.confidence ?? 0);

  const accuracy = Number.isFinite(rawConfidence)
    ? Math.max(
        0,
        Math.min(100, rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence)
      )
    : 0;

  const cause =
    prediction.knowledge_base?.cause ||
    prediction.cause ||
    "Informasi penyebab tidak tersedia dari database.";

  const rawTreatment =
    prediction.knowledge_base?.treatment ??
    prediction.treatment ??
    [];

  const treatmentItems: string[] = Array.isArray(rawTreatment)
    ? rawTreatment.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : typeof rawTreatment === "string"
      ? rawTreatment
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const recommendations = treatmentItems.map(
    (description, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: `Penanganan ${String(index + 1).padStart(2, "0")}`,
      description,
      icon: ["◈", "◉", "❋"][index % 3],
    })
  );

  const isHealthy = diagnosis.toLowerCase() === "healthy";

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5F8F1"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.brand}>LETTUCECARE AI</Text>
            <Text style={styles.headerTitle}>
              Hasil Pemeriksaan
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.leafIcon}>❋</Text>
          </View>
        </View>

        {/* INTRODUCTION */}
        <View style={styles.intro}>
          <View style={styles.successLabel}>
            <View style={styles.successDot} />
            <Text style={styles.successLabelText}>
              PEMERIKSAAN SELESAI
            </Text>
          </View>

          <Text style={styles.pageTitle}>
            Kondisi tanaman{"\n"}
            <Text style={styles.pageTitleAccent}>
              seladamu hari ini.
            </Text>
          </Text>

          <Text style={styles.pageDescription}>
            Berikut hasil deteksi AI, penyebab, dan saran
            perawatan berdasarkan informasi penyakit yang tersedia.
          </Text>
        </View>

        {/* FOTO TANAMAN */}
        <View style={styles.photoCard}>
          <View style={styles.photoHeader}>
            <View>
              <Text style={styles.cardEyebrow}>
                DOKUMENTASI
              </Text>
              <Text style={styles.photoTitle}>
                Foto tanaman
              </Text>
            </View>

            <View style={styles.photoNumber}>
              <Text style={styles.photoNumberText}>01</Text>
            </View>
          </View>

          <View style={styles.imageFrame}>
            {imageLoading ? (
              <View style={styles.emptyImage}>
                <ActivityIndicator
                  size="large"
                  color="#32804D"
                />
                <Text style={styles.emptyImageText}>
                  Memuat foto tanaman...
                </Text>
              </View>
            ) : image && !imageLoadFailed ? (
              <Image
                key={image}
                source={{ uri: image }}
                style={styles.plantImage}
                resizeMode="contain"
                onError={(event) => {
                  console.error(
                    "Foto tanaman gagal ditampilkan:",
                    event.nativeEvent.error
                  );
                  setImageLoadFailed(true);
                }}
              />
            ) : (
              <View style={styles.emptyImage}>
                <Text style={styles.emptyImageIcon}>❋</Text>
                <Text style={styles.emptyImageText}>
                  Foto tidak ditemukan.
                </Text>
                <Text style={styles.emptyImageHint}>
                  Kembali ke halaman deteksi dan pilih foto baru.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.photoFooter}>
            <View style={styles.photoFooterDot} />
            <Text style={styles.photoFooterText}>
              Foto yang diperiksa oleh model AI
            </Text>
          </View>
        </View>

        {/* HASIL DETEKSI AI */}
        <LinearGradient
          colors={["#176B43", "#238653", "#319661"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.resultHero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLabel}>
              <Text style={styles.heroLabelText}>
                HASIL DETEKSI AI
              </Text>
            </View>

            <View style={styles.heroCheck}>
              <Text style={styles.heroCheckText}>
                {isHealthy ? "✓" : "!"}
              </Text>
            </View>
          </View>

          <Text style={styles.heroCaption}>
            Status kesehatan tanaman
          </Text>

          <Text style={styles.heroTitle}>
            {diagnosis}
          </Text>

          <Text style={styles.heroDescription}>
            {isHealthy
              ? "Tanaman teridentifikasi dalam kondisi sehat."
              : diagnosis === "Hasil tidak tersedia"
                ? "Hasil deteksi belum tersedia. Silakan lakukan pemeriksaan kembali."
                : `Model mengidentifikasi tanaman dengan hasil ${diagnosis}.`}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.accuracyHeader}>
            <View>
              <Text style={styles.accuracyLabel}>
                Akurasi deteksi
              </Text>
              <Text style={styles.accuracyValue}>
                {accuracy.toFixed(2)}%
              </Text>
            </View>

            <View style={styles.accuracyBadge}>
              <Text style={styles.accuracyBadgeText}>
                Skor deteksi
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${accuracy}%` },
              ]}
            />
          </View>

          <Text style={styles.accuracyNote}>
            Nilai skor yang dikembalikan oleh model AI.
          </Text>
        </LinearGradient>

        {/* PENYEBAB */}
        <View style={styles.recommendHeader}>
          <View style={styles.recommendHeadingLeft}>
            <Text style={styles.sectionTitle}>
              Penyebab
            </Text>
          </View>
        </View>

        <View style={styles.recommendCard}>
          <View style={styles.recommendItem}>
            <View style={styles.recommendIcon}>
              <Text style={styles.recommendIconText}>i</Text>
            </View>

            <View style={styles.recommendBody}>
              <Text style={styles.recommendTitle}>
                {diagnosis}
              </Text>

              <Text style={styles.recommendDescription}>
                {cause}
              </Text>
            </View>
          </View>
        </View>

        {/* SARAN PERAWATAN */}
        <View style={styles.recommendHeader}>
          <View style={styles.recommendHeadingLeft}>
            <Text style={styles.sectionTitle}>
              Saran perawatan
            </Text>
          </View>

          <View style={styles.recommendCount}>
            <Text style={styles.recommendCountText}>
              {String(recommendations.length).padStart(2, "0")}
            </Text>
          </View>
        </View>

        <View style={styles.recommendCard}>
          {recommendations.length > 0 ? (
            recommendations.map((item, index) => (
              <View key={item.number}>
                <View style={styles.recommendItem}>
                  <View style={styles.recommendIcon}>
                    <Text style={styles.recommendIconText}>
                      {item.icon}
                    </Text>
                  </View>

                  <View style={styles.recommendBody}>
                    <Text style={styles.recommendNumber}>
                      SARAN {item.number}
                    </Text>

                    <Text style={styles.recommendTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.recommendDescription}>
                      {item.description}
                    </Text>
                  </View>
                </View>

                {index < recommendations.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))
          ) : (
            <View style={styles.recommendItem}>
              <View style={styles.recommendBody}>
                <Text style={styles.recommendDescription}>
                  Informasi perawatan belum tersedia di database.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* PENGINGAT */}
        <View style={styles.reminder}>
          <LinearGradient
            colors={["#E6F4E6", "#F0F8EC"]}
            style={styles.reminderIcon}
          >
            <Text style={styles.reminderIconText}>i</Text>
          </LinearGradient>

          <View style={styles.reminderBody}>
            <Text style={styles.reminderTitle}>
              Tetap pantau tanamanmu
            </Text>

            <Text style={styles.reminderDescription}>
              Lakukan pemeriksaan berkala untuk mengetahui
              perubahan kondisi daun lebih awal.
            </Text>
          </View>
        </View>

        {/* TOMBOL AKSI */}
        <Pressable
          onPress={() => router.replace("/detect")}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["#238653", "#176B43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            <Text style={styles.primaryButtonText}>
              Periksa Tanaman Lagi
            </Text>
            <Text style={styles.primaryArrow}>→</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/home")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>
            Kembali ke Beranda
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          LETTUCECARE · RAWAT DENGAN LEBIH CERDAS
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F8F1",
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 35,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E6EFE2",
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    color: "#205D3D",
    fontSize: 35,
    lineHeight: 39,
    marginTop: -3,
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  brand: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#39835A",
    fontWeight: "800",
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 20,
    lineHeight: 26,
    color: "#173F2B",
    fontWeight: "800",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#E4F0E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  leafIcon: {
    fontSize: 25,
    color: "#238653",
  },

  intro: {
    marginBottom: 25,
  },

  successLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E5F2E4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 16,
  },

  successDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#27834D",
    marginRight: 8,
  },

  successLabelText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    color: "#267447",
  },

  pageTitle: {
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.8,
    fontWeight: "900",
    color: "#183F2C",
  },

  pageTitleAccent: {
    color: "#348653",
  },

  pageDescription: {
    fontSize: 14,
    lineHeight: 23,
    color: "#77857A",
    marginTop: 11,
    maxWidth: 330,
  },

  photoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8EEE5",
    marginBottom: 20,
    shadowColor: "#214A2F",
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  photoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 3,
    paddingBottom: 13,
  },

  cardEyebrow: {
    color: "#829185",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  photoTitle: {
    color: "#234B34",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
  },

  photoNumber: {
    backgroundColor: "#EAF4E7",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  photoNumberText: {
    color: "#347A4B",
    fontWeight: "800",
    fontSize: 12,
  },

  imageFrame: {
    width: "100%",
    height: 265,
    backgroundColor: "#F1F6EE",
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  plantImage: {
    width: "100%",
    height: "100%",
  },

  emptyImage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyImageIcon: {
    color: "#43845A",
    fontSize: 36,
    marginBottom: 8,
  },

  emptyImageText: {
    fontSize: 13,
    color: "#738477",
    textAlign: "center",
    marginTop: 10,
  },

  emptyImageHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#859087",
    textAlign: "center",
    marginTop: 6,
  },

  photoFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 13,
    paddingHorizontal: 4,
  },

  photoFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#69A675",
    marginRight: 8,
  },

  photoFooterText: {
    color: "#859087",
    fontSize: 11,
  },

  resultHero: {
    borderRadius: 25,
    padding: 22,
    marginBottom: 30,
    overflow: "hidden",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 23,
  },

  heroLabel: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
  },

  heroLabelText: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#E5F4E7",
    fontWeight: "800",
  },

  heroCheck: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#D8F0D7",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCheckText: {
    color: "#1A7544",
    fontSize: 24,
    fontWeight: "900",
  },

  heroCaption: {
    color: "#D0E7D3",
    fontSize: 12,
    marginBottom: 6,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroDescription: {
    color: "#DDEDE0",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginVertical: 22,
  },

  accuracyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  accuracyLabel: {
    color: "#D8EBDD",
    fontSize: 12,
    marginBottom: 4,
  },

  accuracyValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },

  accuracyBadge: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.13)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  accuracyBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#C7F0AD",
    borderRadius: 10,
  },

  accuracyNote: {
    color: "#D1E6D4",
    fontSize: 10,
    marginTop: 10,
  },

  recommendHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  recommendHeadingLeft: {
    flex: 1,
  },

  sectionTitle: {
    color: "#1C442E",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  recommendCount: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#E5F0E0",
    alignItems: "center",
    justifyContent: "center",
  },

  recommendCountText: {
    fontSize: 13,
    color: "#36764A",
    fontWeight: "900",
  },

  recommendCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 23,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E8EEE5",
    marginBottom: 20,
    shadowColor: "#214A2F",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  recommendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 17,
  },

  recommendIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#EAF4E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  recommendIconText: {
    fontSize: 20,
    color: "#32804D",
    fontWeight: "700",
  },

  recommendBody: {
    flex: 1,
    paddingTop: 1,
  },

  recommendNumber: {
    color: "#80A187",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 5,
  },

  recommendTitle: {
    color: "#244A32",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  recommendDescription: {
    color: "#7C887E",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },

  itemDivider: {
    height: 1,
    backgroundColor: "#EEF2EB",
  },

  reminder: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EDF5E9",
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },

  reminderIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  reminderIconText: {
    fontSize: 19,
    color: "#34784A",
    fontWeight: "900",
  },

  reminderBody: {
    flex: 1,
    paddingTop: 2,
  },

  reminderTitle: {
    color: "#285338",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5,
  },

  reminderDescription: {
    color: "#708474",
    fontSize: 12,
    lineHeight: 19,
  },

  primaryButton: {
    borderRadius: 17,
    overflow: "hidden",
    marginBottom: 11,
    shadowColor: "#176B43",
    shadowOpacity: 0.17,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  primaryGradient: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  primaryArrow: {
    color: "#FFFFFF",
    fontSize: 22,
    marginLeft: 12,
  },

  secondaryButton: {
    height: 53,
    borderRadius: 17,
    borderWidth: 1.3,
    borderColor: "#C9DCC8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#34754A",
    fontSize: 14,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.8,
  },

  footer: {
    color: "#9AA89B",
    textAlign: "center",
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginTop: 24,
  },
});
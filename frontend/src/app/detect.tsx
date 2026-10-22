import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const AGE_OPTIONS = [
  "8–14 hari",
  "15–30 hari",
  "> 30 hari",
];

const CONDITION_OPTIONS = [
  "Daun sehat",
  "Bercak cokelat atau kehitaman pada daun",
  "Lapisan putih seperti tepung",
  "Daun layu atau menguning",
  "Daun busuk atau rusak",
  "Lubang pada daun",
  "Gejala lainnya",
];

// Alamat backend FastAPI pada laptop.
const API_BASE_URL = "http://192.168.1.3:8000";

// Kunci penyimpanan foto yang dibaca oleh result.tsx.
const IMAGE_STORAGE_KEY = "last_detection_image";

export default function DetectScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Memilih foto dari galeri.
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Izin dibutuhkan",
          "Izinkan akses galeri untuk memilih foto tanaman."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gagal membuka galeri:", error);

      Alert.alert("Gagal", "Tidak dapat membuka galeri.");
    }
  };

  // Mengambil foto dari kamera.
  const takePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Izin dibutuhkan",
          "Izinkan akses kamera untuk mengambil foto tanaman."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gagal membuka kamera:", error);

      Alert.alert("Gagal", "Tidak dapat membuka kamera.");
    }
  };

  // Salin foto dari cache ImagePicker ke direktori permanen aplikasi.
  // URI hasil salinan dipakai untuk upload dan halaman hasil.
  const saveImagePermanently = async (
    originalUri: string
  ): Promise<string> => {
    const documentDirectory = FileSystem.documentDirectory;

    if (!documentDirectory) {
      throw new Error(
        "Direktori penyimpanan aplikasi tidak tersedia."
      );
    }

    const originalName =
      originalUri.split("/").pop()?.split("?")[0] ||
      "lettuce.jpg";

    const originalExtension =
      originalName.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(originalExtension)
      ? originalExtension
      : "jpg";

    const destinationUri =
      `${documentDirectory}lettucecare-${Date.now()}.${safeExtension}`;

    await FileSystem.copyAsync({
      from: originalUri,
      to: destinationUri,
    });

    const fileInfo = await FileSystem.getInfoAsync(
      destinationUri
    );

    if (!fileInfo.exists) {
      throw new Error(
        "Foto gagal disimpan ke penyimpanan aplikasi."
      );
    }

    return destinationUri;
  };

  // Mengirim foto ke backend FastAPI.
  const analyze = async () => {
    if (!image) {
      Alert.alert(
        "Foto belum ada",
        "Pilih atau ambil foto tanaman terlebih dahulu."
      );
      return;
    }

    if (!selectedAge) {
      Alert.alert(
        "Umur tanaman belum dipilih",
        "Pilih umur tanaman terlebih dahulu."
      );
      return;
    }

    if (!selectedCondition) {
      Alert.alert(
        "Kondisi tanaman belum dipilih",
        "Pilih kondisi tanaman terlebih dahulu."
      );
      return;
    }

    if (isAnalyzing) return;

    setIsAnalyzing(true);

    let persistentImageUri: string | null = null;

    try {
      // Pastikan sesi login tersedia.
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        Alert.alert(
          "Belum login",
          "Sesi login tidak ditemukan. Silakan login kembali."
        );

        router.replace("/login");
        return;
      }

      // LANGKAH 1:
      // Simpan foto secara permanen SEBELUM upload.
      // Jangan mengandalkan URI sementara dari ImagePicker.
      persistentImageUri = await saveImagePermanently(image);

      // LANGKAH 2:
      // Simpan URI yang sama agar result.tsx dapat membacanya.
      await AsyncStorage.setItem(
        IMAGE_STORAGE_KEY,
        persistentImageUri
      );

      // LANGKAH 3:
      // Tentukan nama dan MIME type file.
      const fileName =
        persistentImageUri.split("/").pop() ||
        "lettuce.jpg";

      const extension = fileName
        .split(".")
        .pop()
        ?.toLowerCase();

      const mimeType =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : "image/jpeg";

      // LANGKAH 4:
      // Upload file hasil salinan permanen ke FastAPI.
      const uploadResult = await FileSystem.uploadAsync(
        `${API_BASE_URL}/detection/predict`,
        persistentImageUri,
        {
          httpMethod: "POST",
          uploadType:
            FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType,
          parameters: {
          plant_age: selectedAge,
          plant_condition: selectedCondition,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      // LANGKAH 5:
      // Baca respons backend.
      let responseData: any;

      try {
        responseData = uploadResult.body
          ? JSON.parse(uploadResult.body)
          : {};
      } catch {
        responseData = {
          detail:
            uploadResult.body ||
            "Respons backend tidak valid.",
        };
      }

      // LANGKAH 6:
      // Tangani respons gagal.
      if (
        uploadResult.status < 200 ||
        uploadResult.status >= 300
      ) {
        if (
          uploadResult.status === 401 ||
          uploadResult.status === 403
        ) {
          Alert.alert(
            "Sesi tidak valid",
            "Silakan login kembali sebelum melakukan deteksi."
          );

          router.replace("/login");
          return;
        }

        const detail =
          responseData?.detail ||
          responseData?.message ||
          `Deteksi gagal. HTTP ${uploadResult.status}.`;

        throw new Error(
          typeof detail === "string"
            ? detail
            : JSON.stringify(detail)
        );
      }

      // LANGKAH 7:
      // Buka halaman hasil.
      // Foto TIDAK dikirim melalui parameter navigasi.
      // result.tsx mengambilnya dari AsyncStorage.
      router.push({
        pathname: "/result",
        params: {
          age: selectedAge,
          condition: selectedCondition,
          prediction: JSON.stringify(responseData),
        },
      });
    } catch (error) {
      console.error("Gagal melakukan deteksi:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim foto.";

      Alert.alert(
        "Deteksi gagal",
        `${message}\n\nPastikan backend aktif, alamat API benar, dan HP terhubung ke jaringan Wi-Fi yang sama dengan laptop.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#F8FFF8", "#EFF8EF", "#EAF5EA"]}
        style={styles.backgroundGradient}
      />

      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />
      <View style={styles.bgCircleThree} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.topHeader}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>
              LettuceCare AI
            </Text>

            <Text style={styles.headerTitle}>
              Deteksi Tanaman
            </Text>
          </View>

          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/images/lettuce-logo.png")}
              style={styles.logo}
            />
          </View>
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Periksa Kesehatan Selada
          </Text>

          <Text style={styles.heroSubtitle}>
            Ambil foto daun, lalu lengkapi informasi tanaman
            untuk membantu proses pemeriksaan dengan lebih akurat.
          </Text>
        </View>

        {/* FOTO TANAMAN */}
        <View style={styles.sectionHeader}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>1</Text>
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              Foto Tanaman
            </Text>

            <Text style={styles.sectionSubtitle}>
              Gunakan foto daun yang terlihat jelas dan terang.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.preview}>
            {image ? (
              <>
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  resizeMode="contain"
                />

                <Pressable
                  style={styles.changePhotoPill}
                  onPress={pickImage}
                >
                  <Text style={styles.changePhotoText}>
                    Ganti foto
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyPhotoWrap}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>📷</Text>
                </View>

                <Text style={styles.emptyTitle}>
                  Belum ada foto
                </Text>

                <Text style={styles.emptySubtitle}>
                  Ambil foto langsung atau pilih dari galeri.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.photoActionRow}>
            <Pressable
              style={styles.primaryAction}
              onPress={takePhoto}
              disabled={isAnalyzing}
            >
              <Text style={styles.primaryActionText}>
                Ambil Foto
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryAction}
              onPress={pickImage}
              disabled={isAnalyzing}
            >
              <Text style={styles.secondaryActionText}>
                Pilih Galeri
              </Text>
            </Pressable>
          </View>
        </View>

        {/* UMUR TANAMAN */}
        <View style={styles.sectionHeader}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>2</Text>
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              Umur Tanaman
            </Text>

            <Text style={styles.sectionSubtitle}>
              Pilih perkiraan umur sejak penanaman.
            </Text>
          </View>
        </View>

        <View style={styles.optionColumn}>
          {AGE_OPTIONS.map((item) => {
            const active = selectedAge === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.optionCard,
                  active && styles.optionCardActive,
                ]}
                onPress={() => setSelectedAge(item)}
                disabled={isAnalyzing}
              >
                <View
                  style={[
                    styles.radioOuter,
                    active && styles.radioOuterActive,
                  ]}
                >
                  {active && (
                    <View style={styles.radioInner} />
                  )}
                </View>

                <Text
                  style={[
                    styles.optionText,
                    active && styles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* KONDISI TANAMAN */}
        <View style={styles.sectionHeader}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberBadgeText}>3</Text>
          </View>

          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>
              Kondisi Tanaman
            </Text>

            <Text style={styles.sectionSubtitle}>
              Pilih gejala yang paling mendekati kondisi daun.
            </Text>
          </View>
        </View>

        <View style={styles.conditionWrap}>
          {CONDITION_OPTIONS.map((item) => {
            const active = selectedCondition === item;

            return (
              <Pressable
                key={item}
                style={[
                  styles.conditionChip,
                  active && styles.conditionChipActive,
                ]}
                onPress={() => setSelectedCondition(item)}
                disabled={isAnalyzing}
              >
                <Text
                  style={[
                    styles.conditionChipText,
                    active && styles.conditionChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* TOMBOL ANALISIS */}
        <LinearGradient
          colors={["#2F9E55", "#1E7A3B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.analyzeButton,
            isAnalyzing && styles.analyzeButtonDisabled,
          ]}
        >
          <Pressable
            style={styles.analyzeButtonInner}
            onPress={analyze}
            disabled={isAnalyzing}
          >
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing
                ? "Sedang Menganalisis..."
                : "Analisis Penyakit"}
            </Text>
          </Pressable>
        </LinearGradient>

        <Text style={styles.disclaimer}>
          Pastikan foto tanaman jelas agar hasil pemeriksaan
          lebih optimal.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8F1",
  },

  backgroundGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  bgCircleOne: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(112, 181, 108, 0.10)",
  },

  bgCircleTwo: {
    position: "absolute",
    top: 220,
    left: -60,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(83, 163, 95, 0.08)",
  },

  bgCircleThree: {
    position: "absolute",
    bottom: 120,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(62, 133, 77, 0.08)",
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 38,
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EAF3E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  backIcon: {
    fontSize: 30,
    color: "#2D7A47",
    fontWeight: "700",
    marginTop: -2,
  },

  headerTextWrap: {
    flex: 1,
  },

  headerEyebrow: {
    fontSize: 14,
    color: "#7C9081",
    fontWeight: "600",
    marginBottom: 3,
    letterSpacing: 0.2,
  },

  headerTitle: {
    fontSize: 19,
    color: "#1F5F37",
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  logoBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#355C40",
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },

  logo: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  heroSection: {
    marginBottom: 28,
  },

  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "900",
    color: "#1E6239",
    letterSpacing: 0.2,
    marginBottom: 10,
  },

  heroSubtitle: {
    fontSize: 17,
    lineHeight: 29,
    color: "#5F7466",
    fontWeight: "500",
    maxWidth: "98%",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    marginTop: 8,
  },

  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#E6F2E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },

  numberBadgeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#32834D",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: "#1D5F38",
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#7B8F7F",
    fontWeight: "500",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E3EBDD",
    shadowColor: "#264C36",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 28,
  },

  preview: {
    width: "100%",
    height: 250,
    borderRadius: 24,
    backgroundColor: "#EEF4E9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDE8D8",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EEF4E9",
  },

  emptyPhotoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#DFF0DA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 28,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E6D43",
    marginBottom: 6,
  },

  emptySubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#7B8E80",
    textAlign: "center",
  },

  changePhotoPill: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "rgba(31, 95, 55, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  changePhotoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  photoActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  primaryAction: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#2D8B49",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  secondaryAction: {
    flex: 1,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.4,
    borderColor: "#BFD4BD",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryActionText: {
    color: "#2D7A47",
    fontSize: 17,
    fontWeight: "800",
  },

  optionColumn: {
    marginBottom: 28,
  },

  optionCard: {
    minHeight: 82,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1.3,
    borderColor: "#D8E3D3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowColor: "#2C4D36",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  optionCardActive: {
    backgroundColor: "#F2FBF3",
    borderColor: "#4AA163",
  },

  radioOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#B4C8B1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  radioOuterActive: {
    borderColor: "#2F8E4C",
  },

  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2F8E4C",
  },

  optionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#56705D",
  },

  optionTextActive: {
    color: "#1E6239",
    fontWeight: "800",
  },

  conditionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },

  conditionChip: {
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1.2,
    borderColor: "#D6E2D2",
  },

  conditionChipActive: {
    backgroundColor: "#E9F7EA",
    borderColor: "#3D965A",
  },

  conditionChipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#64806C",
    flexShrink: 1,
  },

  conditionChipTextActive: {
    color: "#1F6A3C",
    fontWeight: "800",
  },

  analyzeButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#2A7C46",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 4,
  },

  analyzeButtonDisabled: {
    opacity: 0.7,
  },

  analyzeButtonInner: {
    minHeight: 60,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  disclaimer: {
    color: "#8A988A",
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 16,
  },
});
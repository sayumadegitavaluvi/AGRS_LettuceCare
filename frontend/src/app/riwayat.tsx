import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.13:8000";

type Filter = "Semua" | "Sehat" | "Terinfeksi";

type HistoryResponse = {
  id: number;
  image_path?: string;
  diagnosis: string;
  confidence: number;
  created_at: string;
  cause?: string | null;
  treatment?: string[] | string | null;
};

type RecordItem = {
  id: string;
  disease: string;
  status: "Sehat" | "Terinfeksi";
  date: string;
  confidence: number;
  time: string;
  cause: string;
  treatment: string[];
  imageUrl: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: value, time: "" };
  }

  return {
    date: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function buildImageUrl(imagePath?: string | null): string | null {
  if (!imagePath || !imagePath.trim()) return null;

  const value = imagePath.trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const normalizedPath = value.replace(/\\/g, "/");
  const filename = normalizedPath.split("/").filter(Boolean).pop();

  if (!filename) return null;

  return `${API_URL}/uploads/${encodeURIComponent(filename)}`;
}

function mapHistory(item: HistoryResponse): RecordItem {
  const diagnosis = item.diagnosis || "Tidak diketahui";
  const lowerDiagnosis = diagnosis.toLowerCase();

  const healthy =
    lowerDiagnosis.includes("healthy") ||
    lowerDiagnosis.includes("sehat");

  const formatted = formatDate(item.created_at);

  let treatment: string[] = [];

  if (Array.isArray(item.treatment)) {
    treatment = item.treatment;
  } else if (typeof item.treatment === "string") {
    treatment = item.treatment
      .split(/\n\n|\n/)
      .map((text) => text.trim())
      .filter(Boolean);
  }

  return {
    id: String(item.id),
    disease: healthy ? "Daun Sehat" : diagnosis,
    status: healthy ? "Sehat" : "Terinfeksi",
    date: formatted.date,
    time: formatted.time,
    confidence: Number(item.confidence) || 0,
    cause: item.cause || "Informasi penyebab belum tersedia.",
    treatment,
    imageUrl: buildImageUrl(item.image_path),
  };
}

export default function RiwayatScreen() {
  const [filter, setFilter] = useState<Filter>("Semua");
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<RecordItem | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        setHistory([]);
        setError("Sesi login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await fetch(`${API_URL}/history/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        setHistory([]);
        setError(
          "Sesi login tidak valid atau sudah berakhir. Silakan login kembali."
        );
        return;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Gagal mengambil riwayat (${response.status}). ${body}`
        );
      }

      const data: HistoryResponse[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Format data riwayat dari backend tidak sesuai.");
      }

      setFailedImages(new Set());
      setHistory(data.map(mapHistory));
    } catch (err) {
      setHistory([]);
      setError(
        err instanceof Error
          ? err.message
          : "Tidak dapat mengambil data riwayat."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const filteredHistory = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return history.filter((item) => {
      const matchesFilter =
        filter === "Semua" || item.status === filter;

      const matchesSearch =
        item.disease.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword) ||
        item.date.toLowerCase().includes(keyword);

      return matchesFilter && matchesSearch;
    });
  }, [history, filter, search]);

  const healthyCount = history.filter(
    (item) => item.status === "Sehat"
  ).length;

  const infectedCount = history.filter(
    (item) => item.status === "Terinfeksi"
  ).length;

  function showHistoryDetail(item: RecordItem) {
    setSelectedRecord(item);
  }

  function closeHistoryDetail() {
    setSelectedRecord(null);
  }

  function markImageFailed(id: string) {
    setFailedImages((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F6F9F3"
      />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.push("/home")}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>LETTUCECARE AI</Text>

              <Text style={styles.title}>
                Riwayat Pemeriksaan
              </Text>

              <Text style={styles.subtitle}>
                Pantau kesehatan selada dari waktu ke waktu.
              </Text>
            </View>
          </View>

          {/* Ringkasan data dari backend */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              TOTAL PEMERIKSAAN
            </Text>

            <View style={styles.summaryMain}>
              <Text style={styles.totalNumber}>
                {history.length}
              </Text>

              <Text style={styles.totalLabel}>
                kali pemeriksaan
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <View style={styles.statDotHealthy} />

                <View>
                  <Text style={styles.statNumber}>
                    {healthyCount}
                  </Text>
                  <Text style={styles.statLabel}>Sehat</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statDotInfected} />

                <View>
                  <Text style={styles.statNumber}>
                    {infectedCount}
                  </Text>
                  <Text style={styles.statLabel}>
                    Terinfeksi
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.decorCircle} />
          </View>

          {/* Pencarian */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Cari penyakit atau tanggal..."
              placeholderTextColor="#95A398"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Text style={styles.clearSearch}>×</Text>
              </Pressable>
            )}
          </View>

          {/* Filter */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Semua pemeriksaan
            </Text>

            <Text style={styles.resultCount}>
              {filteredHistory.length} hasil
            </Text>
          </View>

          <View style={styles.filterRow}>
            {(["Semua", "Sehat", "Terinfeksi"] as Filter[]).map(
              (item) => {
                const active = filter === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.filterChip,
                      active && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {/* Status pemuatan, error, dan daftar riwayat */}
          {loading ? (
            <View style={styles.messageBox}>
              <ActivityIndicator size="large" color="#286B43" />
              <Text style={styles.messageText}>
                Memuat riwayat pemeriksaan...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.messageBox}>
              <Text style={styles.errorTitle}>
                Gagal memuat riwayat
              </Text>

              <Text style={styles.emptyDescription}>
                {error}
              </Text>

              <Pressable
                onPress={fetchHistory}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Coba Lagi</Text>
              </Pressable>
            </View>
          ) : filteredHistory.length > 0 ? (
            <View style={styles.historyList}>
              {filteredHistory.map((item) => {
                const healthy = item.status === "Sehat";
                const imageFailed = failedImages.has(item.id);

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => showHistoryDetail(item)}
                    style={({ pressed }) => [
                      styles.historyCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.thumb,
                        healthy
                          ? styles.thumbHealthy
                          : styles.thumbInfected,
                      ]}
                    >
                      {item.imageUrl && !imageFailed ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.thumbImage}
                          resizeMode="cover"
                          onError={() => markImageFailed(item.id)}
                        />
                      ) : (
                        <View style={styles.thumbFallback}>
                          <Text style={styles.thumbLeaf}>♣</Text>
                          <Text style={styles.thumbCaption}>
                            {item.imageUrl ? "FOTO ERROR" : "SELADA"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.cardTopRow}>
                        <Text
                          style={styles.diseaseName}
                          numberOfLines={1}
                        >
                          {item.disease}
                        </Text>

                        <Text style={styles.chevron}>›</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          healthy
                            ? styles.badgeHealthy
                            : styles.badgeInfected,
                        ]}
                      >
                        <View
                          style={[
                            styles.badgeDot,
                            healthy
                              ? styles.dotHealthy
                              : styles.dotInfected,
                          ]}
                        />

                        <Text
                          style={[
                            styles.badgeText,
                            healthy
                              ? styles.badgeTextHealthy
                              : styles.badgeTextInfected,
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>

                      <Text style={styles.dateText}>
                        {item.date} · {item.time}
                      </Text>

                      <View style={styles.confidenceRow}>
                        <Text style={styles.confidenceLabel}>
                          Akurasi AI
                        </Text>

                        <Text style={styles.confidenceValue}>
                          {item.confidence}%
                        </Text>
                      </View>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.max(
                                0,
                                Math.min(item.confidence, 100)
                              )}%`,
                            },
                            healthy
                              ? styles.progressHealthy
                              : styles.progressInfected,
                          ]}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⌕</Text>

              <Text style={styles.emptyTitle}>
                Tidak ada pemeriksaan
              </Text>

              <Text style={styles.emptyDescription}>
                {history.length === 0
                  ? "Belum ada hasil deteksi yang tersimpan untuk akun ini."
                  : "Coba kata kunci atau filter yang lain."}
              </Text>

              <Pressable
                onPress={() => {
                  setSearch("");
                  setFilter("Semua");
                  fetchHistory();
                }}
              >
                <Text style={styles.resetText}>
                  Muat ulang / reset pencarian
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => router.push("/detect")}
            style={styles.newCheckButton}
          >
            <Text style={styles.newCheckIcon}>＋</Text>

            <Text style={styles.newCheckText}>
              Pemeriksaan Baru
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            DATA AKTUAL · LETTUCECARE
          </Text>
        </ScrollView>

        {/* Modal detail pemeriksaan */}
        <Modal
          visible={selectedRecord !== null}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeHistoryDetail}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeHistoryDetail}
              accessibilityLabel="Tutup detail riwayat"
            />

            {selectedRecord && (
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalEyebrow}>
                      DETAIL PEMERIKSAAN
                    </Text>

                    <Text style={styles.modalTitle}>
                      {selectedRecord.disease}
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeHistoryDetail}
                    style={styles.modalCloseButton}
                    accessibilityLabel="Tutup"
                  >
                    <Text style={styles.modalCloseText}>×</Text>
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {selectedRecord.imageUrl &&
                  !failedImages.has(selectedRecord.id) ? (
                    <Image
                      source={{ uri: selectedRecord.imageUrl }}
                      style={styles.modalPlantImage}
                      resizeMode="cover"
                      onError={() =>
                        markImageFailed(selectedRecord.id)
                      }
                    />
                  ) : (
                    <View style={styles.modalImageFallback}>
                      <Text style={styles.modalFallbackIcon}>♣</Text>
                      <Text style={styles.modalFallbackText}>
                        {selectedRecord.imageUrl
                          ? "Foto gagal dimuat"
                          : "Foto tidak tersedia"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalInfoRow}>
                    <View
                      style={[
                        styles.modalStatusBadge,
                        selectedRecord.status === "Sehat"
                          ? styles.badgeHealthy
                          : styles.badgeInfected,
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeDot,
                          selectedRecord.status === "Sehat"
                            ? styles.dotHealthy
                            : styles.dotInfected,
                        ]}
                      />

                      <Text
                        style={[
                          styles.badgeText,
                          selectedRecord.status === "Sehat"
                            ? styles.badgeTextHealthy
                            : styles.badgeTextInfected,
                        ]}
                      >
                        {selectedRecord.status}
                      </Text>
                    </View>

                    <Text style={styles.modalDateText}>
                      {selectedRecord.date} · {selectedRecord.time}
                    </Text>
                  </View>

                  <View style={styles.accuracyPanel}>
                    <View style={styles.accuracyHeader}>
                      <Text style={styles.accuracyLabel}>
                        Akurasi AI
                      </Text>

                      <Text style={styles.accuracyValue}>
                        {selectedRecord.confidence}%
                      </Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.max(
                              0,
                              Math.min(selectedRecord.confidence, 100)
                            )}%`,
                          },
                          selectedRecord.status === "Sehat"
                            ? styles.progressHealthy
                            : styles.progressInfected,
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Penyebab
                    </Text>

                    <Text style={styles.modalBodyText}>
                      {selectedRecord.cause}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Saran penanganan
                    </Text>

                    {selectedRecord.treatment.length > 0 ? (
                      selectedRecord.treatment.map((text, index) => (
                        <View
                          key={`${selectedRecord.id}-treatment-${index}`}
                          style={styles.treatmentItem}
                        >
                          <View style={styles.treatmentNumber}>
                            <Text style={styles.treatmentNumberText}>
                              {index + 1}
                            </Text>
                          </View>

                          <Text style={styles.modalBodyText}>
                            {text}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.modalBodyText}>
                        Informasi penanganan belum tersedia.
                      </Text>
                    )}
                  </View>
                </ScrollView>

                <Pressable
                  onPress={closeHistoryDetail}
                  style={styles.modalDoneButton}
                >
                  <Text style={styles.modalDoneText}>
                    Tutup detail
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </Modal>

        {/* Navigasi bawah */}
        <View style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/home")}
          >
            <Text style={styles.navIcon}>⌂</Text>
            <Text style={styles.navText}>Beranda</Text>
          </Pressable>

          <View style={styles.navItem}>
            <View style={styles.activeNavIconBox}>
              <Text style={styles.navIconActive}>◷</Text>
            </View>

            <Text style={styles.navTextActive}>Riwayat</Text>
          </View>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.navIcon}>♙</Text>
            <Text style={styles.navText}>Profil</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F9F3",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F9F3",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E6EFDF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  backIcon: {
    color: "#245B3A",
    fontSize: 34,
    lineHeight: 38,
    marginTop: -4,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#6E9276",
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: "#204F36",
  },
  subtitle: {
    fontSize: 12,
    color: "#718174",
    lineHeight: 18,
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: "#235E3D",
    borderRadius: 24,
    padding: 22,
    marginBottom: 22,
    overflow: "hidden",
  },
  summaryLabel: {
    color: "#C8E0C8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  summaryMain: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 5,
  },
  totalNumber: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.5,
  },
  totalLabel: {
    color: "#D6E8D5",
    fontSize: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 16,
  },
  summaryStats: {
    flexDirection: "row",
    gap: 32,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  statDotHealthy: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#A9D998",
  },
  statDotInfected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F2B7A5",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: "#D5E5D4",
    fontSize: 11,
    marginTop: 2,
  },
  decorCircle: {
    position: "absolute",
    width: 155,
    height: 155,
    borderRadius: 78,
    right: -55,
    top: -70,
    borderWidth: 24,
    borderColor: "rgba(255,255,255,0.06)",
  },
  searchBox: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4EAE0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 25,
  },
  searchIcon: {
    color: "#6D8D73",
    fontSize: 27,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#254F37",
    fontSize: 13,
    paddingVertical: 8,
  },
  clearSearch: {
    color: "#66816D",
    fontSize: 25,
    paddingHorizontal: 5,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#244E36",
    letterSpacing: -0.4,
  },
  resultCount: {
    fontSize: 11,
    color: "#829185",
  },
  filterRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 17,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DCE6D9",
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#286B43",
    borderColor: "#286B43",
  },
  filterText: {
    color: "#667C6B",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8EDE5",
    gap: 13,
  },
  thumb: {
    width: 78,
    height: 104,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  thumbHealthy: {
    backgroundColor: "#E5F1DF",
  },
  thumbInfected: {
    backgroundColor: "#F8E9E2",
  },
  thumbFallback: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLeaf: {
    color: "#397849",
    fontSize: 39,
    fontWeight: "700",
  },
  thumbCaption: {
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#6D8971",
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  diseaseName: {
    flex: 1,
    color: "#234B34",
    fontSize: 14,
    fontWeight: "800",
  },
  chevron: {
    color: "#9AAA9A",
    fontSize: 24,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 5,
  },
  badgeHealthy: {
    backgroundColor: "#E8F4E5",
  },
  badgeInfected: {
    backgroundColor: "#FBEDE7",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotHealthy: {
    backgroundColor: "#39834A",
  },
  dotInfected: {
    backgroundColor: "#C96C51",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextHealthy: {
    color: "#367546",
  },
  badgeTextInfected: {
    color: "#B75E45",
  },
  dateText: {
    color: "#8A978C",
    fontSize: 10,
    marginTop: 8,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  confidenceLabel: {
    color: "#829085",
    fontSize: 10,
  },
  confidenceValue: {
    color: "#315E3E",
    fontSize: 11,
    fontWeight: "800",
  },
  progressTrack: {
    height: 5,
    borderRadius: 5,
    backgroundColor: "#EDF0EA",
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressHealthy: {
    backgroundColor: "#60A66A",
  },
  progressInfected: {
    backgroundColor: "#D18A6D",
  },
  messageBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6ECE2",
    gap: 12,
  },
  messageText: {
    color: "#667C6B",
    fontSize: 13,
    textAlign: "center",
  },
  errorTitle: {
    color: "#B75E45",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#286B43",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 15,
    marginTop: 5,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6ECE2",
  },
  emptyIcon: {
    fontSize: 38,
    color: "#90A895",
  },
  emptyTitle: {
    color: "#244E36",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyDescription: {
    color: "#849187",
    fontSize: 12,
    textAlign: "center",
    marginTop: 7,
    lineHeight: 18,
  },
  resetText: {
    color: "#34764A",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  newCheckButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: "#286B43",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginTop: 22,
  },
  newCheckIcon: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "500",
  },
  newCheckText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    textAlign: "center",
    color: "#9AA99A",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 23,
  },
  bottomNav: {
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E6ECE3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  navIcon: {
    color: "#93A397",
    fontSize: 25,
  },
  activeNavIconBox: {
    width: 37,
    height: 29,
    borderRadius: 13,
    backgroundColor: "#E8F2E3",
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: {
    color: "#286B43",
    fontSize: 23,
    fontWeight: "700",
  },
  navText: {
    color: "#8A998D",
    fontSize: 10,
  },
  navTextActive: {
    color: "#286B43",
    fontSize: 10,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 35, 24, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "92%",
    backgroundColor: "#F8FAF5",
    borderRadius: 26,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E3EBDD",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  modalEyebrow: {
    color: "#7A987F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 5,
  },
  modalTitle: {
    color: "#204F36",
    fontSize: 22,
    fontWeight: "800",
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#E7F0E2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "#286B43",
    fontSize: 28,
    lineHeight: 31,
    marginTop: -2,
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  modalPlantImage: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    backgroundColor: "#EAF1E6",
    marginBottom: 14,
  },
  modalImageFallback: {
    height: 125,
    borderRadius: 18,
    backgroundColor: "#EAF1E6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalFallbackIcon: {
    fontSize: 36,
    color: "#6D9473",
  },
  modalFallbackText: {
    color: "#728575",
    fontSize: 12,
    marginTop: 4,
  },
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 13,
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  modalDateText: {
    color: "#7D8D7F",
    fontSize: 11,
  },
  accuracyPanel: {
    backgroundColor: "#EDF4E9",
    borderRadius: 16,
    padding: 14,
    marginBottom: 17,
  },
  accuracyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  accuracyLabel: {
    color: "#718674",
    fontSize: 11,
    fontWeight: "600",
  },
  accuracyValue: {
    color: "#245B3A",
    fontSize: 26,
    fontWeight: "800",
  },
  modalSection: {
    marginBottom: 17,
  },
  modalSectionTitle: {
    color: "#244E36",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  modalBodyText: {
    color: "#66766A",
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  treatmentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  treatmentNumber: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "#E5F0E0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  treatmentNumberText: {
    color: "#286B43",
    fontSize: 11,
    fontWeight: "800",
  },
  modalDoneButton: {
    backgroundColor: "#286B43",
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  modalDoneText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
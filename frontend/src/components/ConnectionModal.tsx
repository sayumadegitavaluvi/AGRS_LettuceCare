import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";

type ConnectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
};

export default function ConnectionModal({
  visible,
  onClose,
  onRetry,
}: ConnectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>!</Text>
          </View>

          <Text style={styles.title}>
            Koneksi Terputus
          </Text>

          <Text style={styles.message}>
            Tidak dapat terhubung ke server.
            {"\n"}
            Periksa koneksi Wi-Fi atau paket data
            Anda, lalu coba lagi.
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={onRetry ?? onClose}
          >
            <Text style={styles.retryText}>
              Coba Lagi
            </Text>
          </Pressable>

          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>
              Tutup
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  modal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: "center",
    elevation: 12,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF3CD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  icon: {
    fontSize: 34,
    fontWeight: "900",
    color: "#D89B00",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1E6B3D",
    textAlign: "center",
    marginBottom: 12,
  },

  message: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: "#5A6B5F",
    textAlign: "center",
    marginBottom: 24,
  },

  retryButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#238B45",
    justifyContent: "center",
    alignItems: "center",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  closeButton: {
    marginTop: 12,
    paddingVertical: 8,
  },

  closeText: {
    color: "#238B45",
    fontSize: 15,
    fontWeight: "700",
  },
});
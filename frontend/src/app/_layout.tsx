import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import ConnectionModal from "../components/ConnectionModal";
import {
  setConnectionHandler,
} from "../utils/connection";

export default function RootLayout() {
  const [showConnectionError, setShowConnectionError] =
    useState(false);

  // =========================
  // Pantau koneksi HP
  // =========================

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(
      (state) => {
        if (state.isConnected === false) {
          setShowConnectionError(true);
        } else {
          setShowConnectionError(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // =========================
  // Terima error dari API
  // =========================

  useEffect(() => {
    setConnectionHandler(() => {
      setShowConnectionError(true);
    });

    return () => {
      setConnectionHandler(() => {});
    };
  }, []);

  // =========================
  // Coba koneksi lagi
  // =========================

  const handleRetryConnection = async () => {
    const state = await NetInfo.fetch();

    if (state.isConnected) {
      setShowConnectionError(false);
    }
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      <ConnectionModal
        visible={showConnectionError}
        onClose={() =>
          setShowConnectionError(false)
        }
        onRetry={handleRetryConnection}
      />
    </>
  );
}
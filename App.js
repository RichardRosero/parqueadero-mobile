// App.js — punto de entrada de la app movil
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { flushQueue } from "./src/services/offlineQueue";

export default function App() {
  useEffect(() => {
    // Cuando vuelve la conexion, se procesan los registros guardados
    // offline (seccion 4 del documento).
    const unsubscribe = NetInfo.addEventListener((estado) => {
      if (estado.isConnected) {
        flushQueue().catch(() => {});
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}

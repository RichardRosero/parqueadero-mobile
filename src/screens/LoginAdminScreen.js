// screens/LoginAdminScreen.js
// TODO real: reemplazar el formulario de email/password (solo para pruebas
// locales) por los botones nativos "Continuar con Google" / "Continuar con
// Apple" usando expo-auth-session o @react-native-google-signin/google-signin
// + expo-apple-authentication. Ver seccion 3 del documento.

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { mostrarAlerta } from "../utils/alerta";

export default function LoginAdminScreen({ navigation }) {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    setCargando(true);
    try {
      await loginAdmin(email, password);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo iniciar sesion");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Administrador</Text>
      <Text style={styles.nota}>
        Version de prueba: login con email/password. En produccion aqui van los botones de Google e iCloud.
      </Text>

      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? "Ingresando..." : "Ingresar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("LoginGuardia")}>
        <Text style={styles.link}>Soy operador →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#1F4E8C", marginBottom: 8 },
  nota: { color: "#666", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  link: { color: "#1F4E8C", textAlign: "center", marginTop: 20 },
});

// screens/LoginAdminScreen.js
// Login real con Google (ver src/services/googleAuth.js) + el formulario de
// email/password que sigue existiendo SOLO para pruebas locales (la cuenta
// demo admin@demo.com, ver CLAUDE.md — nunca se debe eliminar).

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useAuth } from "../context/AuthContext";
import { mostrarAlerta } from "../utils/alerta";
import { iniciarSesionGoogle } from "../services/googleAuth";

// Logo oficial de Google alojado por Google mismo (documentacion de Google
// Identity, pensado para botones "Sign in with Google") — se carga por URL,
// no hace falta ninguna libreria nueva ni recompilar la app.
const LOGO_GOOGLE = "https://developers.google.com/identity/images/g-logo.png";

export default function LoginAdminScreen({ navigation }) {
  const { loginAdmin, loginAdminGoogle } = useAuth();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

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

  async function handleLoginGoogle() {
    setCargandoGoogle(true);
    try {
      const idToken = await iniciarSesionGoogle();
      if (!idToken) return; // el usuario cerró el selector de cuenta de Google sin elegir ninguna
      await loginAdminGoogle(idToken);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo iniciar sesión con Google");
    } finally {
      setCargandoGoogle(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Administrador</Text>

      <TouchableOpacity style={styles.botonGoogle} onPress={handleLoginGoogle} disabled={cargandoGoogle}>
        <Image source={{ uri: LOGO_GOOGLE }} style={styles.logoGoogle} />
        <Text style={styles.botonGoogleTexto}>{cargandoGoogle ? "Conectando..." : "Continuar con Google"}</Text>
      </TouchableOpacity>

      <View style={styles.divisor}>
        <View style={styles.lineaDivisor} />
        <Text style={styles.notaDivisor}>o, solo para pruebas</Text>
        <View style={styles.lineaDivisor} />
      </View>

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
  titulo: { fontSize: 26, fontWeight: "bold", color: "#1F4E8C", marginBottom: 24, textAlign: "center" },
  botonGoogle: { flexDirection: "row", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  logoGoogle: { width: 18, height: 18, marginRight: 12 },
  botonGoogleTexto: { color: "#333", fontWeight: "bold" },
  divisor: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  lineaDivisor: { flex: 1, height: 1, backgroundColor: "#ddd" },
  notaDivisor: { color: "#999", fontSize: 12, marginHorizontal: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  link: { color: "#1F4E8C", textAlign: "center", marginTop: 20 },
});

// screens/LoginGuardiaScreen.js — login interno de operadores con usuario + contraseña (creados por el admin en Configuracion)
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { mostrarAlerta } from "../utils/alerta";

export default function LoginGuardiaScreen({ navigation }) {
  const { loginGuardia } = useAuth();
  const [codigoNegocio, setCodigoNegocio] = useState("");
  const [usuario, setUsuario] = useState("guardia1");
  const [password, setPassword] = useState("1234");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    if (!codigoNegocio.trim()) return mostrarAlerta("Falta el código de negocio", "Pídeselo al administrador que te creó como operador.");
    setCargando(true);
    try {
      await loginGuardia(codigoNegocio.trim(), usuario, password);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo iniciar sesion");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Operador</Text>
      <Text style={styles.nota}>Ingresa con el código de negocio, usuario y contraseña que te dio el administrador.</Text>

      <TextInput
        style={styles.input}
        placeholder="Código de negocio (ej. XYZ192)"
        value={codigoNegocio}
        onChangeText={(t) => setCodigoNegocio(t.toUpperCase())}
        autoCapitalize="characters"
      />
      <TextInput style={styles.input} placeholder="Usuario" value={usuario} onChangeText={setUsuario} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.boton} onPress={handleLogin} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? "Ingresando..." : "Ingresar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("LoginAdmin")}>
        <Text style={styles.link}>← Soy administrador</Text>
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

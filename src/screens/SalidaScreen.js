// screens/SalidaScreen.js — seccion 7: registro de salida
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";
import { simboloMoneda } from "../utils/moneda";
import { useAuth } from "../context/AuthContext";

export default function SalidaScreen({ navigation }) {
  const { sesion, sedes } = useAuth();
  const simbolo = simboloMoneda(sesion?.moneda || sedes.find((s) => s.id === sesion?.parqueaderoId)?.moneda);
  const [registroId, setRegistroId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function handleValidar() {
    setCargando(true);
    try {
      const res = await api.post("/registros/salida", {
        registro_id: registroId,
        codigo,
        metodo_notificacion_ticket: "ninguno",
      });
      setResultado(res.data);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo validar la salida");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registrar salida</Text>

      <TextInput style={styles.input} placeholder="ID del registro (o escanear QR)" value={registroId} onChangeText={setRegistroId} />
      <TextInput style={styles.input} placeholder="Código del cliente" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" />

      <TouchableOpacity style={styles.boton} onPress={handleValidar} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? "Calculando..." : "Calcular y abrir pluma"}</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={styles.resultado}>
          <Text style={styles.valorGrande}>{simbolo}{resultado.total}</Text>
          <Text style={styles.nota}>{resultado.detalle}</Text>
          {resultado.recargo > 0 && <Text style={styles.nota}>Incluye recargo de notificación: {simbolo}{resultado.recargo}</Text>}
          <Text style={styles.nota}>Pluma: {resultado.pluma?.ok ? "abierta ✅" : "no se pudo abrir (revisar webhook)"}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  resultado: { marginTop: 24, alignItems: "center", padding: 16, backgroundColor: "#DCE8F7", borderRadius: 8 },
  valorGrande: { fontSize: 36, fontWeight: "bold", color: "#1F4E8C" },
  nota: { color: "#444", marginTop: 4 },
});

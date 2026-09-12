// screens/PanicoScreen.js — seccion 12: boton de panico, auditoria inmutable
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";

const MOTIVOS = ["Pérdida de ticket/celular del cliente", "Fallo del sistema"];

export default function PanicoScreen({ navigation }) {
  const { sesion } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [placa, setPlaca] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleConfirmar() {
    if (!codigo || !placa) return mostrarAlerta("Faltan datos", "Código y placa son obligatorios.");
    setCargando(true);
    try {
      await api.post("/panico", {
        parqueadero_id: sesion.parqueaderoId,
        codigo_ingresado: codigo,
        motivo,
        placa,
      });
      mostrarAlerta("Registrado", "El uso del botón de pánico quedó guardado para auditoría.");
      navigation.goBack();
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo registrar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>⚠ Botón de pánico</Text>
      <Text style={styles.nota}>Usa esto solo si el sistema falló y tuviste que dejar salir un vehículo sin validación normal.</Text>

      <TextInput style={styles.input} placeholder="Código generado por el sistema" value={codigo} onChangeText={setCodigo} />
      <TextInput style={styles.input} placeholder="Placa del vehículo" value={placa} onChangeText={(t) => setPlaca(t.toUpperCase())} autoCapitalize="characters" />

      <Text style={styles.subtitulo}>Motivo:</Text>
      {MOTIVOS.map((m) => (
        <TouchableOpacity key={m} style={[styles.opcion, motivo === m && styles.opcionSeleccionada]} onPress={() => setMotivo(m)}>
          <Text>{m}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.boton} onPress={handleConfirmar} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? "Guardando..." : "Confirmar registro de pánico"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#B00020", marginBottom: 8 },
  nota: { color: "#666", marginBottom: 16 },
  subtitulo: { fontWeight: "bold", marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  opcion: { padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 8 },
  opcionSeleccionada: { borderColor: "#B00020", backgroundColor: "#FBE3E6" },
  boton: { backgroundColor: "#B00020", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
});

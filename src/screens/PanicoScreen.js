// screens/PanicoScreen.js — seccion 12: boton de panico, auditoria inmutable
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { simboloMoneda } from "../utils/moneda";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";

const MOTIVOS = ["Pérdida de ticket/celular del cliente", "Fallo del sistema"];

export default function PanicoScreen({ navigation }) {
  const { sesion, sedes } = useAuth();
  const simbolo = simboloMoneda(sesion?.moneda || sedes.find((s) => s.id === sesion?.parqueaderoId)?.moneda);
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [placa, setPlaca] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  async function handleConfirmar() {
    if (!placa) return mostrarAlerta("Falta la placa", "Escribe la placa del vehículo.");
    setCargando(true);
    setResultado(null);
    try {
      const res = await api.post("/panico", {
        parqueadero_id: sesion.parqueaderoId,
        motivo,
        placa,
      });
      setResultado(res.data);
      setPlaca("");
      mostrarAlerta(
        "Registrado",
        res.data.registroEncontrado
          ? "El vehículo quedó registrado como salido y esto quedó guardado para auditoría."
          : "No había un registro de esa placa (posible falla del sistema), pero quedó guardado para auditoría."
      );
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo registrar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>⚠ Botón de pánico</Text>
      <Text style={styles.nota}>Usa esto solo si el sistema falló o el cliente perdió su ticket, y tuviste que dejar salir el vehículo sin la validación normal.</Text>

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

      {resultado && resultado.valorCobrado != null && (
        <View style={styles.resultado}>
          <Text style={styles.valorGrande}>{simbolo}{resultado.valorCobrado}</Text>
          <Text style={styles.nota}>Valor cobrado (incluye multa si aplica)</Text>
        </View>
      )}
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
  resultado: { marginTop: 24, alignItems: "center", padding: 16, backgroundColor: "#FBE3E6", borderRadius: 8 },
  valorGrande: { fontSize: 32, fontWeight: "bold", color: "#B00020" },
});

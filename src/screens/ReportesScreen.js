// screens/ReportesScreen.js — seccion 10: reportes
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";
import { simboloMoneda } from "../utils/moneda";

export default function ReportesScreen() {
  const { sesion, sedes } = useAuth();
  const simbolo = simboloMoneda(sesion?.moneda || sedes.find((s) => s.id === sesion?.parqueaderoId)?.moneda);
  const [reporte, setReporte] = useState(null);

  async function cargarUltimaSemana() {
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - 7 * 24 * 60 * 60 * 1000);
    try {
      const res = await api.get(`/reportes/${sesion.parqueaderoId}`, {
        params: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      });
      setReporte(res.data);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo cargar el reporte");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Reportes</Text>

      <TouchableOpacity style={styles.boton} onPress={cargarUltimaSemana}>
        <Text style={styles.botonTexto}>Ver última semana</Text>
      </TouchableOpacity>

      {reporte && (
        <View style={styles.resultado}>
          <Text style={styles.fila}>Ingreso por parqueo: {simbolo}{reporte.ingresoParqueo}</Text>
          <Text style={styles.fila}>Recargo por notificación: {simbolo}{reporte.recargoNotificacion}</Text>
          <Text style={styles.filaTotal}>Total: {simbolo}{reporte.totalGeneral}</Text>
          <Text style={styles.nota}>{reporte.totalRegistros} vehículos atendidos</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  resultado: { marginTop: 24, padding: 16, backgroundColor: "#DCE8F7", borderRadius: 8 },
  fila: { fontSize: 16, marginBottom: 4 },
  filaTotal: { fontSize: 20, fontWeight: "bold", color: "#1F4E8C", marginTop: 8 },
  nota: { color: "#666", marginTop: 8 },
});

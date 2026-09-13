// screens/ReportesScreen.js — seccion 10: reportes y exportacion a PDF
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import * as Print from "expo-print";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";
import { simboloMoneda } from "../utils/moneda";

const TIPOS_REPORTE = [
  { id: "general", label: "Entradas y salidas" },
  { id: "panico", label: "Botón de pánico" },
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default function ReportesScreen() {
  const { sesion, sedes } = useAuth();
  const [sedeId, setSedeId] = useState(sesion?.parqueaderoId || sedes[0]?.id || null);
  const sede = sedes.find((s) => s.id === sedeId);
  const simbolo = simboloMoneda(sede?.moneda);

  const hoy = new Date();
  const [tipoReporte, setTipoReporte] = useState("general");
  const [diaDesde, setDiaDesde] = useState(String(hoy.getDate()));
  const [mesDesde, setMesDesde] = useState(String(hoy.getMonth() + 1));
  const [anioDesde, setAnioDesde] = useState(String(hoy.getFullYear()));
  const [diaHasta, setDiaHasta] = useState(String(hoy.getDate()));
  const [mesHasta, setMesHasta] = useState(String(hoy.getMonth() + 1));
  const [anioHasta, setAnioHasta] = useState(String(hoy.getFullYear()));

  const [generando, setGenerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [resultadoGeneral, setResultadoGeneral] = useState(null);
  const [resultadoPanico, setResultadoPanico] = useState(null);

  function construirRangoFechas() {
    const dd = parseInt(diaDesde, 10), md = parseInt(mesDesde, 10), ad = parseInt(anioDesde, 10);
    const dh = parseInt(diaHasta, 10), mh = parseInt(mesHasta, 10), ah = parseInt(anioHasta, 10);
    if ([dd, md, ad, dh, mh, ah].some((n) => isNaN(n))) return null;
    const desde = new Date(ad, md - 1, dd, 0, 0, 0);
    const hasta = new Date(ah, mh - 1, dh, 23, 59, 59);
    if (isNaN(desde.getTime()) || isNaN(hasta.getTime())) return null;
    return { desde, hasta };
  }

  function rangoTexto() {
    return `${diaDesde}/${mesDesde}/${anioDesde} - ${diaHasta}/${mesHasta}/${anioHasta}`;
  }

  async function handleGenerar() {
    if (!sedeId) return mostrarAlerta("Selecciona una sede");
    const rango = construirRangoFechas();
    if (!rango) return mostrarAlerta("Revisa las fechas", "Día, mes y año deben ser números válidos.");
    if (rango.desde > rango.hasta) return mostrarAlerta("La fecha 'desde' no puede ser después de 'hasta'");

    setGenerando(true);
    setResultadoGeneral(null);
    setResultadoPanico(null);
    try {
      if (tipoReporte === "general") {
        const res = await api.get(`/reportes/${sedeId}`, {
          params: { desde: rango.desde.toISOString(), hasta: rango.hasta.toISOString() },
        });
        setResultadoGeneral(res.data);
      } else {
        const res = await api.get(`/panico/${sedeId}`, {
          params: { desde: rango.desde.toISOString(), hasta: rango.hasta.toISOString() },
        });
        setResultadoPanico(res.data);
      }
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo generar el reporte");
    } finally {
      setGenerando(false);
    }
  }

  function construirHtmlGeneral() {
    const filas = (resultadoGeneral?.detalle || [])
      .map(
        (r) => `
      <tr>
        <td>${r.placa}</td>
        <td>${new Date(r.hora_entrada).toLocaleString()}</td>
        <td>${r.operador_entrada || "-"}</td>
        <td>${r.hora_salida ? new Date(r.hora_salida).toLocaleString() : "-"}</td>
        <td>${r.operador_salida || "-"}</td>
        <td>${simbolo}${round2((r.valor_parqueo || 0) + (r.recargo_notificacion || 0))}</td>
      </tr>`
      )
      .join("");

    return `<html><head><meta charset="utf-8" /><style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #DCE8F7; }
    </style></head><body>
      <h2>${sede?.nombre || "Sede"}</h2>
      <p>Periodo: ${rangoTexto()}</p>
      <table>
        <thead><tr><th>Placa</th><th>Entrada</th><th>Operador entrada</th><th>Salida</th><th>Operador salida</th><th>Valor cobrado</th></tr></thead>
        <tbody>${filas || `<tr><td colspan="6">Sin registros en este periodo.</td></tr>`}</tbody>
      </table>
      <p style="margin-top:16px; font-weight:bold;">Total general: ${simbolo}${resultadoGeneral?.totalGeneral ?? 0}</p>
    </body></html>`;
  }

  function construirHtmlPanico() {
    const filas = (resultadoPanico || [])
      .map(
        (r) => `
      <tr>
        <td>${new Date(r.creado_en).toLocaleString()}</td>
        <td>${r.placa}</td>
        <td>${r.motivo}</td>
        <td>${r.guardia_nombre || "-"}</td>
      </tr>`
      )
      .join("");

    return `<html><head><meta charset="utf-8" /><style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #FBE3E6; }
    </style></head><body>
      <h2>${sede?.nombre || "Sede"} — Botón de pánico</h2>
      <p>Periodo: ${rangoTexto()}</p>
      <table>
        <thead><tr><th>Fecha</th><th>Placa</th><th>Motivo</th><th>Operador</th></tr></thead>
        <tbody>${filas || `<tr><td colspan="4">Sin registros en este periodo.</td></tr>`}</tbody>
      </table>
    </body></html>`;
  }

  async function handleExportarPdf() {
    setExportando(true);
    try {
      const html = tipoReporte === "general" ? construirHtmlGeneral() : construirHtmlPanico();
      await Print.printAsync({ html });
    } catch (err) {
      mostrarAlerta("Error", err.message || "No se pudo exportar el reporte");
    } finally {
      setExportando(false);
    }
  }

  const hayResultado = (tipoReporte === "general" && resultadoGeneral) || (tipoReporte === "panico" && resultadoPanico);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Reportes</Text>

      {sedes.length > 1 && (
        <>
          <Text style={styles.subtitulo}>Sede:</Text>
          <View style={styles.filaChips}>
            {sedes.map((s) => (
              <TouchableOpacity key={s.id} style={[styles.chip, sedeId === s.id && styles.chipSeleccionado]} onPress={() => setSedeId(s.id)}>
                <Text style={sedeId === s.id ? styles.chipTextoSeleccionado : styles.chipTexto}>{s.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.subtitulo}>Tipo de reporte:</Text>
      <View style={styles.filaChips}>
        {TIPOS_REPORTE.map((t) => (
          <TouchableOpacity key={t.id} style={[styles.chip, tipoReporte === t.id && styles.chipSeleccionado]} onPress={() => setTipoReporte(t.id)}>
            <Text style={tipoReporte === t.id ? styles.chipTextoSeleccionado : styles.chipTexto}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitulo}>Desde:</Text>
      <View style={styles.filaFecha}>
        <TextInput style={[styles.input, styles.inputFecha]} placeholder="DD" value={diaDesde} onChangeText={setDiaDesde} keyboardType="number-pad" maxLength={2} />
        <TextInput style={[styles.input, styles.inputFecha]} placeholder="MM" value={mesDesde} onChangeText={setMesDesde} keyboardType="number-pad" maxLength={2} />
        <TextInput style={[styles.input, styles.inputFechaAnio]} placeholder="AAAA" value={anioDesde} onChangeText={setAnioDesde} keyboardType="number-pad" maxLength={4} />
      </View>

      <Text style={styles.subtitulo}>Hasta:</Text>
      <View style={styles.filaFecha}>
        <TextInput style={[styles.input, styles.inputFecha]} placeholder="DD" value={diaHasta} onChangeText={setDiaHasta} keyboardType="number-pad" maxLength={2} />
        <TextInput style={[styles.input, styles.inputFecha]} placeholder="MM" value={mesHasta} onChangeText={setMesHasta} keyboardType="number-pad" maxLength={2} />
        <TextInput style={[styles.input, styles.inputFechaAnio]} placeholder="AAAA" value={anioHasta} onChangeText={setAnioHasta} keyboardType="number-pad" maxLength={4} />
      </View>

      <TouchableOpacity style={styles.boton} onPress={handleGenerar} disabled={generando}>
        <Text style={styles.botonTexto}>{generando ? "Generando..." : "Generar reporte"}</Text>
      </TouchableOpacity>

      {tipoReporte === "general" && resultadoGeneral && (
        <View style={styles.resultado}>
          <Text style={styles.fila}>Ingreso por parqueo: {simbolo}{resultadoGeneral.ingresoParqueo}</Text>
          <Text style={styles.fila}>Recargo por notificación: {simbolo}{resultadoGeneral.recargoNotificacion}</Text>
          <Text style={styles.filaTotal}>Total: {simbolo}{resultadoGeneral.totalGeneral}</Text>
          <Text style={styles.nota}>{resultadoGeneral.totalRegistros} vehículos atendidos</Text>
        </View>
      )}

      {tipoReporte === "panico" && resultadoPanico && (
        <View style={styles.resultado}>
          <Text style={styles.nota}>{resultadoPanico.length} registro(s) de pánico en este periodo</Text>
        </View>
      )}

      {hayResultado && (
        <TouchableOpacity style={styles.botonSecundario} onPress={handleExportarPdf} disabled={exportando}>
          <Text style={styles.botonSecundarioTexto}>{exportando ? "Abriendo..." : "Exportar / Imprimir PDF"}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  subtitulo: { fontWeight: "bold", marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  filaFecha: { flexDirection: "row", gap: 8, marginBottom: 8 },
  inputFecha: { flex: 1 },
  inputFechaAnio: { flex: 1.5 },
  filaChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 20 },
  chipSeleccionado: { borderColor: "#1F4E8C", backgroundColor: "#1F4E8C" },
  chipTexto: { color: "#333" },
  chipTextoSeleccionado: { color: "#fff", fontWeight: "bold" },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  botonSecundario: { borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 12 },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
  resultado: { marginTop: 24, padding: 16, backgroundColor: "#DCE8F7", borderRadius: 8 },
  fila: { fontSize: 16, marginBottom: 4 },
  filaTotal: { fontSize: 20, fontWeight: "bold", color: "#1F4E8C", marginTop: 8 },
  nota: { color: "#666", marginTop: 8 },
});

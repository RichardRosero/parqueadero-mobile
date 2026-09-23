// screens/SalidaScreen.js — seccion 7: registro de salida
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";
import { simboloMoneda } from "../utils/moneda";
import { useAuth } from "../context/AuthContext";
import { imprimirTicketSalida } from "../services/impresora";
import SelectorPais from "../components/SelectorPais";
import { normalizarNumeroLocal } from "../utils/paises";

const METODOS = [
  { id: "impresion", label: "Imprimir ticket", costo: "Gratis" },
  { id: "telegram", label: "Telegram", costo: "Gratis" },
  { id: "whatsapp", label: "WhatsApp", costo: "Con recargo" },
  { id: "sms", label: "SMS", costo: "Con recargo" },
  { id: "ninguno", label: "No enviar nada", costo: "" },
];

function formatearTiempo(minutosTotales) {
  const horas = Math.floor(minutosTotales / 60);
  const mins = minutosTotales % 60;
  return `${horas}h ${mins}min`;
}

export default function SalidaScreen({ navigation }) {
  const { sesion, sedes } = useAuth();
  const simbolo = simboloMoneda(sesion?.moneda || sedes.find((s) => s.id === sesion?.parqueaderoId)?.moneda);
  const [placa, setPlaca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [salidaConfirmada, setSalidaConfirmada] = useState(false);
  const [metodo, setMetodo] = useState("ninguno");
  const [codigoPais, setCodigoPais] = useState("+593");
  const [destino, setDestino] = useState("");
  const [qrTelegram, setQrTelegram] = useState(null);

  useEffect(() => {
    const sede = sedes.find((s) => s.id === sesion?.parqueaderoId);
    if (sede?.codigo_region) setCodigoPais(sede.codigo_region);
  }, [sesion?.parqueaderoId, sedes]);

  async function handleCalcular() {
    if (!placa) return mostrarAlerta("Falta la placa");
    if (!codigo) return mostrarAlerta("Falta el código");
    setCalculando(true);
    setResultado(null);
    setSalidaConfirmada(false);
    setQrTelegram(null);
    try {
      const res = await api.post("/registros/salida/calcular", {
        parqueadero_id: sesion.parqueaderoId,
        placa,
        codigo,
      });
      setResultado(res.data);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo calcular la salida");
    } finally {
      setCalculando(false);
    }
  }

  // Se llama solo despues de que el operador ya cobro por fuera de la app
  // (efectivo, transferencia, etc.). Cierra el registro. Abrir la pluma es
  // un boton aparte, reservado para mas adelante.
  async function handleSalir() {
    setSaliendo(true);
    try {
      const res = await api.post("/registros/salida/confirmar", {
        parqueadero_id: sesion.parqueaderoId,
        placa,
        codigo,
        metodo_notificacion_ticket: metodo,
        destino_notificacion: (metodo === "whatsapp" || metodo === "sms") ? `${codigoPais}${normalizarNumeroLocal(destino)}` : destino,
      });
      setResultado(res.data);
      setSalidaConfirmada(true);

      if (metodo === "impresion") {
        try {
          await imprimirTicketSalida({
            nombreSede: sedes.find((s) => s.id === sesion.parqueaderoId)?.nombre,
            placa,
            horaEntrada: res.data.horaEntrada,
            horaSalida: res.data.horaSalida,
            tiempoTexto: formatearTiempo(res.data.minutosTotales),
            valor: res.data.total,
            simbolo,
          });
        } catch (err) {
          mostrarAlerta("No se pudo imprimir", `${err.message} La salida ya quedó registrada de todas formas.`);
        }
      } else if (metodo === "telegram") {
        if (res.data.notificacion?.qrTelegram) {
          setQrTelegram(res.data.notificacion.qrTelegram);
        } else {
          mostrarAlerta("Telegram no está configurado", "Falta configurar el bot de Telegram del negocio. La salida ya quedó registrada igual.");
        }
      }

      mostrarAlerta("Salida registrada", "El vehículo ya quedó registrado como salido.");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo registrar la salida");
    } finally {
      setSaliendo(false);
    }
  }

  function handleNuevaSalida() {
    setPlaca("");
    setCodigo("");
    setResultado(null);
    setSalidaConfirmada(false);
    setMetodo("ninguno");
    setDestino("");
    setQrTelegram(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Registrar salida</Text>

      <TextInput style={styles.input} placeholder="Placa" value={placa} onChangeText={(t) => setPlaca(t.toUpperCase())} autoCapitalize="characters" editable={!salidaConfirmada} />
      <TextInput style={styles.input} placeholder="Código del cliente" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" editable={!salidaConfirmada} />

      {!salidaConfirmada && (
        <TouchableOpacity style={styles.boton} onPress={handleCalcular} disabled={calculando}>
          <Text style={styles.botonTexto}>{calculando ? "Calculando..." : "Calcular"}</Text>
        </TouchableOpacity>
      )}

      {resultado && (
        <View style={styles.resultado}>
          <Text style={styles.valorGrande}>{simbolo}{resultado.total}</Text>
          <Text style={styles.nota}>{resultado.detalle}</Text>
          {resultado.recargo > 0 && <Text style={styles.nota}>Incluye recargo de notificación: {simbolo}{resultado.recargo}</Text>}
          <View style={styles.divisorResultado} />
          <Text style={styles.notaTiempo}>Entrada: {new Date(resultado.horaEntrada).toLocaleString()}</Text>
          <Text style={styles.notaTiempo}>Salida: {new Date(resultado.horaSalida).toLocaleString()}</Text>
          <Text style={styles.notaTiempo}>Tiempo total: {formatearTiempo(resultado.minutosTotales)}</Text>
        </View>
      )}

      {resultado && !salidaConfirmada && (
        <>
          <Text style={styles.notaAviso}>Cobra el valor por fuera de la app; cuando el pago esté confirmado, toca "Salir".</Text>

          <Text style={styles.subtitulo}>Entregar comprobante de salida por:</Text>
          {METODOS.map((m) => (
            <TouchableOpacity key={m.id} style={[styles.opcion, metodo === m.id && styles.opcionSeleccionada]} onPress={() => setMetodo(m.id)}>
              <Text>{m.label}</Text>
              <Text style={styles.costo}>{m.costo}</Text>
            </TouchableOpacity>
          ))}

          {(metodo === "whatsapp" || metodo === "sms") && (
            <>
              <View style={styles.filaTelefono}>
                <SelectorPais value={codigoPais} onChange={setCodigoPais} />
                <TextInput style={[styles.input, styles.inputTelefono]} placeholder="Número del cliente" value={destino} onChangeText={setDestino} keyboardType="phone-pad" />
              </View>
              <Text style={styles.notaTelefono}>Puedes escribirlo con o sin el 0 inicial, se ajusta solo.</Text>
            </>
          )}

          <TouchableOpacity style={styles.botonSalir} onPress={handleSalir} disabled={saliendo}>
            <Text style={styles.botonTexto}>{saliendo ? "Registrando..." : "Salir"}</Text>
          </TouchableOpacity>
        </>
      )}

      {qrTelegram && (
        <View style={styles.bloqueQr}>
          <Text style={styles.subtitulo}>Recibir comprobante por Telegram</Text>
          <Text style={styles.nota}>Pídele al cliente que escanee este código con la cámara de su celular.</Text>
          <Image source={{ uri: qrTelegram }} style={styles.imagenQr} />
        </View>
      )}

      {salidaConfirmada && (
        <TouchableOpacity style={styles.botonSecundario} onPress={handleNuevaSalida}>
          <Text style={styles.botonSecundarioTexto}>Registrar otra salida</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  subtitulo: { fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  botonSalir: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonSecundario: { borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
  resultado: { marginTop: 24, alignItems: "center", padding: 16, backgroundColor: "#DCE8F7", borderRadius: 8 },
  valorGrande: { fontSize: 36, fontWeight: "bold", color: "#1F4E8C" },
  nota: { color: "#444", marginTop: 4, textAlign: "center" },
  notaAviso: { color: "#666", fontSize: 13, marginTop: 12, textAlign: "center" },
  divisorResultado: { borderTopWidth: 1, borderColor: "#c3d5ec", marginVertical: 8, width: "100%" },
  notaTiempo: { color: "#1F4E8C", fontSize: 13 },
  opcion: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 8 },
  opcionSeleccionada: { borderColor: "#1F4E8C", backgroundColor: "#DCE8F7" },
  costo: { color: "#666", fontSize: 12 },
  filaTelefono: { flexDirection: "row" },
  inputTelefono: { flex: 1, height: 50, marginBottom: 0 },
  notaTelefono: { color: "#999", fontSize: 12, marginTop: 4, marginBottom: 12 },
  bloqueQr: { alignItems: "center", marginTop: 20 },
  imagenQr: { width: 200, height: 200, marginVertical: 16 },
});

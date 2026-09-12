// screens/EntradaScreen.js — seccion 7: registro de entrada + metodo de entrega
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { ejecutarOEncolar } from "../services/offlineQueue";
import api from "../services/api";
import { mostrarAlerta } from "../utils/alerta";
import { simboloMoneda } from "../utils/moneda";
import { imprimirTicket } from "../services/impresora";

const METODOS = [
  { id: "impresion", label: "Imprimir ticket", costo: "Gratis" },
  { id: "telegram", label: "Telegram", costo: "Gratis" },
  { id: "link", label: "Enlace web", costo: "Gratis" },
  { id: "whatsapp", label: "WhatsApp", costo: "Con recargo" },
  { id: "sms", label: "SMS", costo: "Con recargo" },
];

export default function EntradaScreen({ navigation }) {
  const { sesion, sedes } = useAuth();
  const simbolo = simboloMoneda(sesion?.moneda || sedes.find((s) => s.id === sesion?.parqueaderoId)?.moneda);
  const [placa, setPlaca] = useState("");
  const [tipos, setTipos] = useState([]);
  const [tipoVehiculoId, setTipoVehiculoId] = useState("");
  const [metodo, setMetodo] = useState("impresion");
  const [destino, setDestino] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarTipos = useCallback(async () => {
    if (!sesion?.parqueaderoId) return;
    try {
      const res = await api.get(`/vehiculos/tipos/${sesion.parqueaderoId}`);
      setTipos(res.data);
      if (res.data.length === 1) setTipoVehiculoId(res.data[0].id);
    } catch {
      // sin conexion: se queda con lo ultimo cargado (o vacio)
    }
  }, [sesion?.parqueaderoId]);

  useEffect(() => { cargarTipos(); }, [cargarTipos]);

  async function handleRegistrar() {
    if (!placa) return mostrarAlerta("Falta la placa");
    if (!tipoVehiculoId) return mostrarAlerta("Falta el tipo de vehículo", "Selecciona un tipo de vehículo antes de continuar.");
    setCargando(true);
    try {
      const { encolado, respuesta } = await ejecutarOEncolar({
        metodo: "post",
        url: "/registros/entrada",
        datos: {
          parqueadero_id: sesion.parqueaderoId,
          placa,
          tipo_vehiculo_id: tipoVehiculoId || null,
          metodo_notificacion: metodo,
          destino_notificacion: destino,
        },
      });

      if (encolado) {
        mostrarAlerta("Sin conexión", "El registro se guardó localmente y se enviará cuando vuelva la señal.");
      } else {
        mostrarAlerta("Entrada registrada", `Código: ${respuesta.codigo}`);
        if (metodo === "impresion") {
          try {
            await imprimirTicket({
              nombreSede: sedes.find((s) => s.id === sesion.parqueaderoId)?.nombre,
              placa,
              tipoVehiculo: tipos.find((t) => t.id === tipoVehiculoId)?.nombre,
              codigo: respuesta.codigo,
              horaEntrada: new Date().toISOString(),
            });
          } catch (err) {
            mostrarAlerta("No se pudo imprimir", `${err.message} El registro de entrada ya quedó guardado de todas formas.`);
          }
        }
      }
      navigation.goBack();
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo registrar la entrada");
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Registrar entrada</Text>

      <TextInput style={styles.input} placeholder="Placa" value={placa} onChangeText={(t) => setPlaca(t.toUpperCase())} autoCapitalize="characters" />

      <Text style={styles.subtitulo}>Tipo de vehículo:</Text>
      {tipos.length === 0 && (
        <Text style={styles.nota}>No hay tipos de vehículo creados en esta sede. Pídele al administrador que cree uno en Configuración.</Text>
      )}
      {tipos.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.opcion, tipoVehiculoId === t.id && styles.opcionSeleccionada]}
          onPress={() => setTipoVehiculoId(t.id)}
        >
          <Text style={styles.tipoNombre}>{t.nombre}</Text>
          <Text style={styles.costo}>{simbolo}{t.tarifa_hora}/hora</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.subtitulo}>Entregar código por:</Text>
      {METODOS.map((m) => (
        <TouchableOpacity key={m.id} style={[styles.opcion, metodo === m.id && styles.opcionSeleccionada]} onPress={() => setMetodo(m.id)}>
          <Text>{m.label}</Text>
          <Text style={styles.costo}>{m.costo}</Text>
        </TouchableOpacity>
      ))}

      {metodo === "impresion" && (
        <View style={styles.bloqueImpresora}>
          <Text style={styles.nota}>
            Al confirmar, se abrirá el diálogo de impresión de tu celular para elegir la impresora (la misma que usas desde cualquier otra app).
          </Text>
        </View>
      )}

      {(metodo === "whatsapp" || metodo === "sms" || metodo === "telegram") && (
        <TextInput style={styles.input} placeholder="Número del cliente (con código de país)" value={destino} onChangeText={setDestino} keyboardType="phone-pad" />
      )}

      <TouchableOpacity style={styles.boton} onPress={handleRegistrar} disabled={cargando}>
        <Text style={styles.botonTexto}>{cargando ? "Registrando..." : "Confirmar entrada"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  subtitulo: { fontWeight: "bold", marginTop: 8, marginBottom: 8 },
  nota: { color: "#666", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  opcion: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 8 },
  opcionSeleccionada: { borderColor: "#1F4E8C", backgroundColor: "#DCE8F7" },
  costo: { color: "#666", fontSize: 12 },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  bloqueImpresora: { backgroundColor: "#DCE8F7", borderRadius: 8, padding: 12, marginBottom: 12 },
});

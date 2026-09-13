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
  const [placa, setPlaca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [salidaConfirmada, setSalidaConfirmada] = useState(false);

  async function handleCalcular() {
    if (!placa) return mostrarAlerta("Falta la placa");
    if (!codigo) return mostrarAlerta("Falta el código");
    setCalculando(true);
    setResultado(null);
    setSalidaConfirmada(false);
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
        metodo_notificacion_ticket: "ninguno",
      });
      setResultado(res.data);
      setSalidaConfirmada(true);
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
  }

  return (
    <View style={styles.container}>
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
        </View>
      )}

      {resultado && !salidaConfirmada && (
        <>
          <Text style={styles.notaAviso}>Cobra el valor por fuera de la app; cuando el pago esté confirmado, toca "Salir".</Text>
          <TouchableOpacity style={styles.botonSalir} onPress={handleSalir} disabled={saliendo}>
            <Text style={styles.botonTexto}>{saliendo ? "Registrando..." : "Salir"}</Text>
          </TouchableOpacity>
        </>
      )}

      {salidaConfirmada && (
        <TouchableOpacity style={styles.botonSecundario} onPress={handleNuevaSalida}>
          <Text style={styles.botonSecundarioTexto}>Registrar otra salida</Text>
        </TouchableOpacity>
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
  botonSalir: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonSecundario: { borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 16 },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
  resultado: { marginTop: 24, alignItems: "center", padding: 16, backgroundColor: "#DCE8F7", borderRadius: 8 },
  valorGrande: { fontSize: 36, fontWeight: "bold", color: "#1F4E8C" },
  nota: { color: "#444", marginTop: 4 },
  notaAviso: { color: "#666", fontSize: 13, marginTop: 12, textAlign: "center" },
});

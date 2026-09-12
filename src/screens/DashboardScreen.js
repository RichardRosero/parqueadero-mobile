// screens/DashboardScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function DashboardScreen({ navigation }) {
  const { sesion, sedes, logout, licenciaValida, seleccionarSede } = useAuth();
  const [vencimientos, setVencimientos] = useState([]);
  const [refrescando, setRefrescando] = useState(false);
  const esAdmin = sesion?.rol === "admin";
  const sedeActiva = sedes.find((s) => s.id === sesion?.parqueaderoId);

  const cargar = useCallback(async () => {
    if (!sesion?.parqueaderoId) return;
    try {
      const res = await api.get(`/vehiculos/vencimientos/${sesion.parqueaderoId}?dias=3`);
      setVencimientos(res.data);
    } catch {
      // sin conexion: se queda con lo ultimo cargado
    }
  }, [sesion]);

  useEffect(() => { cargar(); }, [cargar]);

  if (!licenciaValida) {
    return (
      <View style={styles.container}>
        <Text style={styles.tituloAlerta}>Suscripcion vencida</Text>
        <Text style={styles.nota}>
          Pasó el periodo de gracia sin conexión para validar la licencia. Conéctate a internet para renovar.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {sesion?.nombre}</Text>

      {esAdmin && (
        <View style={styles.sedeAviso}>
          {sedeActiva ? (
            <>
              <Text style={styles.sedeTexto}>Sede activa: {sedeActiva.nombre}</Text>
              {sedes.length > 1 && (
                <TouchableOpacity onPress={() => navigation.navigate("Configuracion")}>
                  <Text style={styles.linkSede}>Cambiar sede</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sedeTexto}>
                {sedes.length === 0 ? "Todavía no tienes ninguna sede creada." : "Selecciona una sede para operar."}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Configuracion")}>
                <Text style={styles.linkSede}>{sedes.length === 0 ? "Crear mi primera sede →" : "Elegir sede →"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Un operador con mas de una sede asignada elige aqui con cual va a
          trabajar (si solo tiene una, ya quedo seleccionada automaticamente
          al iniciar sesion). Configuracion sigue sin estar disponible para
          este rol, por eso el selector vive directo en el Dashboard. */}
      {!esAdmin && sedes.length > 1 && (
        <View style={styles.sedeAviso}>
          <Text style={styles.sedeTexto}>{sedeActiva ? `Sede activa: ${sedeActiva.nombre}` : "Selecciona una sede para operar."}</Text>
          <View style={styles.filaChipsSede}>
            {sedes.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chipSede, sesion?.parqueaderoId === s.id && styles.chipSedeSeleccionado]}
                onPress={() => seleccionarSede(s.id)}
              >
                <Text style={sesion?.parqueaderoId === s.id ? styles.chipSedeTextoSeleccionado : styles.chipSedeTexto}>{s.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.accionesFila}>
        <TouchableOpacity style={[styles.botonAccion, !sesion?.parqueaderoId && styles.botonDeshabilitado]} disabled={!sesion?.parqueaderoId} onPress={() => navigation.navigate("Entrada")}>
          <Text style={styles.botonAccionTexto}>Registrar entrada</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonAccion} onPress={() => navigation.navigate("Salida")}>
          <Text style={styles.botonAccionTexto}>Registrar salida</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.botonPanico, !sesion?.parqueaderoId && styles.botonDeshabilitado]} disabled={!sesion?.parqueaderoId} onPress={() => navigation.navigate("Panico")}>
        <Text style={styles.botonAccionTexto}>⚠ Botón de pánico</Text>
      </TouchableOpacity>

      {esAdmin && (
        <View style={styles.accionesFila}>
          <TouchableOpacity style={styles.botonSecundario} onPress={() => navigation.navigate("Configuracion")}>
            <Text style={styles.botonSecundarioTexto}>Configuración</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonSecundario} onPress={() => navigation.navigate("Reportes")}>
            <Text style={styles.botonSecundarioTexto}>Reportes</Text>
          </TouchableOpacity>
        </View>
      )}

      {!esAdmin && (
        <View style={styles.accionesFila}>
          <TouchableOpacity style={styles.botonSecundario} onPress={() => navigation.navigate("Reportes")}>
            <Text style={styles.botonSecundarioTexto}>Reportes</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.subtitulo}>Mensualidades por vencer (próximos 3 días)</Text>
      <FlatList
        data={vencimientos}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />}
        ListEmptyComponent={<Text style={styles.nota}>{sesion?.parqueaderoId ? "Nada por vencer, todo al día." : "Selecciona una sede para ver esta información."}</Text>}
        renderItem={({ item }) => (
          <View style={styles.filaVencimiento}>
            <Text style={styles.placa}>{item.placa}</Text>
            <Text style={styles.nota}>Vence: {new Date(item.plan_interno_vence).toLocaleDateString()}</Text>
          </View>
        )}
      />

      <TouchableOpacity onPress={logout}><Text style={styles.link}>Cerrar sesión</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  saludo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  tituloAlerta: { fontSize: 20, fontWeight: "bold", color: "#B00020" },
  sedeAviso: { backgroundColor: "#DCE8F7", borderRadius: 8, padding: 12, marginBottom: 16 },
  sedeTexto: { color: "#1F4E8C", fontWeight: "bold", marginBottom: 4 },
  linkSede: { color: "#1F4E8C", fontWeight: "bold" },
  filaChipsSede: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chipSede: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 20 },
  chipSedeSeleccionado: { backgroundColor: "#1F4E8C" },
  chipSedeTexto: { color: "#1F4E8C" },
  chipSedeTextoSeleccionado: { color: "#fff", fontWeight: "bold" },
  accionesFila: { flexDirection: "row", gap: 12, marginBottom: 12 },
  botonAccion: { flex: 1, backgroundColor: "#1F4E8C", borderRadius: 8, padding: 16, alignItems: "center" },
  botonDeshabilitado: { opacity: 0.4 },
  botonPanico: { backgroundColor: "#B00020", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 20 },
  botonAccionTexto: { color: "#fff", fontWeight: "bold" },
  botonSecundario: { flex: 1, borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center" },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
  subtitulo: { fontWeight: "bold", marginBottom: 8, color: "#333" },
  filaVencimiento: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" },
  placa: { fontWeight: "bold" },
  nota: { color: "#666" },
  link: { color: "#1F4E8C", textAlign: "center", marginTop: 20 },
});

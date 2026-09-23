// screens/DashboardScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import BotonAnimado from "../components/BotonAnimado";

export default function DashboardScreen({ navigation }) {
  const { sesion, sedes, logout, licenciaValida, seleccionarSede } = useAuth();
  const [vencimientos, setVencimientos] = useState([]);
  const [refrescando, setRefrescando] = useState(false);
  const [ocupacion, setOcupacion] = useState(null);
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

  // Ocupacion (total/ocupados/disponibles) de la sede activa, en vivo: se
  // consulta al entrar y luego cada 10s mientras esta pantalla este abierta,
  // asi el operador no tiene que salir y volver para ver el dato al dia.
  const cargarOcupacion = useCallback(async () => {
    if (!sesion?.parqueaderoId) return setOcupacion(null);
    try {
      const res = await api.get(`/parqueaderos/${sesion.parqueaderoId}/ocupacion`);
      setOcupacion(res.data);
    } catch {
      // sin conexion: se queda con lo ultimo cargado
    }
  }, [sesion?.parqueaderoId]);

  useEffect(() => {
    cargarOcupacion();
    const intervalo = setInterval(cargarOcupacion, 10000);
    return () => clearInterval(intervalo);
  }, [cargarOcupacion]);

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

      {sesion?.parqueaderoId && ocupacion && (
        <View style={styles.tarjetaOcupacion}>
          <View style={styles.filaOcupacion}>
            <Text style={styles.valorOcupacion}>{ocupacion.total ?? "—"}</Text>
            <Text style={styles.etiquetaOcupacion}>Total</Text>
          </View>
          <View style={styles.filaOcupacion}>
            <Text style={[styles.valorOcupacion, styles.valorOcupado]}>{ocupacion.ocupados}</Text>
            <Text style={styles.etiquetaOcupacion}>Ocupados</Text>
          </View>
          <View style={styles.filaOcupacion}>
            <Text style={[styles.valorOcupacion, styles.valorDisponible]}>{ocupacion.disponibles ?? "—"}</Text>
            <Text style={styles.etiquetaOcupacion}>Disponibles</Text>
          </View>
        </View>
      )}
      {sesion?.parqueaderoId && ocupacion && ocupacion.total == null && (
        <Text style={styles.notaOcupacion}>
          Configura los puestos totales de esta sede en Configuración para ver disponibles.
        </Text>
      )}

      <View style={styles.accionesFila}>
        <BotonAnimado style={[styles.botonAccion, !sesion?.parqueaderoId && styles.botonDeshabilitado]} disabled={!sesion?.parqueaderoId} onPress={() => navigation.navigate("Entrada")}>
          <Text style={styles.botonAccionTexto}>Registrar entrada</Text>
        </BotonAnimado>
        <BotonAnimado style={styles.botonAccion} onPress={() => navigation.navigate("Salida")}>
          <Text style={styles.botonAccionTexto}>Registrar salida</Text>
        </BotonAnimado>
      </View>

      <BotonAnimado style={[styles.botonPanico, !sesion?.parqueaderoId && styles.botonDeshabilitado]} disabled={!sesion?.parqueaderoId} onPress={() => navigation.navigate("Panico")}>
        <Text style={styles.botonAccionTexto}>⚠ Botón de pánico</Text>
      </BotonAnimado>

      {esAdmin && (
        <View style={styles.accionesFila}>
          <BotonAnimado style={styles.botonSecundario} onPress={() => navigation.navigate("Configuracion")}>
            <Text style={styles.botonSecundarioTexto}>Configuración</Text>
          </BotonAnimado>
          <BotonAnimado style={styles.botonSecundario} onPress={() => navigation.navigate("Reportes")}>
            <Text style={styles.botonSecundarioTexto}>Reportes</Text>
          </BotonAnimado>
        </View>
      )}

      {!esAdmin && (
        <View style={styles.accionesFila}>
          <BotonAnimado style={styles.botonSecundario} onPress={() => navigation.navigate("Reportes")}>
            <Text style={styles.botonSecundarioTexto}>Reportes</Text>
          </BotonAnimado>
        </View>
      )}

      <Text style={styles.subtitulo}>Mensualidades por vencer (próximos 3 días)</Text>
      <FlatList
        data={vencimientos}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await Promise.all([cargar(), cargarOcupacion()]); setRefrescando(false); }} />}
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
  container: { flex: 1, padding: 20, paddingTop: 28, backgroundColor: "#fff" },
  saludo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 24 },
  tituloAlerta: { fontSize: 20, fontWeight: "bold", color: "#B00020" },
  sedeAviso: { backgroundColor: "#DCE8F7", borderRadius: 8, padding: 14, marginBottom: 24 },
  sedeTexto: { color: "#1F4E8C", fontWeight: "bold", marginBottom: 4 },
  linkSede: { color: "#1F4E8C", fontWeight: "bold" },
  filaChipsSede: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chipSede: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 20 },
  chipSedeSeleccionado: { backgroundColor: "#1F4E8C" },
  chipSedeTexto: { color: "#1F4E8C" },
  chipSedeTextoSeleccionado: { color: "#fff", fontWeight: "bold" },
  tarjetaOcupacion: { flexDirection: "row", backgroundColor: "#F2F2F2", borderRadius: 8, marginBottom: 24, paddingVertical: 16 },
  filaOcupacion: { flex: 1, alignItems: "center" },
  valorOcupacion: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C" },
  valorOcupado: { color: "#B00020" },
  valorDisponible: { color: "#2E7D32" },
  etiquetaOcupacion: { color: "#666", fontSize: 12, marginTop: 2 },
  notaOcupacion: { color: "#999", fontSize: 12, textAlign: "center", marginBottom: 20 },
  accionesFila: { flexDirection: "row", gap: 12, marginBottom: 20 },
  botonAccion: { flex: 1, backgroundColor: "#1F4E8C", borderRadius: 8, padding: 16, alignItems: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  botonDeshabilitado: { opacity: 0.4 },
  botonPanico: { backgroundColor: "#B00020", borderRadius: 8, padding: 14, alignItems: "center", marginBottom: 28, elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  botonAccionTexto: { color: "#fff", fontWeight: "bold" },
  botonSecundario: { flex: 1, borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", backgroundColor: "#fff", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
  subtitulo: { fontWeight: "bold", marginBottom: 8, marginTop: 4, color: "#333" },
  filaVencimiento: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" },
  placa: { fontWeight: "bold" },
  nota: { color: "#666" },
  link: { color: "#1F4E8C", textAlign: "center", marginTop: 20 },
});

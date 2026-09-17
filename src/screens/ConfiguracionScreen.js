// screens/ConfiguracionScreen.js — seccion 5/6: sedes, tipos de vehiculo y tarifas
// Panel basico. Los tramos de la seccion 13 (planes) se administran igual,
// agregando mas pantallas con esta misma estructura cuando se necesiten.

import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { mostrarAlerta, confirmarAccion } from "../utils/alerta";
import { MONEDAS, simboloMoneda } from "../utils/moneda";
import { TIPOS_DEFAULT, MAX_TIPOS } from "../utils/tiposDefault";

let contadorKeyTipo = 0;
function tipoStagedDesde(t) {
  contadorKeyTipo += 1;
  return { key: `nuevo-${contadorKeyTipo}`, nombre: t.nombre, tarifa_hora: t.tarifa_hora, tarifa_fraccion: t.tarifa_fraccion };
}

export default function ConfiguracionScreen({ navigation }) {
  const { sesion, sedes, cargarSedes, seleccionarSede } = useAuth();
  // Si el admin todavia no tiene ninguna sede, el formulario de creacion
  // arranca visible: es lo unico que tiene sentido hacer en esta pantalla.
  const [mostrarFormularioSede, setMostrarFormularioSede] = useState(() => sedes.length === 0);
  const [nombreSede, setNombreSede] = useState("");
  const [monedaNuevaSede, setMonedaNuevaSede] = useState("USD");
  const [puestosNuevaSede, setPuestosNuevaSede] = useState("");
  const [creandoSede, setCreandoSede] = useState(false);
  const [cambiandoMoneda, setCambiandoMoneda] = useState(false);
  // La edicion de la sede activa (moneda, tipos, eliminar) queda oculta
  // hasta que el admin toca "Editar" junto a "Activa".
  const [mostrarEdicionSede, setMostrarEdicionSede] = useState(false);
  const [eliminandoSede, setEliminandoSede] = useState(false);

  // Multa por perdida de ticket/celular del cliente (se cobra junto con la
  // tarifa normal al usar el boton de panico con ese motivo, ver panico.js).
  const [multaPerdidaTicket, setMultaPerdidaTicket] = useState("");
  const [guardandoMulta, setGuardandoMulta] = useState(false);

  // Puestos totales de la sede activa (capacidad_maxima). Con esto el
  // Dashboard puede mostrar ocupados/disponibles en tiempo real.
  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [guardandoCapacidad, setGuardandoCapacidad] = useState(false);

  // Tipos de vehiculo de la sede que se esta creando (aun no existen en el
  // backend). Se precargan los 3 por defecto, editables, y se pueden
  // agregar hasta 2 mas o quitar los que no apliquen. "Crear sede" queda
  // bloqueado si esta lista queda vacia.
  const [tiposNuevaSede, setTiposNuevaSede] = useState(() => TIPOS_DEFAULT.map(tipoStagedDesde));
  const [nombreNuevoTipoStaged, setNombreNuevoTipoStaged] = useState("");
  const [horaNuevoTipoStaged, setHoraNuevoTipoStaged] = useState("");
  const [fraccionNuevoTipoStaged, setFraccionNuevoTipoStaged] = useState("");

  const sedeActiva = sedes.find((s) => s.id === sesion?.parqueaderoId);
  const simbolo = simboloMoneda(sedeActiva?.moneda);

  useEffect(() => {
    setMultaPerdidaTicket(sedeActiva ? String(sedeActiva.monto_multa_perdida_ticket ?? 0) : "");
  }, [sedeActiva?.id, sedeActiva?.monto_multa_perdida_ticket]);

  useEffect(() => {
    setCapacidadMaxima(sedeActiva?.capacidad_maxima != null ? String(sedeActiva.capacidad_maxima) : "");
  }, [sedeActiva?.id, sedeActiva?.capacidad_maxima]);

  const [tipos, setTipos] = useState([]);
  const [editandoId, setEditandoId] = useState(null); // id del tipo que se esta editando, o null si es uno nuevo
  const [nombre, setNombre] = useState("");
  const [tarifaHora, setTarifaHora] = useState("");
  const [tarifaFraccion, setTarifaFraccion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [eliminandoTipo, setEliminandoTipo] = useState(false);

  // --- Operadores: los crea el admin con usuario+contraseña y les asigna
  // 1 o mas sedes (nunca via login Google/Apple, ese es solo para el admin).
  const [operadores, setOperadores] = useState([]);
  const [mostrarFormularioOperador, setMostrarFormularioOperador] = useState(false);
  const [nombreOperador, setNombreOperador] = useState("");
  const [usuarioOperador, setUsuarioOperador] = useState("");
  const [passwordOperador, setPasswordOperador] = useState("");
  const [sedeIdsOperador, setSedeIdsOperador] = useState([]);
  const [creandoOperador, setCreandoOperador] = useState(false);

  const [editandoOperadorId, setEditandoOperadorId] = useState(null);
  const [nombreEdicionOperador, setNombreEdicionOperador] = useState("");
  const [usuarioEdicionOperador, setUsuarioEdicionOperador] = useState("");
  const [passwordEdicionOperador, setPasswordEdicionOperador] = useState("");
  const [sedeIdsEdicionOperador, setSedeIdsEdicionOperador] = useState([]);
  const [guardandoOperador, setGuardandoOperador] = useState(false);
  const [eliminandoOperadorId, setEliminandoOperadorId] = useState(null);

  const cargarTipos = useCallback(async () => {
    if (!sesion?.parqueaderoId) return setTipos([]);
    try {
      const res = await api.get(`/vehiculos/tipos/${sesion.parqueaderoId}`);
      setTipos(res.data);
    } catch {
      // sin conexion: se queda con lo ultimo cargado
    }
  }, [sesion?.parqueaderoId]);

  useEffect(() => { cargarTipos(); }, [cargarTipos]);

  const cargarOperadores = useCallback(async () => {
    try {
      const res = await api.get("/operadores");
      setOperadores(res.data);
    } catch {
      // sin conexion: se queda con lo ultimo cargado
    }
  }, []);

  useEffect(() => { cargarOperadores(); }, [cargarOperadores]);

  function handleToggleSedeOperador(sedeId) {
    setSedeIdsOperador((lista) => (lista.includes(sedeId) ? lista.filter((id) => id !== sedeId) : [...lista, sedeId]));
  }

  function handleToggleSedeEdicionOperador(sedeId) {
    setSedeIdsEdicionOperador((lista) => (lista.includes(sedeId) ? lista.filter((id) => id !== sedeId) : [...lista, sedeId]));
  }

  async function handleCrearOperador() {
    if (!nombreOperador.trim()) return mostrarAlerta("Falta el nombre del operador");
    if (!usuarioOperador.trim()) return mostrarAlerta("Falta el usuario de acceso");
    if (!passwordOperador || passwordOperador.length < 4) return mostrarAlerta("La contraseña debe tener al menos 4 caracteres");
    if (sedeIdsOperador.length === 0) return mostrarAlerta("Selecciona al menos una sede para el operador");

    setCreandoOperador(true);
    try {
      await api.post("/operadores", {
        nombre: nombreOperador.trim(),
        usuario: usuarioOperador.trim(),
        password: passwordOperador,
        sedeIds: sedeIdsOperador,
      });
      setNombreOperador(""); setUsuarioOperador(""); setPasswordOperador(""); setSedeIdsOperador([]);
      setMostrarFormularioOperador(false);
      await cargarOperadores();
      mostrarAlerta("Operador creado", "Ya puede iniciar sesión con su usuario y contraseña.");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo crear el operador");
    } finally {
      setCreandoOperador(false);
    }
  }

  function handleCancelarNuevoOperador() {
    setMostrarFormularioOperador(false);
    setNombreOperador(""); setUsuarioOperador(""); setPasswordOperador(""); setSedeIdsOperador([]);
  }

  function handleEditarOperador(op) {
    setEditandoOperadorId(op.id);
    setNombreEdicionOperador(op.nombre);
    setUsuarioEdicionOperador(op.usuario);
    setPasswordEdicionOperador("");
    setSedeIdsEdicionOperador(op.sedes.map((s) => s.id));
  }

  function handleCancelarEdicionOperador() {
    setEditandoOperadorId(null);
    setNombreEdicionOperador(""); setUsuarioEdicionOperador(""); setPasswordEdicionOperador(""); setSedeIdsEdicionOperador([]);
  }

  async function handleGuardarOperador() {
    if (!nombreEdicionOperador.trim()) return mostrarAlerta("Falta el nombre del operador");
    if (!usuarioEdicionOperador.trim()) return mostrarAlerta("Falta el usuario de acceso");
    if (passwordEdicionOperador && passwordEdicionOperador.length < 4) return mostrarAlerta("La contraseña debe tener al menos 4 caracteres");
    if (sedeIdsEdicionOperador.length === 0) return mostrarAlerta("Selecciona al menos una sede para el operador");

    setGuardandoOperador(true);
    try {
      await api.patch(`/operadores/${editandoOperadorId}`, {
        nombre: nombreEdicionOperador.trim(),
        usuario: usuarioEdicionOperador.trim(),
        password: passwordEdicionOperador || undefined,
        sedeIds: sedeIdsEdicionOperador,
      });
      mostrarAlerta("Actualizado", "Los datos del operador se guardaron.");
      handleCancelarEdicionOperador();
      await cargarOperadores();
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo guardar el operador");
    } finally {
      setGuardandoOperador(false);
    }
  }

  async function handleEliminarOperador(op) {
    const confirmado = await confirmarAccion(
      `¿Eliminar al operador "${op.nombre}"? Ya no podrá iniciar sesión, pero su historial de registros se conserva.`
    );
    if (!confirmado) return;

    setEliminandoOperadorId(op.id);
    try {
      await api.delete(`/operadores/${op.id}`);
      if (editandoOperadorId === op.id) handleCancelarEdicionOperador();
      await cargarOperadores();
      mostrarAlerta("Operador eliminado", `"${op.nombre}" ya no puede iniciar sesión.`);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo eliminar el operador");
    } finally {
      setEliminandoOperadorId(null);
    }
  }

  function handleActualizarTipoStaged(key, campo, valor) {
    setTiposNuevaSede((lista) => lista.map((t) => (t.key === key ? { ...t, [campo]: valor } : t)));
  }

  function handleQuitarTipoStaged(key) {
    setTiposNuevaSede((lista) => lista.filter((t) => t.key !== key));
  }

  function handleAgregarTipoStaged() {
    if (tiposNuevaSede.length >= MAX_TIPOS) return mostrarAlerta(`Ya tienes el máximo de ${MAX_TIPOS} tipos de vehículo.`);
    if (!nombreNuevoTipoStaged.trim()) return mostrarAlerta("Falta el nombre del tipo de vehículo");
    if (isNaN(parseFloat(horaNuevoTipoStaged)) || isNaN(parseFloat(fraccionNuevoTipoStaged))) {
      return mostrarAlerta("Las tarifas deben ser números válidos");
    }
    setTiposNuevaSede((lista) => [
      ...lista,
      tipoStagedDesde({ nombre: nombreNuevoTipoStaged.trim(), tarifa_hora: horaNuevoTipoStaged, tarifa_fraccion: fraccionNuevoTipoStaged }),
    ]);
    setNombreNuevoTipoStaged(""); setHoraNuevoTipoStaged(""); setFraccionNuevoTipoStaged("");
  }

  async function handleCrearSede() {
    if (!nombreSede.trim()) return mostrarAlerta("Falta el nombre de la sede");
    if (tiposNuevaSede.length === 0) return mostrarAlerta("Agrega al menos un tipo de vehículo antes de crear la sede");

    const tiposParaEnviar = [];
    for (const t of tiposNuevaSede) {
      const hora = parseFloat(t.tarifa_hora);
      const fraccion = parseFloat(t.tarifa_fraccion);
      if (!t.nombre.trim() || isNaN(hora) || isNaN(fraccion)) {
        return mostrarAlerta("Revisa los tipos de vehículo", `"${t.nombre || "(sin nombre)"}" tiene datos incompletos o tarifas inválidas.`);
      }
      tiposParaEnviar.push({ nombre: t.nombre.trim(), tarifa_hora: hora, tarifa_fraccion: fraccion });
    }

    let capacidad_maxima = null;
    if (puestosNuevaSede.trim()) {
      const n = parseInt(puestosNuevaSede, 10);
      if (isNaN(n) || n <= 0) return mostrarAlerta("Los puestos totales deben ser un número mayor a 0 (o déjalo vacío si no aplica)");
      capacidad_maxima = n;
    }

    const eraLaPrimeraSede = sedes.length === 0;
    setCreandoSede(true);
    try {
      const res = await api.post("/parqueaderos", { nombre: nombreSede.trim(), moneda: monedaNuevaSede, capacidad_maxima, tipos: tiposParaEnviar });
      setNombreSede("");
      setMonedaNuevaSede("USD");
      setPuestosNuevaSede("");
      setTiposNuevaSede(TIPOS_DEFAULT.map(tipoStagedDesde));
      setMostrarFormularioSede(false);
      await cargarSedes();
      await seleccionarSede(res.data.id);
      mostrarAlerta("Sede creada", "Ya puedes operar con esta sede.");
      if (eraLaPrimeraSede) navigation.navigate("Dashboard");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo crear la sede");
    } finally {
      setCreandoSede(false);
    }
  }

  function handleCancelarNuevaSede() {
    setMostrarFormularioSede(false);
    setNombreSede("");
    setMonedaNuevaSede("USD");
    setPuestosNuevaSede("");
    setTiposNuevaSede(TIPOS_DEFAULT.map(tipoStagedDesde));
  }

  async function handleCambiarMoneda(codigo) {
    if (!sedeActiva || codigo === sedeActiva.moneda) return;
    setCambiandoMoneda(true);
    try {
      await api.patch(`/parqueaderos/${sedeActiva.id}/config`, { moneda: codigo });
      await cargarSedes();
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo cambiar la moneda");
    } finally {
      setCambiandoMoneda(false);
    }
  }

  async function handleGuardarMulta() {
    if (!sedeActiva) return;
    const valor = parseFloat(multaPerdidaTicket);
    if (isNaN(valor) || valor < 0) return mostrarAlerta("La multa debe ser un número válido (0 o más)");

    setGuardandoMulta(true);
    try {
      await api.patch(`/parqueaderos/${sedeActiva.id}/config`, { monto_multa_perdida_ticket: valor });
      await cargarSedes();
      mostrarAlerta("Guardado", "Se actualizó la multa por pérdida de ticket.");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo guardar la multa");
    } finally {
      setGuardandoMulta(false);
    }
  }

  async function handleGuardarCapacidad() {
    if (!sedeActiva) return;
    const valor = parseInt(capacidadMaxima, 10);
    if (isNaN(valor) || valor <= 0) return mostrarAlerta("Los puestos totales deben ser un número mayor a 0");

    setGuardandoCapacidad(true);
    try {
      await api.patch(`/parqueaderos/${sedeActiva.id}/config`, { capacidad_maxima: valor });
      await cargarSedes();
      mostrarAlerta("Guardado", "Se actualizaron los puestos totales de la sede.");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo guardar los puestos totales");
    } finally {
      setGuardandoCapacidad(false);
    }
  }

  async function handleEliminarSede() {
    if (!sedeActiva) return;
    const confirmado = await confirmarAccion(
      `¿Eliminar "${sedeActiva.nombre}"? No se borra su historial, pero dejará de estar disponible para operar.`
    );
    if (!confirmado) return;

    setEliminandoSede(true);
    try {
      await api.delete(`/parqueaderos/${sedeActiva.id}`);
      setMostrarEdicionSede(false);
      await cargarSedes();
      mostrarAlerta("Sede eliminada", `"${sedeActiva.nombre}" ya no está disponible.`);
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo eliminar la sede");
    } finally {
      setEliminandoSede(false);
    }
  }

  function handleEditarTipo(tipo) {
    setEditandoId(tipo.id);
    setNombre(tipo.nombre);
    setTarifaHora(String(tipo.tarifa_hora));
    setTarifaFraccion(String(tipo.tarifa_fraccion));
  }

  function handleCancelarEdicion() {
    setEditandoId(null);
    setNombre(""); setTarifaHora(""); setTarifaFraccion("");
  }

  async function handleGuardarTipo() {
    if (!sesion?.parqueaderoId) return mostrarAlerta("Selecciona una sede primero");
    if (!nombre.trim()) return mostrarAlerta("Falta el nombre del tipo de vehículo");
    const hora = parseFloat(tarifaHora);
    const fraccion = parseFloat(tarifaFraccion);
    if (isNaN(hora) || isNaN(fraccion)) return mostrarAlerta("Las tarifas deben ser números válidos");

    setCargando(true);
    try {
      if (editandoId) {
        await api.patch(`/vehiculos/tipos/${editandoId}`, {
          nombre: nombre.trim(),
          tarifa_hora: hora,
          tarifa_fraccion: fraccion,
        });
        mostrarAlerta("Actualizado", "Tarifa del tipo de vehículo actualizada.");
      } else {
        await api.post("/vehiculos/tipos", {
          parqueadero_id: sesion.parqueaderoId,
          nombre: nombre.trim(),
          tarifa_hora: hora,
          tarifa_fraccion: fraccion,
        });
        mostrarAlerta("Guardado", "Tipo de vehículo creado.");
      }
      setEditandoId(null);
      setNombre(""); setTarifaHora(""); setTarifaFraccion("");
      await cargarTipos();
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminarTipo() {
    if (!editandoId) return;
    const confirmado = await confirmarAccion(`¿Eliminar el tipo de vehículo "${nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    setEliminandoTipo(true);
    try {
      await api.delete(`/vehiculos/tipos/${editandoId}`);
      handleCancelarEdicion();
      await cargarTipos();
      mostrarAlerta("Eliminado", "El tipo de vehículo se eliminó.");
    } catch (err) {
      mostrarAlerta("Error", err.response?.data?.error || "No se pudo eliminar el tipo de vehículo");
    } finally {
      setEliminandoTipo(false);
    }
  }

  const formularioNuevaSede = (
    <>
      <TextInput style={styles.input} placeholder="Nombre de la nueva sede" value={nombreSede} onChangeText={setNombreSede} />
      <Text style={styles.notaChica}>Moneda de la nueva sede:</Text>
      <View style={styles.filaChips}>
        {MONEDAS.map((m) => (
          <TouchableOpacity
            key={m.codigo}
            style={[styles.chip, monedaNuevaSede === m.codigo && styles.chipSeleccionado]}
            onPress={() => setMonedaNuevaSede(m.codigo)}
          >
            <Text style={monedaNuevaSede === m.codigo ? styles.chipTextoSeleccionado : styles.chipTexto}>{m.simbolo} {m.codigo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.notaChica}>Puestos totales de la nueva sede (déjalo vacío si no quieres llevar el control):</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 30"
        value={puestosNuevaSede}
        onChangeText={setPuestosNuevaSede}
        keyboardType="number-pad"
      />

      <Text style={styles.notaChica}>Tipos de vehículo de la nueva sede (necesitas al menos 1):</Text>
      {tiposNuevaSede.map((t) => (
        <View key={t.key} style={styles.filaTipoStaged}>
          <TextInput
            style={[styles.input, styles.inputNombreStaged]}
            placeholder="Nombre"
            value={t.nombre}
            onChangeText={(v) => handleActualizarTipoStaged(t.key, "nombre", v)}
          />
          <TextInput
            style={[styles.input, styles.inputTarifaStaged]}
            placeholder="$/hora"
            value={String(t.tarifa_hora)}
            onChangeText={(v) => handleActualizarTipoStaged(t.key, "tarifa_hora", v)}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, styles.inputTarifaStaged]}
            placeholder="$/fracción"
            value={String(t.tarifa_fraccion)}
            onChangeText={(v) => handleActualizarTipoStaged(t.key, "tarifa_fraccion", v)}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity onPress={() => handleQuitarTipoStaged(t.key)} style={styles.botonQuitar}>
            <Text style={styles.botonQuitarTexto}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {tiposNuevaSede.length === 0 && <Text style={styles.notaAlerta}>Agrega al menos un tipo de vehículo para poder crear la sede.</Text>}

      {tiposNuevaSede.length < MAX_TIPOS && (
        <View style={styles.filaTipoStaged}>
          <TextInput style={[styles.input, styles.inputNombreStaged]} placeholder="Nombre nuevo tipo" value={nombreNuevoTipoStaged} onChangeText={setNombreNuevoTipoStaged} />
          <TextInput style={[styles.input, styles.inputTarifaStaged]} placeholder="$/hora" value={horaNuevoTipoStaged} onChangeText={setHoraNuevoTipoStaged} keyboardType="decimal-pad" />
          <TextInput style={[styles.input, styles.inputTarifaStaged]} placeholder="$/fracción" value={fraccionNuevoTipoStaged} onChangeText={setFraccionNuevoTipoStaged} keyboardType="decimal-pad" />
          <TouchableOpacity onPress={handleAgregarTipoStaged} style={styles.botonAgregar}>
            <Text style={styles.botonAgregarTexto}>＋</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.boton} onPress={handleCrearSede} disabled={creandoSede || tiposNuevaSede.length === 0}>
        <Text style={styles.botonTexto}>{creandoSede ? "Creando..." : "Confirmar creación"}</Text>
      </TouchableOpacity>
    </>
  );

  // Un admin sin ninguna sede solo ve lo necesario para crear la primera:
  // nada de "Mis sedes", moneda o tipos de una sede activa que todavia no existe.
  if (sedes.length === 0) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Crea tu primera sede</Text>
        <Text style={styles.nota}>Necesitas al menos una sede para empezar a operar.</Text>
        {formularioNuevaSede}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Configuración del negocio</Text>

      {/* --- Gestión de la sede que ya tienes --- */}
      <Text style={styles.subtitulo}>Mis sedes</Text>
      {sedes.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.opcion, sesion?.parqueaderoId === s.id && styles.opcionSeleccionada]}
          onPress={() => { seleccionarSede(s.id); setMostrarEdicionSede(false); }}
        >
          <Text>{s.nombre}</Text>
          {sesion?.parqueaderoId === s.id && (
            <View style={styles.filaActivaAcciones}>
              <Text style={styles.costo}>Activa</Text>
              <TouchableOpacity onPress={() => setMostrarEdicionSede((v) => !v)}>
                <Text style={styles.linkEditar}>{mostrarEdicionSede ? "Ocultar" : "Editar"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {sedeActiva && mostrarEdicionSede && (
        <>
          <Text style={styles.notaChica}>Moneda de {sedeActiva.nombre}:</Text>
          <View style={styles.filaChips}>
            {MONEDAS.map((m) => (
              <TouchableOpacity
                key={m.codigo}
                style={[styles.chip, sedeActiva.moneda === m.codigo && styles.chipSeleccionado]}
                onPress={() => handleCambiarMoneda(m.codigo)}
                disabled={cambiandoMoneda}
              >
                <Text style={sedeActiva.moneda === m.codigo ? styles.chipTextoSeleccionado : styles.chipTexto}>{m.simbolo} {m.codigo}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.notaChica, styles.espacioArriba]}>
            Multa por pérdida de ticket/celular del cliente (se cobra junto con la tarifa normal al usar el botón de pánico con ese motivo; 0 = sin multa):
          </Text>
          <View style={styles.filaTipoStaged}>
            <TextInput
              style={[styles.input, styles.inputTarifaStaged]}
              placeholder="0"
              value={multaPerdidaTicket}
              onChangeText={setMultaPerdidaTicket}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.botonAgregar} onPress={handleGuardarMulta} disabled={guardandoMulta}>
              <Text style={styles.linkEditar}>{guardandoMulta ? "..." : "Guardar"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.notaChica, styles.espacioArriba]}>
            Puestos totales de {sedeActiva.nombre} (para que el operador vea disponibilidad en tiempo real; vacío = sin límite configurado):
          </Text>
          <View style={styles.filaTipoStaged}>
            <TextInput
              style={[styles.input, styles.inputTarifaStaged]}
              placeholder="Ej: 30"
              value={capacidadMaxima}
              onChangeText={setCapacidadMaxima}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.botonAgregar} onPress={handleGuardarCapacidad} disabled={guardandoCapacidad}>
              <Text style={styles.linkEditar}>{guardandoCapacidad ? "..." : "Guardar"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitulo, styles.espacioArriba]}>Tipos de vehículo de la sede activa</Text>
          {tipos.length > 0 && <Text style={styles.nota}>Toca un tipo para editar su tarifa.</Text>}
          {tipos.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.filaTipo, editandoId === t.id && styles.filaTipoSeleccionada]}
              onPress={() => handleEditarTipo(t)}
            >
              <Text style={styles.filaTipoNombre}>{t.nombre}</Text>
              <Text style={styles.nota}>{simbolo}{t.tarifa_hora}/hora · {simbolo}{t.tarifa_fraccion}/fracción</Text>
            </TouchableOpacity>
          ))}

          {!editandoId && tipos.length >= MAX_TIPOS ? (
            <Text style={[styles.nota, styles.espacioArriba]}>
              Ya tienes el máximo de {MAX_TIPOS} tipos de vehículo para esta sede ({tipos.length - 3} de 2 propios agregados).
            </Text>
          ) : (
            <>
              <Text style={[styles.subtitulo, styles.espacioArriba]}>{editandoId ? "Editar tipo de vehículo" : "Nuevo tipo de vehículo"}</Text>
              <TextInput style={styles.input} placeholder="Nombre del tipo de vehículo" value={nombre} onChangeText={setNombre} />
              <TextInput style={styles.input} placeholder="Tarifa por hora" value={tarifaHora} onChangeText={setTarifaHora} keyboardType="decimal-pad" />
              <TextInput style={styles.input} placeholder="Tarifa por fracción" value={tarifaFraccion} onChangeText={setTarifaFraccion} keyboardType="decimal-pad" />

              <TouchableOpacity style={styles.boton} onPress={handleGuardarTipo} disabled={cargando}>
                <Text style={styles.botonTexto}>{cargando ? "Guardando..." : editandoId ? "Guardar cambios" : "Guardar tipo de vehículo"}</Text>
              </TouchableOpacity>
              {editandoId && (
                <>
                  <TouchableOpacity style={styles.botonSecundario} onPress={handleCancelarEdicion} disabled={cargando || eliminandoTipo}>
                    <Text style={styles.botonSecundarioTexto}>Cancelar edición</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botonEliminar} onPress={handleEliminarTipo} disabled={cargando || eliminandoTipo}>
                    <Text style={styles.botonEliminarTexto}>{eliminandoTipo ? "Eliminando..." : "Eliminar tipo de vehículo"}</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.divisor} />
          <TouchableOpacity style={styles.botonEliminar} onPress={handleEliminarSede} disabled={eliminandoSede}>
            <Text style={styles.botonEliminarTexto}>{eliminandoSede ? "Eliminando..." : `Eliminar ${sedeActiva.nombre}`}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- Crear una sede nueva: al final, es la accion menos frecuente --- */}
      <View style={styles.divisor} />

      {!mostrarFormularioSede ? (
        <TouchableOpacity style={styles.botonSecundario} onPress={() => setMostrarFormularioSede(true)}>
          <Text style={styles.botonSecundarioTexto}>＋ Agregar sede</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.subtitulo}>Nueva sede</Text>
          {formularioNuevaSede}
          <TouchableOpacity style={styles.botonSecundario} onPress={handleCancelarNuevaSede} disabled={creandoSede}>
            <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- Operadores: el admin los crea con usuario+contraseña y les asigna
          1 o mas sedes. Ellos solo ven Entrada/Salida/Reportes/Pánico, nunca
          esta pantalla de Configuración. --- */}
      <View style={styles.divisor} />
      <Text style={styles.titulo}>Operadores</Text>
      <Text style={styles.nota}>
        Cada operador entra con su propio usuario y contraseña (tú se lo asignas aquí). Solo pueden
        registrar entradas/salidas, ver reportes y usar el botón de pánico en las sedes que le asignes.
      </Text>

      {operadores.length === 0 && <Text style={styles.nota}>Todavía no has creado ningún operador.</Text>}

      {operadores.map((op) => (
        <View key={op.id}>
          <TouchableOpacity
            style={[styles.opcion, editandoOperadorId === op.id && styles.opcionSeleccionada]}
            onPress={() => (editandoOperadorId === op.id ? handleCancelarEdicionOperador() : handleEditarOperador(op))}
          >
            <View>
              <Text>{op.nombre}</Text>
              <Text style={styles.nota}>usuario: {op.usuario} · sedes: {op.sedes.map((s) => s.nombre).join(", ") || "ninguna"}</Text>
            </View>
            <Text style={styles.linkEditar}>{editandoOperadorId === op.id ? "Ocultar" : "Editar"}</Text>
          </TouchableOpacity>

          {editandoOperadorId === op.id && (
            <View style={styles.espacioArriba}>
              <TextInput style={styles.input} placeholder="Nombre" value={nombreEdicionOperador} onChangeText={setNombreEdicionOperador} />
              <TextInput style={styles.input} placeholder="Usuario" value={usuarioEdicionOperador} onChangeText={setUsuarioEdicionOperador} autoCapitalize="none" />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña (dejar vacío para no cambiarla)"
                value={passwordEdicionOperador}
                onChangeText={setPasswordEdicionOperador}
                secureTextEntry
              />

              <Text style={styles.notaChica}>Sedes asignadas:</Text>
              <View style={styles.filaChips}>
                {sedes.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, sedeIdsEdicionOperador.includes(s.id) && styles.chipSeleccionado]}
                    onPress={() => handleToggleSedeEdicionOperador(s.id)}
                  >
                    <Text style={sedeIdsEdicionOperador.includes(s.id) ? styles.chipTextoSeleccionado : styles.chipTexto}>{s.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.boton} onPress={handleGuardarOperador} disabled={guardandoOperador}>
                <Text style={styles.botonTexto}>{guardandoOperador ? "Guardando..." : "Guardar cambios"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonEliminar} onPress={() => handleEliminarOperador(op)} disabled={eliminandoOperadorId === op.id}>
                <Text style={styles.botonEliminarTexto}>{eliminandoOperadorId === op.id ? "Eliminando..." : "Eliminar operador"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      <View style={styles.divisor} />
      {!mostrarFormularioOperador ? (
        <TouchableOpacity style={styles.botonSecundario} onPress={() => setMostrarFormularioOperador(true)}>
          <Text style={styles.botonSecundarioTexto}>＋ Agregar operador</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.subtitulo}>Nuevo operador</Text>
          <TextInput style={styles.input} placeholder="Nombre" value={nombreOperador} onChangeText={setNombreOperador} />
          <TextInput style={styles.input} placeholder="Usuario de acceso" value={usuarioOperador} onChangeText={setUsuarioOperador} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Contraseña" value={passwordOperador} onChangeText={setPasswordOperador} secureTextEntry />

          <Text style={styles.notaChica}>Sedes que puede operar:</Text>
          <View style={styles.filaChips}>
            {sedes.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, sedeIdsOperador.includes(s.id) && styles.chipSeleccionado]}
                onPress={() => handleToggleSedeOperador(s.id)}
              >
                <Text style={sedeIdsOperador.includes(s.id) ? styles.chipTextoSeleccionado : styles.chipTexto}>{s.nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.boton} onPress={handleCrearOperador} disabled={creandoOperador}>
            <Text style={styles.botonTexto}>{creandoOperador ? "Creando..." : "Crear operador"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonSecundario} onPress={handleCancelarNuevoOperador} disabled={creandoOperador}>
            <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1F4E8C", marginBottom: 16 },
  subtitulo: { fontWeight: "bold", marginBottom: 8 },
  espacioArriba: { marginTop: 24 },
  divisor: { borderTopWidth: 1, borderColor: "#eee", marginTop: 32, marginBottom: 16 },
  nota: { color: "#666", marginBottom: 8 },
  notaChica: { color: "#666", fontSize: 13, marginBottom: 8 },
  notaAlerta: { color: "#B00020", marginBottom: 8 },
  filaTipoStaged: { flexDirection: "row", gap: 6, alignItems: "center" },
  inputNombreStaged: { flex: 2 },
  inputTarifaStaged: { flex: 1 },
  botonQuitar: { paddingHorizontal: 10, paddingBottom: 12 },
  botonQuitarTexto: { color: "#B00020", fontSize: 18, fontWeight: "bold" },
  botonAgregar: { paddingHorizontal: 10, paddingBottom: 12 },
  botonAgregarTexto: { color: "#1F4E8C", fontSize: 18, fontWeight: "bold" },
  filaChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 20 },
  chipSeleccionado: { borderColor: "#1F4E8C", backgroundColor: "#1F4E8C" },
  chipTexto: { color: "#333" },
  chipTextoSeleccionado: { color: "#fff", fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  opcion: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 8 },
  opcionSeleccionada: { borderColor: "#1F4E8C", backgroundColor: "#DCE8F7" },
  costo: { color: "#1F4E8C", fontSize: 12, fontWeight: "bold" },
  filaActivaAcciones: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkEditar: { color: "#1F4E8C", fontSize: 12, fontWeight: "bold", textDecorationLine: "underline" },
  botonEliminar: { borderWidth: 1, borderColor: "#B00020", borderRadius: 8, padding: 12, alignItems: "center" },
  botonEliminarTexto: { color: "#B00020", fontWeight: "bold" },
  filaTipo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  filaTipoSeleccionada: { borderColor: "#1F4E8C", backgroundColor: "#DCE8F7" },
  filaTipoNombre: { fontWeight: "bold" },
  boton: { backgroundColor: "#1F4E8C", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  botonTexto: { color: "#fff", fontWeight: "bold" },
  botonSecundario: { borderWidth: 1, borderColor: "#1F4E8C", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 8 },
  botonSecundarioTexto: { color: "#1F4E8C", fontWeight: "bold" },
});

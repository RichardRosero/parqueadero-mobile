// context/AuthContext.js
// Maneja la sesion (admin o guardia) y cachea el ultimo estado de licencia
// conocido para poder operar offline con periodo de gracia (seccion 4).

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { registrarManejadorSesionInvalida } from "../services/api";
import { mostrarAlerta } from "../utils/alerta";

const AuthContext = createContext(null);

const HORAS_GRACIA_POR_DEFECTO = 60; // igual al default del backend, ver db.js

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null); // { token, rol, nombre, parqueaderoId }
  const [sedes, setSedes] = useState([]); // sedes del negocio, solo relevante para el rol admin
  const [sedesListas, setSedesListas] = useState(false); // true una vez que sabemos con certeza cuantas sedes tiene el admin (evita decidir la pantalla inicial con datos a medio cargar)
  const [licenciaValida, setLicenciaValida] = useState(true);
  const [cargando, setCargando] = useState(true);

  const sesionRef = useRef(null);
  useEffect(() => { sesionRef.current = sesion; }, [sesion]);

  useEffect(() => {
    restaurarSesion();
    // Si el backend rechaza el token (sesion vencida, o datos que ya no
    // existen del lado del servidor), forzamos un logout limpio con un
    // aviso claro en vez de dejar al usuario viendo un error crudo.
    registrarManejadorSesionInvalida(() => {
      if (sesionRef.current) {
        mostrarAlerta("Sesión finalizada", "Tu sesión ya no es válida. Inicia sesión de nuevo.");
        logout();
      }
    });
  }, []);

  async function restaurarSesion() {
    const raw = await AsyncStorage.getItem("sesion");
    if (raw) {
      const datos = JSON.parse(raw);
      setSesion(datos);
      await validarLicenciaCacheada();
      if (datos.rol === "admin" || datos.rol === "guardia") await cargarSedes(datos);
    }
    setCargando(false);
  }

  async function loginAdmin(email, password) {
    const res = await api.post("/auth/admin/login", { email, password });
    const datos = await guardarSesion({ token: res.data.token, rol: "admin", nombre: res.data.negocio.nombre, parqueaderoId: null });
    await cachearEstadoLicencia({ activa: true, fechaExpiracion: null });
    await cargarSedes(datos);
  }

  // Carga las sedes del negocio (admin ve todas las suyas, ver seccion 6).
  // Si solo tiene una, la selecciona automaticamente: la mayoria de los
  // planes solo permiten una sede de todos modos.
  async function cargarSedes(sesionActual = sesion) {
    try {
      const res = await api.get("/parqueaderos");
      setSedes(res.data);

      // Si la sede que tenia seleccionada ya no existe (la eliminaron), se
      // trata como si no tuviera ninguna seleccionada todavia.
      const sigueExistiendo = sesionActual?.parqueaderoId && res.data.some((s) => s.id === sesionActual.parqueaderoId);
      const parqueaderoIdEfectivo = sigueExistiendo ? sesionActual.parqueaderoId : null;

      if (!parqueaderoIdEfectivo && res.data.length === 1) {
        await seleccionarSede(res.data[0].id, sesionActual);
      } else if (parqueaderoIdEfectivo !== sesionActual?.parqueaderoId) {
        await seleccionarSede(parqueaderoIdEfectivo, sesionActual);
      }
    } catch {
      // sin conexion: se sigue con lo que ya estaba guardado localmente
    } finally {
      setSedesListas(true);
    }
  }

  async function seleccionarSede(parqueaderoId, sesionActual = sesion) {
    const nuevaSesion = { ...sesionActual, parqueaderoId };
    await guardarSesion(nuevaSesion);
  }

  // El operador puede tener 1 o mas sedes asignadas (ver /operadores); se
  // reutiliza la misma logica de "cargarSedes" del admin para resolver cual
  // sede queda seleccionada (automatica si es solo una, o a elegir si tiene
  // varias, ver el aviso de sede en DashboardScreen).
  async function loginGuardia(usuario, password) {
    const res = await api.post("/auth/guardia/login", { usuario, password });
    const datos = await guardarSesion({ token: res.data.token, rol: "guardia", nombre: res.data.guardia.nombre, parqueaderoId: null });
    await cargarSedes(datos);
  }

  async function guardarSesion(datos) {
    await AsyncStorage.setItem("sesion", JSON.stringify(datos));
    await AsyncStorage.setItem("token", datos.token);
    setSesion(datos);
    return datos;
  }

  async function logout() {
    await AsyncStorage.multiRemove(["sesion", "token", "licencia_cache"]);
    setSesion(null);
    setSedes([]);
    setSedesListas(false);
  }

  // Guarda localmente el ultimo estado de licencia validado contra el servidor
  async function cachearEstadoLicencia(estado) {
    await AsyncStorage.setItem(
      "licencia_cache",
      JSON.stringify({ ...estado, validadoEn: new Date().toISOString() })
    );
  }

  // Si hay internet, valida contra el servidor. Si no, usa el cache
  // respetando el periodo de gracia (seccion 4 del documento).
  async function validarLicenciaCacheada() {
    try {
      const res = await api.get("/salud");
      if (res.status === 200) {
        setLicenciaValida(true);
        return;
      }
    } catch {
      // sin conexion -> revisar cache
    }

    const raw = await AsyncStorage.getItem("licencia_cache");
    if (!raw) {
      setLicenciaValida(true); // primera vez, sin cache: dejar operar y validar en cuanto haya red
      return;
    }
    const cache = JSON.parse(raw);
    const validadoEn = new Date(cache.validadoEn);
    const finGracia = new Date(validadoEn.getTime() + HORAS_GRACIA_POR_DEFECTO * 60 * 60 * 1000);
    setLicenciaValida(new Date() <= finGracia);
  }

  return (
    <AuthContext.Provider value={{ sesion, sedes, sedesListas, licenciaValida, cargando, loginAdmin, loginGuardia, logout, cargarSedes, seleccionarSede }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

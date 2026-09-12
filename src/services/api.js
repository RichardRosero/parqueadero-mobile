// services/api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: cambia esto por la URL real de tu backend cuando lo despliegues
// (ej. Railway, Render, un VPS propio). Mientras pruebas en local, usa la
// IP de tu computadora en la red WiFi (no "localhost", el celular no la ve).
export const API_BASE_URL = "http://localhost:3000";

const api = axios.create({ baseURL: API_BASE_URL, timeout: 8000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token guardado ya no es valido (por ejemplo, "Negocio no encontrado"
// porque la sesion quedo apuntando a datos que ya no existen, o el token
// vencio/fue rechazado) forzamos un logout limpio en vez de dejar al usuario
// viendo un error crudo sin poder hacer nada. AuthContext registra su
// funcion de logout aqui al montar.
let manejarSesionInvalida = null;
export function registrarManejadorSesionInvalida(fn) {
  manejarSesionInvalida = fn;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const mensaje = err.response?.data?.error || "";
    const sesionInvalida = status === 401 || (status === 404 && mensaje.toLowerCase().includes("negocio"));
    if (sesionInvalida && manejarSesionInvalida) {
      manejarSesionInvalida();
    }
    return Promise.reject(err);
  }
);

export default api;

// services/offlineQueue.js
// Implementa el "funcionamiento offline" de la seccion 4 del documento:
// - Si hay conexion, la accion se manda directo al backend.
// - Si no hay conexion, se guarda en una cola local y se reintenta cuando
//   vuelva la señal (ver flushQueue, que conviene llamar en un listener de
//   NetInfo dentro de App.js).
//
// Nota: esto cubre el registro de entradas/salidas. La validacion de
// licencia con periodo de gracia (tambien seccion 4) se maneja aparte en
// AuthContext.js, cacheando el ultimo estado de licencia conocido.

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import api from "./api";

const QUEUE_KEY = "cola_offline_v1";

async function leerCola() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function guardarCola(cola) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(cola));
}

/**
 * Intenta ejecutar la peticion. Si falla por falta de red, la encola para
 * reintentar despues, y devuelve { encolado: true } en vez de la respuesta real.
 */
export async function ejecutarOEncolar({ metodo, url, datos }) {
  const estadoRed = await NetInfo.fetch();

  if (estadoRed.isConnected) {
    try {
      const res = await api.request({ method: metodo, url, data: datos });
      return { encolado: false, respuesta: res.data };
    } catch (err) {
      // Si el error es de red (no de validacion del servidor), lo encolamos igual
      if (!err.response) {
        await encolar({ metodo, url, datos });
        return { encolado: true };
      }
      throw err;
    }
  }

  await encolar({ metodo, url, datos });
  return { encolado: true };
}

async function encolar(item) {
  const cola = await leerCola();
  cola.push({ ...item, creadoEn: new Date().toISOString() });
  await guardarCola(cola);
}

/** Llamar cuando NetInfo detecte que volvio la conexion. */
export async function flushQueue() {
  const cola = await leerCola();
  if (cola.length === 0) return { procesados: 0 };

  const pendientes = [];
  let procesados = 0;

  for (const item of cola) {
    try {
      await api.request({ method: item.metodo, url: item.url, data: item.datos });
      procesados++;
    } catch (err) {
      // Si sigue fallando, lo dejamos en la cola para el proximo intento
      pendientes.push(item);
    }
  }

  await guardarCola(pendientes);
  return { procesados, pendientes: pendientes.length };
}

export async function tamanoCola() {
  return (await leerCola()).length;
}

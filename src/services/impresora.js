// services/impresora.js — impresora térmica WiFi (protocolo ESC/POS sobre
// TCP, puerto 9100: el estándar "raw"/JetDirect que usan casi todas las
// impresoras de recibos con WiFi).
//
// Como la impresora usa DHCP no se puede guardar una IP fija: en su lugar,
// se recorre la red local del celular probando qué dispositivo responde en
// el puerto 9100 (heurística estándar para detectar impresoras de este
// tipo) y se deja elegir cuál es. La IP elegida se guarda por sede para no
// tener que buscarla cada vez; si la impresora cambia de IP (nuevo ciclo de
// DHCP), basta con volver a buscarla.
//
// IMPORTANTE: tanto el escaneo de red como el envío del ticket usan sockets
// TCP reales (react-native-tcp-socket), que no existen ni en el navegador
// ni en Expo Go — solo funcionan en una compilación nativa de la app.
import TcpSocket from "react-native-tcp-socket";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUERTO_IMPRESORA = 9100;
const TIMEOUT_ESCANEO_MS = 350;
const TAMANO_LOTE_ESCANEO = 24;
const PREFIJO_STORAGE = "impresora_ip_";

function claveStorage(parqueaderoId) {
  return `${PREFIJO_STORAGE}${parqueaderoId}`;
}

export async function obtenerImpresoraGuardada(parqueaderoId) {
  if (!parqueaderoId) return null;
  return AsyncStorage.getItem(claveStorage(parqueaderoId));
}

export async function guardarImpresora(parqueaderoId, ip) {
  await AsyncStorage.setItem(claveStorage(parqueaderoId), ip);
}

export async function olvidarImpresora(parqueaderoId) {
  await AsyncStorage.removeItem(claveStorage(parqueaderoId));
}

// Intenta abrir una conexión TCP breve a ip:9100. Si conecta, hay un
// dispositivo escuchando ahí (muy probablemente la impresora).
function probarPuerto(ip) {
  return new Promise((resolve) => {
    let resuelto = false;
    const terminar = (ok) => {
      if (resuelto) return;
      resuelto = true;
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    const socket = TcpSocket.createConnection(
      { host: ip, port: PUERTO_IMPRESORA, connectTimeout: TIMEOUT_ESCANEO_MS },
      () => terminar(true)
    );
    socket.on("error", () => terminar(false));
    socket.on("timeout", () => terminar(false));
    setTimeout(() => terminar(false), TIMEOUT_ESCANEO_MS + 250);
  });
}

// Recorre las 254 direcciones de la red local del celular (asume máscara
// /24, la más común en redes hogar/negocio) buscando cuáles responden en el
// puerto de impresión. Se prueba en lotes para no abrir 254 conexiones a
// la vez. `onProgreso(revisadas, total)` permite mostrar un avance en pantalla.
export async function buscarImpresorasEnRed(onProgreso) {
  const ipPropia = await Network.getIpAddressAsync();
  if (!ipPropia || ipPropia === "0.0.0.0") {
    throw new Error("No se pudo detectar la red WiFi del celular. Verifica que el WiFi esté conectado.");
  }

  const partes = ipPropia.split(".");
  const base = `${partes[0]}.${partes[1]}.${partes[2]}`;
  const propio = Number(partes[3]);

  const encontradas = [];
  for (let inicio = 1; inicio <= 254; inicio += TAMANO_LOTE_ESCANEO) {
    const lote = [];
    for (let i = inicio; i < inicio + TAMANO_LOTE_ESCANEO && i <= 254; i++) {
      if (i !== propio) lote.push(i);
    }
    const resultados = await Promise.all(
      lote.map((i) => probarPuerto(`${base}.${i}`).then((ok) => (ok ? `${base}.${i}` : null)))
    );
    for (const ip of resultados) if (ip) encontradas.push(ip);
    if (onProgreso) onProgreso(Math.min(inicio + TAMANO_LOTE_ESCANEO - 1, 254), 254);
  }
  return encontradas;
}

const ESC = "\x1b";
const GS = "\x1d";

// Los ESC/POS de gama baja suelen traer solo la página de códigos CP437 (sin
// tildes/ñ correctas), asi que se quitan los acentos antes de imprimir para
// evitar que salgan símbolos raros en el ticket.
function sinAcentos(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ñÑ]/g, (c) => (c === "ñ" ? "n" : "N"));
}

function construirTicket({ nombreSede, placa, tipoVehiculo, codigo, horaEntrada }) {
  return [
    `${ESC}@`, // inicializar
    `${ESC}a1`, // centrado
    `${sinAcentos(nombreSede) || "Parqueadero"}\n`,
    "--------------------------------\n",
    `${ESC}a0`, // izquierda
    `Placa: ${placa}\n`,
    `Tipo: ${sinAcentos(tipoVehiculo) || "-"}\n`,
    `Entrada: ${new Date(horaEntrada).toLocaleString()}\n`,
    "--------------------------------\n",
    `${ESC}a1`, // centrado
    `${ESC}!\x30`, // texto grande
    `${codigo}\n`,
    `${ESC}!\x00`, // texto normal
    "\n\n\n",
    `${GS}V\x00`, // cortar papel (si la impresora tiene cuchilla)
  ].join("");
}

// Envía el ticket a la impresora guardada de la sede. Lanza un error claro
// si no hay ninguna configurada o si no se pudo conectar (ej. la impresora
// cambió de IP por DHCP y hay que volver a buscarla).
export async function imprimirTicket(parqueaderoId, datosTicket) {
  const ip = await obtenerImpresoraGuardada(parqueaderoId);
  if (!ip) {
    throw new Error('No hay una impresora configurada para esta sede. Toca "Buscar impresora" primero.');
  }

  const contenido = construirTicket(datosTicket);

  await new Promise((resolve, reject) => {
    let terminado = false;
    const socket = TcpSocket.createConnection({ host: ip, port: PUERTO_IMPRESORA, connectTimeout: 3000 }, () => {
      socket.write(contenido, "ascii");
      socket.end();
    });
    socket.on("close", () => {
      if (terminado) return;
      terminado = true;
      resolve();
    });
    socket.on("error", () => {
      if (terminado) return;
      terminado = true;
      reject(new Error(`No se pudo conectar con la impresora (${ip}). Si cambió de IP, vuelve a tocar "Buscar impresora".`));
    });
    socket.on("timeout", () => {
      if (terminado) return;
      terminado = true;
      socket.destroy();
      reject(new Error("La impresora no respondió a tiempo."));
    });
  });
}

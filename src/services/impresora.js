// services/impresora.js — impresión del ticket de entrada.
//
// Usa el sistema de impresión propio de Android/iOS (expo-print), que abre
// el diálogo nativo de impresión: ahí es el propio sistema operativo el que
// ya conoce las impresoras de la red (compartidas por WiFi/red local), no
// hace falta buscarlas a mano. Esto sirve para impresoras normales/
// multifunción (papel carta, con su propio servicio de impresión instalado
// en el celular, ej. Mopria, o el plugin del fabricante).
//
// Nota para el futuro: si en algún momento se usa una impresora térmica de
// recibos dedicada (58/80mm), esas normalmente no aparecen en el diálogo
// del sistema y hay que hablarles directo por su puerto de red (9100) o por
// Bluetooth con su propio protocolo — es un caso distinto al de aquí.
//
// IMPORTANTE: expo-print usa código nativo, así que no funciona en el
// navegador ni en Expo Go — solo en una compilación nativa de la app
// (development build / build final).
import * as Print from "expo-print";

function construirHtmlTicket({ nombreSede, placa, tipoVehiculo, codigo, horaEntrada }) {
  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; text-align: center; padding: 32px;">
        <h2 style="margin-bottom: 4px;">${nombreSede || "Parqueadero"}</h2>
        <hr />
        <div style="text-align: left; font-size: 16px; line-height: 1.6;">
          <strong>Placa:</strong> ${placa}<br/>
          <strong>Tipo:</strong> ${tipoVehiculo || "-"}<br/>
          <strong>Entrada:</strong> ${new Date(horaEntrada).toLocaleString()}
        </div>
        <hr />
        <p style="font-size: 40px; font-weight: bold; letter-spacing: 2px; margin-top: 24px;">${codigo}</p>
      </body>
    </html>
  `;
}

// Abre el diálogo de impresión del celular con el ticket ya armado. El
// usuario elige ahí su impresora (Android ya la reconoce), igual que al
// imprimir desde cualquier otra app.
export async function imprimirTicket(datosTicket) {
  const html = construirHtmlTicket(datosTicket);
  await Print.printAsync({ html });
}

function construirHtmlTicketSalida({ nombreSede, placa, horaEntrada, horaSalida, tiempoTexto, valor, simbolo }) {
  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; text-align: center; padding: 32px;">
        <h2 style="margin-bottom: 4px;">${nombreSede || "Parqueadero"}</h2>
        <hr />
        <div style="text-align: left; font-size: 16px; line-height: 1.6;">
          <strong>Placa:</strong> ${placa}<br/>
          <strong>Entrada:</strong> ${new Date(horaEntrada).toLocaleString()}<br/>
          <strong>Salida:</strong> ${new Date(horaSalida).toLocaleString()}<br/>
          <strong>Tiempo total:</strong> ${tiempoTexto}
        </div>
        <hr />
        <p style="font-size: 32px; font-weight: bold; margin-top: 24px;">${simbolo || "$"}${valor}</p>
      </body>
    </html>
  `;
}

// Ticket de salida: entrada, salida, tiempo total y valor a pagar (seccion 7).
export async function imprimirTicketSalida(datosTicket) {
  const html = construirHtmlTicketSalida(datosTicket);
  await Print.printAsync({ html });
}

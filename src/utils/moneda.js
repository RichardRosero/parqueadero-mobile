// utils/moneda.js — monedas soportadas por sede (seccion 6 del documento).
// El campo `moneda` ya existia en la tabla `parqueaderos` del backend pero
// no habia forma de elegirlo ni de ver el simbolo correcto en la app.
export const MONEDAS = [
  { codigo: "USD", simbolo: "$", nombre: "Dólar estadounidense" },
  { codigo: "COP", simbolo: "$", nombre: "Peso colombiano" },
  { codigo: "MXN", simbolo: "$", nombre: "Peso mexicano" },
  { codigo: "PEN", simbolo: "S/", nombre: "Sol peruano" },
  { codigo: "ARS", simbolo: "$", nombre: "Peso argentino" },
  { codigo: "CLP", simbolo: "$", nombre: "Peso chileno" },
  { codigo: "GTQ", simbolo: "Q", nombre: "Quetzal guatemalteco" },
  { codigo: "EUR", simbolo: "€", nombre: "Euro" },
];

export function simboloMoneda(codigo) {
  return MONEDAS.find((m) => m.codigo === codigo)?.simbolo || codigo || "$";
}

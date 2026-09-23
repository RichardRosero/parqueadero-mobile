// utils/paises.js — lista de codigos de pais para el selector de WhatsApp/SMS
// (ver components/SelectorPais.js). Lista curada de paises hispanohablantes +
// algunos comunes, no es la lista completa de los ~195 paises del mundo —
// si se necesita alguno que falte, agregarlo aqui es un cambio de 1 linea.
export const PAISES = [
  { codigo: "+593", nombre: "Ecuador", bandera: "🇪🇨" },
  { codigo: "+57", nombre: "Colombia", bandera: "🇨🇴" },
  { codigo: "+51", nombre: "Perú", bandera: "🇵🇪" },
  { codigo: "+52", nombre: "México", bandera: "🇲🇽" },
  { codigo: "+54", nombre: "Argentina", bandera: "🇦🇷" },
  { codigo: "+56", nombre: "Chile", bandera: "🇨🇱" },
  { codigo: "+58", nombre: "Venezuela", bandera: "🇻🇪" },
  { codigo: "+591", nombre: "Bolivia", bandera: "🇧🇴" },
  { codigo: "+595", nombre: "Paraguay", bandera: "🇵🇾" },
  { codigo: "+598", nombre: "Uruguay", bandera: "🇺🇾" },
  { codigo: "+507", nombre: "Panamá", bandera: "🇵🇦" },
  { codigo: "+506", nombre: "Costa Rica", bandera: "🇨🇷" },
  { codigo: "+502", nombre: "Guatemala", bandera: "🇬🇹" },
  { codigo: "+504", nombre: "Honduras", bandera: "🇭🇳" },
  { codigo: "+503", nombre: "El Salvador", bandera: "🇸🇻" },
  { codigo: "+505", nombre: "Nicaragua", bandera: "🇳🇮" },
  { codigo: "+1", nombre: "República Dominicana", bandera: "🇩🇴" },
  { codigo: "+34", nombre: "España", bandera: "🇪🇸" },
  { codigo: "+1", nombre: "Estados Unidos / Canadá", bandera: "🇺🇸" },
  { codigo: "+55", nombre: "Brasil", bandera: "🇧🇷" },
];

// En muchos países (Ecuador incluido) el número "de uso diario" lleva un 0
// adelante (ej. 0982399295) que es solo para marcar DENTRO del país — para
// el formato internacional que necesita WhatsApp/SMS ese 0 no va (queda
// +593982399295, no +5930982399295). Esta funcion limpia el numero que
// escribe el operador (le quita espacios/guiones y ese 0 inicial) para que
// no tenga que acordarse de la regla de cada país — puede escribirlo con o
// sin el 0, siempre va a quedar bien formado.
export function normalizarNumeroLocal(numero) {
  const soloDigitos = (numero || "").replace(/\D/g, "");
  return soloDigitos.replace(/^0+/, "");
}

// utils/tiposDefault.js — debe reflejar exactamente backend/src/utils/tiposDefault.js.
// Se usa para precargar el formulario de "Crear sede" con los 3 tipos de
// vehiculo por defecto (editables) antes de que la sede exista en el backend.
export const TIPOS_DEFAULT = [
  { nombre: "Moto", tarifa_hora: "0.5", tarifa_fraccion: "0.2" },
  { nombre: "Auto-Camioneta", tarifa_hora: "1", tarifa_fraccion: "0.35" },
  { nombre: "Vehículo Pesado", tarifa_hora: "2", tarifa_fraccion: "0.6" },
];

export const MAX_TIPOS = 5; // 3 por defecto + 2 propios

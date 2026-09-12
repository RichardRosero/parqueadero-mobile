// utils/alerta.js
// Alert.alert de React Native no muestra nada en web: react-native-web lo
// implementa como una funcion vacia (ver node_modules/react-native-web/dist/exports/Alert).
// Esto hacia que errores y confirmaciones quedaran completamente invisibles
// al probar la app en el navegador. Este helper usa window.alert en web y
// Alert.alert nativo en Android/iOS, para que el usuario siempre vea el mensaje.
import { Alert, Platform } from "react-native";

export function mostrarAlerta(titulo, mensaje) {
  if (Platform.OS === "web") {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

// Confirmacion si/no (ej. antes de eliminar algo). Devuelve una Promise<boolean>.
export function confirmarAccion(mensaje) {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(mensaje));
  }
  return new Promise((resolve) => {
    Alert.alert("Confirmar", mensaje, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Sí, continuar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

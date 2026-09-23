// navigation/AppNavigator.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import LoginAdminScreen from "../screens/LoginAdminScreen";
import LoginGuardiaScreen from "../screens/LoginGuardiaScreen";
import DashboardScreen from "../screens/DashboardScreen";
import EntradaScreen from "../screens/EntradaScreen";
import SalidaScreen from "../screens/SalidaScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import ReportesScreen from "../screens/ReportesScreen";
import PanicoScreen from "../screens/PanicoScreen";

const Stack = createNativeStackNavigator();

// animation: "fade" — la pantalla se desvanece/aparece en vez de deslizar.
// Aplica a TODAS las pantallas de la app (una sola linea, screenOptions es
// global del Stack.Navigator). Otras opciones ya probadas: "slide_from_right"
// (deslizar de derecha a izquierda), "none" (sin animacion, como estaba
// originalmente) — ver conversacion para la lista completa si se quiere
// cambiar de nuevo.
const opcionesHeader = { headerStyle: { backgroundColor: "#1F4E8C" }, headerTintColor: "#fff", animation: "fade" };

export default function AppNavigator() {
  const { sesion, cargando, sedes, sedesListas } = useAuth();

  if (cargando) return null; // TODO: pantalla de splash mientras se restaura la sesion
  // Para el admin, esperamos a saber con certeza cuantas sedes tiene antes de
  // decidir la pantalla inicial (si no, por un instante parece que tiene 0
  // sedes solo porque todavia no terminaron de cargar).
  if (sesion?.rol === "admin" && !sedesListas) return null;

  // Un admin sin ninguna sede creada entra directo a Configuracion para
  // crear la primera, en vez de ver un Dashboard vacio/deshabilitado.
  const rutaInicial = !sesion ? undefined : sesion.rol === "admin" && sedes.length === 0 ? "Configuracion" : "Dashboard";

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={opcionesHeader} initialRouteName={rutaInicial}>
        {!sesion ? (
          <>
            <Stack.Screen name="LoginAdmin" component={LoginAdminScreen} options={{ title: "Iniciar sesión" }} />
            <Stack.Screen name="LoginGuardia" component={LoginGuardiaScreen} options={{ title: "Iniciar sesión" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Inicio" }} />
            <Stack.Screen name="Entrada" component={EntradaScreen} options={{ title: "Registrar entrada" }} />
            <Stack.Screen name="Salida" component={SalidaScreen} options={{ title: "Registrar salida" }} />
            <Stack.Screen name="Panico" component={PanicoScreen} options={{ title: "Botón de pánico" }} />
            {sesion.rol === "admin" && (
              <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ title: "Configuración" }} />
            )}
            {/* Reportes es de solo lectura: tambien lo puede ver un operador, no solo el admin */}
            <Stack.Screen name="Reportes" component={ReportesScreen} options={{ title: "Reportes" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

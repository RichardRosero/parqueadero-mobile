// services/googleAuth.js — login nativo con Google para el administrador.
//
// Usa @react-native-google-signin/google-signin (codigo nativo: si esto se
// agrega por primera vez, hace falta recompilar con EAS Build y reinstalar
// el APK, igual que paso con expo-print). El "Web Client ID" viene de
// app.json (extra.googleWebClientId) y es el mismo que el backend usa en
// GOOGLE_CLIENT_ID (backend/.env) para validar el idToken — deben coincidir
// siempre. Ver CLAUDE.md, seccion de login con Google, para el paso a paso
// de como se creo en Google Cloud Console.
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

const WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId;

let configurado = false;
function asegurarConfigurado() {
  if (configurado) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: false });
  configurado = true;
}

// Devuelve el idToken de Google, o null si el usuario cerró el selector de
// cuenta sin elegir ninguna (esta libreria no lanza error en ese caso, solo
// devuelve type:'cancelled'). AuthContext manda ese idToken al backend en
// /auth/admin/google.
export async function iniciarSesionGoogle() {
  asegurarConfigurado();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const resultado = await GoogleSignin.signIn();
  if (resultado.type === "cancelled") return null;
  const idToken = resultado.data?.idToken;
  if (!idToken) throw new Error("Google no devolvió un idToken");
  return idToken;
}

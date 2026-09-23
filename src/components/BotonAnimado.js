// components/BotonAnimado.js — boton con "rebote" al tocar (se achica un
// poco al presionar y rebota de vuelta a su tamaño normal al soltar). Usa
// la API de animacion incluida en React Native (Animated), no hace falta
// ninguna libreria nueva ni recompilar la app.
import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";

const PressableAnimado = Animated.createAnimatedComponent(Pressable);

export default function BotonAnimado({ style, onPress, disabled, children }) {
  const escala = useRef(new Animated.Value(1)).current;

  function alPresionar() {
    Animated.spring(escala, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function alSoltar() {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }).start();
  }

  return (
    <PressableAnimado
      style={[style, { transform: [{ scale: escala }] }]}
      onPress={onPress}
      disabled={disabled}
      onPressIn={alPresionar}
      onPressOut={alSoltar}
    >
      {children}
    </PressableAnimado>
  );
}

// components/SelectorPais.js — selector de codigo de pais para numeros de
// WhatsApp/SMS (antes el operador tenia que escribir el codigo de pais a
// mano dentro del numero, lo que se prestaba a errores). Se usa en
// EntradaScreen y SalidaScreen junto a un input que solo pide el numero
// local, sin el codigo.
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from "react-native";
import { PAISES } from "../utils/paises";

export default function SelectorPais({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const seleccionado = PAISES.find((p) => p.codigo === value) || PAISES[0];

  return (
    <>
      <TouchableOpacity style={styles.boton} onPress={() => setAbierto(true)}>
        <Text style={styles.textoBoton}>{seleccionado.bandera} {seleccionado.codigo}</Text>
      </TouchableOpacity>

      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondo}>
          <View style={styles.hoja}>
            <Text style={styles.titulo}>Elige el país</Text>
            <FlatList
              data={PAISES}
              keyExtractor={(item, i) => `${item.codigo}-${item.nombre}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.fila}
                  onPress={() => { onChange(item.codigo); setAbierto(false); }}
                >
                  <Text style={styles.filaTexto}>{item.bandera} {item.nombre}</Text>
                  <Text style={styles.filaCodigo}>{item.codigo}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.botonCerrar} onPress={() => setAbierto(false)}>
              <Text style={styles.botonCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  boton: { height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, justifyContent: "center", marginRight: 8 },
  textoBoton: { fontWeight: "bold" },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  hoja: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: "70%" },
  titulo: { fontSize: 18, fontWeight: "bold", color: "#1F4E8C", marginBottom: 12 },
  fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" },
  filaTexto: { fontSize: 15 },
  filaCodigo: { fontSize: 15, color: "#666" },
  botonCerrar: { marginTop: 12, padding: 12, alignItems: "center" },
  botonCerrarTexto: { color: "#1F4E8C", fontWeight: "bold" },
});

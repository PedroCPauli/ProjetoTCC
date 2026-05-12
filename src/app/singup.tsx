import { MaterialIcons } from '@expo/vector-icons'
import * as Location from "expo-location"
import { Link } from "expo-router"
import { useEffect, useState } from "react"

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"

import MapView, { Marker } from "react-native-maps"

import { Input } from "../components/input"

export default function Signup() {

  const [region, setRegion] = useState<any>(null)

  const [marker, setMarker] = useState<any>(null)

  const [nome, setNome] = useState("")
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  const [loading, setLoading] = useState(false)

  const [localPlantao, setLocalPlantao] = useState<any>(null)

  async function getLocation() {

    try {

      let { status } =
        await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {

        Alert.alert(
          "Erro",
          "Permissão de localização negada"
        )

        return
      }

      let loc = await Location.getCurrentPositionAsync({})

      const newRegion = {

        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,

        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }

      setRegion(newRegion)
      setMarker(newRegion)

    } catch (error) {

      Alert.alert(
        "Erro",
        "Não foi possível carregar localização"
      )

    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  function handleSignup() {

    if (!nome || !usuario || !senha || !confirmarSenha) {

      Alert.alert(
        "Erro",
        "Preencha todos os campos"
      )

      return
    }

    if (senha !== confirmarSenha) {

      Alert.alert(
        "Erro",
        "As senhas não coincidem"
      )

      return
    }

    if (!localPlantao) {

      Alert.alert(
        "Erro",
        "Selecione o local do plantão no mapa"
      )

      return
    }

    setLoading(true)

    setTimeout(() => {

      setLoading(false)

      Alert.alert(
        "Sucesso",
        "Cadastro realizado com sucesso!"
      )

      console.log({

        nome,
        usuario,
        senha,

        latitude: localPlantao.latitude,
        longitude: localPlantao.longitude

      })

    }, 1500)
  }

  return (

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({
        ios: "padding",
        android: "height"
      })}
    >

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

        <View style={styles.container}>

          {/* CARD DADOS */}

          <View style={styles.card}>

            <Text style={styles.title}>
              Cadastro Médico
            </Text>

            <Text style={styles.subtitle}>
              Preencha os dados para continuar
            </Text>

            <View style={styles.form}>

              <Input
                placeholder="Nome"
                onChangeText={setNome}
              />

              <Input
                placeholder="Usuário"
                onChangeText={setUsuario}
              />

              <Input
                placeholder="Senha"
                secureTextEntry
                onChangeText={setSenha}
              />

              <Input
                placeholder="Confirmar senha"
                secureTextEntry
                onChangeText={setConfirmarSenha}
              />

            </View>

          </View>

          {/* MAPA */}

          <View style={styles.card}>

            <View style={styles.headerCard}>

              <MaterialIcons
                name="location-on"
                size={24}
                color="#2E86DE"
              />

              <Text style={styles.mapTitle}>
                Local do Plantão
              </Text>

            </View>

            <Text style={styles.helperText}>
              Toque no mapa para selecionar
              o hospital ou clínica
            </Text>

            {/* DEBUG */}
            <Text style={styles.debug}>
              {region
                ? "Mapa carregado"
                : "Carregando localização..."}
            </Text>

            {region && (

              <MapView
                style={styles.map}

                initialRegion={region}

                onPress={(e) => {

                  const coord =
                    e.nativeEvent.coordinate

                  setMarker(coord)
                  setLocalPlantao(coord)

                }}
              >

                {marker && (

                  <Marker
                    coordinate={marker}
                    title="Local do Plantão"
                    description="Local autorizado"
                  />

                )}

              </MapView>

            )}

          </View>

          {/* LOCAL SELECIONADO */}

          {localPlantao && (

            <View style={styles.cardLocal}>

              <View style={styles.headerCard}>

                <MaterialIcons
                  name="place"
                  size={22}
                  color="#27AE60"
                />

                <Text style={styles.localTitulo}>
                  Local Selecionado
                </Text>

              </View>

              <Text style={styles.localTexto}>
                Latitude:
                {" "}
                {localPlantao.latitude.toFixed(5)}
              </Text>

              <Text style={styles.localTexto}>
                Longitude:
                {" "}
                {localPlantao.longitude.toFixed(5)}
              </Text>

            </View>

          )}

          {/* BOTÃO */}

          <TouchableOpacity
            style={styles.botao}
            onPress={handleSignup}
          >

            <MaterialIcons
              name="person-add"
              size={22}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>

              {loading
                ? "Cadastrando..."
                : "Cadastrar"}

            </Text>

          </TouchableOpacity>

          <Text style={styles.footerText}>

            Já possui conta?

            {" "}

            <Link
              href={"/"}
              style={styles.footerLink}
            >
              Entre aqui
            </Link>

          </Text>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    padding: 20
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.1,
    shadowRadius: 4,

    elevation: 4
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#1E293B"
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 20
  },

  form: {
    gap: 14
  },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },

  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B"
  },

  helperText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10
  },

  debug: {
    marginBottom: 10,
    color: "#2E86DE",
    fontWeight: "bold"
  },

  map: {
    width: "100%",
    height: 300,
    borderRadius: 16
  },

  cardLocal: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.1,
    shadowRadius: 4,

    elevation: 4,
  },

  localTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E293B"
  },

  localTexto: {
    fontSize: 15,
    color: "#475569",
    marginTop: 5
  },

  botao: {
    backgroundColor: "#2E86DE",
    padding: 16,
    borderRadius: 14,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 8,

    elevation: 4
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },

  footerText: {
    textAlign: "center",
    marginTop: 25,
    color: "#64748B"
  },

  footerLink: {
    color: "#2563EB",
    fontWeight: "bold"
  }

})
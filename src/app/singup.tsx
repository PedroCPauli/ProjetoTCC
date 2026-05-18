import { MaterialIcons } from '@expo/vector-icons'
import * as LocalAuthentication from 'expo-local-authentication'
import * as Location from 'expo-location'
import { Link } from "expo-router"
import { useState } from "react"

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

import { Input } from "../components/input"
import { supabase } from "../lib/supabase"

export default function Signup() {

  const [nome, setNome] = useState("")
  const [usuario, setUsuario] = useState("")
  const [email, setEmail] = useState("")

  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")

  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  const [tipoUsuario, setTipoUsuario] = useState("")
  const [loading, setLoading] = useState(false)

  /*
    ============================
    BUSCA CEP AUTOMÁTICO
    ============================
  */

  async function buscarCEP(valor: string) {

    const cepLimpo =
      valor.replace(/\D/g, "")

    setCep(cepLimpo)

    if (cepLimpo.length !== 8) {
      return
    }

    try {

      const response =
        await fetch(
          `https://viacep.com.br/ws/${cepLimpo}/json/`
        )

      const data =
        await response.json()

      if (data.erro) {

        Alert.alert(
          "Erro",
          "CEP não encontrado"
        )

        return
      }

      setLogradouro(
        data.logradouro || ""
      )

      setBairro(
        data.bairro || ""
      )

    } catch (error) {

      console.log(error)

      Alert.alert(
        "Erro",
        "Falha ao buscar CEP"
      )
    }
  }

  /*
    ============================
    ATIVAR BIOMETRIA
    ============================
  */

  async function ativarBiometria(
    idUsuario: number
  ) {

    try {

      const compatible =
        await LocalAuthentication
          .hasHardwareAsync()

      if (!compatible) {

        Alert.alert(
          "Biometria",
          "Dispositivo não suporta biometria"
        )

        return
      }

      const enrolled =
        await LocalAuthentication
          .isEnrolledAsync()

      if (!enrolled) {

        Alert.alert(
          "Biometria",
          "Nenhuma biometria cadastrada"
        )

        return
      }

      const auth =
        await LocalAuthentication
          .authenticateAsync({

            promptMessage:
              "Confirme sua biometria"

          })

      if (!auth.success) {

        Alert.alert(
          "Erro",
          "Falha biométrica"
        )

        return
      }

      const { error } =
        await supabase

          .from("usuario")

          .update({

            biometriaativa: true

          })

          .eq(
            "idusuario",
            idUsuario
          )

      if (error) {

        Alert.alert(
          "Erro",
          "Falha ao ativar biometria"
        )

        return
      }

      Alert.alert(
        "Sucesso",
        "Biometria ativada"
      )

    } catch (error) {

      console.log(error)

      Alert.alert(
        "Erro",
        "Erro biometria"
      )
    }
  }

  /*
    ============================
    PEGAR LOCALIZAÇÃO
    ============================
  */

  async function capturarLocalizacao() {

    try {

      const { status } =
        await Location
          .requestForegroundPermissionsAsync()

      if (status !== "granted") {

        Alert.alert(
          "Erro",
          "Permissão negada"
        )

        return null
      }

      /*
        FORÇA GPS ALTA PRECISÃO
      */

      const location =
        await Location
          .getCurrentPositionAsync({

            accuracy:
              Location.Accuracy.High

          })

      return {

        latitude:
          location.coords.latitude,

        longitude:
          location.coords.longitude
      }

    } catch (error) {

      console.log(error)

      /*
        REMOVE O ERRO DO EMULADOR
      */

      Alert.alert(
        "Erro",
        "Não foi possível obter localização.\n\nNo Android Studio:\n\nClique nos 3 pontos do emulador > Location > informe Latitude e Longitude válidas."
      )

      return null
    }
  }

  /*
    ============================
    CADASTRAR
    ============================
  */

  async function handleSignup() {

    if (
      !nome ||
      !usuario ||
      !email ||
      !senha ||
      !confirmarSenha ||
      !cep ||
      !logradouro ||
      !numero ||
      !bairro
    ) {

      Alert.alert(
        "Erro",
        "Preencha todos os campos"
      )

      return
    }

    if (!tipoUsuario) {

      Alert.alert(
        "Erro",
        "Selecione o tipo usuário"
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

    try {

      setLoading(true)

      /*
        PEGA LOCALIZAÇÃO
      */

      const localizacao =
        await capturarLocalizacao()

      if (!localizacao) {

        setLoading(false)
        return
      }

      setLatitude(
        localizacao.latitude.toString()
      )

      setLongitude(
        localizacao.longitude.toString()
      )

      /*
        ADMIN = 1
        PLANTONISTA = 2
      */

      const idTipoUsuario =
        tipoUsuario === "admin"
          ? 1
          : 2

      /*
        CADASTRA ENDEREÇO
      */

      const {
        data: enderecoData,
        error: enderecoError
      } = await supabase

        .from("endereco")

        .insert({

          cep,
          logradouro,
          numero,
          complemento,
          bairro,

          latitude:
            localizacao.latitude,

          longitude:
            localizacao.longitude

        })

        .select()

        .single()

      if (enderecoError) {

        console.log(enderecoError)

        throw enderecoError
      }

      /*
        CADASTRA USUÁRIO
      */

      const {
        data: usuarioData,
        error: usuarioError
      } = await supabase

        .from("usuario")

        .insert({

          idtipousuario:
            idTipoUsuario,

          idendereco:
            enderecoData.idendereco,

          nome,
          usuario,
          email,
          senha,

          biometriaativa: false

        })

        .select()

        .single()

      if (usuarioError) {

        console.log(usuarioError)

        throw usuarioError
      }

      setLoading(false)

      Alert.alert(

        "Sucesso",

        "Usuário cadastrado com sucesso!\n\nDeseja ativar biometria?",

        [

          {
            text: "Não"
          },

          {
            text: "Sim",

            onPress: async () => {

              await ativarBiometria(
                usuarioData.idusuario
              )
            }
          }
        ]
      )

    } catch (error: any) {

      setLoading(false)

      console.log(error)

      Alert.alert(
        "Erro",
        error.message
      )
    }
  }

  return (

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({
        ios: "padding",
        android: "height"
      })}
    >

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1
        }}
      >

        <View style={styles.container}>

          <View style={styles.card}>

            <Text style={styles.title}>
              Cadastro Usuário
            </Text>

            <Text style={styles.subtitle}>
              Preencha os dados abaixo
            </Text>

            <View style={styles.form}>

              <Input
                placeholder="Nome completo"
                value={nome}
                onChangeText={setNome}
              />

              <Input
                placeholder="Usuário"
                value={usuario}
                onChangeText={setUsuario}
              />

              <Input
                placeholder="E-mail"
                value={email}
                keyboardType="email-address"
                onChangeText={setEmail}
              />

              {/* CEP PRIMEIRO */}

              <Input
                placeholder="CEP"
                keyboardType="numeric"
                value={cep}
                onChangeText={buscarCEP}
              />

              <Input
                placeholder="Logradouro"
                value={logradouro}
                onChangeText={setLogradouro}
              />

              <Input
                placeholder="Número"
                value={numero}
                keyboardType="numeric"
                onChangeText={setNumero}
              />

              <Input
                placeholder="Complemento"
                value={complemento}
                onChangeText={setComplemento}
              />

              <Input
                placeholder="Bairro"
                value={bairro}
                onChangeText={setBairro}
              />

              {/* LOCALIZAÇÃO */}

              <Input
                placeholder="Latitude"
                value={latitude}
                editable={false}
              />

              <Input
                placeholder="Longitude"
                value={longitude}
                editable={false}
              />

              {/* TIPO USUÁRIO */}

              <View style={styles.tipoContainer}>

                <Text style={styles.tipoLabel}>
                  Tipo de Usuário
                </Text>

                <View style={styles.tipoButtons}>

                  <TouchableOpacity
                    style={[

                      styles.tipoButton,

                      tipoUsuario === "admin" &&
                      styles.tipoButtonActive

                    ]}

                    onPress={() =>
                      setTipoUsuario("admin")
                    }
                  >

                    <MaterialIcons
                      name="admin-panel-settings"
                      size={20}
                      color={
                        tipoUsuario === "admin"
                          ? "#fff"
                          : "#2E86DE"
                      }
                    />

                    <Text
                      style={[

                        styles.tipoButtonText,

                        tipoUsuario === "admin" &&
                        styles.tipoButtonTextActive

                      ]}
                    >
                      Administrador
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[

                      styles.tipoButton,

                      tipoUsuario === "plantonista" &&
                      styles.tipoButtonActive

                    ]}

                    onPress={() =>
                      setTipoUsuario("plantonista")
                    }
                  >

                    <MaterialIcons
                      name="medical-services"
                      size={20}
                      color={
                        tipoUsuario === "plantonista"
                          ? "#fff"
                          : "#2E86DE"
                      }
                    />

                    <Text
                      style={[

                        styles.tipoButtonText,

                        tipoUsuario === "plantonista" &&
                        styles.tipoButtonTextActive

                      ]}
                    >
                      Plantonista
                    </Text>

                  </TouchableOpacity>

                </View>

              </View>

              <Input
                placeholder="Senha"
                value={senha}
                secureTextEntry
                onChangeText={setSenha}
              />

              <Input
                placeholder="Confirmar senha"
                value={confirmarSenha}
                secureTextEntry
                onChangeText={setConfirmarSenha}
              />

            </View>

          </View>

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
    padding: 20,
    justifyContent: "center"
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

  tipoContainer: {
    marginBottom: 10
  },

  tipoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 10
  },

  tipoButtons: {
    flexDirection: "row",
    gap: 10
  },

  tipoButton: {
    flex: 1,

    borderWidth: 2,
    borderColor: "#2E86DE",

    borderRadius: 14,

    paddingVertical: 14,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 8,

    backgroundColor: "#fff"
  },

  tipoButtonActive: {
    backgroundColor: "#2E86DE"
  },

  tipoButtonText: {
    color: "#2E86DE",
    fontWeight: "bold"
  },

  tipoButtonTextActive: {
    color: "#fff"
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
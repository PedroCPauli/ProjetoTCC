import { useEffect, useState } from "react"

import { MaterialIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'

import * as LocalAuthentication from 'expo-local-authentication'
import * as Location from 'expo-location'

import { Link } from "expo-router"

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native"

import { LinearGradient } from 'expo-linear-gradient'

import { supabase } from "../lib/supabase"

import { Input } from "../components/input"

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

  const [hospitais, setHospitais] = useState<any[]>([])
  const [hospitalSelecionado, setHospitalSelecionado] = useState("")

  const [loading, setLoading] = useState(false)

  /*
    ============================
    BUSCAR HOSPITAIS
    ============================
  */

  async function buscarHospitais() {

    try {

      const {
        data,
        error
      } = await supabase

        .from("hospital")

        .select("*")

        .order("nome")

      if (error) {

        console.log(error)
        return
      }

      setHospitais(data || [])

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    buscarHospitais()

  }, [])

  /*
    ============================
    BUSCA CEP
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
    BIOMETRIA
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
    LOCALIZAÇÃO
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

      Alert.alert(
        "Erro",
        "Não foi possível obter localização"
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
        "Preencha todos os campos obrigatórios"
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

    if (!hospitalSelecionado) {

      Alert.alert(
        "Erro",
        "Selecione o hospital"
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

      const idTipoUsuario =
        tipoUsuario === "admin"
          ? 1
          : 2

      /*
        ENDEREÇO
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
          bairro

        })

        .select()

        .single()

      if (enderecoError) {

        console.log(enderecoError)
        throw enderecoError
      }

      /*
        USUÁRIO
      */

      const {
        data: usuarioData,
        error: usuarioError
      } = await supabase

        .from("usuario")

        .insert({

          idtipousuario:
            idTipoUsuario,

          idhospital:
            Number(hospitalSelecionado),

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

    <LinearGradient

      colors={[
        "#F8FAFC",
        "#EEF4FF",
        "#FFFFFF"
      ]}

      style={styles.gradient}
    >

      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

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

          showsVerticalScrollIndicator={false}
        >

          <View style={styles.container}>

            <View style={styles.card}>

              <Text style={styles.title}>
                Criar conta
              </Text>

              <Text style={styles.subtitle}>
                Cadastro de usuário hospitalar
              </Text>

              {/* DADOS */}

              <Input
                label="Nome completo"
                obrigatorio
                value={nome}
                onChangeText={setNome}
              />

              <Input
                label="Usuário"
                obrigatorio
                value={usuario}
                onChangeText={setUsuario}
              />

              <Input
                label="E-mail"
                obrigatorio
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              {/* HOSPITAL */}

              <Text style={styles.label}>
                Hospital *
              </Text>

              <View style={styles.pickerContainer}>

                <Picker
                  selectedValue={hospitalSelecionado}
                  onValueChange={(itemValue) =>
                    setHospitalSelecionado(itemValue)
                  }
                >

                  <Picker.Item
                    label="Selecione o hospital"
                    value=""
                  />

                  {hospitais.map((hospital) => (

                    <Picker.Item
                      key={hospital.idhospital}
                      label={hospital.nome}
                      value={String(hospital.idhospital)}
                    />

                  ))}

                </Picker>

              </View>

              {/* ENDEREÇO */}

              <Input
                label="CEP"
                obrigatorio
                keyboardType="numeric"
                value={cep}
                onChangeText={buscarCEP}
              />

              <Input
                label="Logradouro"
                obrigatorio
                value={logradouro}
                onChangeText={setLogradouro}
              />

              <Input
                label="Número"
                obrigatorio
                keyboardType="numeric"
                value={numero}
                onChangeText={setNumero}
              />

              <Input
                label="Complemento"
                value={complemento}
                onChangeText={setComplemento}
              />

              <Input
                label="Bairro"
                obrigatorio
                value={bairro}
                onChangeText={setBairro}
              />

              {/* LOCALIZAÇÃO */}

              <Input
                label="Latitude"
                value={latitude}
                editable={false}
              />

              <Input
                label="Longitude"
                value={longitude}
                editable={false}
              />

              {/* TIPO USUÁRIO */}

              <Text style={styles.label}>
                Tipo de Usuário *
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
                        : "#2563EB"
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
                        : "#2563EB"
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

              {/* SENHAS */}

              <Input
                label="Senha"
                obrigatorio
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
              />

              <Input
                label="Confirmar senha"
                obrigatorio
                secureTextEntry
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
              />

            </View>

            {/* BOTÃO */}

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.botao}
              onPress={handleSignup}
            >

              <LinearGradient

                colors={[
                  "#60A5FA",
                  "#3B82F6",
                  "#2563EB"
                ]}

                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}

                style={styles.botaoGradient}
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

              </LinearGradient>

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

    </LinearGradient>
  )
}

const styles = StyleSheet.create({

  gradient: {
    flex: 1
  },

  container: {
    flex: 1,
    padding: 20
  },

  card: {
    backgroundColor: "#FFFFFF",

    padding: 24,

    borderRadius: 28,

    marginBottom: 24,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 8
    },

    shadowOpacity: 0.08,

    shadowRadius: 12,

    elevation: 6
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1E293B"
  },

  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 28
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 10,
    marginTop: 5
  },

  pickerContainer: {

    borderWidth: 1.5,

    borderColor: "#CBD5E1",

    borderRadius: 16,

    overflow: "hidden",

    marginBottom: 22,

    backgroundColor: "#fff"
  },

  tipoButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22
  },

  tipoButton: {

    flex: 1,

    borderWidth: 2,

    borderColor: "#2563EB",

    borderRadius: 16,

    paddingVertical: 16,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 8,

    backgroundColor: "#fff"
  },

  tipoButtonActive: {
    backgroundColor: "#2563EB"
  },

  tipoButtonText: {
    color: "#2563EB",
    fontWeight: "bold"
  },

  tipoButtonTextActive: {
    color: "#fff"
  },

  botao: {

    borderRadius: 18,

    overflow: "hidden",

    elevation: 5,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 6
    },

    shadowOpacity: 0.2,

    shadowRadius: 8
  },

  botaoGradient: {

    height: 58,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 10
  },

  botaoTexto: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold"
  },

  footerText: {
    textAlign: "center",
    marginBottom: 30,
    color: "#64748B",
    fontSize: 15
  },

  footerLink: {
    color: "#2563EB",
    fontWeight: "bold"
  }
})
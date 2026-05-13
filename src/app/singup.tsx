import { MaterialIcons } from '@expo/vector-icons'
import * as LocalAuthentication from 'expo-local-authentication'
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

  const [nome, setNome] =
    useState("")

  const [usuario, setUsuario] =
    useState("")

  const [email, setEmail] =
    useState("")

  const [senha, setSenha] =
    useState("")

  const [
    confirmarSenha,
    setConfirmarSenha
  ] = useState("")

  const [
    tipoUsuario,
    setTipoUsuario
  ] = useState("")

  const [loading, setLoading] =
    useState(false)

  async function ativarBiometria(
    idUsuario: number
  ) {

    try {

      /*
        VERIFICA HARDWARE
      */

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

      /*
        VERIFICA SE EXISTE BIOMETRIA
      */

      const enrolled =
        await LocalAuthentication
          .isEnrolledAsync()

      if (!enrolled) {

        Alert.alert(
          "Biometria",
          "Nenhuma biometria cadastrada no dispositivo"
        )

        return
      }

      /*
        AUTENTICA BIOMETRIA
      */

      const auth =
        await LocalAuthentication
          .authenticateAsync({

            promptMessage:
              "Confirme sua biometria",

            fallbackLabel:
              "Usar senha"

          })

      if (!auth.success) {

        Alert.alert(
          "Erro",
          "Falha na autenticação biométrica"
        )

        return
      }

      /*
        ATIVA BIOMETRIA NO BANCO
      */

      const {
        error
      } = await supabase

        .from("usuario")

        .update({

          biometriaativa: true

        })

        .eq(
          "idusuario",
          idUsuario
        )

      if (error) {

        console.log(error)

        Alert.alert(
          "Erro",
          "Não foi possível ativar biometria"
        )

        return
      }

      Alert.alert(
        "Sucesso",
        "Biometria ativada com sucesso!"
      )

    } catch (error) {

      console.log(error)

      Alert.alert(
        "Erro",
        "Erro ao ativar biometria"
      )
    }
  }

  async function handleSignup() {

    /*
      VALIDA CAMPOS
    */

    if (
      !nome.trim() ||
      !usuario.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {

      Alert.alert(
        "Erro",
        "Preencha todos os campos"
      )

      return
    }

    /*
      VALIDA E-MAIL
    */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {

      Alert.alert(
        "Erro",
        "Informe um e-mail válido"
      )

      return
    }

    /*
      VALIDA TIPO USUÁRIO
    */

    if (!tipoUsuario) {

      Alert.alert(
        "Erro",
        "Selecione o tipo de usuário"
      )

      return
    }

    /*
      VALIDA SENHA
    */

    if (senha.length < 8) {

      Alert.alert(
        "Erro",
        "A senha deve possuir no mínimo 8 caracteres"
      )

      return
    }

    /*
      VALIDA CONFIRMAR SENHA
    */

    if (confirmarSenha.length < 8) {

      Alert.alert(
        "Erro",
        "A confirmação da senha deve possuir no mínimo 8 caracteres"
      )

      return
    }

    /*
      VALIDA SENHAS IGUAIS
    */

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

          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cep: ""

        })

        .select()

        .single()

      if (enderecoError) {

        console.log(
          "Erro endereço:",
          enderecoError
        )

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

          nome: nome,

          usuario: usuario,

          email: email,

          senha: senha,

          biometriaativa: false

        })

        .select()

        .single()

      if (usuarioError) {

        console.log(
          "Erro usuário:",
          usuarioError
        )

        throw usuarioError
      }

      setLoading(false)

      /*
        PERGUNTA BIOMETRIA
      */

      Alert.alert(

        "Sucesso",

        "Usuário cadastrado com sucesso!\n\nDeseja ativar biometria?",

        [

          {
            text: "Não",

            style: "cancel",

            onPress: () => {

              setNome("")
              setUsuario("")
              setEmail("")
              setSenha("")
              setConfirmarSenha("")
              setTipoUsuario("")
            }
          },

          {
            text: "Sim",

            onPress: async () => {

              await ativarBiometria(
                usuarioData.idusuario
              )

              setNome("")
              setUsuario("")
              setEmail("")
              setSenha("")
              setConfirmarSenha("")
              setTipoUsuario("")
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
                autoCapitalize="none"
                onChangeText={setUsuario}
              />

              <Input
                placeholder="E-mail"
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
              />

              {/* TIPO USUÁRIO */}

              <View style={styles.tipoContainer}>

                <Text style={styles.tipoLabel}>
                  Tipo de Usuário
                </Text>

                <View style={styles.tipoButtons}>

                  {/* ADMIN */}

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

                  {/* PLANTONISTA */}

                  <TouchableOpacity
                    style={[

                      styles.tipoButton,

                      tipoUsuario ===
                      "plantonista" &&
                      styles.tipoButtonActive

                    ]}

                    onPress={() =>
                      setTipoUsuario(
                        "plantonista"
                      )
                    }
                  >

                    <MaterialIcons
                      name="medical-services"
                      size={20}
                      color={
                        tipoUsuario ===
                        "plantonista"
                          ? "#fff"
                          : "#2E86DE"
                      }
                    />

                    <Text
                      style={[

                        styles.tipoButtonText,

                        tipoUsuario ===
                        "plantonista" &&
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
                onChangeText={
                  setConfirmarSenha
                }
              />

            </View>

          </View>

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
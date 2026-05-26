import { MaterialIcons } from '@expo/vector-icons';

import { router } from 'expo-router';

import { useRef, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import * as Animatable from 'react-native-animatable';

import { LinearGradient } from 'expo-linear-gradient';

import { Input } from "../components/input";

import { supabase } from '../lib/supabase';

export default function EsqueciSenha() {

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [showSenha, setShowSenha] =
    useState(false);

  const [showConfirmarSenha, setShowConfirmarSenha] =
    useState(false);

  const senhaRef =
    useRef<TextInput>(null);

  const confirmarSenhaRef =
    useRef<TextInput>(null);

  async function redefinirSenha() {

    try {

      if (
        !email.trim() ||
        !senha.trim() ||
        !confirmarSenha.trim()
      ) {

        Alert.alert(
          "Erro",
          "Preencha todos os campos"
        );

        return;
      }

      if (
        senha !== confirmarSenha
      ) {

        Alert.alert(
          "Erro",
          "As senhas não coincidem"
        );

        return;
      }

      /*
        VERIFICA USUÁRIO
      */

      const {
        data: usuario,
        error: usuarioError

      } = await supabase

        .from("usuario")

        .select("*")

        .eq("email", email)

        .single();

      if (
        usuarioError ||
        !usuario
      ) {

        Alert.alert(
          "Erro",
          "Usuário não encontrado"
        );

        return;
      }

      /*
        ALTERA SENHA
      */

      const {
        error: updateError

      } = await supabase

        .from("usuario")

        .update({

          senha: senha

        })

        .eq(
          "idusuario",
          usuario.idusuario
        );

      if (updateError) {

        Alert.alert(
          "Erro",
          updateError.message
        );

        return;
      }

      Alert.alert(
        "Sucesso",
        "Senha alterada com sucesso"
      );

      router.replace("/");

    } catch (error: any) {

      Alert.alert(
        "Erro",
        error.message
      );
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
      />

      <KeyboardAvoidingView

        style={{ flex: 1 }}

        behavior={Platform.select({

          ios: "padding",

          android: undefined

        })}
      >

        <ScrollView

          contentContainerStyle={{
            flexGrow: 1
          }}

          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.container}>

            {/* CARD */}

            <Animatable.View

              animation="fadeInUp"

              duration={1200}

              style={styles.card}
            >

              {/* ÍCONE */}

              <Animatable.View

                animation="pulse"

                iterationCount="infinite"

                duration={2500}

                style={styles.iconArea}
              >

                <MaterialIcons
                  name="lock-reset"
                  size={42}
                  color="#2563EB"
                />

              </Animatable.View>

              {/* TÍTULOS */}

              <Text style={styles.title}>
                Redefinir Senha
              </Text>

              <Text style={styles.subtitle}>
                Informe seu email e escolha uma nova senha
              </Text>

              {/* EMAIL */}

              <Input

                label="Email"

                obrigatorio

                autoCapitalize="none"

                keyboardType="email-address"

                returnKeyType="next"

                onSubmitEditing={() =>
                  senhaRef.current?.focus()
                }

                value={email}

                onChangeText={setEmail}
              />

              {/* SENHA */}

              <View>

                <Input

                  ref={senhaRef}

                  label="Nova senha"

                  obrigatorio

                  secureTextEntry={
                    !showSenha
                  }

                  returnKeyType="next"

                  onSubmitEditing={() =>
                    confirmarSenhaRef.current?.focus()
                  }

                  value={senha}

                  onChangeText={setSenha}
                />

                <TouchableOpacity

                  style={styles.eyeButton}

                  onPress={() =>
                    setShowSenha(
                      !showSenha
                    )
                  }
                >

                  <MaterialIcons

                    name={
                      showSenha
                        ? "visibility"
                        : "visibility-off"
                    }

                    size={22}

                    color="#64748B"
                  />

                </TouchableOpacity>

              </View>

              {/* CONFIRMAR SENHA */}

              <View>

                <Input

                  ref={confirmarSenhaRef}

                  label="Confirmar senha"

                  obrigatorio

                  secureTextEntry={
                    !showConfirmarSenha
                  }

                  returnKeyType="done"

                  onSubmitEditing={
                    redefinirSenha
                  }

                  value={confirmarSenha}

                  onChangeText={setConfirmarSenha}
                />

                <TouchableOpacity

                  style={styles.eyeButton}

                  onPress={() =>
                    setShowConfirmarSenha(
                      !showConfirmarSenha
                    )
                  }
                >

                  <MaterialIcons

                    name={
                      showConfirmarSenha
                        ? "visibility"
                        : "visibility-off"
                    }

                    size={22}

                    color="#64748B"
                  />

                </TouchableOpacity>

              </View>

              {/* BOTÃO */}

              <TouchableOpacity

                style={styles.botao}

                activeOpacity={0.9}

                onPress={redefinirSenha}
              >

                <LinearGradient

                  colors={[
                    "#3B82F6",
                    "#2563EB"
                  ]}

                  start={{
                    x: 0,
                    y: 0
                  }}

                  end={{
                    x: 1,
                    y: 0
                  }}

                  style={styles.botaoGradient}
                >

                  <MaterialIcons
                    name="verified-user"
                    size={22}
                    color="#fff"
                  />

                  <Text style={styles.botaoTexto}>
                    Alterar Senha
                  </Text>

                </LinearGradient>

              </TouchableOpacity>

              {/* VOLTAR */}

              <TouchableOpacity
                onPress={() =>
                  router.back()
                }
              >

                <Text style={styles.voltar}>
                  Voltar ao login
                </Text>

              </TouchableOpacity>

            </Animatable.View>

          </View>

        </ScrollView>

      </KeyboardAvoidingView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  gradient: {
    flex: 1
  },

  container: {

    flex: 1,

    justifyContent: "center",

    padding: 24
  },

  card: {

    backgroundColor: "#FFFFFF",

    borderRadius: 30,

    padding: 26,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 10
    },

    shadowOpacity: 0.08,

    shadowRadius: 18,

    elevation: 10
  },

  iconArea: {

    alignSelf: "center",

    width: 95,

    height: 95,

    borderRadius: 30,

    backgroundColor: "#DBEAFE",

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 24
  },

  title: {

    fontSize: 30,

    fontWeight: "bold",

    textAlign: "center",

    color: "#0F172A"
  },

  subtitle: {

    textAlign: "center",

    color: "#64748B",

    marginTop: 8,

    marginBottom: 28,

    fontSize: 15
  },

  eyeButton: {

    position: "absolute",

    right: 16,

    top: 18
  },

  botao: {

    borderRadius: 18,

    overflow: "hidden",

    marginTop: 18,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 6
    },

    shadowOpacity: 0.25,

    shadowRadius: 10,

    elevation: 8
  },

  botaoGradient: {

    height: 58,

    borderRadius: 18,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center"
  },

  botaoTexto: {

    color: "#fff",

    fontWeight: "bold",

    fontSize: 17,

    marginLeft: 8
  },

  voltar: {

    textAlign: "center",

    marginTop: 22,

    color: "#2563EB",

    fontWeight: "700",

    fontSize: 15
  }
});
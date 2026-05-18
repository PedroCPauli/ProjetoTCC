import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import * as Animatable from 'react-native-animatable';

import { Input } from "../components/input";

import { supabase } from "../lib/supabase";

export default function Index() {

  const [usuario, setUsuario] =
    useState<string>("");

  const [password, setPassword] =
    useState<string>("");

  const usuarioRef =
    useRef<TextInput>(null);

  const passwordRef =
    useRef<TextInput>(null);

  async function verifyAvaliableAuthentication():
    Promise<void> {

    try {

      const compatible =
        await LocalAuthentication
          .hasHardwareAsync();

      if (!compatible) {

        console.log(
          "Dispositivo não suporta biometria"
        );

        return;
      }

    } catch (error) {

      console.log(error);
    }
  }

  async function handleSigIn():
    Promise<void> {

    /*
      VALIDA CAMPOS
    */

    if (
      !usuario.trim() ||
      !password.trim()
    ) {

      Alert.alert(
        "Entrar",
        "Preencha usuário e senha"
      );

      return;
    }

    try {

      /*
        BUSCA USUÁRIO
      */

      const {
        data,
        error

      } = await supabase

        .from("usuario")

        .select("*")

        .eq("usuario", usuario)

        .eq("senha", password)

        .single();

      /*
        LOGIN INVÁLIDO
      */

      if (error || !data) {

        Alert.alert(
          "Erro",
          "Usuário ou senha inválidos"
        );

        return;
      }

      console.log(
        "Usuário encontrado:",
        data
      );

      /*
        SALVA USUÁRIO LOGADO
      */

      await AsyncStorage.setItem(
        "@medponto_usuario",
        JSON.stringify(data)
      );

      /*
        POSSUI BIOMETRIA
      */

      if (data.biometriaativa === true) {

        const auth =
          await LocalAuthentication
            .authenticateAsync({

              promptMessage:
                "Confirme sua biometria",

              cancelLabel:
                "Cancelar"

            });

        /*
          BIOMETRIA INVÁLIDA
        */

        if (!auth.success) {

          Alert.alert(
            "Erro",
            "Biometria inválida"
          );

          return;
        }

        Alert.alert(
          "Sucesso",
          "Login realizado com biometria!"
        );

        /*
          ADMIN = 1
          PLANTONISTA = 2
        */

        if (data.idtipousuario === 1) {

          router.replace("/admin");

        } else {

          router.replace("/ponto");
        }

      } else {

        /*
          SEM BIOMETRIA
        */

        Alert.alert(

          "Biometria",

          "Sem biometria cadastrada, continuar somente com senha?",

          [

            {
              text: "Não",

              style: "cancel",

              onPress: () => {

                router.replace("/singup");
              }
            },

            {
              text: "Sim",

              onPress: () => {

                Alert.alert(
                  "Sucesso",
                  "Login realizado com sucesso!"
                );

                /*
                  ADMIN = 1
                  PLANTONISTA = 2
                */

                if (data.idtipousuario === 1) {

                  router.replace("/admin");

                } else {

                  router.replace("/ponto");
                }
              }
            }
          ]
        );
      }

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Não foi possível realizar login"
      );
    }
  }

  useEffect(() => {

    verifyAvaliableAuthentication();

  }, []);

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

        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.container}>

          <Animatable.Image

            animation="fadeInDown"

            duration={1500}

            source={
              require("../assets/logoApp.png")
            }

            style={styles.illustration}
          />

          <Text style={styles.title}>
            Entrar
          </Text>

          <Text style={styles.subtitle}>

            Acesse sua conta
            com usuário e senha

          </Text>

          <View style={styles.card}>

            <Input

              ref={usuarioRef}

              placeholder="Usuário"

              autoCapitalize="none"

              returnKeyType="next"

              onSubmitEditing={() =>
                passwordRef.current?.focus()
              }

              onChangeText={setUsuario}

              value={usuario}
            />

            <Input

              ref={passwordRef}

              placeholder="Senha"

              secureTextEntry

              returnKeyType="done"

              onSubmitEditing={handleSigIn}

              onChangeText={setPassword}

              value={password}
            />

            <TouchableOpacity

              style={styles.button}

              onPress={handleSigIn}
            >

              <MaterialIcons
                name="login"
                size={22}
                color="#fff"
              />

              <Text style={styles.buttonText}>
                Entrar
              </Text>

            </TouchableOpacity>

          </View>

          <Text style={styles.footerText}>

            Não tem uma conta?

            {' '}

            <Link

              href={'/singup'}

              style={styles.footerLink}
            >

              Cadastre-se aqui

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
    backgroundColor: '#F4F6F8',
    padding: 24,
    justifyContent: 'center'
  },

  illustration: {
    width: '100%',
    height: 280,
    resizeMode: 'contain'
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B'
  },

  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20
  },

  card: {
    backgroundColor: '#fff',

    borderRadius: 20,

    padding: 20,

    elevation: 5,

    gap: 14,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2
    },

    shadowOpacity: 0.1,

    shadowRadius: 4
  },

  button: {
    backgroundColor: '#2E86DE',

    padding: 15,

    borderRadius: 12,

    alignItems: 'center',

    flexDirection: 'row',

    justifyContent: 'center',

    gap: 8
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748B'
  },

  footerLink: {
    color: '#2563EB',
    fontWeight: 'bold'
  }

});
import { MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as LocalAuthentication from 'expo-local-authentication';

import { Link, router } from "expo-router";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import * as Animatable from 'react-native-animatable';

import { LinearGradient } from 'expo-linear-gradient';

import { Input } from "../components/input";

import { supabase } from "../lib/supabase";

export default function Index() {

  const [usuario, setUsuario] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const usuarioRef =
    useRef<TextInput>(null);

  const passwordRef =
    useRef<TextInput>(null);

  const scaleAnim =
    useRef(
      new Animated.Value(1)
    ).current;

  /*
    ===================================
    BIOMETRIA DISPONÍVEL
    ===================================
  */

  async function verifyAvaliableAuthentication() {

    try {

      const compatible =
        await LocalAuthentication
          .hasHardwareAsync();

      if (!compatible) {

        console.log(
          "Sem biometria"
        );

        return;
      }

    } catch (error) {

      console.log(error);
    }
  }

  /*
    ===================================
    ANIMAÇÃO BOTÃO
    ===================================
  */

  const animatePressIn = () => {

    Animated.spring(scaleAnim, {

      toValue: 0.97,

      useNativeDriver: true

    }).start();
  };

  const animatePressOut = () => {

    Animated.spring(scaleAnim, {

      toValue: 1,

      useNativeDriver: true

    }).start();
  };

  /*
    ===================================
    LOGIN
    ===================================
  */

  async function handleSigIn() {

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

      setLoading(true);

      const {
        data,
        error

      } = await supabase

        .from("usuario")

        .select("*")

        .eq("usuario", usuario)

        .eq("senha", password)

        .single();

      if (error || !data) {

        setLoading(false);

        Alert.alert(
          "Erro",
          "Usuário ou senha inválidos"
        );

        return;
      }

      await AsyncStorage.setItem(
        "@medponto_usuario",
        JSON.stringify(data)
      );

      /*
        BIOMETRIA
      */

      if (data.biometriaativa === true) {

        const supportedTypes =
  await LocalAuthentication.supportedAuthenticationTypesAsync();

  const possuiFaceID =
      supportedTypes.includes(
     LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
   );

  const auth =
      await LocalAuthentication.authenticateAsync({
       promptMessage: possuiFaceID
        ? "Confirme sua identidade com Face ID"
        : "Confirme sua biometria",
      cancelLabel: "Cancelar",
      disableDeviceFallback: false
    });

        if (!auth.success) {

          setLoading(false);

          Alert.alert(
            "Erro",
            "Biometria inválida"
          );

          return;
        }
      }

      setLoading(false);

      Alert.alert(
        "Sucesso",
        "Login realizado!"
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

    } catch (error) {

      setLoading(false);

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao realizar login"
      );
    }
  }

  useEffect(() => {

    verifyAvaliableAuthentication();

  }, []);

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

      {/* EFEITOS FUNDO */}

      <View style={styles.circleTop} />

      <View style={styles.circleBottom} />

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

            {/* LOGO */}

            <Animatable.View

              animation="fadeInDown"

              duration={1500}

              style={styles.logoContainer}
            >

              <View style={styles.logoCard}>

                <Image

                  source={
                    require("../assets/logoApp.png")
                  }

                  style={styles.logo}
                />

              </View>

            </Animatable.View>

            {/* TEXTOS */}

            <Animatable.View

              animation="fadeInUp"

              duration={1200}

            >

              <Text style={styles.title}>
                MEDPonto
              </Text>

              <Text style={styles.subtitle}>

                Gestão inteligente
                de ponto hospitalar

              </Text>

            </Animatable.View>

            {/* CARD */}

            <Animatable.View

              animation="fadeInUp"

              delay={300}

              duration={1200}

              style={styles.card}
            >

              {/* HEADER CARD */}

              <View style={styles.cardHeader}>

                <View style={styles.iconCard}>

                  <MaterialIcons
                    name="medical-services"
                    size={28}
                    color="#2563EB"
                  />

                </View>

                <View>

                  <Text style={styles.cardTitle}>
                    Bem-vindo
                  </Text>

                  <Text style={styles.cardSubtitle}>
                    Faça login para continuar
                  </Text>

                </View>

              </View>

              {/* USUÁRIO */}

              <Input

                ref={usuarioRef}

                label="Usuário"

                obrigatorio

                autoCapitalize="none"

                returnKeyType="next"

                onSubmitEditing={() =>
                  passwordRef.current?.focus()
                }

                onChangeText={setUsuario}

                value={usuario}
              />

              {/* SENHA */}

              <View>

                <Input

                  ref={passwordRef}

                  label="Senha"

                  obrigatorio

                  secureTextEntry={
                    !showPassword
                  }

                  returnKeyType="done"

                  onSubmitEditing={
                    handleSigIn
                  }

                  onChangeText={
                    setPassword
                  }

                  value={password}
                />

                <TouchableOpacity

                  style={styles.eyeButton}

                  onPress={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  <MaterialIcons

                    name={
                      showPassword
                        ? "visibility"
                        : "visibility-off"
                    }

                    size={22}

                    color="#64748B"
                  />

                </TouchableOpacity>

              </View>

              {/* ESQUECI SENHA */}

              <TouchableOpacity

                style={styles.esqueciContainer}

                onPress={() =>
                  router.push("/esqueci-senha")
                }
              >

                <Text style={styles.esqueciSenha}>
                  Esqueci minha senha
                </Text> 

              </TouchableOpacity>

              {/* BOTÃO */}

              <TouchableOpacity

                activeOpacity={0.9}

                onPressIn={animatePressIn}

                onPressOut={animatePressOut}

                onPress={handleSigIn}
              >

                <Animated.View

                  style={[

                    styles.button,

                    {
                      transform: [
                        {
                          scale: scaleAnim
                        }
                      ]
                    }

                  ]}
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

                    style={styles.buttonGradient}
                  >

                    <MaterialIcons
                      name="login"
                      size={22}
                      color="#fff"
                    />

                    <Text style={styles.buttonText}>

                      {loading
                        ? "Entrando..."
                        : "Entrar"}

                    </Text>

                  </LinearGradient>

                </Animated.View>

              </TouchableOpacity>

            </Animatable.View>

            {/* FOOTER */}

            <Animatable.View

              animation="fadeInUp"

              delay={600}

            >

              <Text style={styles.footerText}>

                Não possui conta?

                {" "}

                <Link

                  href={"/singup"}

                  style={styles.footerLink}
                >

                  Criar conta

                </Link>

              </Text>

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

  circleTop: {

    position: "absolute",

    width: 320,

    height: 320,

    borderRadius: 200,

    backgroundColor: "#DBEAFE",

    top: -120,

    right: -100,

    opacity: 0.5
  },

  circleBottom: {

    position: "absolute",

    width: 280,

    height: 280,

    borderRadius: 200,

    backgroundColor: "#BFDBFE",

    bottom: -120,

    left: -100,

    opacity: 0.4
  },

  container: {

    flex: 1,

    justifyContent: "center",

    padding: 24
  },

  logoContainer: {

    alignItems: "center",

    marginBottom: 10
  },

  logoCard: {

    width: 170,

    height: 170,

    borderRadius: 40,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 12
    },

    shadowOpacity: 0.12,

    shadowRadius: 20,

    elevation: 10
  },

  logo: {

    width: 140,

    height: 140,

    resizeMode: "contain"
  },

  title: {

    fontSize: 42,

    fontWeight: "bold",

    color: "#0F172A",

    textAlign: "center"
  },

  subtitle: {

    fontSize: 16,

    color: "#64748B",

    textAlign: "center",

    marginTop: 10,

    marginBottom: 35,

    lineHeight: 24
  },

  card: {

    backgroundColor: "#FFFFFF",

    borderRadius: 32,

    padding: 24,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 10
    },

    shadowOpacity: 0.08,

    shadowRadius: 18,

    elevation: 8
  },

  cardHeader: {

    flexDirection: "row",

    alignItems: "center",

    gap: 14,

    marginBottom: 22
  },

  iconCard: {

    width: 58,

    height: 58,

    borderRadius: 20,

    backgroundColor: "#DBEAFE",

    justifyContent: "center",

    alignItems: "center"
  },

  cardTitle: {

    fontSize: 22,

    fontWeight: "bold",

    color: "#0F172A"
  },

  cardSubtitle: {

    color: "#64748B",

    marginTop: 4
  },

  eyeButton: {

    position: "absolute",

    right: 16,

    top: 18
  },

  esqueciContainer: {

    alignItems: "flex-end",

    marginTop: 6
  },

  esqueciSenha: {

    color: "#2563EB",

    fontWeight: "700",

    fontSize: 14
  },

  button: {

    borderRadius: 22,

    overflow: "hidden",

    marginTop: 24,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 8
    },

    shadowOpacity: 0.25,

    shadowRadius: 14,

    elevation: 10
  },

  buttonGradient: {

    height: 62,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: 22
  },

  buttonText: {

    color: "#fff",

    fontSize: 18,

    fontWeight: "700",

    marginLeft: 10
  },

  footerText: {

    textAlign: "center",

    marginTop: 30,

    color: "#64748B",

    fontSize: 15
  },

  footerLink: {

    color: "#2563EB",

    fontWeight: "bold"
  }

});
import { MaterialIcons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from "expo-local-authentication";

import * as Location from 'expo-location';

import { router } from "expo-router";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import { LinearGradient } from 'expo-linear-gradient';

import * as Animatable from 'react-native-animatable';

import { supabase } from "../lib/supabase";

export default function PontoScreen() {

  const [dataAtual, setDataAtual] =
    useState("");

  const [horaAtual, setHoraAtual] =
    useState("");

  const [entrada, setEntrada] =
    useState("");

  const [saida, setSaida] =
    useState("");

  const [statusLocal, setStatusLocal] =
    useState("");

  const scaleAnim =
    useRef(
      new Animated.Value(1)
    ).current;

  /*
    =========================
    RELÓGIO
    =========================
  */

  useEffect(() => {

    const atualizarHora = () => {

      const agora = new Date();

      setDataAtual(

        agora.toLocaleDateString(
          "pt-BR",
          {
            timeZone:
              "America/Sao_Paulo"
          }
        )
      );

      setHoraAtual(

        agora.toLocaleTimeString(
          "pt-BR",
          {
            timeZone:
              "America/Sao_Paulo"
          }
        )
      );
    };

    atualizarHora();

    const intervalo =
      setInterval(
        atualizarHora,
        1000
      );

    return () =>
      clearInterval(intervalo);

  }, []);

  /*
    =========================
    ANIMAÇÃO BOTÃO
    =========================
  */

  const animatePressIn = () => {

    Animated.spring(scaleAnim, {

      toValue: 0.96,

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
    =========================
    CALCULAR DISTÂNCIA
    =========================
  */

  function calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {

    const R = 6371e3;

    const φ1 =
      lat1 * Math.PI / 180;

    const φ2 =
      lat2 * Math.PI / 180;

    const Δφ =
      (lat2 - lat1) *
      Math.PI / 180;

    const Δλ =
      (lon2 - lon1) *
      Math.PI / 180;

    const a =

      Math.sin(Δφ / 2) *
      Math.sin(Δφ / 2) +

      Math.cos(φ1) *
      Math.cos(φ2) *

      Math.sin(Δλ / 2) *
      Math.sin(Δλ / 2);

    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  }

  /*
    =========================
    BATER PONTO
    =========================
  */

  async function baterPonto() {

    try {

      const { status } =

        await Location
          .requestForegroundPermissionsAsync();

      if (status !== "granted") {

        Alert.alert(
          "Erro",
          "Permissão de localização negada"
        );

        return;
      }

      const localAtual =

        await Location
          .getCurrentPositionAsync({

            accuracy:
              Location.Accuracy.High

          });

      const usuarioStorage =

        await AsyncStorage.getItem(
          "@medponto_usuario"
        );

      if (!usuarioStorage) {

        Alert.alert(
          "Erro",
          "Usuário não encontrado"
        );

        return;
      }

      const usuario =
        JSON.parse(usuarioStorage);

      /*
=========================
BIOMETRIA OBRIGATÓRIA
=========================
*/

      if (usuario.biometriaativa) {

        const hardwareDisponivel =
          await LocalAuthentication.hasHardwareAsync();

        const biometriaCadastrada =
          await LocalAuthentication.isEnrolledAsync();

        if (
          !hardwareDisponivel ||
          !biometriaCadastrada
        ) {

          Alert.alert(
            "Erro",
            "Nenhuma biometria cadastrada no dispositivo."
          );

          return;
        }

        const auth =
          await LocalAuthentication.authenticateAsync({

            promptMessage:
              "Confirme sua biometria",

            cancelLabel:
              "Cancelar",

            fallbackLabel:
              "Usar senha",

            disableDeviceFallback:
              false
          });

        if (!auth.success) {

          Alert.alert(
            "Erro",
            "Autenticação biométrica inválida."
          );

          return;
        }
      }

      if (!usuario.idhospital) {

        Alert.alert(
          "Erro",
          "Usuário sem hospital cadastrado"
        );

        return;
      }

      const {
        data: hospital,
        error: hospitalError

      } = await supabase

        .from("hospital")

        .select("*")

        .eq(
          "idhospital",
          usuario.idhospital
        )

        .single();

      if (
        hospitalError ||
        !hospital
      ) {

        Alert.alert(
          "Erro",
          "Hospital não encontrado"
        );

        return;
      }

      const distancia =

        calcularDistancia(

          Number(
            localAtual.coords.latitude
          ),

          Number(
            localAtual.coords.longitude
          ),

          Number(
            hospital.latitude
          ),

          Number(
            hospital.longitude
          )
        );

      const RAIO_PERMITIDO = 200;

      if (distancia > RAIO_PERMITIDO) {

        Alert.alert(
          "Localização inválida",
          `Você está a ${Math.round(distancia)} metros do hospital autorizado`
        );

        return;
      }

      const agora = new Date();

      const data =

        agora.toLocaleDateString(
          "sv-SE",
          {
            timeZone:
              "America/Sao_Paulo"
          }
        );

      const hora =

        agora.toLocaleTimeString(
          "pt-BR",
          {
            timeZone:
              "America/Sao_Paulo"
          }
        );

      const {

        data: pontoExistente,
        error: pontoError

      } = await supabase

        .from("ponto")

        .select("*")

        .eq(
          "idusuario",
          usuario.idusuario
        )

        .eq(
          "data",
          data
        )

        .maybeSingle();

      if (pontoError) {

        Alert.alert(
          "Erro",
          pontoError.message
        );

        return;
      }

      /*
        ENTRADA
      */

      if (!pontoExistente) {

        const {
          error: insertError
        } = await supabase

          .from("ponto")

          .insert([
            {

              idusuario:
                usuario.idusuario,

              idhospital:
                usuario.idhospital,

              data: data,

              horaentrada:
                hora,

              horasaida:
                null,

              validacaobiometrica:
                usuario.biometriaativa || false,

              validacaolocalizacao:
                true
            }
          ]);

        if (insertError) {

          Alert.alert(
            "Erro",
            insertError.message
          );

          return;
        }

        setEntrada(hora);

        setStatusLocal(
          "Entrada registrada com sucesso"
        );

        Alert.alert(
          "Sucesso",
          "Entrada registrada"
        );

        return;
      }

      /*
        SAÍDA
      */

      if (
        pontoExistente.horasaida
      ) {

        Alert.alert(
          "Aviso",
          "Ponto de hoje já registrado!"
        );

        return;
      }

      const {
        error: updateError
      } = await supabase

        .from("ponto")

        .update({

          horasaida:
            hora

        })

        .eq(
          "idponto",
          pontoExistente.idponto
        );

      if (updateError) {

        Alert.alert(
          "Erro",
          updateError.message
        );

        return;
      }

      setSaida(hora);

      setStatusLocal(
        "Saída registrada com sucesso"
      );

      Alert.alert(
        "Sucesso",
        "Saída registrada"
      );

    } catch (err: any) {

      console.log(err);

      Alert.alert(
        "Erro",
        err?.message ||
        "Erro ao bater ponto"
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

      {/* DETALHES FUNDO */}

      <View style={styles.circleTop} />

      <View style={styles.circleBottom} />

      <View style={styles.container}>

        {/* HEADER */}

        <Animatable.View

          animation="fadeInDown"

          duration={1000}

          style={styles.header}
        >

          <View>

            <Text style={styles.bemvindo}>
              MEDPonto
            </Text>

            <Text style={styles.subtitulo}>
              Registro inteligente
            </Text>

          </View>

          <View style={styles.iconHeader}>

            <MaterialIcons
              name="medical-services"
              size={28}
              color="#2563EB"
            />

          </View>

        </Animatable.View>

        {/* CARD PRINCIPAL */}

        <Animatable.View

          animation="fadeInUp"

          duration={1200}

          style={styles.card}
        >

          <View style={styles.clockContainer}>

            <Text style={styles.labelClock}>
              Horário Atual
            </Text>

            <Text style={styles.hora}>
              {horaAtual}
            </Text>

            <Text style={styles.data}>
              {dataAtual}
            </Text>

          </View>

          {statusLocal !== "" && (

            <View style={styles.statusContainer}>

              <MaterialIcons
                name="verified"
                size={18}
                color="#22C55E"
              />

              <Text style={styles.status}>
                {statusLocal}
              </Text>

            </View>
          )}

          {/* BOTÃO */}

          <TouchableWithoutFeedback

            onPressIn={animatePressIn}

            onPressOut={animatePressOut}

            onPress={baterPonto}
          >

            <Animated.View

              style={[

                styles.botaoContainer,

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
                  y: 1
                }}

                style={styles.botao}
              >

                <MaterialIcons
                  name="fingerprint"
                  size={30}
                  color="#fff"
                />

                <Text style={styles.textoBotao}>
                  Bater Ponto
                </Text>

              </LinearGradient>

            </Animated.View>

          </TouchableWithoutFeedback>

          {/* REGISTROS */}

          <View style={styles.registrosArea}>

            <View style={styles.registroCard}>

              <View style={styles.iconEntrada}>

                <MaterialIcons
                  name="login"
                  size={22}
                  color="#22C55E"
                />

              </View>

              <View>

                <Text style={styles.registroTitulo}>
                  Entrada
                </Text>

                <Text style={styles.registroHorario}>
                  {entrada || "--:--:--"}
                </Text>

              </View>

            </View>

            <View style={styles.registroCard}>

              <View style={styles.iconSaida}>

                <MaterialIcons
                  name="logout"
                  size={22}
                  color="#EF4444"
                />

              </View>

              <View>

                <Text style={styles.registroTitulo}>
                  Saída
                </Text>

                <Text style={styles.registroHorario}>
                  {saida || "--:--:--"}
                </Text>

              </View>

            </View>

          </View>

        </Animatable.View>

        {/* MENU */}

        <View style={styles.menu}>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              router.replace("/")
            }
          >

            <MaterialIcons
              name="home"
              size={26}
              color="#64748B"
            />

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButtonActive}
          >

            <MaterialIcons
              name="fingerprint"
              size={30}
              color="#fff"
            />

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              router.replace("/config")
            }
          >

            <MaterialIcons
              name="settings"
              size={26}
              color="#64748B"
            />

          </TouchableOpacity>

        </View>

      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  gradient: {
    flex: 1
  },

  circleTop: {

    position: "absolute",

    width: 260,

    height: 260,

    borderRadius: 200,

    backgroundColor: "#DBEAFE",

    top: -100,

    right: -80,

    opacity: 0.5
  },

  circleBottom: {

    position: "absolute",

    width: 240,

    height: 240,

    borderRadius: 200,

    backgroundColor: "#E0F2FE",

    bottom: -100,

    left: -80,

    opacity: 0.5
  },

  container: {

    flex: 1,

    paddingTop: 70,

    paddingHorizontal: 22,

    justifyContent: "space-between"
  },

  header: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center"
  },

  bemvindo: {

    fontSize: 30,

    fontWeight: "bold",

    color: "#0F172A"
  },

  subtitulo: {

    fontSize: 15,

    color: "#64748B",

    marginTop: 4
  },

  iconHeader: {

    width: 58,

    height: 58,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 5
    },

    shadowOpacity: 0.08,

    shadowRadius: 10,

    elevation: 5
  },

  card: {

    backgroundColor: "#FFFFFF",

    borderRadius: 32,

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

  clockContainer: {

    alignItems: "center",

    marginBottom: 28
  },

  labelClock: {

    fontSize: 15,

    color: "#64748B",

    marginBottom: 10
  },

  hora: {

    fontSize: 48,

    fontWeight: "bold",

    color: "#2563EB"
  },

  data: {

    marginTop: 10,

    fontSize: 17,

    color: "#475569",

    fontWeight: "500"
  },

  statusContainer: {

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 6,

    marginBottom: 24
  },

  status: {

    color: "#22C55E",

    fontWeight: "600",

    fontSize: 15
  },

  botaoContainer: {

    borderRadius: 24,

    overflow: "hidden",

    marginBottom: 30
  },

  botao: {

    height: 68,

    borderRadius: 24,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 12
  },

  textoBotao: {

    color: "#FFFFFF",

    fontSize: 19,

    fontWeight: "bold"
  },

  registrosArea: {

    gap: 16
  },

  registroCard: {

    backgroundColor: "#F8FAFC",

    borderRadius: 20,

    padding: 18,

    flexDirection: "row",

    alignItems: "center",

    gap: 14
  },

  iconEntrada: {

    width: 50,

    height: 50,

    borderRadius: 16,

    backgroundColor: "#DCFCE7",

    justifyContent: "center",

    alignItems: "center"
  },

  iconSaida: {

    width: 50,

    height: 50,

    borderRadius: 16,

    backgroundColor: "#FEE2E2",

    justifyContent: "center",

    alignItems: "center"
  },

  registroTitulo: {

    fontSize: 14,

    color: "#64748B"
  },

  registroHorario: {

    fontSize: 18,

    fontWeight: "bold",

    color: "#0F172A",

    marginTop: 2
  },

  menu: {

    backgroundColor: "#FFFFFF",

    borderRadius: 28,

    paddingVertical: 16,

    paddingHorizontal: 30,

    marginBottom: 22,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 0
    },

    shadowOpacity: 0.06,

    shadowRadius: 10,

    elevation: 10
  },

  menuButton: {

    width: 52,

    height: 52,

    borderRadius: 18,

    justifyContent: "center",

    alignItems: "center"
  },

  menuButtonActive: {

    width: 62,

    height: 62,

    borderRadius: 22,

    backgroundColor: "#2563EB",

    justifyContent: "center",

    alignItems: "center",

    marginTop: -40,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 10
    },

    shadowOpacity: 0.2,

    shadowRadius: 12,

    elevation: 12
  }
});
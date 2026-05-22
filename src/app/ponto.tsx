import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

import { supabase } from "../lib/supabase";

export default function PontoScreen() {

  const [dataAtual, setDataAtual] = useState("");
  const [horaAtual, setHoraAtual] = useState("");

  const [entrada, setEntrada] = useState("");
  const [saida, setSaida] = useState("");

  const [statusLocal, setStatusLocal] =
    useState("");

  const scaleAnim =
    useRef(new Animated.Value(1)).current;

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
    ANIMAÇÃO
    =========================
  */

  const animatePressIn = () => {

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = () => {

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
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

      /*
        PERMISSÃO GPS
      */

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

      /*
        LOCALIZAÇÃO ATUAL
      */

      const localAtual =
        await Location
          .getCurrentPositionAsync({

            accuracy:
              Location.Accuracy.High

          });

      /*
        USUÁRIO LOGADO
      */

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
        VALIDA HOSPITAL
      */

      if (!usuario.idhospital) {

        Alert.alert(
          "Erro",
          "Usuário sem hospital cadastrado"
        );

        return;
      }

      /*
        BUSCA ENDEREÇO
      */

      const {
        data: endereco,
        error: enderecoError

      } = await supabase

        .from("endereco")

        .select("*")

        .eq(
          "idendereco",
          usuario.idendereco
        )

        .single();

      if (
        enderecoError ||
        !endereco
      ) {

        console.log(
          enderecoError
        );

        Alert.alert(
          "Erro",
          "Endereço não encontrado"
        );

        return;
      }

      /*
        VALIDA LAT/LONG
      */

      if (
        !endereco.latitude ||
        !endereco.longitude
      ) {

        Alert.alert(
          "Erro",
          "Endereço sem localização"
        );

        return;
      }

      /*
        DISTÂNCIA
      */

      const distancia =
        calcularDistancia(

          Number(
            localAtual.coords.latitude
          ),

          Number(
            localAtual.coords.longitude
          ),

          Number(
            endereco.latitude
          ),

          Number(
            endereco.longitude
          )
        );

      /*
        LIMITE
      */

      if (distancia > 150) {

        Alert.alert(
          "Localização inválida",
          `Você está a ${Math.round(distancia)}m do local permitido`
        );

        return;
      }

      /*
        DATA / HORA
      */

      const agora = new Date();

      const data =
        agora.toLocaleDateString(
          "sv-SE"
        );

      const hora =
        agora.toLocaleTimeString(
          "pt-BR",
          {
            timeZone:
              "America/Sao_Paulo"
          }
        );

      /*
        BUSCA PONTO
      */

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

        console.log(
          pontoError
        );

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

          console.log(
            insertError
          );

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

        console.log(
          updateError
        );

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

      console.log(
        "ERRO COMPLETO:",
        err
      );

      Alert.alert(
        "Erro inesperado",
        err?.message ||
        "Erro ao bater ponto"
      );
    }
  }

  return (

    <View style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.titulo}>
          Registro de Ponto
        </Text>

        <Text style={styles.data}>
          📅 {dataAtual}
        </Text>

        <Text style={styles.hora}>
          {horaAtual}
        </Text>

        {statusLocal !== "" && (

          <Text style={styles.status}>
            {statusLocal}
          </Text>
        )}

        <TouchableWithoutFeedback
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          onPress={baterPonto}
        >

          <Animated.View
            style={[
              styles.botao,
              {
                transform: [
                  {
                    scale: scaleAnim
                  }
                ]
              }
            ]}
          >

            <MaterialIcons
              name="fingerprint"
              size={26}
              color="#fff"
            />

            <Text style={styles.textoBotao}>
              Bater Ponto
            </Text>

          </Animated.View>

        </TouchableWithoutFeedback>

        {entrada !== "" && (

          <Text style={styles.registro}>
            ✅ Entrada: {entrada}
          </Text>
        )}

        {saida !== "" && (

          <Text style={styles.registro}>
            ❌ Saída: {saida}
          </Text>
        )}

      </View>

      <View style={styles.menu}>

        <TouchableOpacity
          onPress={() =>
            router.replace("/")
          }
        >

          <MaterialIcons
            name="home"
            size={28}
            color="#555"
          />

        </TouchableOpacity>

        <TouchableOpacity>

          <MaterialIcons
            name="schedule"
            size={28}
            color="#2E86DE"
          />

        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.replace("/config")
          }
        >

          <MaterialIcons
            name="settings"
            size={28}
            color="#555"
          />

        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    paddingTop: 60
  },

  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E293B'
  },

  data: {
    fontSize: 18,
    color: '#475569'
  },

  hora: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2E86DE',
    marginVertical: 15
  },

  status: {
    color: '#27AE60',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  botao: {
    backgroundColor: '#2E86DE',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4
  },

  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },

  registro: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600'
  },

  menu: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: '#ddd'
  }
});
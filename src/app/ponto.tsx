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
  const [statusLocal, setStatusLocal] = useState("");

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();

      setDataAtual(
        agora.toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        })
      );

      setHoraAtual(
        agora.toLocaleTimeString("pt-BR", {
          timeZone: "America/Sao_Paulo"
        })
      );
    };

    atualizarHora();
    const intervalo = setInterval(atualizarHora, 1000);

    return () => clearInterval(intervalo);
  }, []);

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

  const baterPonto = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Erro", "Permissão de localização negada");
        return;
      }

      const agora = new Date();

      // ✅ FORMATO CORRETO PADRÃO BANCO
      const data = agora.toLocaleDateString("sv-SE"); // YYYY-MM-DD

      const hora = agora.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo"
      });

      const userStorage = await AsyncStorage.getItem("@medponto_usuario");

      if (!userStorage) {
        Alert.alert("Erro", "Usuário não encontrado");
        return;
      }

      const usuario = JSON.parse(userStorage);

      if (!usuario?.idusuario) {
        Alert.alert("Erro", "ID do usuário inválido");
        return;
      }

      // 🔥 pega ponto do dia (apenas aberto)
      const { data: pontoExistente, error: selectError } = await supabase
        .from("ponto")
        .select("*")
        .eq("idusuario", usuario.idusuario)
        .eq("data", data)
        .maybeSingle();

      if (selectError) {
        Alert.alert("Erro", selectError.message);
        return;
      }

      // =========================
      // 🟢 ENTRADA
      // =========================
      if (!pontoExistente) {
        const { error } = await supabase
          .from("ponto")
          .insert([
            {
              idusuario: usuario.idusuario,
              idhospital: usuario.idhospital || 1,
              data,
              horaentrada: hora,
              horasaida: null,
              validacaobiometrica: false,
              validacaolocalizacao: true
            }
          ]);

        if (error) {
          Alert.alert("Erro", error.message);
          return;
        }

        setEntrada(hora);
        setStatusLocal("Entrada registrada com sucesso");
        return;
      }

      // =========================
      // 🔴 SAÍDA (somente se ainda não tem)
      // =========================
      if (pontoExistente.horasaida) {
        Alert.alert("Aviso", "Ponto já finalizado hoje");
        return;
      }

      const { error } = await supabase
        .from("ponto")
        .update({
          horasaida: hora
        })
        .eq("idponto", pontoExistente.idponto);

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      setSaida(hora);
      setStatusLocal("Saída registrada com sucesso");

    } catch (err) {
      console.log(err);
      Alert.alert("Erro", "Erro inesperado");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Registro de Ponto</Text>

        <Text style={styles.data}>📅 {dataAtual}</Text>
        <Text style={styles.hora}>{horaAtual}</Text>

        {statusLocal !== "" && (
          <Text style={styles.status}>{statusLocal}</Text>
        )}

        <TouchableWithoutFeedback
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          onPress={baterPonto}
        >
          <Animated.View style={[styles.botao, { transform: [{ scale: scaleAnim }] }]}>
            <MaterialIcons name="fingerprint" size={26} color="#fff" />
            <Text style={styles.textoBotao}>Bater Ponto</Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        {entrada !== "" && (
          <Text style={styles.registro}>✅ Entrada: {entrada}</Text>
        )}

        {saida !== "" && (
          <Text style={styles.registro}>❌ Saída: {saida}</Text>
        )}
      </View>

      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <MaterialIcons name="home" size={28} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity>
          <MaterialIcons name="schedule" size={28} color="#2E86DE" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/config')}>
          <MaterialIcons name="settings" size={28} color="#555" />
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
    shadowOffset: { width: 0, height: 2 },
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
    fontWeight: 'bold'
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
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import { router } from "expo-router";
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from "react";

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { supabase } from "../lib/supabase";

export default function ConfigScreen() {
  const [usuario, setUsuario] = useState({ nome: "", email: "" });
  const [localizacao, setLocalizacao] = useState({ latitude: "-", longitude: "-" });

  const [registros, setRegistros] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  useEffect(() => {
    obterUsuarioLogado();
    obterLocalizacao();
    buscarRegistros();
  }, []);

  // =========================
  // USUÁRIO
  // =========================
  async function obterUsuarioLogado() {
    try {
      const usuarioStorage = await AsyncStorage.getItem("@medponto_usuario");

      if (!usuarioStorage) {
        Alert.alert("Erro", "Usuário não encontrado");
        return;
      }

      const usuarioConvertido = JSON.parse(usuarioStorage);

      setUsuario({
        nome: usuarioConvertido.nome || "",
        email: usuarioConvertido.email || ""
      });

    } catch {
      Alert.alert("Erro", "Falha ao carregar usuário");
    }
  }

  // =========================
  // LOCALIZAÇÃO
  // =========================
  async function obterLocalizacao() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Erro", "Permissão negada");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      setLocalizacao({
        latitude: loc.coords.latitude.toFixed(5),
        longitude: loc.coords.longitude.toFixed(5)
      });

    } catch {
      Alert.alert("Erro", "Falha ao obter localização");
    }
  }

  // =========================
  // REGISTROS REAIS
  // =========================
  async function buscarRegistros() {
    try {
      const usuarioStorage = await AsyncStorage.getItem("@medponto_usuario");

      if (!usuarioStorage) return;

      const usuario = JSON.parse(usuarioStorage);

      const { data, error } = await supabase
        .from("ponto")
        .select("*")
        .eq("idusuario", usuario.idusuario)
        .order("data", { ascending: false });

      if (error) {
        Alert.alert("Erro", error.message);
        return;
      }

      setRegistros(data || []);

    } catch {
      Alert.alert("Erro", "Falha ao buscar registros");
    }
  }

  // =========================
  // DATA FORMAT
  // =========================
  function formatarData(data: Date) {
    return data.toLocaleDateString("sv-SE");
  }

  // =========================
  // HORAS TRABALHADAS
  // =========================
  function calcularHoras(entrada: string, saida: string) {
    if (!entrada || !saida) return "Em aberto";

    const [h1, m1] = entrada.split(":").map(Number);
    const [h2, m2] = saida.split(":").map(Number);

    const inicio = h1 * 60 + m1;
    const fim = h2 * 60 + m2;

    const diff = fim - inicio;

    if (diff <= 0) return "0h";

    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;

    return `${horas}h ${minutos}m`;
  }

  // =========================
  // RELATÓRIO
  // =========================
  function gerarRelatorio() {
    const dados = dataSelecionada
      ? registros.filter(r => r.data === formatarData(dataSelecionada))
      : registros;

    if (dados.length === 0) {
      Alert.alert("Erro", "Nenhum dado encontrado");
      return;
    }

    const texto = dados.map(r =>
      `Data: ${r.data}\nHorário de entrada: ${r.horaentrada || "-"}\nHorário de saída: ${r.horasaida || "-"}\nHoras trabalhadas: ${calcularHoras(r.horaentrada, r.horasaida)}`
    ).join("\n\n");

    Alert.alert("Relatório", texto);
  }

  // =========================
  // PDF FUNCIONANDO
  // =========================
  async function exportarPDF() {
    const dados = dataSelecionada
      ? registros.filter(r => r.data === formatarData(dataSelecionada))
      : registros;

    if (dados.length === 0) {
      Alert.alert("Erro", "Nenhum dado para exportar");
      return;
    }

    const html = `
      <html>
        <body>
          <h1>Relatório de Ponto</h1>
          <hr/>
          ${dados.map(r => `
            <p>
              <strong>Data:</strong> ${r.data}<br/>
              <strong>Entrada:</strong> ${r.horaentrada || "-"}<br/>
              <strong>Saída:</strong> ${r.horasaida || "-"}<br/>
              <strong>Total:</strong> ${calcularHoras(r.horaentrada, r.horasaida)}
            </p>
            <hr/>
          `).join("")}
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.log(err);
      Alert.alert("Erro", "Falha ao gerar PDF");
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <View style={styles.headerCard}>
            <MaterialIcons name="person" size={24} color="#2563EB" />
            <Text style={styles.titulo}>Dados do Usuário</Text>
          </View>

          <Text style={styles.texto}>Nome: {usuario.nome}</Text>
          <Text style={styles.texto}>E-mail: {usuario.email}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.headerCard}>
            <MaterialIcons name="location-on" size={24} color="#2563EB" />
            <Text style={styles.titulo}>Localização</Text>
          </View>

          <Text style={styles.texto}>Latitude: {localizacao.latitude}</Text>
          <Text style={styles.texto}>Longitude: {localizacao.longitude}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.headerCard}>
            <MaterialIcons name="calendar-month" size={24} color="#2563EB" />
            <Text style={styles.titulo}>Relatório de Ponto</Text>
          </View>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => setMostrarCalendario(true)}
          >
            <MaterialIcons name="calendar-today" size={20} color="#fff" />
            <Text style={styles.botaoTexto}>
              {dataSelecionada ? formatarData(dataSelecionada) : "Filtrar por data"}
            </Text>
          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={dataSelecionada || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setMostrarCalendario(false);
                if (date) setDataSelecionada(date);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.botaoRelatorio}
            onPress={gerarRelatorio}
          >
            <MaterialIcons name="description" size={20} color="#fff" />
            <Text style={styles.botaoTexto}>Gerar Relatório</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={exportarPDF}
          >
            <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
            <Text style={styles.botaoTexto}>Exportar PDF</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuBotao} onPress={() => router.replace("/")}>
          <MaterialIcons name="home" size={26} color="#555" />
          <Text style={styles.menuTexto}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBotao} onPress={() => router.replace("/ponto")}>
          <MaterialIcons name="schedule" size={26} color="#555" />
          <Text style={styles.menuTexto}>Ponto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBotao}>
          <MaterialIcons name="settings" size={26} color="#2563EB" />
          <Text style={styles.menuTextoAtivo}>Config</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    justifyContent: "space-between"
  },

  content: {
    padding: 16,
    paddingBottom: 30
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },

  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A"
  },

  texto: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 6
  },

  botao: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },

  botaoSecundario: {
    backgroundColor: "#1D4ED8",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },

  botaoRelatorio: {
    backgroundColor: "#0F172A",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },

  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 8
  },

  menuBotao: {
    alignItems: "center"
  },

  menuTexto: {
    color: "#555",
    fontSize: 12,
    marginTop: 4
  },

  menuTextoAtivo: {
    color: "#2563EB",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700"
  }
});
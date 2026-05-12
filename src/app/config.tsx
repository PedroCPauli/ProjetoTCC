import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { router } from "expo-router";
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

export default function ConfigScreen() {

  const [usuario] = useState({
    nome: "Pedro Pauli",
    email: "pedro@email.com"
  });

  const [localizacao, setLocalizacao] = useState({
    latitude: "-26.9055",
    longitude: "-49.0849"
  });

  const [registros] = useState([
    { data: "25/03/2026", entrada: "08:00", saida: "18:00" },
    { data: "24/03/2026", entrada: "08:10", saida: "17:50" }
  ]);

  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [filtrados, setFiltrados] = useState<any[]>([]);

  useEffect(() => {
    obterLocalizacao();
  }, []);

  async function obterLocalizacao() {

    try {

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Erro", "Permissão negada");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});

      setLocalizacao({
        latitude: loc.coords.latitude.toFixed(5),
        longitude: loc.coords.longitude.toFixed(5)
      });

    } catch {
      Alert.alert("Erro", "Falha ao obter localização");
    }
  }

  function formatarData(data: Date) {
    return data.toLocaleDateString("pt-BR");
  }

  function filtrarPorData() {

    if (!dataSelecionada) {
      Alert.alert("Erro", "Selecione uma data");
      return;
    }

    const dataFormatada = formatarData(dataSelecionada);

    const resultado = registros.filter(
      r => r.data === dataFormatada
    );

    setFiltrados(resultado);

    if (resultado.length === 0) {
      Alert.alert("Aviso", "Nenhum registro encontrado");
    }
  }

  function gerarRelatorio() {

    if (filtrados.length === 0) {
      Alert.alert("Erro", "Nenhum dado encontrado");
      return;
    }

    let texto = filtrados.map(r =>
      `Data: ${r.data}\nEntrada: ${r.entrada}\nSaída: ${r.saida}`
    ).join("\n\n");

    Alert.alert("Relatório", texto);
  }

  return (

    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.content}>

        {/* DADOS USUÁRIO */}
        <View style={styles.card}>

          <View style={styles.headerCard}>
            <MaterialIcons name="person" size={24} color="#2E86DE" />
            <Text style={styles.titulo}>Dados do Usuário</Text>
          </View>

          <Text style={styles.texto}>
            Nome: {usuario.nome}
          </Text>

          <Text style={styles.texto}>
            E-mail: {usuario.email}
          </Text>

        </View>

        {/* LOCALIZAÇÃO */}
        <View style={styles.card}>

          <View style={styles.headerCard}>
            <MaterialIcons name="location-on" size={24} color="#2E86DE" />
            <Text style={styles.titulo}>Localização</Text>
          </View>

          <Text style={styles.texto}>
            Latitude: {localizacao.latitude}
          </Text>

          <Text style={styles.texto}>
            Longitude: {localizacao.longitude}
          </Text>

        </View>

        {/* DATA */}
        <View style={styles.card}>

          <View style={styles.headerCard}>
            <MaterialIcons name="calendar-month" size={24} color="#2E86DE" />
            <Text style={styles.titulo}>Selecionar Data</Text>
          </View>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => setMostrarCalendario(true)}
          >

            <MaterialIcons
              name="calendar-today"
              size={20}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>
              {dataSelecionada
                ? formatarData(dataSelecionada)
                : "Escolher Data"}
            </Text>

          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={dataSelecionada || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, date) => {
                setMostrarCalendario(false);

                if (date) {
                  setDataSelecionada(date);
                }
              }}
            />
          )}

          <TouchableOpacity
            style={styles.botaoBuscar}
            onPress={filtrarPorData}
          >

            <MaterialIcons
              name="search"
              size={20}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>
              Buscar
            </Text>

          </TouchableOpacity>

        </View>

        {/* RESULTADOS */}
        <View style={styles.card}>

          <View style={styles.headerCard}>
            <MaterialIcons name="analytics" size={24} color="#2E86DE" />
            <Text style={styles.titulo}>Resultados</Text>
          </View>

          {filtrados.length === 0 ? (
            <Text style={styles.textoVazio}>
              Nenhum resultado encontrado
            </Text>
          ) : (
            filtrados.map((item, index) => (

              <View key={index} style={styles.registroItem}>

                <Text style={styles.texto}>
                  📅 {item.data}
                </Text>

                <Text style={styles.texto}>
                  ⏰ Entrada: {item.entrada}
                </Text>

                <Text style={styles.texto}>
                  🚪 Saída: {item.saida}
                </Text>

              </View>

            ))
          )}

        </View>

        {/* RELATÓRIO */}
        <TouchableOpacity
          style={styles.botaoRelatorio}
          onPress={gerarRelatorio}
        >

          <MaterialIcons
            name="description"
            size={22}
            color="#fff"
          />

          <Text style={styles.botaoTexto}>
            Gerar Relatório
          </Text>

        </TouchableOpacity>

      </ScrollView>

      {/* MENU */}
      <View style={styles.menu}>

        <TouchableOpacity
          style={styles.menuBotao}
          onPress={() => router.replace("/")}
        >
          <MaterialIcons name="home" size={28} color="#555" />
          <Text style={styles.menuTexto}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBotao}
          onPress={() => router.replace("/ponto")}
        >
          <MaterialIcons name="schedule" size={28} color="#555" />
          <Text style={styles.menuTexto}>Ponto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBotao}>
          <MaterialIcons name="settings" size={28} color="#2E86DE" />
          <Text style={styles.menuTextoAtivo}>Config</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    justifyContent: "space-between"
  },

  content: {
    padding: 16
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

  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15
  },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B"
  },

  texto: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 8
  },

  textoVazio: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 10
  },

  botao: {
    backgroundColor: "#2E86DE",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },

  botaoBuscar: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },

  botaoRelatorio: {
    backgroundColor: "#27AE60",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    elevation: 4
  },

  botaoTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },

  registroItem: {
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: 12,
    marginTop: 12
  },

  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#E2E8F0"
  },

  menuBotao: {
    alignItems: "center"
  },

  menuTexto: {
    color: "#555",
    fontSize: 13,
    marginTop: 4
  },

  menuTextoAtivo: {
    color: "#2E86DE",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "bold"
  }

});
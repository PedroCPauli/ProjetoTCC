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

  const [usuario, setUsuario] = useState<any>({});
  const [endereco, setEndereco] = useState<any>({});
  const [hospital, setHospital] = useState<any>({});

  const [localizacao, setLocalizacao] = useState({
    latitude: "-",
    longitude: "-"
  });

  const [registros, setRegistros] = useState<any[]>([]);

  const [dataSelecionada, setDataSelecionada] =
    useState<Date | null>(null);

  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  useEffect(() => {

    carregarDados();

  }, []);

  // =====================================
  // CARREGA DADOS
  // =====================================

  async function carregarDados() {

    await obterUsuarioLogado();

    await obterLocalizacao();

    await buscarRegistros();
  }

  // =====================================
  // USUÁRIO + ENDEREÇO + HOSPITAL
  // =====================================

  async function obterUsuarioLogado() {

    try {

      const usuarioStorage =
        await AsyncStorage.getItem("@medponto_usuario");

      if (!usuarioStorage) {

        Alert.alert(
          "Erro",
          "Usuário não encontrado"
        );

        return;
      }

      const usuarioConvertido =
        JSON.parse(usuarioStorage);

      const {
        data: usuarioData,
        error: usuarioError

      } = await supabase

        .from("usuario")

        .select(`
          *,
          endereco (*)
        `)

        .eq(
          "idusuario",
          usuarioConvertido.idusuario
        )

        .single();

      if (usuarioError) {

        console.log(usuarioError);

        Alert.alert(
          "Erro",
          usuarioError.message
        );

        return;
      }

      let hospitalData = {};

      if (usuarioData?.idhospital) {

        const {
          data: hospitalBusca,
          error: hospitalError

        } = await supabase

          .from("hospital")

          .select("*")

          .eq(
            "idhospital",
            usuarioData.idhospital
          )

          .single();

        if (!hospitalError) {

          hospitalData =
            hospitalBusca || {};
        }
      }

      setUsuario(
        usuarioData || {}
      );

      setEndereco(
        usuarioData?.endereco || {}
      );

      setHospital(
        hospitalData || {}
      );

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao carregar usuário"
      );
    }
  }

  // =====================================
  // LOCALIZAÇÃO
  // =====================================

  async function obterLocalizacao() {

    try {

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {

        Alert.alert(
          "Erro",
          "Permissão negada"
        );

        return;
      }

      const loc =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

      setLocalizacao({

        latitude:
          loc.coords.latitude.toFixed(5),

        longitude:
          loc.coords.longitude.toFixed(5)

      });

    } catch {

      Alert.alert(
        "Erro",
        "Falha ao obter localização"
      );
    }
  }

  // =====================================
  // FORMATAR DATA BANCO
  // =====================================

  function formatarDataBanco(data: Date) {

    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(2, "0");

    const dia =
      String(
        data.getDate()
      ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  // =====================================
  // FORMATAR DATA BRASIL
  // =====================================

  function formatarDataBrasil(data: string) {

    if (!data) return "-";

    const partes =
      data.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // =====================================
  // BUSCAR REGISTROS
  // =====================================

  async function buscarRegistros() {

    try {

      const usuarioStorage =
        await AsyncStorage.getItem("@medponto_usuario");

      if (!usuarioStorage)
        return [];

      const usuarioConvertido =
        JSON.parse(usuarioStorage);

      let query =
        supabase

          .from("ponto")

          .select("*")

          .eq(
            "idusuario",
            usuarioConvertido.idusuario
          )

          .order(
            "data",
            {
              ascending: false
            }
          );

      /*
        FILTRO CORRETO DE DATA
      */

      if (dataSelecionada) {

        const dataFormatada =
          formatarDataBanco(
            dataSelecionada
          );

        query =
          query.eq(
            "data",
            dataFormatada
          );
      }

      const {
        data,
        error

      } = await query;

      if (error) {

        Alert.alert(
          "Erro",
          error.message
        );

        return [];
      }

      setRegistros(
        data || []
      );

      return data || [];

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao buscar registros"
      );

      return [];
    }
  }

  // =====================================
  // CALCULAR HORAS
  // =====================================

  function calcularHoras(
    entrada: string,
    saida: string
  ) {

    if (!entrada || !saida)
      return "Em aberto";

    const [h1, m1] =
      entrada.split(":").map(Number);

    const [h2, m2] =
      saida.split(":").map(Number);

    const inicio =
      h1 * 60 + m1;

    const fim =
      h2 * 60 + m2;

    const diff =
      fim - inicio;

    if (diff <= 0)
      return "0h";

    const horas =
      Math.floor(diff / 60);

    const minutos =
      diff % 60;

    return `${horas}h ${minutos}m`;
  }

  // =====================================
  // GERAR RELATÓRIO
  // =====================================

  async function gerarRelatorio() {

    const dados =
      await buscarRegistros();

    if (!dados || dados.length === 0) {

      Alert.alert(
        "Erro",
        "Nenhum registro encontrado"
      );

      return;
    }

    const texto =
      dados.map((r: any) => `

Data:
${formatarDataBrasil(r.data)}

Entrada:
${r.horaentrada || "-"}

Saída:
${r.horasaida || "-"}

Horas Trabalhadas:
${calcularHoras(
  r.horaentrada,
  r.horasaida
)}

Hospital:
${hospital.nome || "-"}

Endereço:
${endereco.logradouro || "-"},
${endereco.numero || "-"}

Bairro:
${endereco.bairro || "-"}

CEP:
${endereco.cep || "-"}

      `).join("\n\n");

    Alert.alert(
      "Relatório",
      texto
    );
  }

  // =====================================
  // EXPORTAR PDF
  // =====================================

  async function exportarPDF() {

    const dados =
      await buscarRegistros();

    if (!dados || dados.length === 0) {

      Alert.alert(
        "Erro",
        "Nenhum dado encontrado"
      );

      return;
    }

    const html = `
      <html>

        <body style="
          font-family: Arial;
          padding: 20px;
        ">

          <h1>
            Relatório de Ponto
          </h1>

          <hr />

          <h2>
            Dados do Funcionário
          </h2>

          <p>
            <strong>Nome:</strong>
            ${usuario.nome || "-"}
          </p>

          <p>
            <strong>E-mail:</strong>
            ${usuario.email || "-"}
          </p>

          <p>
            <strong>Hospital:</strong>
            ${hospital.nome || "-"}
          </p>

          <p>
            <strong>Endereço:</strong>
            ${endereco.logradouro || "-"},
            ${endereco.numero || "-"}
          </p>

          <p>
            <strong>Bairro:</strong>
            ${endereco.bairro || "-"}
          </p>

          <p>
            <strong>CEP:</strong>
            ${endereco.cep || "-"}
          </p>

          <hr />

          ${dados.map((r: any) => `

            <div style="
              margin-bottom: 20px;
            ">

              <h3>
                Data:
                ${formatarDataBrasil(r.data)}
              </h3>

              <p>
                <strong>Entrada:</strong>
                ${r.horaentrada || "-"}
              </p>

              <p>
                <strong>Saída:</strong>
                ${r.horasaida || "-"}
              </p>

              <p>
                <strong>Total:</strong>
                ${calcularHoras(
                  r.horaentrada,
                  r.horasaida
                )}
              </p>

            </div>

            <hr />

          `).join("")}

        </body>

      </html>
    `;

    try {

      const { uri } =
        await Print.printToFileAsync({
          html
        });

      await Sharing.shareAsync(uri);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao gerar PDF"
      );
    }
  }

  return (

    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
      >

        {/* USUÁRIO */}

        <View style={styles.card}>

          <View style={styles.headerCard}>

            <MaterialIcons
              name="person"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.titulo}>
              Dados do Usuário
            </Text>

          </View>

          <Text style={styles.texto}>
            Nome: {usuario.nome || "-"}
          </Text>

          <Text style={styles.texto}>
            E-mail: {usuario.email || "-"}
          </Text>

          <Text style={styles.texto}>
            Hospital: {hospital.nome || "-"}
          </Text>

        </View>

        {/* ENDEREÇO */}

        <View style={styles.card}>

          <View style={styles.headerCard}>

            <MaterialIcons
              name="home"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.titulo}>
              Endereço Cadastrado
            </Text>

          </View>

          <Text style={styles.texto}>
            Rua: {endereco.logradouro || "-"}
          </Text>

          <Text style={styles.texto}>
            Número: {endereco.numero || "-"}
          </Text>

          <Text style={styles.texto}>
            Bairro: {endereco.bairro || "-"}
          </Text>

          <Text style={styles.texto}>
            CEP: {endereco.cep || "-"}
          </Text>

        </View>

        {/* LOCALIZAÇÃO */}

        <View style={styles.card}>

          <View style={styles.headerCard}>

            <MaterialIcons
              name="location-on"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.titulo}>
              Localização Atual
            </Text>

          </View>

          <Text style={styles.texto}>
            Latitude: {localizacao.latitude}
          </Text>

          <Text style={styles.texto}>
            Longitude: {localizacao.longitude}
          </Text>

        </View>

        {/* RELATÓRIO */}

        <View style={styles.card}>

          <View style={styles.headerCard}>

            <MaterialIcons
              name="calendar-month"
              size={24}
              color="#2563EB"
            />

            <Text style={styles.titulo}>
              Relatório de Ponto
            </Text>

          </View>

          <TouchableOpacity
            style={styles.botao}
            onPress={() =>
              setMostrarCalendario(true)
            }
          >

            <MaterialIcons
              name="calendar-today"
              size={20}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>

              {dataSelecionada

                ? dataSelecionada.toLocaleDateString("pt-BR")

                : "Filtrar por data"}

            </Text>

          </TouchableOpacity>

          {mostrarCalendario && (

            <DateTimePicker

              value={
                dataSelecionada ||
                new Date()
              }

              mode="date"

              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }

              onChange={(event, date) => {

                setMostrarCalendario(false);

                if (date) {

                  /*
                    CORREÇÃO DO FUSO HORÁRIO
                  */

                  const dataCorrigida =
                    new Date(
                      date.getTime() +
                      Math.abs(
                        date.getTimezoneOffset() * 60000
                      )
                    );

                  setDataSelecionada(
                    dataCorrigida
                  );
                }
              }}
            />
          )}

          <TouchableOpacity
            style={styles.botaoRelatorio}
            onPress={gerarRelatorio}
          >

            <MaterialIcons
              name="description"
              size={20}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>
              Gerar Relatório
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSecundario}
            onPress={exportarPDF}
          >

            <MaterialIcons
              name="picture-as-pdf"
              size={20}
              color="#fff"
            />

            <Text style={styles.botaoTexto}>
              Exportar PDF
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* MENU */}

      <View style={styles.menu}>

        <TouchableOpacity
          style={styles.menuBotao}
          onPress={() =>
            router.replace("/")
          }
        >

          <MaterialIcons
            name="home"
            size={26}
            color="#555"
          />

          <Text style={styles.menuTexto}>
            Início
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBotao}
          onPress={() =>
            router.replace("/ponto")
          }
        >

          <MaterialIcons
            name="schedule"
            size={26}
            color="#555"
          />

          <Text style={styles.menuTexto}>
            Ponto
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuBotao}
        >

          <MaterialIcons
            name="settings"
            size={26}
            color="#2563EB"
          />

          <Text style={styles.menuTextoAtivo}>
            Config
          </Text>

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

    shadowOffset: {
      width: 0,
      height: 2
    },

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
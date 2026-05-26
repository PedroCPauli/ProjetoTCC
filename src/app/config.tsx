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
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { LinearGradient } from 'expo-linear-gradient';

import * as Animatable from 'react-native-animatable';

import { supabase } from "../lib/supabase";

export default function ConfigScreen() {

  const [usuario, setUsuario] = useState<any>({});

  const [endereco, setEndereco] = useState<any>({});

  const [hospital, setHospital] = useState<any>({});

  const [localizacao, setLocalizacao] = useState({

    latitude: "-",

    longitude: "-"
  });

  const [registros, setRegistros] =
    useState<any[]>([]);

  const [dataSelecionada, setDataSelecionada] =
    useState<Date | null>(null);

  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  useEffect(() => {

    carregarDados();

  }, []);

  /*
    =====================================
    CARREGA DADOS
    =====================================
  */

  async function carregarDados() {

    await obterUsuarioLogado();

    await obterLocalizacao();

    await buscarRegistros();
  }

  /*
    =====================================
    USUÁRIO
    =====================================
  */

  async function obterUsuarioLogado() {

    try {

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

    } catch {

      Alert.alert(
        "Erro",
        "Falha ao carregar usuário"
      );
    }
  }

  /*
    =====================================
    LOCALIZAÇÃO
    =====================================
  */

  async function obterLocalizacao() {

    try {

      const { status } =

        await Location
          .requestForegroundPermissionsAsync();

      if (status !== "granted") {

        Alert.alert(
          "Erro",
          "Permissão negada"
        );

        return;
      }

      const loc =

        await Location
          .getCurrentPositionAsync({

            accuracy:
              Location.Accuracy.High
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

  /*
    =====================================
    FORMATAR DATA
    =====================================
  */

  function formatarDataBanco(
    data: Date
  ) {

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

  function formatarDataBrasil(
    data: string
  ) {

    if (!data) return "-";

    const partes =
      data.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /*
    =====================================
    BUSCAR REGISTROS
    =====================================
  */

  async function buscarRegistros(
    dataFiltro?: Date | null
  ) {

    try {

      const usuarioStorage =
        await AsyncStorage.getItem(
          "@medponto_usuario"
        );

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

      if (dataFiltro) {

        const dataFormatada =
          formatarDataBanco(
            dataFiltro
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

    } catch {

      Alert.alert(
        "Erro",
        "Falha ao buscar registros"
      );

      return [];
    }
  }

  /*
    =====================================
    CALCULAR HORAS
    =====================================
  */

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

  /*
    =====================================
    RELATÓRIO
    =====================================
  */

 async function gerarRelatorio() {

  const dados =
    await buscarRegistros(
      dataSelecionada
    );

  if (!dados || dados.length === 0) {

    Alert.alert(
      "Erro",
      "Nenhum registro encontrado"
    );

    return;
  }

  const texto = `

==========================
Relatório de ponto
==========================

Funcionário:
${usuario.nome || "-"}

E-mail:
${usuario.email || "-"}

Hospital:
${hospital.nome || "-"}

Endereço:
${endereco.logradouro || "-"},
${endereco.numero || "-"}

Bairro:
${endereco.bairro || "-"}

CEP:
${endereco.cep || "-"}

==========================

${dados.map((r: any) => `

Data:
${formatarDataBrasil(r.data)}

Entrada:
${r.horaentrada || "-"}

Saída:
${r.horasaida || "-"}

Horas trabalhadas:
${calcularHoras(
  r.horaentrada,
  r.horasaida
)}

--------------------------

`).join("")}
`;

  Alert.alert(
    "Relatório",
    texto
  );
}

/*
  =====================================
  PDF
  =====================================
*/

async function exportarPDF() {

  const dados =
    await buscarRegistros(
      dataSelecionada
    );

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
        padding: 24px;
        color: #1E293B;
      ">

        <h1 style="
          color: #2563EB;
          margin-bottom: 10px;
        ">
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

        <h2 style="
          color: #2563EB;
          margin-bottom: 10px;
        ">
          Relatório de Ponto
        </h2>

        ${dados.map((r: any) => `

          <div style="
            margin-bottom: 24px;
            padding: 16px;
            border: 1px solid #CBD5E1;
            border-radius: 12px;
          ">

            <p>
              <strong>Data:</strong>
              ${formatarDataBrasil(r.data)}
            </p>

            <p>
              <strong>Entrada:</strong>
              ${r.horaentrada || "-"}
            </p>

            <p>
              <strong>Saída:</strong>
              ${r.horasaida || "-"}
            </p>

            <p>
              <strong>Total Trabalhado:</strong>
              ${calcularHoras(
                r.horaentrada,
                r.horasaida
              )}
            </p>

          </div>

        `).join("")}

      </body>

    </html>
  `;

  try {

    const { uri } =

      await Print
        .printToFileAsync({
          html
        });

    await Sharing
      .shareAsync(uri);

  } catch {

    Alert.alert(
      "Erro",
      "Falha ao gerar PDF"
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

      <View style={styles.container}>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* USUÁRIO */}

          <Animatable.View

            animation="fadeInUp"

            duration={1000}

            style={styles.card}
          >

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

          </Animatable.View>

          {/* ENDEREÇO */}

          <Animatable.View

            animation="fadeInUp"

            delay={200}

            duration={1000}

            style={styles.card}
          >

            <View style={styles.headerCard}>

              <MaterialIcons
                name="home"
                size={24}
                color="#2563EB"
              />

              <Text style={styles.titulo}>
                Endereço
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

          </Animatable.View>

          {/* LOCALIZAÇÃO */}

          <Animatable.View

            animation="fadeInUp"

            delay={400}

            duration={1000}

            style={styles.card}
          >

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

          </Animatable.View>

          {/* RELATÓRIO */}

          <Animatable.View

            animation="fadeInUp"

            delay={600}

            duration={1000}

            style={styles.card}
          >

            <View style={styles.headerCard}>

              <MaterialIcons
                name="description"
                size={24}
                color="#2563EB"
              />

              <Text style={styles.titulo}>
                Relatórios
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

                  : "Filtrar por Data"}

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

                    setDataSelecionada(date);
                  }
                }}
              />
            )}

            <TouchableOpacity

              style={styles.botaoDark}

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

              style={styles.botaoPdf}

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

          </Animatable.View>

        </ScrollView>
        </View>
    {/* MENU PREMIUM */}

<View style={styles.menu}>

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
        color="#64748B"
      />

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
        color="#64748B"
      />

    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuBotaoAtivo}
    >

      <MaterialIcons
        name="settings"
        size={30}
        color="#FFFFFF"
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

  container: {
    flex: 1,
    justifyContent: "space-between"
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 140
  },

  card: {

    backgroundColor: "#FFFFFF",

    borderRadius: 30,

    padding: 22,

    marginBottom: 20,

    borderWidth: 1,

    borderColor: "#E8EEF9",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 8
    },

    shadowOpacity: 0.08,

    shadowRadius: 12,

    elevation: 6
  },

  headerCard: {

    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    marginBottom: 16
  },

  titulo: {

    fontSize: 21,

    fontWeight: "bold",

    color: "#1E293B"
  },

  texto: {

    fontSize: 15,

    color: "#64748B",

    marginBottom: 10,

    lineHeight: 22
  },

  botao: {

    backgroundColor: "#2563EB",

    height: 58,

    borderRadius: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: 12,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 6
    },

    shadowOpacity: 0.20,

    shadowRadius: 10,

    elevation: 5
  },

  botaoDark: {

    backgroundColor: "#0F172A",

    height: 58,

    borderRadius: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: 12,

    shadowColor: "#0F172A",

    shadowOffset: {
      width: 0,
      height: 5
    },

    shadowOpacity: 0.18,

    shadowRadius: 8,

    elevation: 4
  },

  botaoPdf: {

    backgroundColor: "#1D4ED8",

    height: 58,

    borderRadius: 20,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: 12,

    shadowColor: "#1D4ED8",

    shadowOffset: {
      width: 0,
      height: 5
    },

    shadowOpacity: 0.18,

    shadowRadius: 8,

    elevation: 4
  },

  botaoTexto: {

    color: "#FFFFFF",

    fontWeight: "700",

    fontSize: 16
  },

  /*
    =====================================
    MENU IGUAL AO PONTOSCREEN
    =====================================
  */

  menu: {

    position: "absolute",

    bottom: 22,

    left: 20,

    right: 20,

    height: 78,

    backgroundColor: "#FFFFFF",

    borderRadius: 28,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-around",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 8
    },

    shadowOpacity: 0.12,

    shadowRadius: 16,

    elevation: 12
  },

  menuBotao: {

    alignItems: "center",

    justifyContent: "center",

    width: 70
  },

  menuBotaoAtivo: {

    width: 64,

    height: 64,

    borderRadius: 22,

    backgroundColor: "#2563EB",

    alignItems: "center",

    justifyContent: "center",

    marginTop: -35,

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 10
    },

    shadowOpacity: 0.30,

    shadowRadius: 12,

    elevation: 12
  },

  menuTexto: {

    color: "#64748B",

    fontSize: 12,

    fontWeight: "600",

    marginTop: 4
  },

  menuTextoAtivo: {

    color: "#FFFFFF",

    fontSize: 11,

    fontWeight: "700",

    marginTop: 2
  }
});
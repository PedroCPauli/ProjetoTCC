import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';

import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function AdminScreen() {

  const [usuarios, setUsuarios] =
    useState<any[]>([]);

  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<any>(null);

  const [pontos, setPontos] =
    useState<any[]>([]);

  const [dataSelecionada, setDataSelecionada] =
    useState<Date | null>(null);

  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  const [hospitalAdmin, setHospitalAdmin] =
    useState<any>(null);

  useEffect(() => {

    carregarAdmin();

  }, []);

  /*
    ============================
    CARREGAR ADMIN
    ============================
  */

  async function carregarAdmin() {

    try {

      const storage =
        await AsyncStorage.getItem(
          "@medponto_usuario"
        );

      if (!storage) {

        Alert.alert(
          "Erro",
          "Administrador não encontrado"
        );

        return;
      }

      const adminStorage =
        JSON.parse(storage);

      const {
        data,
        error

      } = await supabase

        .from("usuario")

        .select(`
          *,
          hospital:idhospital (
            nome
          )
        `)

        .eq(
          "idusuario",
          adminStorage.idusuario
        )

        .single();

      if (error) {

        Alert.alert(
          "Erro",
          error.message
        );

        return;
      }

      setHospitalAdmin(data);

      buscarUsuarios(
        data.idhospital
      );

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao carregar admin"
      );
    }
  }

  /*
    ============================
    BUSCAR USUÁRIOS
    ============================
  */

  async function buscarUsuarios(
    idhospital: number
  ) {

    try {

      const {
        data,
        error

      } = await supabase

        .from("usuario")

        .select(`
          *,
          hospital:idhospital (
            nome
          )
        `)

        .eq(
          "idhospital",
          idhospital
        )

        .order(
          "nome"
        );

      if (error) {

        Alert.alert(
          "Erro",
          error.message
        );

        return;
      }

      setUsuarios(data || []);

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao buscar usuários"
      );
    }
  }

  /*
    ============================
    FORMATAR DATA BANCO
    ============================
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

  /*
    ============================
    FORMATAR DATA BRASIL
    ============================
  */

  function formatarDataBrasil(
    data: string
  ) {

    if (!data)
      return "-";

    const partes =
      data.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  /*
    ============================
    BUSCAR PONTOS
    ============================
  */

  async function buscarPontos(
    idusuario: number,
    dataFiltro?: Date | null
  ) {

    try {

      let query =
        supabase

          .from("ponto")

          .select(`
            *,
            usuario (
              nome,
              email
            )
          `)

          .eq(
            "idusuario",
            idusuario
          )

          .order(
            "data",
            {
              ascending: false
            }
          );

      /*
        FILTRO DATA
      */

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

        return;
      }

      setPontos(data || []);

      if (!data || data.length === 0) {

        Alert.alert(
          "Aviso",
          "Nenhum registro encontrado"
        );
      }

    } catch (error) {

      console.log(error);

      Alert.alert(
        "Erro",
        "Falha ao buscar registros"
      );
    }
  }

  /*
    ============================
    CALCULAR HORAS
    ============================
  */

  function calcularHoras(
    entrada: string,
    saida: string
  ) {

    if (!entrada || !saida) {

      return "Em aberto";
    }

    const [h1, m1] =
      entrada.split(":").map(Number);

    const [h2, m2] =
      saida.split(":").map(Number);

    const inicio =
      h1 * 60 + m1;

    const fim =
      h2 * 60 + m2;

    const diferenca =
      fim - inicio;

    if (diferenca <= 0) {

      return "0h";
    }

    const horas =
      Math.floor(diferenca / 60);

    const minutos =
      diferenca % 60;

    return `${horas}h ${minutos}m`;
  }

 /*
  ============================
  GERAR RELATÓRIO
  ============================
*/

function gerarRelatorio() {

  if (pontos.length === 0) {

    Alert.alert(
      "Erro",
      "Nenhum registro encontrado"
    );

    return;
  }

  const texto = `

==============================
RELATÓRIO DE PONTO
==============================

Hospital:
${hospitalAdmin?.hospital?.nome || "-"}

Funcionário:
${usuarioSelecionado?.nome || "-"}

E-mail:
${usuarioSelecionado?.email || "-"}

Quantidade de registros:
${pontos.length}

==============================

${pontos.map((p) => `

Data:
${formatarDataBrasil(p.data)}

Entrada:
${p.horaentrada || "-"}

Saída:
${p.horasaida || "-"}

Horas Trabalhadas:
${calcularHoras(
  p.horaentrada,
  p.horasaida
)}

--------------------------------

`).join("")}

`;

  Alert.alert(
    "Relatório",
    texto
  );
}

/*
  ============================
  EXPORTAR PDF
  ============================
*/

async function exportarPDF() {

  if (pontos.length === 0) {

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
        background: #F8FAFC;
        color: #1E293B;
      ">

        <div style="
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #E2E8F0;
        ">

          <h1 style="
            color: #2563EB;
            margin-bottom: 10px;
          ">
            Relatório Administrativo
          </h1>

          <hr style="
            border: none;
            border-top: 1px solid #CBD5E1;
            margin: 20px 0;
          " />

          <h2 style="
            color: #0F172A;
            margin-bottom: 14px;
          ">
            Dados do Funcionário
          </h2>

          <p>
            <strong>Hospital:</strong>
            ${hospitalAdmin?.hospital?.nome || "-"}
          </p>

          <p>
            <strong>Funcionário:</strong>
            ${usuarioSelecionado?.nome || "-"}
          </p>

          <p>
            <strong>E-mail:</strong>
            ${usuarioSelecionado?.email || "-"}
          </p>

          <p>
            <strong>Total de registros:</strong>
            ${pontos.length}
          </p>

          <hr style="
            border: none;
            border-top: 1px solid #CBD5E1;
            margin: 24px 0;
          " />

          <h2 style="
            color: #2563EB;
            margin-bottom: 18px;
          ">
            Registros de Ponto
          </h2>

          ${pontos.map((p) => `

            <div style="
              border: 1px solid #CBD5E1;
              border-radius: 16px;
              padding: 18px;
              margin-bottom: 18px;
              background: #FFFFFF;
            ">

              <p>
                <strong>Data:</strong>
                ${formatarDataBrasil(p.data)}
              </p>

              <p>
                <strong>Entrada:</strong>
                ${p.horaentrada || "-"}
              </p>

              <p>
                <strong>Saída:</strong>
                ${p.horasaida || "-"}
              </p>

              <p>
                <strong>Total Trabalhado:</strong>
                ${calcularHoras(
                  p.horaentrada,
                  p.horasaida
                )}
              </p>

            </div>

          `).join("")}

        </div>

      </body>

    </html>
  `;

  try {

    const { uri } =

      await Print.printToFileAsync({
        html
      });

    await Sharing.shareAsync(uri);

  } catch {

    Alert.alert(
      "Erro",
      "Falha ao exportar PDF"
    );
  }
}

  return (

    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.content}
      >

        <Text style={styles.title}>
          Painel Administrativo
        </Text>

        {/* HOSPITAL */}

        <View style={styles.hospitalCard}>

          <MaterialIcons
            name="local-hospital"
            size={24}
            color="#2563EB"
          />

          <Text style={styles.hospitalTexto}>

            Hospital:
            {" "}
            {hospitalAdmin?.hospital?.nome || "-"}

          </Text>

        </View>

        {/* BOTÃO VOLTAR */}

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() =>
            router.replace("/")
          }
        >

          <MaterialIcons
            name="arrow-back"
            size={22}
            color="#fff"
          />

          <Text style={styles.botaoVoltarTexto}>
            Voltar
          </Text>

        </TouchableOpacity>

        <Text style={styles.subtitle}>
          Funcionários do Hospital
        </Text>

        <FlatList

          data={usuarios}

          scrollEnabled={false}

          keyExtractor={(item) =>
            item.idusuario.toString()
          }

          renderItem={({ item }) => (

            <TouchableOpacity

              style={styles.userCard}

              onPress={() => {

                setUsuarioSelecionado(item);

                setDataSelecionada(null);

                buscarPontos(
                  item.idusuario,
                  null
                );
              }}
            >

              <MaterialIcons
                name="person"
                size={24}
                color="#2563EB"
              />

              <View>

                <Text style={styles.nome}>
                  {item.nome}
                </Text>

                <Text style={styles.email}>
                  {item.email}
                </Text>

              </View>

            </TouchableOpacity>
          )}
        />

        {/* RELATÓRIOS */}

        {usuarioSelecionado && (

          <View style={styles.relatorioCard}>

            <Text style={styles.subtitle}>
              Relatórios de{" "}
              {usuarioSelecionado.nome}
            </Text>

            <TouchableOpacity

              style={styles.botaoData}

              onPress={() =>
                setMostrarCalendario(true)
              }
            >

              <MaterialIcons
                name="calendar-month"
                size={20}
                color="#fff"
              />

              <Text style={styles.botaoTexto}>

                {dataSelecionada
                  ? dataSelecionada.toLocaleDateString("pt-BR")
                  : "Selecionar Data"}

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
                      USA DATA EXATA
                    */

                    setDataSelecionada(date);

                    buscarPontos(
                      usuarioSelecionado.idusuario,
                      date
                    );
                  }
                }}
              />
            )}

            <TouchableOpacity

              style={styles.botao}

              onPress={() =>

                buscarPontos(
                  usuarioSelecionado.idusuario,
                  dataSelecionada
                )
              }
            >

              <MaterialIcons
                name="search"
                size={20}
                color="#fff"
              />

              <Text style={styles.botaoTexto}>
                Filtrar Registros
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botao}
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

          </View>
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F1F5F9'
  },

  content: {
    padding: 16,
    paddingBottom: 40
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 14
  },

  hospitalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    elevation: 3
  },

  hospitalTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A"
  },

  botaoVoltar: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20
  },

  botaoVoltarTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  },

  userCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    elevation: 3
  },

  nome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },

  email: {
    color: '#64748B'
  },

  relatorioCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
    elevation: 3
  },

  botao: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10
  },

  botaoData: {
    backgroundColor: '#1D4ED8',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10
  },

  botaoPdf: {
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10
  },

  botaoTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  }
});
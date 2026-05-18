import { MaterialIcons } from '@expo/vector-icons';
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

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);

  const [pontos, setPontos] = useState<any[]>([]);

  const [dataSelecionada, setDataSelecionada] =
    useState<Date | null>(null);

  const [mostrarCalendario, setMostrarCalendario] =
    useState(false);

  useEffect(() => {
    buscarUsuarios();
  }, []);

  async function buscarUsuarios() {

    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .order("nome");

    if (error) {

      Alert.alert(
        "Erro",
        error.message
      );

      return;
    }

    setUsuarios(data || []);
  }

  async function buscarPontos(
    idusuario: number
  ) {

    try {

      let query = supabase

        .from("ponto")

        .select("*")

        .eq("idusuario", idusuario)

        .order("data", {
          ascending: false
        });

      /*
        FILTRO DATA
      */

      if (dataSelecionada) {

        const dataFormatada =
          dataSelecionada
            .toISOString()
            .split("T")[0];

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

    } catch {

      Alert.alert(
        "Erro",
        "Falha ao buscar registros"
      );
    }
  }

  function formatarData(
    data: Date
  ) {

    return data.toLocaleDateString(
      "pt-BR"
    );
  }

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

    const horas =
      Math.floor(diferenca / 60);

    const minutos =
      diferenca % 60;

    return `${horas}h ${minutos}m`;
  }

  function gerarRelatorio() {

    if (pontos.length === 0) {

      Alert.alert(
        "Erro",
        "Nenhum registro encontrado"
      );

      return;
    }

    const texto = pontos.map(p =>

      `Data: ${p.data}

Entrada: ${p.horaentrada || "-"}

Saída: ${p.horasaida || "-"}

Total Trabalhado:
${calcularHoras(
        p.horaentrada,
        p.horasaida
      )}`

    ).join("\n\n");

    Alert.alert(
      "Relatório",
      texto
    );
  }

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
          padding: 20px;
        ">

          <h1>
            Relatório de Pontos
          </h1>

          <h3>
            ${usuarioSelecionado?.nome}
          </h3>

          <hr />

          ${pontos.map(p => `

            <div style="
              margin-bottom: 20px;
            ">

              <p>
                <strong>Data:</strong>
                ${p.data}
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
                <strong>Total:</strong>
                ${calcularHoras(
                  p.horaentrada,
                  p.horasaida
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

        {/* VOLTAR */}

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
          Usuários cadastrados
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

                buscarPontos(
                  item.idusuario
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

            {/* DATA */}

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
                  ? formatarData(
                    dataSelecionada
                  )
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

                onChange={(
                  event,
                  date
                ) => {

                  setMostrarCalendario(false);

                  if (date) {

                    setDataSelecionada(
                      date
                    );
                  }
                }}
              />
            )}

            {/* FILTRAR */}

            <TouchableOpacity

              style={styles.botao}

              onPress={() =>
                buscarPontos(
                  usuarioSelecionado.idusuario
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

            {/* RELATÓRIO */}

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

            {/* PDF */}

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
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as Animatable from 'react-native-animatable';
import { Input } from "../components/input";

export default function Index() {

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [biometryType, setBiometryType] = useState<string>("Biometria");

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function verifyAvaliableAuthentication(): Promise<void> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!compatible) {
        Alert.alert("Erro", "Dispositivo não suporta biometria");
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometryType("Reconhecimento Facial");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometryType("Impressão Digital");
      }

    } catch (error) {
      console.log(error);
    }
  }

  async function handleAuthentication() {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Autentique-se"
    });

    if (auth.success) {
      router.replace("/ponto");
    } else {
      Alert.alert("Erro", "Falha na autenticação");
    }
  }

  useEffect(() => {
    verifyAvaliableAuthentication();
  }, []);

  function handleSigIn(): void {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Entrar", "Preencha e-mail e senha");
      return;
    }

    router.replace("/ponto");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: "height" })}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>

          <Animatable.Image
            animation="fadeInDown"
            duration={1500}
            source={require("../assets/logoApp.png")}
            style={styles.illustration}
          />

          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>
            Acesse sua conta com e-mail e senha
          </Text>

          <View style={styles.card}>

            <Input
              ref={emailRef}
              placeholder="E-mail"
              keyboardType="email-address"
              returnKeyType="next"
              autoCapitalize="none"
              onSubmitEditing={() => passwordRef.current?.focus()}
              onChangeText={setEmail}
            />

            <Input
              ref={passwordRef}
              placeholder="Senha"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSigIn}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleSigIn}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bioButton}
              onPress={handleAuthentication}
            >
              <MaterialIcons name="fingerprint" size={24} color="#fff" />
              <Text style={styles.buttonText}>
                Entrar com {biometryType}
              </Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.footerText}>
            Não tem uma conta?{' '}
            <Link href={'/singup'} style={styles.footerLink}>
              Cadastre-se aqui
            </Link>
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 24,
    justifyContent: 'center'
  },

  illustration: {
    width: '100%',
    height: 280,
    resizeMode: 'contain'
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B'
  },

  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },

  button: {
    backgroundColor: '#2E86DE',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center'
  },

  bioButton: {
    backgroundColor: '#27AE60',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },

  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#64748B'
  },

  footerLink: {
    color: '#2563EB',
    fontWeight: 'bold'
  }
})
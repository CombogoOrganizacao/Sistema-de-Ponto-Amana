import * as Device from 'expo-device';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { cssInterop } from 'nativewind';

function getDevMenuHint() {
  cssInterop(ThemedText, { className: 'style' });
  cssInterop(ThemedView, { className: 'style' });

  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth.context';

export default function HomeScreen() {
  const { user, userProfile, loginComEmail, cadastrarComEmail, loginComGoogle, logout, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [isCadastro, setIsCadastro] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Por favor preencha e-mail e senha.');
      return;
    }

    setSubmitting(true);
    try {
      if (isCadastro) {
        if (!nome) {
          Alert.alert('Atenção', 'Por favor informe o seu nome.');
          setSubmitting(false);
          return;
        }
        await cadastrarComEmail(nome, email, senha);
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      } else {
        await loginComEmail(email, senha);
      }
    } catch (error: any) {
      let mensagem = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensagem = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/email-already-in-use') {
        mensagem = 'Este e-mail já está cadastrado.';
      } else if (error.code === 'auth/weak-password') {
        mensagem = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        mensagem = 'E-mail inválido.';
      }
      Alert.alert('Erro na autenticação', mensagem);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginComGoogle();
    } catch (error: any) {
      Alert.alert('Erro Google', error.message || 'Falha ao autenticar com Google.');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView className="flex-1 p-6 justify-between">
          <View className="gap-4">
            <ThemedText type="title">Olá, {userProfile?.nome || user.displayName || 'Colaborador'} 👋</ThemedText>
            <ThemedText className="text-gray-400">
              Conectado como: <ThemedText className="text-orange-400">{user.email}</ThemedText>
            </ThemedText>
            <View className="bg-gray-800 p-4 rounded-xl mt-4 border border-gray-700">
              <ThemedText className="font-semibold text-gray-300">Cargo / Função:</ThemedText>
              <ThemedText className="text-lg text-white capitalize">{userProfile?.cargo || 'Colaborador'}</ThemedText>
            </View>
          </View>

          <TouchableOpacity
            onPress={logout}
            className="bg-red-500/20 border border-red-500 rounded-xl px-4 py-4 flex-row items-center gap-2 justify-center mt-6"
          >
            <ThemedText className="text-red-400 font-semibold">Sair da Conta</ThemedText>
          </TouchableOpacity>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView className="flex-1">
        <View className="justify-between h-full p-6">
          <View className="gap-6">
            <View className="mb-2">
              <ThemedText type="title">Combogó Ponto</ThemedText>
              <ThemedText className="text-gray-400">
                {isCadastro ? 'Crie sua conta institucional' : 'Faça login para bater seu ponto'}
              </ThemedText>
            </View>

            {isCadastro && (
              <View>
                <ThemedText>Nome Completo</ThemedText>
                <View className="border border-gray-600 rounded-xl px-4 py-3 bg-gray-900 flex-row items-center gap-2 mt-1">
                  <Text>👤</Text>
                  <TextInput
                    placeholder="Seu nome"
                    placeholderTextColor="#6b7280"
                    value={nome}
                    onChangeText={setNome}
                    className="flex-1 text-white text-base"
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View>
              <ThemedText>E-mail institucional</ThemedText>
              <View className="border border-gray-600 rounded-xl px-4 py-3 bg-gray-900 flex-row items-center gap-2 mt-1">
                <Text>✉️</Text>
                <TextInput
                  placeholder="email@empresa.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  className="flex-1 text-white text-base"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View>
              <ThemedText>Senha</ThemedText>
              <View className="border border-gray-600 rounded-xl px-4 py-3 bg-gray-900 flex-row items-center gap-2 mt-1">
                <Text>🔑</Text>
                <TextInput
                  placeholder="Sua senha"
                  placeholderTextColor="#6b7280"
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                  className="flex-1 text-white text-base"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className="bg-orange-500 active:bg-orange-600 rounded-xl px-4 py-4 flex-row items-center gap-2 justify-center mt-2 shadow"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText className="text-lg font-semibold text-white">
                  {isCadastro ? 'Cadastrar' : 'Entrar'}
                </ThemedText>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center gap-3 my-1">
              <View className="flex-1 h-[1px] bg-gray-700" />
              <ThemedText className="text-xs text-gray-500">OU</ThemedText>
              <View className="flex-1 h-[1px] bg-gray-700" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              className="border border-gray-600 bg-gray-900 rounded-xl px-4 py-4 flex-row items-center justify-center gap-3"
            >
              <Text className="text-lg">🌐</Text>
              <ThemedText className="font-semibold text-white">Continuar com Google</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsCadastro(!isCadastro)}
              className="items-center py-2"
            >
              <ThemedText className="text-orange-400">
                {isCadastro ? 'Já possui uma conta? Faça Login' : 'Novo por aqui? Criar uma conta'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});

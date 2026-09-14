import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth.context';
import { pontoService, RegistroPonto, TipoPonto } from '@/services/ponto.service';

export default function PontoScreen() {
  const { user, userProfile } = useAuth();
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setPontos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Escuta em tempo real os registros de ponto do Firestore
    const unsubscribe = pontoService.ouvirPontosPorUsuario(
      user.uid,
      (novosPontos) => {
        setPontos(novosPontos);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar histórico de pontos:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleBaterPonto = async (tipo: TipoPonto) => {
    if (!user) {
      Alert.alert('Aviso', 'Faça login na aba Home primeiro para bater seu ponto.');
      return;
    }

    setSaving(true);
    try {
      await pontoService.registrarPonto({
        usuarioId: user.uid,
        usuarioNome: userProfile?.nome || user.displayName || 'Colaborador',
        usuarioEmail: user.email || '',
        tipo,
        localizacao: 'Registro via Mobile App',
        registro: new Date(),
      });
      Alert.alert(
        'Ponto Registrado!',
        `Seu ponto de ${tipo.toUpperCase()} foi salvo com sucesso no Firestore.`
      );
    } catch (error: any) {
      console.error('Erro ao bater ponto:', error);
      Alert.alert('Erro ao registrar ponto', error.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const formatarDataHora = (data: any) => {
    if (!data) return '-';
    const d = data instanceof Date ? data : new Date(data);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView className="flex-1 justify-center items-center p-6">
          <Text className="text-4xl mb-4">⏱️</Text>
          <ThemedText type="title" className="text-center mb-2">Registro de Ponto</ThemedText>
          <ThemedText className="text-gray-400 text-center">
            Por favor, faça login na tela inicial para registrar seus pontos e ver seu histórico.
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView className="flex-1 p-6">
        <View className="mb-6">
          <ThemedText type="title">Bater Ponto ⏱️</ThemedText>
          <ThemedText className="text-gray-400">
            {userProfile?.nome || user.displayName} ({user.email})
          </ThemedText>
        </View>

        {/* Botões de Ação */}
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity
            onPress={() => handleBaterPonto('entrada')}
            disabled={saving}
            className="flex-1 bg-emerald-600 active:bg-emerald-700 p-4 rounded-xl items-center justify-center shadow"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-2xl mb-1">🟢</Text>
                <ThemedText className="font-bold text-white text-base">Entrada</ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleBaterPonto('saida')}
            disabled={saving}
            className="flex-1 bg-rose-600 active:bg-rose-700 p-4 rounded-xl items-center justify-center shadow"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-2xl mb-1">🔴</Text>
                <ThemedText className="font-bold text-white text-base">Saída</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Histórico em Tempo Real */}
        <View className="flex-1">
          <ThemedText type="subtitle" className="mb-3">
            Histórico Recente (Firestore)
          </ThemedText>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : pontos.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <ThemedText className="text-gray-500">Nenhum registro de ponto encontrado.</ThemedText>
            </View>
          ) : (
            <FlatList
              data={pontos}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={({ item }) => (
                <View className="bg-gray-800/80 border border-gray-700/60 p-4 rounded-xl mb-3 flex-row justify-between items-center">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-xl">
                      {item.tipo === 'entrada' ? '🟢' : '🔴'}
                    </Text>
                    <View>
                      <ThemedText className="font-semibold text-white capitalize">
                        {item.tipo}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400">
                        {typeof item.localizacao === 'string' ? item.localizacao : 'Local registrado'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText className="text-xs text-gray-300 font-mono">
                    {formatarDataHora(item.registro)}
                  </ThemedText>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});


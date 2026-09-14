import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

export type TipoPonto = 'entrada' | 'saida';

export interface RegistroPonto {
  id?: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  tipo: TipoPonto;
  localizacao?: {
    latitude?: number;
    longitude?: number;
    endereco?: string;
  } | string;
  registro: Date | Timestamp;
  criadoEm?: any;
}

export const pontoService = {
  /**
   * Bate um ponto (entrada ou saída)
   */
  async registrarPonto(dados: Omit<RegistroPonto, 'id' | 'criadoEm'>) {
    const pontosRef = collection(db, 'pontos');
    const docRef = await addDoc(pontosRef, {
      ...dados,
      registro: dados.registro instanceof Date ? Timestamp.fromDate(dados.registro) : dados.registro,
      criadoEm: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Obtém o histórico de pontos de um usuário específico
   */
  async getPontosPorUsuario(usuarioId: string): Promise<RegistroPonto[]> {
    const pontosRef = collection(db, 'pontos');
    const q = query(
      pontosRef,
      where('usuarioId', '==', usuarioId),
      orderBy('registro', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      registro: (doc.data().registro as Timestamp)?.toDate?.() || doc.data().registro,
    })) as RegistroPonto[];
  },

  /**
   * Escuta em tempo real os pontos de um usuário
   */
  ouvirPontosPorUsuario(
    usuarioId: string,
    onUpdate: (pontos: RegistroPonto[]) => void,
    onError?: (error: Error) => void
  ) {
    const pontosRef = collection(db, 'pontos');
    const q = query(
      pontosRef,
      where('usuarioId', '==', usuarioId),
      orderBy('registro', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const pontos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          registro: (doc.data().registro as Timestamp)?.toDate?.() || doc.data().registro,
        })) as RegistroPonto[];
        onUpdate(pontos);
      },
      (error) => {
        if (onError) onError(error);
        else console.error('Erro ao escutar pontos:', error);
      }
    );
  },
};

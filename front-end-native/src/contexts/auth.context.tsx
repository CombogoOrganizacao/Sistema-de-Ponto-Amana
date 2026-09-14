import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  cargo: 'admin' | 'colaborador';
  fotoUrl?: string;
}

interface AuthContextData {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginComEmail: (email: string, pass: string) => Promise<void>;
  cadastrarComEmail: (nome: string, email: string, pass: string, cargo?: 'admin' | 'colaborador') => Promise<void>;
  loginComGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configuração do Google Auth Session para Expo
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '20657185811-web.apps.googleusercontent.com', // fallback Web Client ID
    iosClientId: '20657185811-ios.apps.googleusercontent.com',
    androidClientId: '20657185811-android.apps.googleusercontent.com',
  });

  // Salvar ou atualizar perfil do usuário no Firestore
  const syncUserProfile = async (firebaseUser: User, customData?: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'usuarios', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          nome: customData?.nome || firebaseUser.displayName || 'Colaborador',
          email: firebaseUser.email || '',
          cargo: customData?.cargo || 'colaborador',
          fotoUrl: firebaseUser.photoURL || undefined,
        };
        await setDoc(userRef, {
          ...newProfile,
          criadoEm: serverTimestamp(),
        });
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Erro ao sincronizar perfil:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Resposta do Google Auth Session
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          await syncUserProfile(userCredential.user);
        })
        .catch((err) => {
          console.error('Erro ao autenticar com credencial do Google:', err);
        });
    }
  }, [response]);

  const loginComEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserProfile(userCred.user);
    } finally {
      setLoading(false);
    }
  };

  const cadastrarComEmail = async (
    nome: string,
    email: string,
    pass: string,
    cargo: 'admin' | 'colaborador' = 'colaborador'
  ) => {
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(userCred.user, { displayName: nome });
      await syncUserProfile(userCred.user, { nome, cargo });
    } finally {
      setLoading(false);
    }
  };

  const loginComGoogle = async () => {
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithCredential(auth, provider as any);
      await syncUserProfile(userCred.user);
    } else {
      await promptAsync();
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginComEmail,
        cadastrarComEmail,
        loginComGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

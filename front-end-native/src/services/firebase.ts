import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBb7pTGduRDMY_y6rGrk5If9tIaLWV7X3c",
  authDomain: "amana-ponto.firebaseapp.com",
  projectId: "amana-ponto",
  storageBucket: "amana-ponto.firebasestorage.app",
  messagingSenderId: "242866393115",
  appId: "1:242866393115:web:580d5c66a98f256667a8be"
};

// Inicializa o App do Firebase (evita recriar em reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializa o Auth com persistência adequada
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    auth = getAuth(app);
  }
}

// Inicializa o Firestore
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig };

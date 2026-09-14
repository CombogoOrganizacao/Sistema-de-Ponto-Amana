import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyD3Tjefzcy-YxOr3c8YJ91HhH8AO3r1LuY",
  authDomain: "combogoponto.firebaseapp.com",
  projectId: "combogoponto",
  storageBucket: "combogoponto.firebasestorage.app",
  messagingSenderId: "20657185811",
  appId: "1:20657185811:web:21b6111d7a29b370a20be6",
  measurementId: "G-BJZKEBN9FH"
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

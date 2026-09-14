import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ==========================================
// CONFIGURAÇÃO DO FIREBASE
// ==========================================
export const firebaseConfig = {
  apiKey: "AIzaSyD3Tjefzcy-YxOr3c8YJ91HhH8AO3r1LuY",
  authDomain: "Amana Lab.firebaseapp.com",
  projectId: "Amana Lab",
  storageBucket: "Amana Lab.firebasestorage.app",
  messagingSenderId: "20657185811",
  appId: "1:20657185811:web:21b6111d7a29b370a20be6",
  measurementId: "G-BJZKEBN9FH"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// E-mail Master de Administrador
export const ADMIN_EMAIL = "Amana Lab@gmail.com";

// ==========================================
// PONTOS GEOFENCE PERMITIDOS (UNICAP & MUSEU)
// ==========================================
export const GEOFENCE_LOCATIONS = [
  {
    name: "Campus UNICAP (Rua do Príncipe)",
    lat: -8.0548955,
    lng: -34.8877622,
    radiusMeters: 450
  },
  {
    name: "Museu de Arqueologia da UNICAP",
    lat: -8.056223,
    lng: -34.888640,
    radiusMeters: 250
  }
];

export function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

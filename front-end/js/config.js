import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// ==========================================
// CONFIGURAÇÃO DO FIREBASE (AMANA-PONTO)
// ==========================================
export const firebaseConfig = {
  apiKey: "AIzaSyBb7pTGduRDMY_y6rGrk5If9tIaLWV7X3c",
  authDomain: "amana-ponto.firebaseapp.com",
  projectId: "amana-ponto",
  storageBucket: "amana-ponto.firebasestorage.app",
  messagingSenderId: "242866393115",
  appId: "1:242866393115:web:580d5c66a98f256667a8be"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// E-mail Master de Administrador
export const ADMIN_EMAIL = "combogounicap@gmail.com";

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

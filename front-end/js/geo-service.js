import { GEOFENCE_LOCATIONS } from "./config.js";

// ==========================================
// SERVIÇO DE GEOLOCALIZAÇÃO E GEOFENCE
// ==========================================
let currentGeoPosition = null;

export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function checarGeofence(userLat, userLng) {
  for (const loc of GEOFENCE_LOCATIONS) {
    const distancia = calcularDistanciaMetros(userLat, userLng, loc.lat, loc.lng);
    if (distancia <= loc.radiusMeters) {
      return { dentro: true, localNome: loc.name, distancia: Math.round(distancia) };
    }
  }
  const dist1 = Math.round(calcularDistanciaMetros(userLat, userLng, GEOFENCE_LOCATIONS[0].lat, GEOFENCE_LOCATIONS[0].lng));
  return { dentro: false, distancia: dist1 };
}

export function obterLocalizacaoAtual(geoStatusDot, geoStatusText) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const err = new Error("Geolocalização não suportada pelo seu navegador/aparelho.");
      if (geoStatusText) geoStatusText.innerHTML = `<strong class="text-rose-400">GPS Não Suportado</strong>`;
      reject(err);
      return;
    }

    if (geoStatusDot && geoStatusText) {
      geoStatusDot.className = "w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse";
      geoStatusText.textContent = "Obtendo sinal do GPS...";
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const geoCheck = checarGeofence(latitude, longitude);
        currentGeoPosition = { latitude, longitude, accuracy, ...geoCheck };

        if (geoStatusDot && geoStatusText) {
          if (geoCheck.dentro) {
            geoStatusDot.className = "w-2.5 h-2.5 rounded-full bg-emerald-500";
            geoStatusText.innerHTML = `<strong class="text-emerald-400">Dentro do perímetro permitido:</strong> ${geoCheck.localNome} (~${geoCheck.distancia}m)`;
          } else {
            geoStatusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
            geoStatusText.innerHTML = `<strong class="text-rose-400">Fora do perímetro:</strong> Você está a ~${geoCheck.distancia}m da UNICAP (Necessário estar no Campus ou Museu)`;
          }
        }
        resolve(currentGeoPosition);
      },
      (err) => {
        if (geoStatusDot && geoStatusText) {
          geoStatusDot.className = "w-2.5 h-2.5 rounded-full bg-rose-500";
          let msg = "Permissão de localização negada ou GPS inativo.";
          if (err.code === err.TIMEOUT) msg = "Tempo esgotado ao buscar GPS.";
          geoStatusText.innerHTML = `<strong class="text-rose-400">GPS Indisponível:</strong> ${msg}`;
        }
        reject(new Error("Permissão de localização negada ou GPS inativo."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

export function getCurrentGeoPosition() {
  return currentGeoPosition;
}

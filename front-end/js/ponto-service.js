import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db, renderIcons } from "./config.js";
import { obterHoraOficialRecife, formatarDataChave, validarHorarioPonto, getServerTimeOffsetMs } from "./time-service.js";
import { obterLocalizacaoAtual } from "./geo-service.js";

// ==========================================
// CONTROLE E REGISTRO DE PONTO DIÁRIO
// ==========================================
export function checarPontosHoje(userId, allPontosData) {
  if (!userId) return { jaBateuEntrada: false, jaBateuSaida: false, horaEntrada: null, horaSaida: null, dataHojeChave: "" };

  const dataHojeOficial = new Date(Date.now() + getServerTimeOffsetMs());
  const hojeChave = formatarDataChave(dataHojeOficial);

  const pontosHoje = allPontosData.filter(p => {
    if (p.usuarioId !== userId) return false;
    if (p.dataChave) return p.dataChave === hojeChave;
    if (!p.registro) return false;
    const d = p.registro.toDate ? p.registro.toDate() : new Date(p.registro);
    return !isNaN(d.getTime()) && formatarDataChave(d) === hojeChave;
  });

  const pontoEntrada = pontosHoje.find(p => p.tipo === "entrada");
  const pontoSaida = pontosHoje.find(p => p.tipo === "saida");

  return {
    dataHojeChave: hojeChave,
    jaBateuEntrada: !!pontoEntrada,
    jaBateuSaida: !!pontoSaida,
    horaEntrada: pontoEntrada ? (pontoEntrada.registro ? (pontoEntrada.registro.toDate ? pontoEntrada.registro.toDate() : new Date(pontoEntrada.registro)) : null) : null,
    horaSaida: pontoSaida ? (pontoSaida.registro ? (pontoSaida.registro.toDate ? pontoSaida.registro.toDate() : new Date(pontoSaida.registro)) : null) : null
  };
}

export function atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida) {
  if (!currentUserData || !btnBaterEntrada || !btnBaterSaida) return;

  const statusHoje = checarPontosHoje(currentUserData.uid, allPontosData);

  // Controle de Entrada
  if (statusHoje.jaBateuEntrada) {
    btnBaterEntrada.disabled = true;
    btnBaterEntrada.className = "py-3.5 px-4 bg-gray-800 text-gray-400 border border-gray-700 font-semibold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 opacity-80";
    const horaFormat = statusHoje.horaEntrada ? statusHoje.horaEntrada.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Recife" }) : "";
    btnBaterEntrada.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i><span>Entrada Realizada ${horaFormat ? `(${horaFormat})` : ''}</span>`;
  } else {
    btnBaterEntrada.disabled = false;
    btnBaterEntrada.className = "py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] font-bold text-sm text-white rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer";
    btnBaterEntrada.innerHTML = `<i data-lucide="arrow-down-left" class="w-5 h-5"></i><span>Bater Entrada</span>`;
  }

  // Controle de Saída
  if (statusHoje.jaBateuSaida) {
    btnBaterSaida.disabled = true;
    btnBaterSaida.className = "py-3.5 px-4 bg-gray-800 text-gray-400 border border-gray-700 font-semibold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 opacity-80";
    const horaFormat = statusHoje.horaSaida ? statusHoje.horaSaida.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Recife" }) : "";
    btnBaterSaida.innerHTML = `<i data-lucide="check-circle-2" class="w-5 h-5 text-rose-400"></i><span>Saída Realizada ${horaFormat ? `(${horaFormat})` : ''}</span>`;
  } else {
    btnBaterSaida.disabled = false;
    btnBaterSaida.className = "py-3.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] font-bold text-sm text-white rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer";
    btnBaterSaida.innerHTML = `<i data-lucide="arrow-up-right" class="w-5 h-5"></i><span>Bater Saída</span>`;
  }

  renderIcons();
}

export async function registrarPontoWeb({
  tipo,
  currentUserData,
  currentUserProfile,
  allPontosData,
  btnBaterEntrada,
  btnBaterSaida,
  geoStatusDot,
  geoStatusText,
  showPontoStatus
}) {
  if (!currentUserData || !currentUserProfile) {
    showPontoStatus("Você precisa estar logado.", true);
    return;
  }

  const curso = currentUserProfile.curso || "";
  const isAdmin = currentUserProfile.cargo === "admin";

  const statusPreCheck = checarPontosHoje(currentUserData.uid, allPontosData);
  if (tipo === "entrada" && statusPreCheck.jaBateuEntrada) {
    showPontoStatus("Ponto Bloqueado: Você já registrou a ENTRADA de hoje. Apenas 1 entrada por dia é permitida.", true);
    atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
    return;
  }
  if (tipo === "saida" && statusPreCheck.jaBateuSaida) {
    showPontoStatus("Ponto Bloqueado: Você já registrou a SAÍDA de hoje. Apenas 1 saída por dia é permitida.", true);
    atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
    return;
  }

  btnBaterEntrada.disabled = true;
  btnBaterSaida.disabled = true;
  showPontoStatus("Sincronizando hora oficial e validando localização GPS...");

  try {
    const dataOficial = await obterHoraOficialRecife();
    const dataChave = formatarDataChave(dataOficial);
    const pontoDocId = `${currentUserData.uid}_${dataChave}_${tipo}`;

    const pontoExistenteRef = doc(db, "pontos", pontoDocId);
    const pontoExistenteSnap = await getDoc(pontoExistenteRef);
    if (pontoExistenteSnap.exists()) {
      showPontoStatus(`Ponto Bloqueado: Registro de ${tipo.toUpperCase()} já efetuado hoje (${dataChave}).`, true);
      atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
      return;
    }

    const validacaoHorario = validarHorarioPonto(tipo, curso, isAdmin, dataOficial);
    if (!validacaoHorario.valido) {
      showPontoStatus(validacaoHorario.motivo, true);
      atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
      return;
    }

    const geo = await obterLocalizacaoAtual(geoStatusDot, geoStatusText);
    if (!geo.dentro) {
      showPontoStatus(`Ponto Bloqueado: Você precisa estar no campus da UNICAP ou no Museu da UNICAP (Distância atual: ~${geo.distancia}m).`, true);
      atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
      return;
    }

    await setDoc(pontoExistenteRef, {
      usuarioId: currentUserData.uid,
      usuarioNome: currentUserProfile.nome || currentUserData.displayName || "Colaborador",
      usuarioEmail: currentUserData.email || "",
      usuarioCurso: curso || "Não especificado",
      tipo: tipo,
      dataChave: dataChave,
      localizacao: `${geo.localNome} (GPS Validado)`,
      coordenadas: {
        latitude: geo.latitude,
        longitude: geo.longitude,
        precisao: geo.accuracy
      },
      registro: serverTimestamp(),
      criadoEm: serverTimestamp()
    });

    showPontoStatus(`Ponto de ${tipo.toUpperCase()} registrado com sucesso no ${geo.localNome}! (+1h30min adicionado)`);
  } catch (err) {
    console.error("Erro ao registrar ponto:", err);
    showPontoStatus(err.message || "Erro ao registrar ponto.", true);
  } finally {
    atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
  }
}

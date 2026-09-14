// ==========================================
// SERVIÇO DE HORA OFICIAL E REGRAS DE HORÁRIO
// ==========================================
let serverTimeOffsetMs = 0;
let hasSyncedServerTime = false;

export async function sincronizarHoraServidor() {
  try {
    const t0 = performance.now();
    const res = await fetch("https://timeapi.io/api/time/current/zone?timeZone=America/Recife", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const t1 = performance.now();
      const latency = (t1 - t0) / 2;
      const isoWithOffset = data.dateTime.includes("-03:00") ? data.dateTime : `${data.dateTime}-03:00`;
      const serverDate = new Date(new Date(isoWithOffset).getTime() + latency);
      if (!isNaN(serverDate.getTime())) {
        serverTimeOffsetMs = serverDate.getTime() - Date.now();
        hasSyncedServerTime = true;
        return serverDate;
      }
    }
  } catch (e) {
    try {
      const t0 = performance.now();
      const res = await fetch("https://worldtimeapi.org/api/timezone/America/Recife", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const t1 = performance.now();
        const latency = (t1 - t0) / 2;
        const serverDate = new Date(new Date(data.datetime).getTime() + latency);
        if (!isNaN(serverDate.getTime())) {
          serverTimeOffsetMs = serverDate.getTime() - Date.now();
          hasSyncedServerTime = true;
          return serverDate;
        }
      }
    } catch (e2) {
      console.warn("Não foi possível sincronizar hora externa no momento:", e2);
    }
  }
  return new Date(Date.now() + serverTimeOffsetMs);
}

// Inicia sincronização imediatamente
sincronizarHoraServidor();

export async function obterHoraOficialRecife() {
  return await sincronizarHoraServidor();
}

export function formatarDataChave(dateObj) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Recife',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(dateObj);
  const dia = parts.find(p => p.type === 'day').value;
  const mes = parts.find(p => p.type === 'month').value;
  const ano = parts.find(p => p.type === 'year').value;
  return `${ano}-${mes}-${dia}`;
}

export function obterMinutosDoDia(dateObj) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Recife',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(dateObj);
  const hora = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minuto = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return { hora, minuto, totalMinutos: hora * 60 + minuto };
}

// Converte string "HH:MM" para minutos do dia
export function parseHoraParaMinutos(horaStr, padraoMinutos) {
  if (!horaStr || typeof horaStr !== 'string') return padraoMinutos;
  const partes = horaStr.split(':');
  if (partes.length < 2) return padraoMinutos;
  const h = parseInt(partes[0], 10);
  const m = parseInt(partes[1], 10);
  if (isNaN(h) || isNaN(m)) return padraoMinutos;
  return h * 60 + m;
}

export function validarHorarioPonto(tipo, cursoNome, isAdmin, dateOficial, listaCursos = []) {
  if (isAdmin) return { valido: true };

  const { hora, minuto, totalMinutos: currentMinutes } = obterMinutosDoDia(dateOficial);
  const agoraStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

  // Busca configuração do curso se existir
  const cursoConfig = listaCursos.find(c => (c.nome || "").toLowerCase().trim() === (cursoNome || "").toLowerCase().trim());

  // Horários configurados ou padrões (Entrada padrão: 14:00 | Saída padrão: 17:00 / 16:00 para Jogos)
  let horaEntradaAlvoMin = 14 * 60; // 14:00
  let horaSaidaAlvoMin = (cursoNome || "").toLowerCase().includes("jogos") ? (16 * 60) : (17 * 60);
  let toleranciaMin = 20;

  if (cursoConfig) {
    if (cursoConfig.horaEntrada) {
      horaEntradaAlvoMin = parseHoraParaMinutos(cursoConfig.horaEntrada, horaEntradaAlvoMin);
    }
    if (cursoConfig.horaSaida) {
      horaSaidaAlvoMin = parseHoraParaMinutos(cursoConfig.horaSaida, horaSaidaAlvoMin);
    }
    if (typeof cursoConfig.toleranciaMinutos === 'number') {
      toleranciaMin = cursoConfig.toleranciaMinutos;
    }
  }

  if (tipo === "entrada") {
    const minEntrada = horaEntradaAlvoMin - toleranciaMin;
    const maxEntrada = horaEntradaAlvoMin + toleranciaMin;

    const minStr = `${String(Math.floor(minEntrada / 60)).padStart(2, '0')}:${String(minEntrada % 60).padStart(2, '0')}`;
    const maxStr = `${String(Math.floor(maxEntrada / 60)).padStart(2, '0')}:${String(maxEntrada % 60).padStart(2, '0')}`;
    const alvoStr = `${String(Math.floor(horaEntradaAlvoMin / 60)).padStart(2, '0')}:${String(horaEntradaAlvoMin % 60).padStart(2, '0')}`;

    if (currentMinutes < minEntrada || currentMinutes > maxEntrada) {
      return {
        valido: false,
        motivo: `Horário de Entrada não permitido (Hora Oficial: ${agoraStr}). O ponto de entrada deve ser registrado entre ${minStr} e ${maxStr} (tolerância de ${toleranciaMin} min para as ${alvoStr}).`
      };
    }
    return { valido: true };
  }

  if (tipo === "saida") {
    const minSaida = horaSaidaAlvoMin - toleranciaMin;
    const maxSaida = horaSaidaAlvoMin + toleranciaMin;

    const minStr = `${String(Math.floor(minSaida / 60)).padStart(2, '0')}:${String(minSaida % 60).padStart(2, '0')}`;
    const maxStr = `${String(Math.floor(maxSaida / 60)).padStart(2, '0')}:${String(maxSaida % 60).padStart(2, '0')}`;
    const alvoStr = `${String(Math.floor(horaSaidaAlvoMin / 60)).padStart(2, '0')}:${String(horaSaidaAlvoMin % 60).padStart(2, '0')}`;

    if (currentMinutes < minSaida || currentMinutes > maxSaida) {
      return {
        valido: false,
        motivo: `Horário de Saída para ${cursoNome || 'seu curso'} não permitido (Hora Oficial: ${agoraStr}). O ponto de saída deve ser registrado entre ${minStr} e ${maxStr} (tolerância de ${toleranciaMin} min para as ${alvoStr}).`
      };
    }
    return { valido: true };
  }

  return { valido: true };
}

export function getServerTimeOffsetMs() {
  return serverTimeOffsetMs;
}

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

export function validarHorarioPonto(tipo, curso, isAdmin, dateOficial) {
  if (isAdmin) return { valido: true };

  const { hora, minuto, totalMinutos: currentMinutes } = obterMinutosDoDia(dateOficial);
  const agoraStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;

  if (tipo === "entrada") {
    // 14:00 -> 840 min. Tolerância: 13:40 (820 min) até 14:20 (860 min)
    const minEntrada = 13 * 60 + 40;
    const maxEntrada = 14 * 60 + 20;

    if (currentMinutes < minEntrada || currentMinutes > maxEntrada) {
      return {
        valido: false,
        motivo: `Horário de Entrada não permitido (Hora Oficial: ${agoraStr}). O ponto de entrada só pode ser registrado entre 13:40 e 14:20 (tolerância de 20 min para as 14h).`
      };
    }
    return { valido: true };
  }

  if (tipo === "saida") {
    const isJogos = (curso || "").toLowerCase().includes("jogos");
    
    if (isJogos) {
      // 16:00 -> 960 min. Tolerância: 15:40 (940 min) até 16:20 (980 min)
      const minSaidaJogos = 15 * 60 + 40;
      const maxSaidaJogos = 16 * 60 + 20;

      if (currentMinutes < minSaidaJogos || currentMinutes > maxSaidaJogos) {
        return {
          valido: false,
          motivo: `Horário de Saída para Jogos Digitais não permitido (Hora Oficial: ${agoraStr}). O ponto de saída deve ser registrado entre 15:40 e 16:20 (tolerância de 20 min para as 16h).`
        };
      }
    } else {
      // 17:00 -> 1020 min. Tolerância: 16:40 (1000 min) até 17:20 (1040 min)
      const minSaidaGeral = 16 * 60 + 40;
      const maxSaidaGeral = 17 * 60 + 20;

      if (currentMinutes < minSaidaGeral || currentMinutes > maxSaidaGeral) {
        return {
          valido: false,
          motivo: `Horário de Saída não permitido (Hora Oficial: ${agoraStr}). O ponto de saída deve ser registrado entre 16:40 e 17:20 (tolerância de 20 min para as 17h).`
        };
      }
    }

    return { valido: true };
  }

  return { valido: true };
}

export function getServerTimeOffsetMs() {
  return serverTimeOffsetMs;
}

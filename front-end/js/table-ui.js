import { doc, updateDoc, collection, query, orderBy, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db, renderIcons } from "./config.js";

// ==========================================
// CÁLCULO DE HORAS ACUMULADAS
// ==========================================
export function calcularHorasUsuario(pontosDoUsuario) {
  // Ordena cronologicamente crescente
  const pontosOrdenados = [...pontosDoUsuario].sort((a, b) => {
    const dataA = a.registro ? (a.registro.toDate ? a.registro.toDate() : new Date(a.registro)) : new Date(0);
    const dataB = b.registro ? (b.registro.toDate ? b.registro.toDate() : new Date(b.registro)) : new Date(0);
    return dataA.getTime() - dataB.getTime();
  });

  // Agrupa pontos por dataChave ou dia
  const diasMap = new Map();
  for (const p of pontosOrdenados) {
    let diaChave = p.dataChave;
    if (!diaChave && p.registro) {
      const d = p.registro.toDate ? p.registro.toDate() : new Date(p.registro);
      diaChave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (!diaChave) continue;

    if (!diasMap.has(diaChave)) {
      diasMap.set(diaChave, { entrada: null, saida: null, count: 0 });
    }
    const diaObj = diasMap.get(diaChave);
    diaObj.count++;
    if (p.tipo === "entrada" && !diaObj.entrada) {
      diaObj.entrada = p.registro ? (p.registro.toDate ? p.registro.toDate() : new Date(p.registro)) : null;
    } else if (p.tipo === "saida" && !diaObj.saida) {
      diaObj.saida = p.registro ? (p.registro.toDate ? p.registro.toDate() : new Date(p.registro)) : null;
    }
  }

  // Cada par entrada + saída (ou cada registro validado) contabiliza as horas
  let totalMinutos = 0;
  for (const [_, reg] of diasMap.entries()) {
    if (reg.entrada && reg.saida) {
      const diffMs = reg.saida.getTime() - reg.entrada.getTime();
      const min = Math.max(0, Math.floor(diffMs / (1000 * 60)));
      // Se a jornada for razoável (até 8h), soma a diferença real, ou valor padrão fixo de 90min por ponto
      totalMinutos += min > 0 && min < 600 ? min : 180;
    } else if (reg.entrada || reg.saida) {
      // 1 registro isolado = 1h30m (90 min)
      totalMinutos += 90;
    }
  }

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return { totalMinutos, horas, minutos, formatted: `${horas}h ${String(minutos).padStart(2, '0')}m` };
}

// ==========================================
// RENDERIZAÇÃO DA TABELA DE PONTOS (ADMIN / GERAL)
// ==========================================
export function renderPontosTable(pontos, pontosTbody, emptyState, pontosCount, filterDateValue = "") {
  if (!pontosTbody) return;

  let filtrados = [...pontos];
  if (filterDateValue) {
    filtrados = filtrados.filter(p => {
      if (p.dataChave) return p.dataChave === filterDateValue;
      if (!p.registro) return false;
      const d = p.registro.toDate ? p.registro.toDate() : new Date(p.registro);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return chave === filterDateValue;
    });
  }

  if (pontosCount) {
    pontosCount.textContent = `${filtrados.length} registro${filtrados.length !== 1 ? 's' : ''}`;
  }

  if (filtrados.length === 0) {
    pontosTbody.innerHTML = "";
    emptyState?.classList.remove("hidden");
    return;
  }

  emptyState?.classList.add("hidden");

  // Ordena descrescente por data
  filtrados.sort((a, b) => {
    const dataA = a.registro ? (a.registro.toDate ? a.registro.toDate() : new Date(a.registro)) : new Date(0);
    const dataB = b.registro ? (b.registro.toDate ? b.registro.toDate() : new Date(b.registro)) : new Date(0);
    return dataB.getTime() - dataA.getTime();
  });

  pontosTbody.innerHTML = filtrados.map(p => {
    const isEntrada = p.tipo === "entrada";
    const badgeClass = isEntrada 
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
      : "bg-rose-500/10 text-rose-400 border-rose-500/20";
    const badgeText = isEntrada ? "Entrada" : "Saída";
    const iconName = isEntrada ? "arrow-down-left" : "arrow-up-right";

    const d = p.registro ? (p.registro.toDate ? p.registro.toDate() : new Date(p.registro)) : null;
    const dataHoraStr = d ? d.toLocaleString("pt-BR", { timeZone: "America/Recife" }) : "Data pendente";

    return `
      <tr class="hover:bg-gray-800/30 transition">
        <td class="px-4 py-3.5 whitespace-nowrap">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
            <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
            ${badgeText}
          </span>
        </td>
        <td class="px-4 py-3.5">
          <div class="font-medium text-white">${p.usuarioNome || "Colaborador"}</div>
          <div class="text-[11px] text-gray-400">${p.usuarioEmail || ""}</div>
          ${p.usuarioCurso ? `<div class="text-[10px] text-orange-400/90 font-medium">${p.usuarioCurso}</div>` : ""}
        </td>
        <td class="px-4 py-3.5 text-xs text-gray-300">
          <div class="flex items-center gap-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-orange-400 shrink-0"></i>
            <span>${p.localizacao || "Campus UNICAP"}</span>
          </div>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap text-xs text-gray-300">
          ${dataHoraStr}
        </td>
      </tr>
    `;
  }).join("");

  renderIcons();
}

// ==========================================
// RENDERIZAÇÃO DA TABELA DE USUÁRIOS (ADMIN)
// ==========================================
export function renderAdminUsersTable(users, allPontos, adminUsersTbody) {
  if (!adminUsersTbody) return;

  adminUsersTbody.innerHTML = users.map(u => {
    const pontosUser = allPontos.filter(p => p.usuarioId === u.uid);
    const calculo = calcularHorasUsuario(pontosUser);
    const isAdmin = u.cargo === "admin";

    return `
      <tr class="hover:bg-gray-800/30 transition">
        <td class="px-4 py-3.5">
          <div class="font-semibold text-white">${u.nome || "Sem Nome"}</div>
          <div class="text-xs text-gray-400">${u.email || ""}</div>
          ${u.curso ? `<div class="text-[11px] text-orange-400/90 font-medium">${u.curso}</div>` : ""}
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <span class="font-bold text-sm text-emerald-400">${calculo.formatted}</span>
          <span class="text-[11px] text-gray-500 block">${pontosUser.length} registro(s)</span>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isAdmin ? "bg-orange-500/10 text-orange-400 border border-orange-500/30" : "bg-gray-800 text-gray-300 border border-gray-700"
          }">
            ${isAdmin ? "Administrador" : "Aluno / Colaborador"}
          </span>
        </td>
        <td class="px-4 py-3.5 whitespace-nowrap text-right">
          <button
            data-uid="${u.uid}"
            data-current-role="${u.cargo || 'aluno'}"
            class="btn-toggle-user-role px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isAdmin 
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700" 
                : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/40"
            }"
          >
            ${isAdmin ? "Tornar Aluno" : "Promover a Admin"}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach event listeners para toggle de cargo
  adminUsersTbody.querySelectorAll(".btn-toggle-user-role").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const uid = btn.getAttribute("data-uid");
      const currentRole = btn.getAttribute("data-current-role");
      const newRole = currentRole === "admin" ? "aluno" : "admin";
      
      btn.disabled = true;
      try {
        await updateDoc(doc(db, "usuarios", uid), { cargo: newRole });
      } catch (err) {
        alert("Erro ao alterar cargo: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });

  renderIcons();
}

import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db, renderIcons } from "./config.js";

// ==========================================
// SERVIÇOS DO PAINEL ADMINISTRATIVO
// ==========================================

export const DEFAULT_CURSOS = [
  { id: "jogos-digitais", nome: "Jogos Digitais", horaEntrada: "14:00", horaSaida: "16:00", toleranciaMinutos: 20 },
  { id: "ciencia-da-computacao", nome: "Ciência da Computação", horaEntrada: "14:00", horaSaida: "17:00", toleranciaMinutos: 20 },
  { id: "sistemas-para-internet", nome: "Sistemas para Internet", horaEntrada: "14:00", horaSaida: "17:00", toleranciaMinutos: 20 }
];

export async function salvarCurso(cursoData) {
  const { id, nome, horaEntrada, horaSaida, toleranciaMinutos } = cursoData;
  const docId = id || nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  
  const cursoDocRef = doc(db, "cursos", docId);
  await setDoc(cursoDocRef, {
    nome: nome.trim(),
    horaEntrada: horaEntrada || "14:00",
    horaSaida: horaSaida || "17:00",
    toleranciaMinutos: Number(toleranciaMinutos) || 20,
    atualizadoEm: serverTimestamp()
  }, { merge: true });
}

export async function removerCurso(cursoId) {
  const cursoDocRef = doc(db, "cursos", cursoId);
  await deleteDoc(cursoDocRef);
}

export function renderAdminCursosTable(cursos, adminCursosTbody) {
  if (!adminCursosTbody) return;

  if (!cursos || cursos.length === 0) {
    adminCursosTbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-8 text-center text-gray-500 text-xs">
          Nenhum curso cadastrado ainda. Use o formulário acima para adicionar.
        </td>
      </tr>
    `;
    return;
  }

  adminCursosTbody.innerHTML = cursos.map(c => `
    <tr class="hover:bg-gray-800/30 transition">
      <td class="px-4 py-3.5">
        <span class="font-semibold text-white">${c.nome}</span>
      </td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          ${c.horaEntrada || '14:00'}
        </span>
      </td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          ${c.horaSaida || '17:00'}
        </span>
      </td>
      <td class="px-4 py-3.5">
        <span class="text-xs text-gray-300 font-medium">±${c.toleranciaMinutos ?? 20} min</span>
      </td>
      <td class="px-4 py-3.5 text-right whitespace-nowrap">
        <button
          data-id="${c.id}"
          data-nome="${c.nome}"
          class="btn-delete-curso px-2.5 py-1 text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition inline-flex items-center gap-1"
          title="Excluir curso"
        >
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          <span>Excluir</span>
        </button>
      </td>
    </tr>
  `).join("");

  adminCursosTbody.querySelectorAll(".btn-delete-curso").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const nome = btn.getAttribute("data-nome");
      if (confirm(`Tem certeza que deseja excluir o curso "${nome}"?`)) {
        btn.disabled = true;
        try {
          await removerCurso(id);
        } catch (err) {
          alert("Erro ao remover curso: " + err.message);
        } finally {
          btn.disabled = false;
        }
      }
    });
  });

  renderIcons();
}

export function setupAdminReset(btnResetAllPoints, currentUserProfile) {
  if (!btnResetAllPoints) return;

  btnResetAllPoints.addEventListener("click", async () => {
    if (!currentUserProfile || currentUserProfile.cargo !== "admin") {
      alert("Apenas administradores podem resetar o banco de pontos.");
      return;
    }

    const confirmacao = prompt(
      'ATENÇÃO: Você está prestes a APAGAR TODOS OS PONTOS E ZERAR AS HORAS DE TODOS OS ALUNOS.\n\nPara confirmar esta ação, digite "ZERAR" no campo abaixo:'
    );

    if (confirmacao !== "ZERAR") {
      alert("Ação cancelada. O banco de pontos não foi alterado.");
      return;
    }

    btnResetAllPoints.disabled = true;
    btnResetAllPoints.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Zerando banco...`;

    try {
      const snap = await getDocs(collection(db, "pontos"));
      if (snap.empty) {
        alert("O banco de pontos já está vazio.");
        return;
      }

      let batch = writeBatch(db);
      let count = 0;
      for (const docSnap of snap.docs) {
        batch.delete(docSnap.ref);
        count++;
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }

      alert("Todos os registros de ponto foram apagados e as horas acumuladas foram zeradas com sucesso!");
    } catch (err) {
      console.error("Erro ao zerar pontos:", err);
      alert("Erro ao zerar pontos: " + err.message);
    } finally {
      btnResetAllPoints.disabled = false;
      btnResetAllPoints.innerHTML = `<i data-lucide="trash" class="w-3.5 h-3.5"></i><span>Zerar Todos os Pontos e Horas</span>`;
      renderIcons();
    }
  });
}


import { collection, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { db, renderIcons } from "./config.js";

// ==========================================
// SERVIÇOS DO PAINEL ADMINISTRATIVO
// ==========================================
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

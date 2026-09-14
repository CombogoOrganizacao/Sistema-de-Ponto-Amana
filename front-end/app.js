import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import { auth, db, ADMIN_EMAIL, renderIcons } from "./js/config.js";
import { formatarDataChave, getServerTimeOffsetMs } from "./js/time-service.js";
import { obterLocalizacaoAtual } from "./js/geo-service.js";
import { registrarPontoWeb, atualizarEstadoBotoesPonto } from "./js/ponto-service.js";
import { setupAdminReset, salvarCurso, renderAdminCursosTable, DEFAULT_CURSOS } from "./js/admin-service.js";
import { setupPWAToast } from "./js/pwa-ui.js";
import { renderPontosTable, renderAdminUsersTable, calcularHorasUsuario } from "./js/table-ui.js";

// ==========================================
// ESTADOS DA APLICAÇÃO
// ==========================================
let currentUserData = null;
let currentUserProfile = null;
let isCadastro = false;
let unsubscribePontos = null;
let unsubscribeUsers = null;
let unsubscribeCursos = null;
let allPontosData = [];
let allUsersData = [];
let allCursosData = [];

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const loadingContainer = document.getElementById("loading-container");
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const userHeader = document.getElementById("user-header");
const headerUserName = document.getElementById("header-user-name");
const headerUserBadge = document.getElementById("header-user-badge");
const btnLogout = document.getElementById("btn-logout");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const btnAuthSubmit = document.getElementById("btn-auth-submit");
const btnToggleAuth = document.getElementById("btn-toggle-auth");
const nomeGroup = document.getElementById("nome-group");
const inputNome = document.getElementById("input-nome");
const inputEmail = document.getElementById("input-email");
const inputSenha = document.getElementById("input-senha");
const inputCurso = document.getElementById("input-curso");
const btnGoogleLogin = document.getElementById("btn-google-login");
const authError = document.getElementById("auth-error");
const authErrorMsg = document.getElementById("auth-error-msg");
const pontosTbody = document.getElementById("pontos-tbody");
const emptyState = document.getElementById("empty-state");
const pontosCount = document.getElementById("pontos-count");
const filterDate = document.getElementById("filter-date");
const btnClearFilter = document.getElementById("btn-clear-filter");
const tabNavPontos = document.getElementById("tab-nav-pontos");
const tabNavAdmin = document.getElementById("tab-nav-admin");
const viewPontosSection = document.getElementById("view-pontos-section");
const viewAdminSection = document.getElementById("view-admin-section");
const adminUsersTbody = document.getElementById("admin-users-tbody");
const statTotalUsers = document.getElementById("stat-total-users");
const statPointsToday = document.getElementById("stat-points-today");
const statTotalHoursAll = document.getElementById("stat-total-hours-all");
const userTotalHours = document.getElementById("user-total-hours");
const cardUserCurso = document.getElementById("card-user-curso");
const cardUserHorario = document.getElementById("card-user-horario");

// Modal de Curso
const cursoModal = document.getElementById("curso-modal");
const modalSelectCurso = document.getElementById("modal-select-curso");
const btnConfirmarCurso = document.getElementById("btn-confirmar-curso");
const cursoModalError = document.getElementById("curso-modal-error");

// PWA & Toast Elements
const pwaToast = document.getElementById("pwa-toast");
const btnOpenInstallGuide = document.getElementById("btn-open-install-guide");
const btnDismissPwa = document.getElementById("btn-dismiss-pwa");
const btnCloseToast = document.getElementById("btn-close-toast");
const installModal = document.getElementById("install-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnModalOk = document.getElementById("btn-modal-ok");
const tabIos = document.getElementById("tab-ios");
const tabAndroid = document.getElementById("tab-android");
const contentIos = document.getElementById("content-ios");
const contentAndroid = document.getElementById("content-android");

// Bater Ponto & Geofence Elements
const btnBaterEntrada = document.getElementById("btn-bater-entrada");
const btnBaterSaida = document.getElementById("btn-bater-saida");
const pontoStatusMsg = document.getElementById("ponto-status-msg");
const geoStatusDot = document.getElementById("geo-status-dot");
const geoStatusText = document.getElementById("geo-status-text");
const btnRefreshLocation = document.getElementById("btn-refresh-location");
const btnResetAllPoints = document.getElementById("btn-reset-all-points");

// Gestão de Cursos Admin Elements
const formAdminCurso = document.getElementById("form-admin-curso");
const adminCursoNome = document.getElementById("admin-curso-nome");
const adminCursoEntrada = document.getElementById("admin-curso-entrada");
const adminCursoSaida = document.getElementById("admin-curso-saida");
const adminCursoTolerancia = document.getElementById("admin-curso-tolerancia");
const btnSalvarCurso = document.getElementById("btn-salvar-curso");
const adminCursosTbody = document.getElementById("admin-cursos-tbody");

// Inicializa Toast do PWA
setupPWAToast({
  pwaToast,
  btnDismissPwa,
  btnCloseToast,
  btnOpenInstallGuide,
  installModal,
  btnCloseModal,
  btnModalOk,
  tabIos,
  tabAndroid,
  contentIos,
  contentAndroid
});

// ==========================================
// MENSAGENS E ALERTAS DE UI
// ==========================================
function showError(msg) {
  if (!msg) {
    authError.classList.add("hidden");
    authErrorMsg.textContent = "";
  } else {
    authErrorMsg.textContent = msg;
    authError.classList.remove("hidden");
  }
  renderIcons();
}

function showPontoStatus(text, isError = false) {
  pontoStatusMsg.textContent = text;
  pontoStatusMsg.className = `text-xs font-medium px-3 py-1.5 rounded-xl ${
    isError 
      ? "bg-red-500/10 text-red-400 border border-red-500/20" 
      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  }`;
  pontoStatusMsg.classList.remove("hidden");
  setTimeout(() => {
    pontoStatusMsg.classList.add("hidden");
  }, 6000);
}

function toggleAuthMode() {
  isCadastro = !isCadastro;
  showError("");
  if (isCadastro) {
    authTitle.textContent = "Criar Conta";
    btnAuthSubmit.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i><span>Cadastrar</span>`;
    btnToggleAuth.textContent = "Já possui conta? Faça login";
    nomeGroup.classList.remove("hidden");
    inputNome.required = true;
    inputCurso.required = true;
  } else {
    authTitle.textContent = "Acessar Painel";
    btnAuthSubmit.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Entrar</span>`;
    btnToggleAuth.textContent = "Novo por aqui? Crie uma conta";
    nomeGroup.classList.add("hidden");
    inputNome.required = false;
    inputCurso.required = false;
  }
  renderIcons();
}

btnToggleAuth.addEventListener("click", toggleAuthMode);

// Modal de Curso
btnConfirmarCurso.addEventListener("click", async () => {
  const selectedCurso = modalSelectCurso.value;
  if (!selectedCurso) {
    cursoModalError.textContent = "Por favor, selecione seu curso.";
    cursoModalError.classList.remove("hidden");
    return;
  }
  cursoModalError.classList.add("hidden");
  btnConfirmarCurso.disabled = true;

  try {
    if (!currentUserData) return;
    const userDocRef = doc(db, "usuarios", currentUserData.uid);
    await updateDoc(userDocRef, { curso: selectedCurso });
    currentUserProfile.curso = selectedCurso;
    cursoModal.classList.add("hidden");
    updateHeaderUI();
  } catch (err) {
    cursoModalError.textContent = "Erro ao salvar curso: " + err.message;
    cursoModalError.classList.remove("hidden");
  } finally {
    btnConfirmarCurso.disabled = false;
  }
});

function traduzirErroAuth(errorCode, defaultMsg) {
  if (!errorCode) return defaultMsg || "Erro na autenticação.";
  if (errorCode.includes("auth/invalid-credential") || errorCode.includes("auth/wrong-password") || errorCode.includes("auth/user-not-found")) {
    return "E-mail ou senha incorretos. Verifique seus dados.";
  }
  if (errorCode.includes("auth/email-already-in-use")) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }
  if (errorCode.includes("auth/weak-password")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (errorCode.includes("auth/invalid-email")) {
    return "Formato de e-mail inválido.";
  }
  if (errorCode.includes("auth/popup-closed-by-user")) {
    return "Login cancelado. A janela do Google foi fechada antes de concluir.";
  }
  if (errorCode.includes("auth/cancelled-popup-request")) {
    return "Tentativa de login anterior cancelada.";
  }
  if (errorCode.includes("auth/unauthorized-domain")) {
    return "Domínio não autorizado no Firebase Auth. Adicione o domínio da Vercel nas configurações de autenticação do Firebase.";
  }
  return defaultMsg || errorCode;
}

// Autenticação E-mail/Senha
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showError("");
  const email = inputEmail.value.trim().toLowerCase();
  const senha = inputSenha.value;
  const nome = inputNome.value.trim();
  const curso = inputCurso.value;

  const originalSubmitText = btnAuthSubmit.innerHTML;
  btnAuthSubmit.disabled = true;
  btnAuthSubmit.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Aguarde...</span>`;
  renderIcons();

  try {
    if (isCadastro) {
      if (!nome) {
        showError("Informe seu nome completo.");
        return;
      }
      if (!curso) {
        showError("Por favor, selecione seu curso / graduação.");
        return;
      }
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      const initialRole = (email === ADMIN_EMAIL) ? "admin" : "aluno";
      
      await setDoc(doc(db, "usuarios", res.user.uid), {
        uid: res.user.uid,
        nome: nome,
        email: res.user.email,
        cargo: initialRole,
        curso: curso,
        criadoEm: serverTimestamp()
      });
    } else {
      await signInWithEmailAndPassword(auth, email, senha);
    }
  } catch (err) {
    console.error("Erro auth:", err);
    showError(traduzirErroAuth(err.code || err.message, err.message));
  } finally {
    btnAuthSubmit.disabled = false;
    btnAuthSubmit.innerHTML = originalSubmitText;
    renderIcons();
  }
});

// Google Login
btnGoogleLogin.addEventListener("click", async () => {
  showError("");
  const originalGoogleText = btnGoogleLogin.innerHTML;
  btnGoogleLogin.disabled = true;
  btnGoogleLogin.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Conectando com Google...</span>`;
  renderIcons();

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const email = (res.user.email || "").toLowerCase();
    
    const userDocRef = doc(db, "usuarios", res.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const initialRole = (email === ADMIN_EMAIL) ? "admin" : "aluno";
      await setDoc(userDocRef, {
        uid: res.user.uid,
        nome: res.user.displayName || "Usuário Google",
        email: res.user.email,
        cargo: initialRole,
        curso: "",
        criadoEm: serverTimestamp()
      });
    } else if (email === ADMIN_EMAIL && userDoc.data().cargo !== "admin") {
      await updateDoc(userDocRef, { cargo: "admin" });
    }
  } catch (err) {
    console.error("Erro Google Login:", err);
    showError(traduzirErroAuth(err.code || err.message, err.message));
  } finally {
    btnGoogleLogin.disabled = false;
    btnGoogleLogin.innerHTML = originalGoogleText;
    renderIcons();
  }
});

// Logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
});

// Navegação de Abas
tabNavPontos.addEventListener("click", () => {
  tabNavPontos.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-orange-500 text-white transition flex items-center gap-2";
  tabNavAdmin.className = "hidden px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gray-900 text-gray-400 hover:text-white border border-gray-800 transition flex items-center gap-2";
  
  if (currentUserProfile && currentUserProfile.cargo === "admin") {
    tabNavAdmin.classList.remove("hidden");
  }
  
  viewPontosSection.classList.remove("hidden");
  viewAdminSection.classList.add("hidden");
  renderIcons();
});

tabNavAdmin.addEventListener("click", () => {
  if (!currentUserProfile || currentUserProfile.cargo !== "admin") {
    viewAdminSection.classList.add("hidden");
    tabNavAdmin.classList.add("hidden");
    viewPontosSection.classList.remove("hidden");
    tabNavPontos.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-orange-500 text-white transition flex items-center gap-2";
    renderIcons();
    return;
  }

  tabNavAdmin.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-orange-500 text-white transition flex items-center gap-2";
  tabNavPontos.className = "px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gray-900 text-gray-400 hover:text-white border border-gray-800 transition flex items-center gap-2";
  viewAdminSection.classList.remove("hidden");
  viewPontosSection.classList.add("hidden");
  renderIcons();
});

// GPS Refresh
btnRefreshLocation.addEventListener("click", () => {
  obterLocalizacaoAtual(geoStatusDot, geoStatusText).catch(() => {});
});

// Formulário de Adicionar / Salvar Curso (Admin)
if (formAdminCurso) {
  formAdminCurso.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUserProfile || currentUserProfile.cargo !== "admin") {
      alert("Apenas administradores podem gerenciar cursos.");
      return;
    }

    const nome = adminCursoNome.value.trim();
    const horaEntrada = adminCursoEntrada.value;
    const horaSaida = adminCursoSaida.value;
    const toleranciaMinutos = parseInt(adminCursoTolerancia.value, 10) || 20;

    if (!nome) {
      alert("Informe o nome do curso.");
      return;
    }

    const originalBtn = btnSalvarCurso.innerHTML;
    btnSalvarCurso.disabled = true;
    btnSalvarCurso.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Salvando...</span>`;
    renderIcons();

    try {
      await salvarCurso({ nome, horaEntrada, horaSaida, toleranciaMinutos });
      formAdminCurso.reset();
      adminCursoEntrada.value = "14:00";
      adminCursoSaida.value = "17:00";
      adminCursoTolerancia.value = "20";
    } catch (err) {
      console.error("Erro ao salvar curso:", err);
      alert("Erro ao salvar curso: " + err.message);
    } finally {
      btnSalvarCurso.disabled = false;
      btnSalvarCurso.innerHTML = originalBtn;
      renderIcons();
    }
  });
}

// Bater Ponto Handlers
btnBaterEntrada.addEventListener("click", () => {
  registrarPontoWeb({
    tipo: "entrada",
    currentUserData,
    currentUserProfile,
    allPontosData,
    listaCursos: allCursosData,
    btnBaterEntrada,
    btnBaterSaida,
    geoStatusDot,
    geoStatusText,
    showPontoStatus
  });
});

btnBaterSaida.addEventListener("click", () => {
  registrarPontoWeb({
    tipo: "saida",
    currentUserData,
    currentUserProfile,
    allPontosData,
    listaCursos: allCursosData,
    btnBaterEntrada,
    btnBaterSaida,
    geoStatusDot,
    geoStatusText,
    showPontoStatus
  });
});

// Filtro de Data do Admin
filterDate.addEventListener("change", () => {
  renderPontosTable(allPontosData, pontosTbody, emptyState, pontosCount, filterDate.value);
});

btnClearFilter.addEventListener("click", () => {
  filterDate.value = "";
  renderPontosTable(allPontosData, pontosTbody, emptyState, pontosCount, "");
});

// Atualiza opções dos selects de curso dinamicamente
function updateCourseSelectOptions(cursos) {
  const lista = (cursos && cursos.length > 0) ? cursos : DEFAULT_CURSOS;
  
  // Modal Select
  const currentModalVal = modalSelectCurso.value;
  modalSelectCurso.innerHTML = '<option value="" disabled selected>Escolha um curso</option>' + 
    lista.map(c => `<option value="${c.nome}">${c.nome}</option>`).join("");
  if (currentModalVal && lista.some(c => c.nome === currentModalVal)) {
    modalSelectCurso.value = currentModalVal;
  }

  // Register Form Select
  const currentInputVal = inputCurso.value;
  inputCurso.innerHTML = '<option value="" disabled selected>Selecione seu curso</option>' + 
    lista.map(c => `<option value="${c.nome}">${c.nome}</option>`).join("");
  if (currentInputVal && lista.some(c => c.nome === currentInputVal)) {
    inputCurso.value = currentInputVal;
  }
}

// Atualização de UI do Header e Cards
function updateHeaderUI() {
  if (!currentUserData || !currentUserProfile) return;

  headerUserName.textContent = currentUserProfile.nome || currentUserData.displayName || currentUserData.email;
  const isAdmin = currentUserProfile.cargo === "admin";
  headerUserBadge.textContent = isAdmin ? "Admin" : "Aluno";
  headerUserBadge.className = `inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
    isAdmin ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "bg-gray-800 text-gray-300 border border-gray-700"
  }`;

  if (isAdmin) {
    tabNavAdmin.classList.remove("hidden");
  } else {
    tabNavAdmin.classList.add("hidden");
  }

  const userCurso = currentUserProfile.curso || "Não informado";
  cardUserCurso.textContent = userCurso;

  // Busca horário customizado do curso se houver
  const configCurso = allCursosData.find(c => (c.nome || "").toLowerCase().trim() === userCurso.toLowerCase().trim());
  if (configCurso) {
    const ent = configCurso.horaEntrada || "14:00";
    const sai = configCurso.horaSaida || "17:00";
    const tol = configCurso.toleranciaMinutos ?? 20;
    cardUserHorario.textContent = `${ent} às ${sai} (±${tol} min)`;
  } else {
    const isJogos = userCurso.toLowerCase().includes("jogos");
    cardUserHorario.textContent = isJogos ? "14:00 às 16:00 (±20 min)" : "14:00 às 17:00 (±20 min)";
  }
}

// Sincronização em Tempo Real com Firestore
function syncRealtimeData() {
  if (unsubscribePontos) unsubscribePontos();
  if (unsubscribeUsers) unsubscribeUsers();
  if (unsubscribeCursos) unsubscribeCursos();

  // Escuta Cursos do Sistema
  const cursosQuery = query(collection(db, "cursos"), orderBy("nome", "asc"));
  unsubscribeCursos = onSnapshot(cursosQuery, (snap) => {
    if (!snap.empty) {
      allCursosData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      allCursosData = [...DEFAULT_CURSOS];
    }
    
    updateCourseSelectOptions(allCursosData);
    renderAdminCursosTable(allCursosData, adminCursosTbody);
    updateHeaderUI();
  }, (err) => {
    console.warn("Snapshot cursos fallback:", err);
    allCursosData = [...DEFAULT_CURSOS];
    updateCourseSelectOptions(allCursosData);
    renderAdminCursosTable(allCursosData, adminCursosTbody);
  });

  // Escuta registros de pontos
  const pontosQuery = query(collection(db, "pontos"), orderBy("registro", "desc"));
  unsubscribePontos = onSnapshot(pontosQuery, (snap) => {
    allPontosData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Atualiza tabela de pontos do admin
    renderPontosTable(allPontosData, pontosTbody, emptyState, pontosCount, filterDate.value);

    // Atualiza horas do usuário logado
    if (currentUserData) {
      const pontosUser = allPontosData.filter(p => p.usuarioId === currentUserData.uid);
      const horasUser = calcularHorasUsuario(pontosUser);
      userTotalHours.textContent = horasUser.formatted;
      atualizarEstadoBotoesPonto(currentUserData, allPontosData, btnBaterEntrada, btnBaterSaida);
    }

    // Atualiza estatísticas do Admin
    const hojeChave = formatarDataChave(new Date(Date.now() + getServerTimeOffsetMs()));
    const pontosHoje = allPontosData.filter(p => p.dataChave === hojeChave);
    statPointsToday.textContent = pontosHoje.length;

    let totalMinutosGerais = 0;
    for (const u of allUsersData) {
      const pUser = allPontosData.filter(p => p.usuarioId === u.uid);
      totalMinutosGerais += calcularHorasUsuario(pUser).totalMinutos;
    }
    const totalH = Math.floor(totalMinutosGerais / 60);
    statTotalHoursAll.textContent = `${totalH}h`;

    if (allUsersData.length > 0) {
      renderAdminUsersTable(allUsersData, allPontosData, adminUsersTbody, currentUserProfile);
    }
  });

  // Escuta usuários cadastrados
  const usersQuery = query(collection(db, "usuarios"), orderBy("nome", "asc"));
  unsubscribeUsers = onSnapshot(usersQuery, (snap) => {
    allUsersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    statTotalUsers.textContent = allUsersData.length;
    renderAdminUsersTable(allUsersData, allPontosData, adminUsersTbody, currentUserProfile);
  });
}

// Inicializa select de cursos no load da página
updateCourseSelectOptions(DEFAULT_CURSOS);

// ==========================================
// OBSERVER DE AUTENTICAÇÃO
// ==========================================
onAuthStateChanged(auth, async (user) => {
  loadingContainer.classList.add("hidden");

  if (user) {
    currentUserData = user;
    const userDocRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      currentUserProfile = userSnap.data();
      // Garante que o e-mail master sempre tenha cargo admin
      if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && currentUserProfile.cargo !== "admin") {
        currentUserProfile.cargo = "admin";
        await updateDoc(userDocRef, { cargo: "admin" });
      }
    } else {
      const isMasterAdmin = (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      currentUserProfile = {
        uid: user.uid,
        nome: user.displayName || "Usuário",
        email: user.email,
        cargo: isMasterAdmin ? "admin" : "aluno",
        curso: ""
      };
      await setDoc(userDocRef, {
        ...currentUserProfile,
        criadoEm: serverTimestamp()
      });
    }

    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    userHeader.classList.remove("hidden");

    updateHeaderUI();
    setupAdminReset(btnResetAllPoints, currentUserProfile);

    // Se usuário não tiver curso selecionado, abre modal obrigatório
    if (!currentUserProfile.curso) {
      cursoModal.classList.remove("hidden");
    }

    // Inicializa localização e dados em tempo real
    obterLocalizacaoAtual(geoStatusDot, geoStatusText).catch(() => {});
    syncRealtimeData();
  } else {
    currentUserData = null;
    currentUserProfile = null;
    if (unsubscribePontos) unsubscribePontos();
    if (unsubscribeUsers) unsubscribeUsers();
    if (unsubscribeCursos) unsubscribeCursos();

    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
    userHeader.classList.add("hidden");
    cursoModal.classList.add("hidden");
  }
  renderIcons();
});

renderIcons();


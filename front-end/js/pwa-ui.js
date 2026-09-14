import { renderIcons } from "./config.js";

// ==========================================
// TOAST E MODAL DE INSTALAÇÃO PWA
// ==========================================
export function setupPWAToast({
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
}) {
  if (!pwaToast) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isDismissed = localStorage.getItem('Amana Lab_pwa_dismissed');

  if (!isStandalone && !isDismissed) {
    setTimeout(() => {
      pwaToast.classList.remove('hidden');
      renderIcons();
    }, 1500);
  }

  function dismissToast() {
    pwaToast.classList.add('hidden');
    localStorage.setItem('Amana Lab_pwa_dismissed', 'true');
  }

  btnDismissPwa?.addEventListener('click', dismissToast);
  btnCloseToast?.addEventListener('click', dismissToast);

  btnOpenInstallGuide?.addEventListener('click', () => {
    installModal.classList.remove('hidden');
    renderIcons();
  });

  btnCloseModal?.addEventListener('click', () => installModal.classList.add('hidden'));
  btnModalOk?.addEventListener('click', () => installModal.classList.add('hidden'));

  function showTabIOS() {
    if (!tabIos || !tabAndroid || !contentIos || !contentAndroid) return;
    tabIos.className = "flex-1 py-2 text-xs font-semibold rounded-lg bg-orange-500 text-white transition flex items-center justify-center gap-2";
    tabAndroid.className = "flex-1 py-2 text-xs font-semibold rounded-lg text-gray-400 hover:text-white transition flex items-center justify-center gap-2";
    contentIos.classList.remove('hidden');
    contentAndroid.classList.add('hidden');
    renderIcons();
  }

  function showTabAndroid() {
    if (!tabIos || !tabAndroid || !contentIos || !contentAndroid) return;
    tabAndroid.className = "flex-1 py-2 text-xs font-semibold rounded-lg bg-orange-500 text-white transition flex items-center justify-center gap-2";
    tabIos.className = "flex-1 py-2 text-xs font-semibold rounded-lg text-gray-400 hover:text-white transition flex items-center justify-center gap-2";
    contentAndroid.classList.remove('hidden');
    contentIos.classList.add('hidden');
    renderIcons();
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) showTabIOS();
  else showTabAndroid();

  tabIos?.addEventListener('click', showTabIOS);
  tabAndroid?.addEventListener('click', showTabAndroid);
}

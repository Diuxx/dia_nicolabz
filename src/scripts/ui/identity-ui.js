import { IDENTITY_APP_ID, IDENTITY_BASE_URL } from '../config/identity.js';
import { IdentityApi } from '../services/identity-api.js';
import { synchronizeProject } from '../services/identity-sync.js';

const $ = (id) => document.getElementById(id);

/** La configuration se limite à l'API centrale. Aucun SDK Google côté client. */
export function mountIdentity({ getProject, applyProject, notify }) {
  const api = new IdentityApi({ baseUrl: IDENTITY_BASE_URL, appId: IDENTITY_APP_ID });
  const profileMenu = $('profile-menu');
  const trigger = $('profile-trigger');
  const avatar = $('profile-avatar');
  const fallback = $('profile-avatar-fallback');
  avatar.addEventListener('error', () => { avatar.hidden = true; });
  const status = $('identity-status');
  let session = null;
  let unavailable = false;
  let busy = false;

  function hideMenu() {
    profileMenu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }

  function render() {
    const connected = Boolean(session?.authenticated && session?.user);
    const drive = connected && Boolean(session.driveConnected);
    const user = connected ? session.user : null;
    $('profile-name').textContent = user?.name || 'Compte Google';
    $('profile-email').textContent = user?.email || 'Édition locale';
    $('profile-short-name').textContent = user?.name?.split(' ')[0] || 'Compte';
    fallback.textContent = (user?.name || 'G').slice(0, 1).toUpperCase();
    if (user?.picture && /^https:\/\//i.test(user.picture)) {
      avatar.src = user.picture;
      avatar.hidden = false;
    } else {
      avatar.removeAttribute('src');
      avatar.hidden = true;
    }
    const state = unavailable ? 'API indisponible' : drive ? 'Drive connecté' : connected ? 'Google connecté' : 'Mode local';
    status.textContent = state;
    $('profile-status').textContent = state;
    $('identity-login').hidden = connected;
    $('identity-drive').hidden = !connected || drive;
    $('identity-sync').disabled = !drive || busy;
    $('identity-sync').hidden = !connected;
    $('identity-logout').hidden = !connected;
  }

  async function refresh() {
    if (busy) return;
    try {
      const result = await api.getSession();
      session = result;
      unavailable = false;
    } catch (error) {
      unavailable = true;
      session = null;
      console.warn('Session Identity indisponible :', error);
    }
    render();
  }

  function returnUrl() {
    return `${location.origin}${location.pathname}`;
  }

  async function choose(reason) {
    const dialog = $('sync-dialog');
    $('sync-dialog-message').textContent = reason === 'empty'
      ? 'Aucun schéma enregistré sur ce Drive. Souhaites-tu y envoyer ce tableau ?'
      : 'Les schémas local et Drive sont différents. Quelle version souhaites-tu conserver ? Aucun remplacement n’est automatique.';
    $('sync-download').hidden = reason === 'empty';
    $('sync-upload').textContent = reason === 'empty' ? 'Créer sur Drive' : 'Garder le local → Drive';
    dialog.showModal();
    return await new Promise((resolve) => {
      const onClick = (event) => {
        const choice = event.target.closest('button[data-choice]')?.dataset.choice;
        if (!choice) return;
        dialog.removeEventListener('click', onClick);
        dialog.removeEventListener('close', onClose);
        dialog.close();
        resolve(choice);
      };
      const onClose = () => {
        dialog.removeEventListener('click', onClick);
        resolve('cancel');
      };
      dialog.addEventListener('click', onClick);
      dialog.addEventListener('close', onClose, { once: true });
    });
  }

  async function sync() {
    if (busy || !session?.authenticated || !session.driveConnected) return;
    busy = true;
    render();
    try {
      const result = await synchronizeProject({
        api, userId: session.user.id, storage: localStorage,
        getProject, applyProject, choose
      });
      notify({ created: 'Sauvegarde initiale envoyée sur Drive.', uploaded: 'Schéma envoyé sur Drive.',
        downloaded: 'Schéma restauré depuis Drive.', identical: 'Drive déjà à jour.',
        cancel: 'Synchronisation annulée.' }[result] || 'Synchronisation terminée.');
    } catch (error) {
      console.error('Synchronisation échouée :', error);
      notify(error.status === 409
        ? 'Conflit de version Drive (409). Recharge la session et relance la synchronisation.'
        : `Synchronisation impossible : ${error.message}`);
    } finally {
      busy = false;
      render();
    }
  }

  trigger.addEventListener('click', () => {
    profileMenu.hidden = !profileMenu.hidden;
    trigger.setAttribute('aria-expanded', String(!profileMenu.hidden));
    if (!profileMenu.hidden) refresh();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.profile-wrapper')) hideMenu();
  });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideMenu(); });
  $('identity-login').addEventListener('click', () => location.assign(api.loginUrl(returnUrl())));
  $('identity-drive').addEventListener('click', () => location.assign(api.driveConsentUrl(returnUrl())));
  $('identity-sync').addEventListener('click', () => { hideMenu(); sync(); });
  $('identity-refresh').addEventListener('click', refresh);
  $('identity-logout').addEventListener('click', async () => {
    try { await api.logout(); session = null; hideMenu(); render(); notify('Session Google fermée. Tableau local conservé.'); }
    catch (error) { notify(`Déconnexion impossible : ${error.message}`); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  if (new URLSearchParams(location.search).has('auth')) {
    const url = new URL(location.href);
    url.searchParams.delete('auth');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  render();
  refresh();
}

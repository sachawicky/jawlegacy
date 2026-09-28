(() => {
  const link = document.createElement('a');
  link.className = 'jaw-archive-return';
  link.href = '/index.html';
  link.textContent = '← JAW LEGACY';
  link.setAttribute('aria-label', 'Revenir au site JAW LEGACY');

  const style = document.createElement('style');
  style.textContent = `
    .jaw-archive-return {
      position: fixed;
      z-index: 2147483646;
      left: 18px;
      top: 16px;
      padding: 11px 13px;
      border: 1px solid #171717;
      background: #171717;
      color: #fff;
      font: 600 11px/1 Arial, sans-serif;
      letter-spacing: .1em;
      text-decoration: none;
      opacity: 1;
      transition: opacity .2s ease, background-color .2s ease;
    }
    .jaw-archive-return:hover,
    .jaw-archive-return:focus-visible {
      opacity: 1;
      background: #5f1c28;
    }
    @media (max-width: 719px) {
      .jaw-archive-return { left: 10px; top: 10px; padding: 9px 10px; font-size: 10px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(link);

  // Une seule fois par onglet, au moment d'une arrivée depuis JAW LEGACY.
  const parameters = new URLSearchParams(location.search);
  const isArchiveHome = /\/www\.maboitamoi\.fr\/index\.html$/.test(location.pathname);
  const noticeKey = 'jaw-maboitamoi-archive-notice';
  if (isArchiveHome && parameters.has('from-jaw') && !sessionStorage.getItem(noticeKey)) {
    const notice = document.createElement('div');
    notice.className = 'jaw-archive-notice';
    notice.innerHTML = `<div class="jaw-archive-notice__panel" role="dialog" aria-modal="true" aria-labelledby="jaw-archive-notice-title"><h1 id="jaw-archive-notice-title">Ma Boîte À Moi — archive.</h1><p>Vous consultez une archive du site historique Ma Boîte À Moi.</p><p>Cette version est proposée à titre de mémoire et de consultation uniquement&nbsp;: elle ne constitue pas une boutique active et aucun produit ne peut être acheté.</p><p>Les pages, objets et collections sont conservés ici comme témoins du projet original.</p><div class="jaw-archive-notice__actions"><button type="button" data-close>Fermer</button><button type="button" data-enter>Consulter l’archive</button></div></div>`;
    const dismiss = () => { sessionStorage.setItem(noticeKey, '1'); notice.remove(); history.replaceState({}, '', location.pathname); };
    notice.querySelector('[data-close]').addEventListener('click', dismiss);
    notice.querySelector('[data-enter]').addEventListener('click', dismiss);
    notice.addEventListener('click', event => { if (event.target === notice) dismiss(); });
    document.body.appendChild(notice);
    const noticeStyle = document.createElement('style');
    noticeStyle.textContent = `.jaw-archive-notice{position:fixed;z-index:2147483647;inset:0;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.48);font-family:Arial,sans-serif;color:#173b47}.jaw-archive-notice__panel{width:min(990px,100%);padding:43px 40px 38px;background:#fff;box-shadow:0 18px 55px rgba(0,0,0,.28)}.jaw-archive-notice h1{margin:0 0 23px;font-size:33px;line-height:1.1;color:#10333f}.jaw-archive-notice p{max-width:850px;margin:0 0 25px;font-size:20px;line-height:1.7}.jaw-archive-notice__actions{display:flex;justify-content:flex-end;gap:24px;margin-top:37px}.jaw-archive-notice button{min-width:168px;padding:16px 20px;border:1px solid #d7dfe1;background:#fff;color:#222;font-size:18px;cursor:pointer}.jaw-archive-notice [data-enter]{background:#242424;border-color:#242424;color:#fff}@media(max-width:700px){.jaw-archive-notice__panel{padding:30px 24px}.jaw-archive-notice h1{font-size:25px}.jaw-archive-notice p{font-size:16px;line-height:1.55}.jaw-archive-notice__actions{gap:12px;margin-top:22px}.jaw-archive-notice button{min-width:0;padding:13px;font-size:15px}}`;
    document.head.appendChild(noticeStyle);
  }
})();

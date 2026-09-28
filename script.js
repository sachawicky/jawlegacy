const nav=document.querySelector('nav');
if(nav){const current=location.pathname.split('/').pop()||'index.html';const items=[['wicky.html','WICKY'],['films.html','FILMS'],['dessins.html','DESSINS'],['archives.html','ARCHIVES'],['memoire.html','MÉMOIRE'],['contact.html','CONTACT']];nav.innerHTML=items.map(([href,label])=>`<a href="${href}"${current===href?' class="is-current" aria-current="page"':''}>${label}</a>`).join('');}

const menuToggle=document.querySelector('.menu-toggle');
if(menuToggle && nav){
  const scrim=document.createElement('div');
  scrim.className='nav-scrim';
  document.body.append(scrim);
  const closeMenu=()=>{nav.classList.remove('is-open');scrim.classList.remove('is-open');document.body.classList.remove('nav-open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Ouvrir le menu');};
  const openMenu=()=>{nav.classList.add('is-open');scrim.classList.add('is-open');document.body.classList.add('nav-open');menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Fermer le menu');};
  menuToggle.addEventListener('click',()=>{nav.classList.contains('is-open')?closeMenu():openMenu();});
  scrim.addEventListener('click',closeMenu);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
}

const heroFrame=document.querySelector('.video-hero iframe');
if(heroFrame){
  // Ces identifiants ne sont jamais proposés : Toyota est déjà connu comme indisponible.
  const knownBlocked=JSON.parse(localStorage.getItem('jaw-blocked-youtube-videos')||'[]');
  const blockedVideoIds=new Set(['owvNpe11KoQ',...knownBlocked]);
  const fallbackFilms=[
    {id:'SAOpIAaNLtM',seconds:10},{id:'WgIACYF8oGk',seconds:10},{id:'r36vQmqW2Jw',seconds:10},
    {id:'FJ34NkTzWgs',seconds:10},{id:'oiwXx7m-r5c',seconds:10},{id:'bB0YHqT3JIE',seconds:10},
    {id:'n5odygeaZ-U',seconds:10},{id:'bWrNcEATXCM',seconds:10},{id:'jLLElORRRTE',seconds:10}
  ];
  let catalogue=[],queue=[],currentFilm,timer,player,isMuted=true,playerReady=false,useNativePlayer=false,apiWatchdog;
  const hero=document.querySelector('.video-hero');
  const soundToggle=document.createElement('button');
  soundToggle.className='sound-toggle is-muted';
  soundToggle.type='button';
  soundToggle.textContent='SON';
  soundToggle.setAttribute('aria-label','Activer le son');
  hero.append(soundToggle);
  const shuffle=items=>[...items].sort(()=>Math.random()-.5);
  const refillQueue=()=>{queue=shuffle(catalogue.filter(film=>!blockedVideoIds.has(film.id)&&film.id!==currentFilm?.id));};
  const nativePlayerUrl=id=>`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${isMuted?1:0}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  function playNext(){
    clearTimeout(timer);
    if(!queue.length)refillQueue();
    const next=queue.pop();
    if(!next)return;
    currentFilm=next;
    if(useNativePlayer){
      heroFrame.src=nativePlayerUrl(next.id);
      // Le lecteur simplifié reste disponible si l’API YouTube est bloquée par un navigateur.
      setTimeout(()=>hero.classList.add('is-playing'),900);
    }else player.loadVideoById({videoId:next.id,startSeconds:0});
    timer=setTimeout(playNext,Math.max(1,Math.min(next.seconds||10,10))*1000);
  }
  function excludeCurrent(){
    if(!currentFilm)return;
    blockedVideoIds.add(currentFilm.id);
    localStorage.setItem('jaw-blocked-youtube-videos',JSON.stringify([...blockedVideoIds]));
    queue=queue.filter(film=>film.id!==currentFilm.id);
    playNext();
  }
  function durationInSeconds(value){
    const parts=(value||'').trim().split(':').map(Number);
    return parts.length===2&&parts.every(Number.isFinite)?parts[0]*60+parts[1]:10;
  }
  function activateNativePlayer(){
    if(playerReady||useNativePlayer)return;
    useNativePlayer=true;
    catalogue=fallbackFilms.filter(film=>!blockedVideoIds.has(film.id));
    refillQueue();
    playNext();
  }
  function initialisePlayer(){
    if(useNativePlayer)return;
    player=new YT.Player('jaw-player',{playerVars:{autoplay:1,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,mute:1,playsinline:1,rel:0,origin:location.origin},events:{
      onReady:()=>{
        playerReady=true;
        clearTimeout(apiWatchdog);
        fetch('films.html').then(response=>response.ok?response.text():Promise.reject()).then(markup=>{
          const page=new DOMParser().parseFromString(markup,'text/html'),seen=new Set();
          catalogue=[...page.querySelectorAll('[data-video]')].map(card=>({id:card.dataset.video,seconds:durationInSeconds(card.querySelector('.film-dur')?.textContent)})).filter(film=>film.id&&!seen.has(film.id)&&seen.add(film.id)&&!blockedVideoIds.has(film.id));
          if(!catalogue.length)catalogue=fallbackFilms.filter(film=>!blockedVideoIds.has(film.id));
          refillQueue();playNext();
        }).catch(()=>{catalogue=fallbackFilms.filter(film=>!blockedVideoIds.has(film.id));refillQueue();playNext();});
      },
      onStateChange:event=>{if(event.data===YT.PlayerState.PLAYING)hero.classList.add('is-playing');if(event.data===YT.PlayerState.ENDED)playNext();},
      // L’API officielle renvoie les erreurs de lecture (dont restriction territoriale) : la vidéo est mémorisée et sautée immédiatement.
      onError:excludeCurrent
    }});
  }
  soundToggle.addEventListener('click',()=>{isMuted=!isMuted;soundToggle.textContent=isMuted?'SON':'MUET';soundToggle.classList.toggle('is-muted',isMuted);soundToggle.setAttribute('aria-label',isMuted?'Activer le son':'Couper le son');if(player){isMuted?player.mute():player.unMute();}});
  apiWatchdog=setTimeout(activateNativePlayer,4000);
  if(window.YT?.Player)initialisePlayer();
  else{
    const api=document.createElement('script');
    api.src='https://www.youtube.com/iframe_api';
    api.async=true;
    api.onerror=activateNativePlayer;
    const previousReady=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{previousReady?.();initialisePlayer();};
    document.head.append(api);
  }
}

const ARCHIVE_ROWS_BP=900;

const gallery=document.querySelector('[data-justify]');
if(gallery){
  const figures=[...gallery.querySelectorAll('figure')];
  const pad=()=>parseFloat(getComputedStyle(gallery).getPropertyValue('--archive-pad'))||0;
  const target=()=>innerHeight*(innerWidth<ARCHIVE_ROWS_BP?0.6:0.36);
  function layout(){
    const W=gallery.clientWidth,p=pad(),t=target();
    if(!W)return;
    const items=figures.map(f=>{const img=f.querySelector('img');const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;return {f,r:w&&h?w/h:1.5};});
    gallery.textContent='';
    let row=[],sum=0;
    const flush=()=>{
      if(!row.length)return;
      const n=row.length;
      const avail=W-p*(n-1);
      const h=Math.min(avail/sum,t*1.5);
      const line=document.createElement('div');
      line.className='justify-row';
      line.style.height=h+'px';
      let used=0;
      for(let i=0;i<row.length;i++){
        const {f,r}=row[i];
        const w=i===row.length-1?avail-used:Math.round(r*h);
        f.style.width=w+'px';
        used+=w;
        line.append(f);
      }
      gallery.append(line);
      row=[];sum=0;
    };
    for(const it of items){
      if(sum>0&&(sum+it.r)*t+p*row.length>W)flush();
      row.push(it);sum+=it.r;
    }
    flush();
  }
  const relayout=()=>requestAnimationFrame(layout);
  for(const img of gallery.querySelectorAll('img'))img.complete||img.addEventListener('load',relayout);
  addEventListener('load',relayout);
  addEventListener('resize',relayout);
  document.fonts?.ready.then(relayout);
  relayout();

  const lightbox=document.createElement('dialog');
  lightbox.className='lightbox';
  lightbox.innerHTML='<button class="close" type="button" aria-label="Fermer">×</button><button class="nav prev" type="button" aria-label="Image précédente">‹</button><img alt=""><button class="nav next" type="button" aria-label="Image suivante">›</button><figcaption></figcaption>';
  document.body.append(lightbox);
  const lbImg=lightbox.querySelector('img');
  const lbCap=lightbox.querySelector('figcaption');
  const sources=figures.map(f=>f.querySelector('img'));
  let lbIndex=0;
  function show(i){
    lbIndex=(i+sources.length)%sources.length;
    const img=sources[lbIndex];
    lbImg.src=img.currentSrc||img.src;
    lbImg.alt=img.alt;
    const cap=img.closest('figure').querySelector('figcaption');
    lbCap.textContent=cap?cap.textContent:'';
  }
  figures.forEach((f,i)=>{
    f.classList.add('is-clickable');
    f.tabIndex=0;
    f.setAttribute('role','button');
    const open=()=>{show(i);lightbox.showModal();};
    f.addEventListener('click',open);
    f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
  });
  lightbox.querySelector('.close').addEventListener('click',()=>lightbox.close());
  lightbox.querySelector('.prev').addEventListener('click',()=>show(lbIndex-1));
  lightbox.querySelector('.next').addEventListener('click',()=>show(lbIndex+1));
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close();});
  addEventListener('keydown',e=>{
    if(!lightbox.open)return;
    if(e.key==='ArrowLeft')show(lbIndex-1);
    if(e.key==='ArrowRight')show(lbIndex+1);
  });
}

const filmCards=document.querySelectorAll('[data-video]');
if(filmCards.length){
  const player=document.createElement('dialog');
  player.className='lightbox film-lightbox';
  player.innerHTML='<button class="close" type="button" aria-label="Fermer">×</button><div class="film-frame"></div>';
  document.body.append(player);
  const frame=player.querySelector('.film-frame');
  filmCards.forEach(card=>card.addEventListener('click',e=>{
    e.preventDefault();
    const iframe=document.createElement('iframe');
    iframe.src=`https://www.youtube-nocookie.com/embed/${card.dataset.video}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    iframe.title=card.dataset.title||'Vidéo';
    iframe.allow='autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen=true;
    frame.textContent='';
    frame.append(iframe);
    player.showModal();
  }));
  player.querySelector('.close').addEventListener('click',()=>player.close());
  player.addEventListener('close',()=>{frame.textContent='';});
  player.addEventListener('click',e=>{if(e.target===player)player.close();});

  const requestedVideo=new URLSearchParams(location.search).get('video');
  const requestedCard=[...filmCards].find(card=>card.dataset.video===requestedVideo);
  if(requestedCard)requestAnimationFrame(()=>requestedCard.click());
}

// Dissuasion de copie pour les œuvres : le navigateur charge toujours une image
// affichée, cette mesure ne remplace donc pas la protection juridique.
document.querySelectorAll('.design-gallery img').forEach(img=>{
  img.draggable=false;
  img.addEventListener('dragstart',event=>event.preventDefault());
  img.addEventListener('contextmenu',event=>event.preventDefault());
});

// Lien commun vers les informations de droits, présent dans tous les footers
// du site principal sans toucher à l’archive Ma Boîte À Moi.
const footer=document.querySelector('body > footer');
if(footer){
  let legalLink=footer.querySelector('.legal-link');
  if(!legalLink){
    legalLink=document.createElement('a');
    legalLink.className='legal-link';
    legalLink.href='legal.html';
    legalLink.textContent='Mentions légales';
    footer.append(legalLink);
  }
  footer.querySelectorAll('a:not(.legal-link)').forEach(link=>link.remove());
  legalLink.style.cssText='margin-left:auto;color:inherit;font:inherit;text-decoration:none;border-bottom:1px solid transparent';
  legalLink.addEventListener('mouseenter',()=>{legalLink.style.borderBottomColor='currentColor';});
  legalLink.addEventListener('mouseleave',()=>{legalLink.style.borderBottomColor='transparent';});
}

const homeCopy=document.querySelector('.note-copy');
if(homeCopy){
  homeCopy.innerHTML=`
    <h1>JAW LEGACY — 2026</h1>
    <p>JAW LEGACY est un projet consacré à la préservation et à la transmission de l’œuvre de Jacques-Antoine Wicky, producteur, réalisateur et graphiste.</p>
    <p>Le site rassemble une sélection de ses archives : films publicitaires, spectacles et documentaires réalisés notamment à l’île de La Réunion, ainsi qu’un ensemble d’œuvres inspirées par le travail d’Auguste Bartholdi.</p>
    <p>Une page Mémoire réunit les témoignages et hommages qui lui ont été rendus.</p>
    <p>JAW LEGACY est une archive en construction. Si vous avez travaillé avec Jacques-Antoine Wicky et souhaitez être crédité pour l’une des réalisations présentées, ou si vous possédez des photographies, films, documents ou autres éléments susceptibles de compléter ce fonds, vous pouvez contacter sa famille depuis la section <a href="contact.html">Contact</a>.</p>`;
}

document.querySelectorAll('a[href="mailto:bonjour@jawlegacy.com"]').forEach(link=>{
  link.href='mailto:contact@jawlegacy.com';
  link.textContent='contact@jawlegacy.com';
});

const homeFilms=[
  ['O_INnmKTBew','Air Austral — Publicité La Réunion · 0:51'],
  ['ehNCiCu6S78','Galawabeach — Publicité La Réunion · 0:31'],
  ['MaohoeduKPQ','Réa — Publicité La Réunion · 0:30'],
  ['bWrNcEATXCM','OdB Zombie — Publicité La Réunion'],
  ['_DiKVE5EO6s','Soframa — Publicité La Réunion · 0:31'],
  ['2UMR5f91wj8','Le Goût Ôté — Publicité La Réunion · 0:36']
];
document.querySelectorAll('.image-stream figure').forEach((figure,index)=>{
  const film=homeFilms[index];
  if(!film)return;
  const [videoId,title]=film;
  const link=figure.querySelector('a');
  const image=figure.querySelector('img');
  const caption=figure.querySelector('figcaption');
  if(link)link.href=`films.html?video=${videoId}`;
  if(image){
    image.src=`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    image.alt=title;
  }
  if(caption)caption.textContent=title;
});

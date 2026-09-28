if(!document.querySelector('link[rel="icon"]')){
  const icon=document.createElement('link');
  icon.rel='icon'; icon.type='image/svg+xml'; icon.href='assets/favicon/favicon.svg';
  document.head.append(icon);
}
document.querySelectorAll('link[href*="responsive.css"],link[href*="films.css"],link[href*="styles.css"]').forEach(link=>{
  link.href=link.href.replace('?v=29','?v=30');
});

const nav=document.querySelector('nav');
if(nav){const current=location.pathname.split('/').pop()||'index.html';const items=[['wicky.html','WICKY'],['films.html','FILMS'],['dessins.html','DESIGNS'],['archives.html','ARCHIVES'],['memoire.html','MÉMOIRE'],['contact.html','CONTACT']];nav.innerHTML=items.map(([href,label])=>`<a href="${href}"${current===href?' class="is-current" aria-current="page"':''}>${label}</a>`).join('');}

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

const heroVideo=document.querySelector('.video-hero video');
if(heroVideo){
  let isMuted=false;
  const hero=document.querySelector('.video-hero');
  const soundToggle=document.createElement('button');
  soundToggle.className='sound-toggle';
  soundToggle.type='button';
  soundToggle.textContent='MUET';
  soundToggle.setAttribute('aria-label','Couper le son');
  hero.append(soundToggle);
  soundToggle.addEventListener('click',()=>{
    isMuted=!isMuted;
    soundToggle.textContent=isMuted?'SON':'MUET';
    soundToggle.classList.toggle('is-muted',isMuted);
    soundToggle.setAttribute('aria-label',isMuted?'Activer le son':'Couper le son');
    heroVideo.muted=isMuted;
    heroVideo.play().catch(()=>{});
  });
  heroVideo.muted=false;
  heroVideo.play().catch(()=>{});
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
    image.src=`assets/films/${videoId}.jpg`;
    image.alt=title;
  }
  if(caption)caption.textContent=title;
});

const filmSearch=document.querySelector('[data-film-search]');
if(filmSearch){
  const publicities=filmSearch.closest('.films-group');
  const cards=[...(publicities?.querySelectorAll('.film-card')||[])];
  const empty=publicities?.querySelector('.films-empty');
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  filmSearch.addEventListener('input',()=>{
    const query=normalize(filmSearch.value.trim());
    let matches=0;
    cards.forEach(card=>{
      const match=!query||normalize(card.dataset.title||card.textContent).includes(query);
      card.hidden=!match;
      matches+=match?1:0;
    });
    if(empty)empty.hidden=matches!==0;
  });
}

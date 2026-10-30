(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  // Motion explicitly enabled for this preview at the user's request.
  const reduceMotion = false;
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const hero = document.querySelector('.hero-wide');
  const heroImage = document.querySelector('.hero-image');
  let scheduled = false;
  let sectionMotion = false;
  let scrollRange = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  let heroLimit = hero.offsetHeight + 100;
  function paintScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 25);
    progress.style.transform = `scaleX(${scrollRange > 0 ? y / scrollRange : 0})`;
    if (!sectionMotion && !reduceMotion && heroImage && y < heroLimit) {
      heroImage.style.setProperty('--hero-shift', Math.min(y * .3, 240) + 'px');
    }
    scheduled = false;
  }
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(paintScroll); }
  }, { passive: true });
  paintScroll();
  // Individual viewport entrances, using the Web Animations API.
  const entranceSelector = '.story-copy > *, .story-wide figure, .food-intro .eyebrow, .food-intro h2, .intro-right > *, .panel-heading, .menu-tab, .place-heading > *, .place-images figure, .reservation-wide > *, .map-heading > *, .map-frame, .credit-footer > *';
  let entranceObserver;
  const pendingEntrances = new Set();
  function animateEntrance(el, delay = 0) {
    const photo = el.matches('figure');
    const bottomElement = !!el.closest('.map-section,.credit-footer');
    return el.animate([
      { opacity: 0, transform: bottomElement ? 'none' : photo ? 'translateY(36px) scale(.98)' : 'translateY(24px)' },
      { opacity: 1, transform: bottomElement ? 'none' : 'translateY(0) scale(1)' }
    ], { duration: photo ? 1000 : 800, delay, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' });
  }
  function revealPendingEntrances() {
    if (sectionMotion) return;
    [...pendingEntrances].forEach((el,index) => {
      const bounds = el.getBoundingClientRect();
      if (el.closest('[hidden]') || bounds.bottom <= header.offsetHeight || bounds.top >= innerHeight) return;
      pendingEntrances.delete(el);
      entranceObserver.unobserve(el);
      el.dataset.entered = 'true';
      el.style.opacity = '1';
      animateEntrance(el,Math.min(index*75,300));
    });
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    entranceObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      entries.filter(entry => !entry.isIntersecting).forEach(entry=>pendingEntrances.delete(entry.target));
      visible.forEach(entry => {
        const el = entry.target;
        if (el.closest('[hidden]')) return;
        pendingEntrances.add(el);
      });
      revealPendingEntrances();
    }, { threshold: .18, rootMargin: '0px' });
    document.querySelectorAll(entranceSelector).forEach(el => {
      el.classList.remove('motion-item', 'reveal');
      if (!el.closest('[hidden]')) el.style.opacity = '0';
      entranceObserver.observe(el);
    });
  }
  // The image is visible immediately; text has a clear staggered fade-in.
  document.querySelectorAll('.hero-copy > .eyebrow,.hero-line,.hero-copy > p,.hero-copy > .actions,.hero-bottom').forEach((el, i) => {
    el.animate([{opacity:0,transform:'translateY(26px)'},{opacity:1,transform:'none'}],
      {duration:800,delay:100+i*85,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
  });
  const tabs = [...document.querySelectorAll('.menu-tab')];
  const panels = [...document.querySelectorAll('.landing-menu-panel')];
  function selectCategory(index, focus = false) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    if (focus) tabs[index].focus({ preventScroll: true });
    const track = panels[index].querySelector('.landing-dishes');
    if (track) track.scrollLeft = 0;
    if (!reduceMotion) {
      const heading = panels[index].querySelector('.panel-heading');
      heading.getAnimations().forEach(animation => animation.cancel());
      heading.style.opacity = '';
      animateEntrance(heading);
      // Animate the rail as a unit; individual cards remain stable while swiping.
      [...track.children].forEach(card => {
        entranceObserver?.unobserve(card);
        card.getAnimations().forEach(animation => animation.cancel());
        card.style.opacity = '1';
        card.style.transform = 'none';
        card.style.filter = 'none';
      });
      track.getAnimations().forEach(animation => animation.cancel());
      track.animate([{opacity:.35},{opacity:1}], {duration:250,easing:'ease-out'});
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCategory(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectCategory(next, true); }
    });
  });

  // Native touch panning, mouse dragging, and wheel navigation share one rail.
  document.querySelectorAll('.landing-dishes').forEach(rail => {
    let drag = null;
    rail.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x:event.clientX, left:rail.scrollLeft, id:event.pointerId };
      rail.setPointerCapture(event.pointerId);
      rail.classList.add('is-dragging');
    });
    rail.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      event.preventDefault();
      rail.scrollLeft = drag.left - (event.clientX - drag.x);
    });
    function endDrag() {
      drag = null;
      rail.classList.remove('is-dragging');
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('lostpointercapture', endDrag);
    rail.addEventListener('dragstart', event => event.preventDefault());
    rail.addEventListener('wheel', event => {
      if (event.ctrlKey || rail.scrollWidth <= rail.clientWidth + 1) return;
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = (horizontal ? event.deltaX : event.deltaY) * (event.deltaMode === 1 ? 16 : 1);
      if (!delta) return;
      event.preventDefault(); event.stopPropagation();
      rail.scrollLeft += delta;
    }, {passive:false});
  });

  // Discrete section navigation: one gesture -> one fixed destination.
  const chapters = [...document.querySelectorAll('.snap-section')];
  let chapterIndex = 0, moving = false, wheelSum = 0, wheelTime = 0;
  const sectionNames = ['Úvod','Restaurace','Jídelní lístek','Galerie','Rezervace','Kontakt'];
  const dotsNav = document.createElement('nav');
  dotsNav.className = 'section-dots';
  dotsNav.setAttribute('aria-label','Navigace sekcí');
  const sectionDots = chapters.map((section,index)=>{
    const button=document.createElement('button');
    button.type='button';button.className='section-dot';
    button.setAttribute('aria-label',sectionNames[index] || 'Sekce '+(index+1));
    button.innerHTML='<span class="dot-label">'+(sectionNames[index] || 'Sekce '+(index+1))+'</span><span class="dot-mark" aria-hidden="true"></span>';
    button.addEventListener('click',()=>goToChapter(index));
    dotsNav.append(button);return button;
  });
  document.body.append(dotsNav);
  function updateSectionDots() {
    sectionDots.forEach((dot,index)=>{
      dot.classList.toggle('active',index===chapterIndex);
      if(index===chapterIndex)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');
    });
    dotsNav.classList.toggle('on-dark',[0,1,4].includes(chapterIndex));
  }
  updateSectionDots();
  let touchStart = null, frameId = null;
  let chapterStops = [];
  function measureChapters() {
    const headerSize = header.offsetHeight;
    const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    scrollRange = max;
    heroLimit = hero.offsetHeight + 100;
    chapterStops = chapters.map((section,index) => index === chapters.length - 1
      ? max : Math.min(max, Math.max(0, section.offsetTop - headerSize)));
  }
  measureChapters();
  function destination(index) {
    return chapterStops[index];
  }
  function goToChapter(index, instant = false) {
    index = Math.max(0, Math.min(chapters.length - 1, index));
    if (moving && index === chapterIndex && !instant) return;
    chapterIndex = index;
    updateSectionDots();
    if (frameId) cancelAnimationFrame(frameId);
    const from = scrollY, to = destination(index);
    if (instant || Math.abs(from - to) < 1) {
      window.scrollTo({top:to,behavior:'instant'}); moving = sectionMotion = false; frameId = null; document.body.classList.remove('is-section-moving'); revealPendingEntrances(); return;
    }
    moving = sectionMotion = true;
    document.body.classList.add('is-section-moving');
    const began = performance.now(), duration = Math.min(740, Math.max(520, Math.abs(to-from)*.65));
    function tick(now) {
      const t = Math.min(1,(now-began)/duration);
      // Start responding immediately, then ease into the exact section stop.
      const eased = 1-Math.pow(1-t,3);
      window.scrollTo({top:from+(to-from)*eased,behavior:'instant'});
      if (t < 1) frameId = requestAnimationFrame(tick);
      else { frameId = null; moving = sectionMotion = false; document.body.classList.remove('is-section-moving'); wheelSum = 0; paintScroll(); revealPendingEntrances(); }
    }
    frameId = requestAnimationFrame(tick);
  }
  const excluded = target => target instanceof Element && !!target.closest('.landing-dishes,.menu-tabs,dialog,input,textarea,select');
  const touchExcluded = target => target instanceof Element && !!target.closest('dialog,input,textarea,select');
  addEventListener('wheel', event => {
    if (event.ctrlKey || excluded(event.target) || Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    const gap = now-wheelTime;
    if (moving) { wheelTime = now; return; }
    const delta = event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    // Ignore the tail of one trackpad gesture, but accept a fresh gesture
    // without the old 1.25-second global lockout.
    if (!wheelSum && gap<150) { wheelTime=now; return; }
    if (gap>150 || Math.sign(wheelSum)!==Math.sign(delta)) wheelSum=0;
    wheelTime=now; wheelSum+=delta;
    if (Math.abs(wheelSum)>=18) { const direction=Math.sign(wheelSum);wheelSum=0;goToChapter(chapterIndex+direction); }
  },{passive:false});
  addEventListener('touchstart',event=>{
    if (touchExcluded(event.target) || event.touches.length!==1) {touchStart=null;return;}
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  addEventListener('touchmove',event=>{
    if (!touchStart || touchExcluded(event.target)) return;
    const dx=event.touches[0].clientX-touchStart.x,dy=event.touches[0].clientY-touchStart.y;
    if (Math.abs(dy)>Math.abs(dx)) event.preventDefault();
  },{passive:false});
  addEventListener('touchend',event=>{
    if (!touchStart) return;
    const dx=event.changedTouches[0].clientX-touchStart.x,dy=event.changedTouches[0].clientY-touchStart.y;
    touchStart=null;
    if (Math.abs(dy)>=35 && Math.abs(dy)>Math.abs(dx) && !moving) goToChapter(chapterIndex+(dy<0?1:-1));
  },{passive:true});
  addEventListener('keydown',event=>{
    if (excluded(event.target) || event.target.closest('button,a') || event.ctrlKey || event.metaKey || event.altKey) return;
    let target;
    if (['ArrowDown','PageDown',' '].includes(event.key)) target=chapterIndex+1;
    if (['ArrowUp','PageUp'].includes(event.key)) target=chapterIndex-1;
    if (event.key==='Home') target=0;
    if (event.key==='End') target=chapters.length-1;
    if (target!==undefined) {event.preventDefault();goToChapter(target);}
  });
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const index=chapters.findIndex(section=>section.id===link.getAttribute('href').slice(1));
    if(index>=0){event.preventDefault();goToChapter(index);}
  }));
  addEventListener('focusin', event => {
    if (moving) return;
    const index = chapters.findIndex(section => section.contains(event.target));
    if (index >= 0) chapterIndex = index;
    updateSectionDots();
  });
  let resizeTimer;
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measureChapters();goToChapter(chapterIndex,true);},160);});
  addEventListener('load',measureChapters,{once:true});
  document.fonts?.ready.then(measureChapters);
  const photos = [...document.querySelectorAll('.place-images img,.story-wide img')];
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-viewer';
  dialog.setAttribute('aria-label', 'Fotografie restaurace');
  dialog.innerHTML = '<button class="viewer-close" type="button" aria-label="Zavřít fotografii">×</button><img alt=""><p></p>';
  document.body.append(dialog);
  const fullImage = dialog.querySelector('img');
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.classList.remove('viewer-open'); });
  photos.forEach(img => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'photo-trigger';
    button.setAttribute('aria-label', `Zvětšit fotografii: ${img.alt}`);
    img.replaceWith(button); button.append(img);

    button.addEventListener('click', () => {
      fullImage.src = img.dataset.full || img.currentSrc || img.src; fullImage.alt = img.alt;
      dialog.querySelector('p').textContent = img.alt;
      document.body.classList.add('viewer-open'); dialog.showModal();
    });
  });
  // A slow photo drift, independent of the pointer and the foreground text.
  const backgroundObserver = new IntersectionObserver(entries => {
    entries.forEach(entry=>entry.target.classList.toggle('background-visible',entry.isIntersecting));
  },{threshold:.1});
  backgroundObserver.observe(hero);
})();
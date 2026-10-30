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
  function paintScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 25);
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? y / range : 0})`;
    if (!reduceMotion && heroImage && y < hero.offsetHeight + 100) {
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
  function animateEntrance(el, delay = 0) {
    const photo = el.matches('figure');
    const bottomElement = !!el.closest('.map-section,.credit-footer');
    return el.animate([
      { opacity: 0, transform: bottomElement ? 'none' : photo ? 'translateY(55px) scale(.96)' : 'translateY(36px)', filter: 'blur(3px)' },
      { opacity: 1, transform: bottomElement ? 'none' : 'translateY(0) scale(1)', filter: 'blur(0px)' }
    ], { duration: photo ? 1200 : 850, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    entranceObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach((entry, index) => {
        const el = entry.target;
        if (el.closest('[hidden]')) return;
        // Reveal once. Never hide content again at a section/viewport boundary.
        entranceObserver.unobserve(el);
        el.dataset.entered = 'true';
        el.style.opacity = '1';
        animateEntrance(el, Math.min(index * 85, 340));
      });
    }, { threshold: .08, rootMargin: '0px' });
    document.querySelectorAll(entranceSelector).forEach(el => {
      el.classList.remove('motion-item', 'reveal');
      if (!el.closest('[hidden]')) el.style.opacity = '0';
      entranceObserver.observe(el);
    });
  }
  async function playIntro() {
    const cover = document.querySelector('.intro-cover');
    if (!cover) return;
    document.body.classList.add('intro-running');
    // The intro glyph is an SVG outline, independent of font loading.
    const strokes = [...cover.querySelectorAll('.n-ink-reveal')];
    // Physical SVG lengths avoid browser differences with pathLength-normalised dashes.
    strokes.forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length + ' ' + (length + 100);
      path.style.strokeDashoffset = String(length + 32);
    });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      for (const path of strokes) {
        const length = path.getTotalLength() + 32;
        await path.animate([
          {strokeDashoffset:String(length),offset:0,easing:'cubic-bezier(.18,.06,.42,.88)'},
          {strokeDashoffset:String(length*.63),offset:.28,easing:'cubic-bezier(.18,.06,.42,.88)'},
          {strokeDashoffset:String(length*.30),offset:.63,easing:'cubic-bezier(.18,.06,.42,.88)'},
          {strokeDashoffset:'0',offset:1}
        ], {duration: 700, fill:'forwards'}).finished;
      }
      await new Promise(resolve => setTimeout(resolve, reduceMotion ? 60 : 400));
      const duration = 800;
      const radius = Math.ceil(Math.hypot(innerWidth, innerHeight) / 2);
      const exit = cover.animate([{clipPath:'circle(' + radius + 'px at 50% 50%)'},{clipPath:'circle(0px at 50% 50%)'}], {duration,easing:'cubic-bezier(.45,0,.3,1)',fill:'forwards'});
      cover.querySelector('svg').animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.08)',opacity:0}],{duration,easing:'ease-in-out',fill:'forwards'});
      await exit.finished;
      document.body.classList.remove('intro-running');
      const elements = [...document.querySelectorAll('.hero-copy > .eyebrow,.hero-line,.hero-copy > p,.hero-copy > .actions,.hero-bottom')];
      elements.forEach((el, i) => el.animate([
        {opacity:0,transform:reduceMotion?'none':'translateY(28px)'},
        {opacity:1,transform:'translateY(0)'}
      ],{duration:reduceMotion?200:950,delay:reduceMotion?0:150+i*120,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'}));

    } finally {
      cover.remove(); document.body.classList.remove('intro-running');
    }
  }
  playIntro().catch(() => { document.querySelector('.intro-cover')?.remove(); document.body.classList.remove('intro-running'); });
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
  let touchStart = null, frameId = null, wheelCooldown = 0;
  const headerHeight = () => header.offsetHeight;
  function destination(index) {
    const footer = document.querySelector('.credit-footer');
    const max = Math.max(0, footer.offsetTop + footer.offsetHeight - innerHeight);
    return index === chapters.length - 1 ? max : Math.min(max, Math.max(0, chapters[index].offsetTop - headerHeight()));
  }
  function goToChapter(index, instant = false) {
    if (moving && !instant) return;
    index = Math.max(0, Math.min(chapters.length - 1, index));
    chapterIndex = index;
    updateSectionDots();
    if (frameId) cancelAnimationFrame(frameId);
    const from = scrollY, to = destination(index);
    if (instant || Math.abs(from - to) < 1) {
      window.scrollTo({top:to,behavior:'instant'}); moving = false; return;
    }
    moving = true;
    const began = performance.now(), duration = 1050;
    function tick(now) {
      const t = Math.min(1,(now-began)/duration);
      // Quintic smoothstep: zero velocity and acceleration at both ends.
      const eased = t*t*t*(t*(t*6-15)+10);
      window.scrollTo({top:from+(to-from)*eased,behavior:'instant'});
      if (t < 1) frameId = requestAnimationFrame(tick);
      else { frameId = null; moving = false; wheelSum = 0; }
    }
    frameId = requestAnimationFrame(tick);
  }
  const excluded = target => target instanceof Element && !!target.closest('.landing-dishes,.menu-tabs,dialog,input,textarea,select');
  const touchExcluded = target => target instanceof Element && !!target.closest('dialog,input,textarea,select');
  addEventListener('wheel', event => {
    if (event.ctrlKey || excluded(event.target) || Math.abs(event.deltaX)>Math.abs(event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (moving || now < wheelCooldown || document.body.classList.contains('intro-running')) { wheelTime = now; return; }
    const delta = event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if (now-wheelTime>220 || Math.sign(wheelSum)!==Math.sign(delta)) wheelSum=0;
    wheelTime=now; wheelSum+=delta;
    if (Math.abs(wheelSum)>=30) { const direction=Math.sign(wheelSum);wheelSum=0;wheelCooldown=now+1250;goToChapter(chapterIndex+direction); }
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
  addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>goToChapter(chapterIndex,true),160);});
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
})();

/* ============ PRELOADER ============ */
(function(){
  const el = document.getElementById('preloader');
  const count = document.getElementById('preloadCount');
  const bar = document.getElementById('preloadBar');
  let n = 0;
  const t = setInterval(()=>{
    n += Math.floor(Math.random()*8)+3;
    if(n>=100){ n=100; clearInterval(t); finish(); }
    count.textContent = n;
    bar.style.width = n+'%';
  }, 90);
  function finish(){
    setTimeout(()=>{
      el.classList.add('done');
      document.body.classList.add('loaded');
      triggerReveal();
    }, 350);
  }
})();

/* ============ CUSTOM CURSOR ============ */
(function(){
  if(window.matchMedia('(max-width:899px)').matches) return;
  const c = document.getElementById('cursor');
  const d = document.getElementById('cursorDot');
  let mx=innerWidth/2, my=innerHeight/2, cx=mx, cy=my;
  addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; d.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop(){ cx+=(mx-cx)*.18; cy+=(my-cy)*.18; c.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.querySelectorAll('[data-cursor]').forEach(elm=>{
    const type = elm.getAttribute('data-cursor');
    elm.addEventListener('mouseenter', ()=> c.classList.add(type==='view'?'is-view':'is-hover'));
    elm.addEventListener('mouseleave', ()=> c.classList.remove('is-view','is-hover'));
  });
})();

/* ============ NAV SCROLL + PROGRESS + GLOW ============ */
(function(){
  const nav = document.getElementById('nav');
  const prog = document.getElementById('scrollProgress');
  const glow = document.getElementById('bgGlow');
  addEventListener('scroll', ()=>{
    const y = scrollY;
    nav.classList.toggle('scrolled', y>40);
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (y/h*100)+'%';
  }, {passive:true});
  addEventListener('mousemove', e=>{
    const x = (e.clientX/innerWidth-.5)*60, yy=(e.clientY/innerHeight-.5)*60;
    glow.style.transform = `translate(${x}px,${yy}px)`;
  });
})();

/* ============ MOBILE MENU ============ */
(function(){
  const burger = document.getElementById('burger');
  const links = document.getElementById('navLinks');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', ()=>{
    links.classList.toggle('open');
    nav.classList.toggle('menu-open');
  });
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    links.classList.remove('open'); nav.classList.remove('menu-open');
  }));
})();

/* ============ REVEAL ON SCROLL ============ */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
}, {threshold:.15});

function triggerReveal(){
  document.querySelectorAll('.hero__title').forEach(h=>h.classList.add('in'));
}
function setupReveal(){
  const sel = '.section__head, .card, .service, .step, .stat, .about__visual, .about__copy, .contact__form, .contact__left, .marquee';
  document.querySelectorAll(sel).forEach((elm,i)=>{
    elm.classList.add('reveal');
    elm.style.transitionDelay = (i%4*0.06)+'s';
    io.observe(elm);
  });
  document.querySelectorAll('.step').forEach(s=>{
    new IntersectionObserver((e,o)=>{ e.forEach(x=>{ if(x.isIntersecting){ x.target.classList.add('in'); o.unobserve(x.target);} }); },{threshold:.4}).observe(s);
  });
}
setupReveal();

/* ============ COUNTERS ============ */
(function(){
  const stats = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries,o)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count, suffix = el.dataset.suffix||'';
      let cur = 0; const step = target/50;
      const t = setInterval(()=>{
        cur += step;
        if(cur>=target){ cur=target; clearInterval(t); }
        el.textContent = Math.floor(cur)+suffix;
      }, 24);
      o.unobserve(el);
    });
  },{threshold:.6});
  stats.forEach(s=>obs.observe(s));
})();

/* ============ TILT ============ */
(function(){
  if(window.matchMedia('(max-width:1000px)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5;
      el.style.transform = `rotateY(${px*10}deg) rotateX(${-py*10}deg) translateZ(0)`;
    });
    el.addEventListener('mouseleave', ()=> el.style.transform='');
  });
})();

/* ============ HERO PARALLAX ============ */
(function(){
  const v = document.getElementById('heroVisual');
  if(!v || window.matchMedia('(max-width:1000px)').matches) return;
  addEventListener('mousemove', e=>{
    const x=(e.clientX/innerWidth-.5)*20, y=(e.clientY/innerHeight-.5)*20;
    v.style.transform = `translate(${x}px,${y}px)`;
  });
})();

/* ============ CONTACT FORM ============ */
(function(){
  const form = document.getElementById('contactForm');
  const ok = document.getElementById('formSuccess');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    ok.classList.add('show');
    form.querySelector('button').textContent = 'Enviado ✓';
    setTimeout(()=>form.reset(), 400);
  });
})();

/* ============ YEAR ============ */
document.getElementById('year').textContent = new Date().getFullYear();

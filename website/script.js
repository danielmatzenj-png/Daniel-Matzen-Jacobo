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
  const sel = '.section__head, .card, .service, .step, .stat, .about__copy, .contact__form, .contact__left, .marquee, .testi, .faq__item, .clients__label';
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

/* ============ MAGNETIC BUTTONS ============ */
(function(){
  if(window.matchMedia('(max-width:1000px)').matches) return;
  document.querySelectorAll('.btn--pill, .btn--send').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const x = (e.clientX-r.left-r.width/2)*.35, y=(e.clientY-r.top-r.height/2)*.5;
      btn.style.transform = `translate(${x}px,${y}px)`;
    });
    btn.addEventListener('mouseleave', ()=> btn.style.transform='');
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

/* ============ HERO PARTICLE NETWORK ============ */
(function(){
  const canvas = document.getElementById('heroCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  let w, h, dpr, particles = [], mouse = {x:-999,y:-999};
  function resize(){
    dpr = Math.min(devicePixelRatio||1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w*dpr; canvas.height = h*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count = Math.min(90, Math.floor(w*h/16000));
    particles = Array.from({length:count}, ()=>({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35,
      r:Math.random()*1.6+.6
    }));
  }
  const hero = document.getElementById('hero');
  hero.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; });
  hero.addEventListener('mouseleave', ()=>{ mouse.x=mouse.y=-999; });
  function frame(){
    ctx.clearRect(0,0,w,h);
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      // mouse attraction
      const dxm=p.x-mouse.x, dym=p.y-mouse.y, dm=Math.hypot(dxm,dym);
      if(dm<140){ p.x+=dxm/dm*.6; p.y+=dym/dm*.6; }
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fillStyle='rgba(120,140,255,.55)'; ctx.fill();
    }
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const a=particles[i], b=particles[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<120){
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle='rgba(90,110,240,'+(1-d/120)*.28+')'; ctx.lineWidth=1; ctx.stroke();
        }
      }
      // link to mouse
      const dmx=Math.hypot(particles[i].x-mouse.x, particles[i].y-mouse.y);
      if(dmx<160){ ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(mouse.x,mouse.y); ctx.strokeStyle='rgba(120,140,255,'+(1-dmx/160)*.5+')'; ctx.lineWidth=1; ctx.stroke(); }
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize);
  resize();
  if(!reduce) frame(); else { for(const p of particles){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle='rgba(120,140,255,.4)';ctx.fill();} }
})();

/* ============ SCRAMBLE ROTATING WORD ============ */
(function(){
  const el = document.querySelector('.rotator');
  if(!el) return;
  const words = el.dataset.words.split(',');
  const chars = '!<>-_\\/[]{}—=+*^?#'; let idx=0;
  function setText(newText){
    return new Promise(res=>{
      const old = el.textContent, len=Math.max(old.length,newText.length);
      const queue=[];
      for(let i=0;i<len;i++){
        const from=old[i]||'', to=newText[i]||'';
        const start=Math.floor(Math.random()*24), end=start+Math.floor(Math.random()*24)+8;
        queue.push({from,to,start,end,ch:''});
      }
      let frame=0;
      (function upd(){
        let out='', done=0;
        for(const q of queue){
          if(frame>=q.end){ done++; out+=q.to; }
          else if(frame>=q.start){ if(!q.ch||Math.random()<.28) q.ch=chars[Math.floor(Math.random()*chars.length)]; out+=q.ch; }
          else out+=q.from;
        }
        el.textContent=out;
        if(done===queue.length) res(); else { frame++; requestAnimationFrame(upd); }
      })();
    });
  }
  setInterval(()=>{ idx=(idx+1)%words.length; setText(words[idx]); }, 2600);
})();

/* ============ SCROLL PARALLAX (data-speed) ============ */
(function(){
  const items=[...document.querySelectorAll('[data-speed]')];
  if(!items.length) return;
  let ticking=false;
  function apply(){
    const vh=innerHeight;
    for(const el of items){
      const r=el.getBoundingClientRect();
      const center=r.top+r.height/2-vh/2;
      const sp=parseFloat(el.dataset.speed)||1;
      el.style.setProperty('--py', (-center*(sp-1)*.08)+'px');
    }
    ticking=false;
  }
  addEventListener('scroll',()=>{ if(!ticking){ requestAnimationFrame(apply); ticking=true; } },{passive:true});
  apply();
})();

/* ============ SCROLL-DRIVEN HERO FADE ============ */
(function(){
  const inner=document.getElementById('heroInner');
  if(!inner) return;
  addEventListener('scroll',()=>{
    const y=Math.min(scrollY,700);
    const p=y/700;
    inner.style.opacity=1-p*1.1;
    inner.style.transform=`translateY(${y*.15}px) scale(${1-p*.06})`;
  },{passive:true});
})();

/* ============ SCROLL-VELOCITY MARQUEE ============ */
(function(){
  const track=document.querySelector('.marquee__track');
  if(!track) return;
  let last=scrollY, vel=0, base=-.6, offset=0;
  function loop(){
    const now=scrollY, dv=now-last; last=now;
    vel = vel*.9 + dv*.35;
    offset += base + vel;
    const width=track.scrollWidth/2;
    if(offset<=-width) offset+=width;
    if(offset>0) offset-=width;
    track.style.transform=`translateX(${offset}px)`;
    requestAnimationFrame(loop);
  }
  track.style.animation='none';
  loop();
})();

/* ============ CLIP + PROCESS LINE REVEAL ============ */
(function(){
  document.querySelectorAll('.clip-reveal').forEach(el=>io.observe(el));
  const pl=document.querySelector('.process__line');
  if(pl) new IntersectionObserver((e,o)=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('draw');o.unobserve(x.target);}})},{threshold:.4}).observe(pl);
})();

/* ============ CURSOR TRAIL ============ */
(function(){
  if(window.matchMedia('(max-width:899px)').matches) return;
  const N=6, dots=[];
  for(let i=0;i<N;i++){ const d=document.createElement('div'); d.className='trail'; document.body.appendChild(d); dots.push({el:d,x:innerWidth/2,y:innerHeight/2}); }
  let mx=innerWidth/2,my=innerHeight/2;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
  (function loop(){
    let px=mx,py=my;
    dots.forEach((d,i)=>{ d.x+=(px-d.x)*.35; d.y+=(py-d.y)*.35; d.el.style.transform=`translate(${d.x}px,${d.y}px) translate(-50%,-50%) scale(${1-i/N})`; d.el.style.opacity=(1-i/N)*.5; px=d.x; py=d.y; });
    requestAnimationFrame(loop);
  })();
})();

/* ============ YEAR ============ */
document.getElementById('year').textContent = new Date().getFullYear();

/* =========================================================
   BENAMI — Premium Storefront Components
   Dark editorial luxury · cinematic motion · magazine layout
   Maps 1:1 to:
     hero.tsx · featured-grid.tsx · campaign-section.tsx
     category-strip.tsx · premium-footer-cta.tsx
   ========================================================= */

const { useState, useEffect, useRef } = React;

/* ---------- Real product data (placeholder for DB) ---------- */
const PRODUCTS = [
  { id:'p1', name:'Aero Court Low — Bone',     price:285, category:'Sneakers',    src:'OBSIDIAN/SS26', tag:'New', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1800&q=85' },
  { id:'p2', name:'Heritage Trail GTX',        price:340, category:'Sneakers',    src:'CAMPAIGN 04',   tag:'Limited', img:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1800&q=85' },
  { id:'p3', name:'Atelier Wool Crew',         price:420, category:'Streetwear',  src:'WINTER ED.',    tag:'New', img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1800&q=85' },
  { id:'p4', name:'Studio Trench — Charcoal',  price:890, category:'Outerwear',   src:'OBSIDIAN/SS26', tag:'Editor', img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1800&q=85' },
  { id:'p5', name:'Linen Field Shirt',         price:265, category:'Streetwear',  src:'CAMPAIGN 04',   tag:'New', img:'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1800&q=85' },
  { id:'p6', name:'Soft Calf Tote — Cognac',   price:560, category:'Accessories', src:'OBJECTS 02',    tag:'New', img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1800&q=85' },
  { id:'p7', name:'Matte Steel Chrono',        price:1290,category:'Accessories', src:'OBJECTS 02',    tag:'Heritage', img:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1800&q=85' },
  { id:'p8', name:'Carbon Runner Mid',         price:310, category:'Sneakers',    src:'OBSIDIAN/SS26', tag:'Trending', img:'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1800&q=85' },
];

const HERO_SLIDES = [PRODUCTS[1], PRODUCTS[3], PRODUCTS[7]];

/* =========================================================
   NAVBAR (integrated into hero, sits over dark)
   ========================================================= */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-12">
          <a href="#" className="font-serif text-[26px] tracking-[-0.02em] leading-none text-white">benami<span className="text-[var(--accent)]">.</span></a>
          <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] tracking-[0.22em] uppercase text-white/70">
            <a href="#shop" className="underline-grow hover:text-white">Shop</a>
            <a href="#campaign" className="underline-grow hover:text-white">Campaign</a>
            <a href="#categories" className="underline-grow hover:text-white">Universe</a>
            <a href="#" className="underline-grow hover:text-white">Journal</a>
            <a href="#" className="underline-grow hover:text-white">Boutiques</a>
          </nav>
        </div>
        <div className="flex items-center gap-6 font-mono text-[11px] tracking-[0.22em] uppercase text-white/70">
          <span className="hidden lg:inline">EN · USD</span>
          <a href="#" className="hover:text-white">Search</a>
          <a href="#" className="hover:text-white">Account</a>
          <a href="#" className="relative hover:text-white">Bag <span className="ml-1 text-[var(--accent)]">(2)</span></a>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   HERO — full-bleed cinematic, editorial split, real products
   ========================================================= */
function Hero() {
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const slide = HERO_SLIDES[i];

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const dur = 7000;
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now()-start)/dur);
      setProgress(p);
      if (p >= 1) {
        setI((v)=> (v+1) % HERO_SLIDES.length);
      }
    }, 33);
    return () => clearInterval(t);
  }, [i]);

  return (
    <section className="relative h-[100vh] min-h-[760px] overflow-hidden bg-black text-white" data-screen-label="01 Hero">
      {/* Background image with ken burns */}
      {HERO_SLIDES.map((s, idx) => (
        <div key={s.id} className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${idx===i?'opacity-100':'opacity-0'}`}>
          <div className="absolute inset-0 ken-burns">
            <img src={s.img} alt="" className="w-full h-full object-cover" />
          </div>
          {/* Cinematic gradient overlays */}
          <div className="absolute inset-0" style={{background:'linear-gradient(120deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.55) 100%)'}}></div>
          <div className="absolute inset-0" style={{background:'radial-gradient(70% 50% at 50% 100%, rgba(0,0,0,0.7), transparent 70%)'}}></div>
        </div>
      ))}

      {/* Ambient glows */}
      <div className="ambient-glow" style={{top:'10%',left:'-5%',width:'520px',height:'520px',background:'rgba(201,121,74,0.18)'}}></div>
      <div className="ambient-glow" style={{bottom:'-10%',right:'-8%',width:'620px',height:'620px',background:'rgba(217,200,163,0.10)'}}></div>

      {/* Vertical side rails */}
      <div className="absolute left-8 lg:left-14 top-[120px] bottom-[120px] w-px bg-white/10 hidden md:block"></div>
      <div className="absolute right-8 lg:right-14 top-[120px] bottom-[120px] w-px bg-white/10 hidden md:block"></div>

      {/* Editorial split content */}
      <div className="relative z-10 h-full max-w-[1760px] mx-auto px-8 lg:px-14 pt-[120px] pb-[80px] flex flex-col">
        <div className="flex-1 grid grid-cols-12 gap-8 items-center">
          {/* LEFT: editorial text */}
          <div className="col-span-12 lg:col-span-7 relative">
            <div key={`eyebrow-${i}`} className="reveal-up flex items-center gap-3 font-mono text-[11px] tracking-[0.32em] uppercase text-white/70 mb-8">
              <span className="w-8 h-px bg-[var(--accent)]"></span>
              <span>Volume 04 — {slide.src}</span>
            </div>
            <h1 key={`h1-${i}`} className="reveal-up font-serif text-balance text-[88px] md:text-[120px] lg:text-[152px] leading-[0.88] tracking-[-0.035em]" style={{animationDelay:'.1s'}}>
              <span className="block">A study in</span>
              <span className="block italic text-[var(--accent)]">silence,</span>
              <span className="block">made to wear.</span>
            </h1>
            <p key={`p-${i}`} className="reveal-up mt-8 max-w-[440px] text-white/65 text-[15px] leading-[1.7] text-pretty" style={{animationDelay:'.25s'}}>
              The {slide.src} edition assembles considered pieces for a quieter wardrobe — built in Italian mills, cut in our Lisbon atelier, finished by hand.
            </p>
            <div key={`cta-${i}`} className="reveal-up mt-12 flex items-center gap-6 flex-wrap" style={{animationDelay:'.4s'}}>
              <a href="#shop" className="group inline-flex items-center gap-4 h-[56px] pl-7 pr-3 rounded-full bg-white text-black font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-[var(--accent)] transition-colors">
                Shop now
                <span className="w-[40px] h-[40px] rounded-full bg-black text-white grid place-items-center group-hover:translate-x-1 transition-transform">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </a>
              <a href="#campaign" className="font-mono text-[11px] tracking-[0.28em] uppercase text-white/80 underline-grow">Explore the collection</a>
            </div>
          </div>

          {/* RIGHT: floating product card */}
          <div className="col-span-12 lg:col-span-5 relative hidden lg:block">
            <div className="relative">
              {/* large floating product chip */}
              <div key={`card-${i}`} className="reveal-up glass rounded-[28px] p-8 ml-auto max-w-[420px] glow-soft" style={{animationDelay:'.3s'}}>
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.28em] uppercase text-white/55">
                  <span>Featured · {String(i+1).padStart(2,'0')} / {String(HERO_SLIDES.length).padStart(2,'0')}</span>
                  <span className="text-[var(--accent)]">{slide.tag}</span>
                </div>
                <div className="mt-6 aspect-[4/5] rounded-[18px] overflow-hidden bg-black/40 relative">
                  <img src={slide.img} alt={slide.name} className="w-full h-full object-cover ken-burns" />
                  <div className="absolute inset-0" style={{background:'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.5))'}}></div>
                </div>
                <div className="mt-6 flex items-end justify-between gap-6">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-white/45">{slide.category}</div>
                    <div className="font-serif text-[26px] leading-tight tracking-[-0.01em] text-white mt-1">{slide.name}</div>
                  </div>
                  <div className="font-serif text-[26px] tracking-[-0.01em] text-[var(--accent)] whitespace-nowrap">${slide.price}</div>
                </div>
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/55">Add to bag</span>
                  <span className="w-[36px] h-[36px] rounded-full border border-white/20 grid place-items-center hover:bg-white hover:text-black transition-colors cursor-pointer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  </span>
                </div>
              </div>
              {/* floating coordinates */}
              <div className="absolute -top-4 -left-2 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">N 38°43′ · W 9°08′</div>
              <div className="absolute -bottom-4 right-4 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">No.{String(i+1).padStart(3,'0')} / 124</div>
            </div>
          </div>
        </div>

        {/* Bottom rail: slider controls + scroll indicator */}
        <div className="flex items-end justify-between gap-8 mt-8">
          <div className="flex items-center gap-6">
            {/* slide dots / progress */}
            <div className="flex items-center gap-3">
              {HERO_SLIDES.map((s, idx) => (
                <button key={s.id} onClick={()=>setI(idx)} className="group relative">
                  <span className={`block h-px transition-all duration-500 ${idx===i?'w-[80px] bg-white/20':'w-[24px] bg-white/15 group-hover:bg-white/30'}`}></span>
                  {idx===i && (
                    <span className="absolute left-0 top-0 h-px bg-[var(--accent)]" style={{width:`${progress*80}px`}}></span>
                  )}
                </button>
              ))}
            </div>
            <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/55">
              {String(i+1).padStart(2,'0')} <span className="text-white/30">/</span> {String(HERO_SLIDES.length).padStart(2,'0')} — {slide.name}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-white/55 scroll-indicator">
            <span>Scroll</span>
            <span className="w-[1px] h-[40px] bg-gradient-to-b from-white/40 to-transparent"></span>
          </div>
        </div>
      </div>

      {/* Top film strip */}
      <div className="absolute top-[72px] left-0 right-0 z-20 border-y border-white/5 overflow-hidden bg-black/30 backdrop-blur-md">
        <div className="flex marquee-track whitespace-nowrap py-3 font-mono text-[10px] tracking-[0.32em] uppercase text-white/55">
          {Array.from({length:2}).flatMap((_,k)=>[
            <span key={`a${k}`} className="px-8">Free worldwide shipping over $300</span>,
            <span key={`b${k}`} className="px-8 text-[var(--accent)]">·</span>,
            <span key={`c${k}`} className="px-8">Lisbon atelier — finished by hand</span>,
            <span key={`d${k}`} className="px-8 text-[var(--accent)]">·</span>,
            <span key={`e${k}`} className="px-8">SS26 · Volume 04 now in store</span>,
            <span key={`f${k}`} className="px-8 text-[var(--accent)]">·</span>,
            <span key={`g${k}`} className="px-8">WhatsApp concierge — 24h reply</span>,
            <span key={`h${k}`} className="px-8 text-[var(--accent)]">·</span>,
          ])}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FEATURED GRID — asymmetric editorial
   ========================================================= */
function FeaturedGrid() {
  const featured = [PRODUCTS[0], PRODUCTS[2], PRODUCTS[5], PRODUCTS[7], PRODUCTS[4]];
  return (
    <section id="shop" className="relative py-[140px] bg-[#0a0a0a] text-white" data-screen-label="02 Featured">
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14">
        {/* Section header */}
        <div className="grid grid-cols-12 gap-8 mb-20">
          <div className="col-span-12 lg:col-span-3">
            <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-white/50 flex items-center gap-3">
              <span className="w-6 h-px bg-[var(--accent)]"></span>
              <span>02 — In rotation</span>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <h2 className="font-serif text-[64px] md:text-[96px] leading-[0.92] tracking-[-0.03em] text-balance">
              Pieces we <span className="italic text-[var(--accent)]">cannot stop</span><br/>thinking about.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-2 flex lg:justify-end items-end">
            <a href="#" className="font-mono text-[11px] tracking-[0.28em] uppercase text-white/70 underline-grow">View all 124 →</a>
          </div>
        </div>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Tall feature left */}
          <ProductCard p={featured[0]} className="col-span-12 md:col-span-7 row-span-2" aspect="aspect-[4/5]" size="lg" />
          {/* Two stacked right */}
          <ProductCard p={featured[1]} className="col-span-12 md:col-span-5" aspect="aspect-[5/4]" />
          <ProductCard p={featured[2]} className="col-span-12 md:col-span-5" aspect="aspect-[5/4]" />

          {/* Editorial quote band */}
          <div className="col-span-12 md:col-span-7 py-16 px-2 flex items-center">
            <p className="font-serif text-[34px] md:text-[44px] leading-[1.15] tracking-[-0.015em] text-white/85 text-balance">
              "We design for the moment after the photograph — when the clothes are <span className="italic text-[var(--accent)]">lived in</span>, not lit."
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 py-16 flex flex-col justify-center gap-4 border-l border-white/10 pl-8">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/50">Editor's letter</div>
            <div className="font-serif text-[22px] tracking-[-0.01em]">— Ana Vergara, Creative Director</div>
            <a href="#" className="mt-4 font-mono text-[11px] tracking-[0.28em] uppercase text-white/70 underline-grow self-start">Read the letter</a>
          </div>

          {/* Wide bottom */}
          <ProductCard p={featured[3]} className="col-span-12 md:col-span-8" aspect="aspect-[16/10]" size="md" />
          <ProductCard p={featured[4]} className="col-span-12 md:col-span-4" aspect="aspect-[4/5]" />
        </div>
      </div>
    </section>
  );
}

function ProductCard({ p, className='', aspect='aspect-[4/5]', size='sm' }) {
  return (
    <a href="#" className={`group relative block lift ${className}`}>
      <div className={`relative overflow-hidden rounded-[6px] bg-[#141413] img-hover ${aspect}`}>
        <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.45))'}}></div>

        {/* Top corner tag */}
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/85 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur border border-white/15">{p.tag}</span>
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/65">{p.src}</span>
        </div>

        {/* Quick add button (hover) */}
        <div className="absolute bottom-5 right-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <span className="inline-flex items-center gap-2 h-[40px] px-5 rounded-full bg-white text-black font-mono text-[10px] tracking-[0.28em] uppercase">
            Quick add
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
      </div>

      {/* Caption */}
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">{p.category}</div>
          <div className={`font-serif tracking-[-0.01em] text-white mt-1 ${size==='lg'?'text-[34px] leading-[1.05]':size==='md'?'text-[26px]':'text-[20px]'}`}>{p.name}</div>
        </div>
        <div className={`font-serif text-white/85 whitespace-nowrap ${size==='lg'?'text-[28px]':'text-[18px]'}`}>${p.price}</div>
      </div>
    </a>
  );
}

/* =========================================================
   CAMPAIGN / LOOKBOOK — magazine layout
   ========================================================= */
function CampaignSection() {
  return (
    <section id="campaign" className="relative py-[140px] bg-[#0a0a0a] text-white overflow-hidden" data-screen-label="03 Campaign">
      {/* Cinematic header */}
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14 mb-16">
        <div className="grid grid-cols-12 gap-8 items-end">
          <div className="col-span-12 lg:col-span-8">
            <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-white/50 flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--accent)]"></span>
              <span>03 — Campaign / Volume 04</span>
            </div>
            <h2 className="font-serif text-[80px] md:text-[140px] lg:text-[176px] leading-[0.86] tracking-[-0.04em] text-balance">
              <span className="italic text-[var(--accent)]">Obsidian</span><br/>after dark.
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pb-8">
            <p className="text-white/65 text-[15px] leading-[1.7] max-w-[380px] text-pretty">
              Photographed in the Alfama hills two hours before dawn. A capsule of fourteen pieces, layered for the cold blue hour. Available exclusively through Volume 04.
            </p>
            <div className="mt-6 font-mono text-[10px] tracking-[0.28em] uppercase text-white/45">
              Lisbon · 04:42 · 8°C — by Mariela Sá
            </div>
          </div>
        </div>
      </div>

      {/* Magazine grid */}
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* Big hero shot left */}
          <div className="col-span-12 md:col-span-7 relative img-hover overflow-hidden rounded-[6px] aspect-[4/5]">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&q=85" alt="Editorial 1" className="w-full h-full object-cover ken-burns" />
            <div className="absolute inset-0" style={{background:'linear-gradient(180deg, rgba(0,0,0,0.2), transparent 30%, transparent 70%, rgba(0,0,0,0.65))'}}></div>
            <div className="absolute top-6 left-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.32em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
              <span>Frame 01 / 14</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/65 mb-2">Look 03 · Trench, wool crew</div>
                <div className="font-serif text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.02em] text-white max-w-[480px]">"The street still holds the rain."</div>
              </div>
              <a href="#" className="hidden md:inline-flex font-mono text-[10px] tracking-[0.28em] uppercase text-white/85 underline-grow whitespace-nowrap">Shop the look</a>
            </div>
          </div>

          {/* Right column stack */}
          <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-6 lg:gap-8 content-start">
            <div className="col-span-2 img-hover overflow-hidden rounded-[6px] aspect-[5/4] relative">
              <img src="https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=1400&q=85" alt="Editorial 2" className="w-full h-full object-cover" />
              <div className="absolute bottom-5 left-5 font-mono text-[10px] tracking-[0.28em] uppercase text-white/85">Look 07 · Field shirt</div>
            </div>
            <div className="col-span-1 img-hover overflow-hidden rounded-[6px] aspect-[3/4] relative">
              <img src="https://images.unsplash.com/photo-1493612276216-ee3925520721?w=1200&q=85" alt="Editorial 3" className="w-full h-full object-cover" />
            </div>
            <div className="col-span-1 bg-[#141413] rounded-[6px] aspect-[3/4] p-6 flex flex-col justify-between border border-white/5">
              <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/50">Volume 04</div>
              <div>
                <div className="font-serif text-[28px] leading-[1.05] tracking-[-0.015em] text-balance">14 pieces. <span className="italic text-[var(--accent)]">3 colorways.</span></div>
                <div className="mt-3 text-white/55 text-[12px] leading-relaxed">Capsule drops in three deliveries through SS26.</div>
              </div>
              <a href="#" className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/85 underline-grow self-start">View capsule</a>
            </div>
          </div>

          {/* Wide bottom strip */}
          <div className="col-span-12 grid grid-cols-12 gap-6 lg:gap-8 mt-2">
            <div className="col-span-6 md:col-span-3 img-hover overflow-hidden rounded-[6px] aspect-[3/4] relative">
              <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&q=85" alt="Editorial 4" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.28em] uppercase text-white/85">Look 09</div>
            </div>
            <div className="col-span-6 md:col-span-3 img-hover overflow-hidden rounded-[6px] aspect-[3/4] relative">
              <img src="https://images.unsplash.com/photo-1485518882345-15568b007407?w=1200&q=85" alt="Editorial 5" className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.28em] uppercase text-white/85">Look 11</div>
            </div>
            <div className="col-span-12 md:col-span-6 img-hover overflow-hidden rounded-[6px] aspect-[3/2] relative">
              <img src="https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1800&q=85" alt="Editorial 6" className="w-full h-full object-cover ken-burns" />
              <div className="absolute inset-0" style={{background:'linear-gradient(90deg, rgba(0,0,0,0.6), transparent 60%)'}}></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-8 max-w-[300px]">
                <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/70 mb-3">Closing frame</div>
                <div className="font-serif text-[28px] md:text-[36px] leading-[1.05] tracking-[-0.02em]">"And then, almost nothing."</div>
                <a href="#" className="mt-5 inline-flex font-mono text-[10px] tracking-[0.28em] uppercase text-white/85 underline-grow">See full editorial →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   CATEGORY STRIP
   ========================================================= */
function CategoryStrip() {
  const cats = [
    { name:'Sneakers',     count:38, img:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=900&q=85' },
    { name:'Streetwear',   count:46, img:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=900&q=85' },
    { name:'Accessories',  count:24, img:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900&q=85' },
    { name:'New arrivals', count:18, img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=85' },
    { name:'Trending',     count:12, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=85' },
  ];
  return (
    <section id="categories" className="relative py-[140px] bg-[#0a0a0a] text-white border-y border-white/5" data-screen-label="04 Categories">
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14">
        <div className="flex items-end justify-between gap-8 mb-14">
          <div>
            <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-white/50 flex items-center gap-3 mb-6">
              <span className="w-6 h-px bg-[var(--accent)]"></span>
              <span>04 — Universe</span>
            </div>
            <h2 className="font-serif text-[56px] md:text-[80px] leading-[0.95] tracking-[-0.03em]">
              The full <span className="italic text-[var(--accent)]">universe.</span>
            </h2>
          </div>
          <a href="#" className="hidden md:inline-flex font-mono text-[11px] tracking-[0.28em] uppercase text-white/70 underline-grow">All categories →</a>
        </div>

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {cats.map((c, idx) => (
            <a key={c.name} href="#" className={`group relative overflow-hidden rounded-[6px] img-hover lift bg-[#141413] ${idx===0?'col-span-12 md:col-span-8 aspect-[16/10]':idx===1?'col-span-12 md:col-span-4 aspect-[4/5] md:aspect-auto':idx===2?'col-span-6 md:col-span-4 aspect-[5/4]':idx===3?'col-span-6 md:col-span-4 aspect-[5/4]':'col-span-12 md:col-span-4 aspect-[5/4]'}`}>
              <img src={c.img} alt={c.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0" style={{background:'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85))'}}></div>
              <div className="relative h-full p-7 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/75">{String(idx+1).padStart(2,'0')}</span>
                  <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/75">{c.count} pieces</span>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className={`font-serif tracking-[-0.02em] text-balance ${idx===0?'text-[64px] md:text-[88px] leading-[0.9]':'text-[34px] md:text-[44px] leading-[1.0]'}`}>{c.name}</div>
                  <span className="w-[48px] h-[48px] rounded-full border border-white/30 grid place-items-center group-hover:bg-white group-hover:text-black transition-colors flex-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   TRUST / BRAND PROMISE
   ========================================================= */
function TrustSection() {
  const items = [
    { k:'01', title:'Express delivery', text:'48h to most of Europe and US East. Tracked from atelier to door, signature on arrival.', icon:(
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>) },
    { k:'02', title:'Verified authentic', text:'Every piece carries an embedded NFC chip. Provenance and serial signed by our atelier.', icon:(
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M9 12l2.2 2.2L15 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { k:'03', title:'WhatsApp concierge', text:'Real humans, no chatbots. Style advice, sizing, returns — replied within 24 hours.', icon:(
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M4 20l1.5-4A8 8 0 1112 20H4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>) },
    { k:'04', title:'Lifetime care', text:'Free repairs, resoling, and re-stitching for the lifetime of every garment we ship.', icon:(
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>) },
  ];
  return (
    <section className="relative py-[140px] bg-[#0a0a0a] text-white" data-screen-label="05 Trust">
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14">
        <div className="grid grid-cols-12 gap-8 mb-16">
          <div className="col-span-12 lg:col-span-5">
            <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-white/50 flex items-center gap-3 mb-6">
              <span className="w-6 h-px bg-[var(--accent)]"></span>
              <span>05 — The promise</span>
            </div>
            <h2 className="font-serif text-[56px] md:text-[80px] leading-[0.95] tracking-[-0.03em] text-balance">
              Quietly serious about <span className="italic text-[var(--accent)]">every detail.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-white/10">
          {items.map((it, i) => (
            <div key={it.k} className={`group p-10 border-b border-white/10 ${i!==0?'lg:border-l border-white/10':''} ${i!==items.length-1?'md:border-r md:last:border-r-0':''} hover:bg-white/[0.02] transition-colors`}>
              <div className="flex items-center justify-between mb-12">
                <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/45">{it.k}</span>
                <span className="text-[var(--accent)]">{it.icon}</span>
              </div>
              <div className="font-serif text-[26px] tracking-[-0.01em] mb-3">{it.title}</div>
              <p className="text-white/55 text-[13px] leading-[1.7] text-pretty">{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FINAL CTA — cinematic dark
   ========================================================= */
function PremiumFooterCTA() {
  return (
    <section className="relative min-h-[700px] bg-black text-white overflow-hidden flex items-center" data-screen-label="06 Final CTA">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=2000&q=85" alt="" className="w-full h-full object-cover ken-burns opacity-50" />
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95))'}}></div>
        <div className="absolute inset-0" style={{background:'radial-gradient(60% 50% at 50% 50%, transparent, rgba(0,0,0,0.6))'}}></div>
      </div>
      <div className="ambient-glow" style={{top:'10%',left:'40%',width:'700px',height:'700px',background:'rgba(201,121,74,0.18)'}}></div>

      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-8 lg:px-14 py-[120px]">
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="font-mono text-[11px] tracking-[0.36em] uppercase text-white/55 flex items-center justify-center gap-3 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
            <span>06 — The full collection</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
          </div>
          <h2 className="font-serif text-[80px] md:text-[140px] lg:text-[180px] leading-[0.86] tracking-[-0.04em] text-balance">
            Discover<br/><span className="italic text-[var(--accent)]">everything</span> we make.
          </h2>
          <p className="mt-12 max-w-[480px] mx-auto text-white/60 text-[15px] leading-[1.7] text-pretty">
            124 pieces across four volumes. New deliveries every fortnight. Members of The Index see drops 48 hours early.
          </p>
          <div className="mt-14 flex items-center justify-center gap-6 flex-wrap">
            <a href="#" className="group inline-flex items-center gap-4 h-[64px] pl-9 pr-4 rounded-full bg-white text-black font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-[var(--accent)] transition-colors">
              Enter the collection
              <span className="w-[44px] h-[44px] rounded-full bg-black text-white grid place-items-center group-hover:translate-x-1 transition-transform">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </a>
            <a href="#" className="font-mono text-[11px] tracking-[0.28em] uppercase text-white/80 underline-grow">Join The Index</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FOOTER
   ========================================================= */
function Footer() {
  return (
    <footer className="bg-[#070707] text-white border-t border-white/5">
      <div className="max-w-[1760px] mx-auto px-8 lg:px-14 py-20">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5">
            <div className="font-serif text-[64px] md:text-[88px] tracking-[-0.03em] leading-none mb-6">benami<span className="text-[var(--accent)]">.</span></div>
            <p className="text-white/55 text-[14px] leading-[1.7] max-w-[380px] text-pretty">
              A multi-store house of considered objects. Founded in Lisbon, made across small ateliers in Portugal, Italy and Japan.
            </p>
          </div>
          <div className="col-span-6 lg:col-span-2">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/40 mb-5">Shop</div>
            <ul className="space-y-3 text-white/75 text-[13px]">
              <li><a className="underline-grow" href="#">Sneakers</a></li>
              <li><a className="underline-grow" href="#">Streetwear</a></li>
              <li><a className="underline-grow" href="#">Outerwear</a></li>
              <li><a className="underline-grow" href="#">Accessories</a></li>
              <li><a className="underline-grow" href="#">Volume 04</a></li>
            </ul>
          </div>
          <div className="col-span-6 lg:col-span-2">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/40 mb-5">House</div>
            <ul className="space-y-3 text-white/75 text-[13px]">
              <li><a className="underline-grow" href="#">Atelier</a></li>
              <li><a className="underline-grow" href="#">Boutiques</a></li>
              <li><a className="underline-grow" href="#">Journal</a></li>
              <li><a className="underline-grow" href="#">Sustainability</a></li>
              <li><a className="underline-grow" href="#">Press</a></li>
            </ul>
          </div>
          <div className="col-span-12 lg:col-span-3">
            <div className="font-mono text-[10px] tracking-[0.32em] uppercase text-white/40 mb-5">The Index</div>
            <p className="text-white/55 text-[13px] leading-[1.7] mb-5">Drops 48h early. Atelier letters once a month.</p>
            <form onSubmit={(e)=>e.preventDefault()} className="flex items-center gap-2 border-b border-white/15 pb-3">
              <input type="email" placeholder="your@email.com" className="bg-transparent flex-1 outline-none text-[14px] text-white placeholder:text-white/35" />
              <button type="submit" className="font-mono text-[10px] tracking-[0.28em] uppercase text-[var(--accent)] hover:text-white transition-colors">Subscribe →</button>
            </form>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
          <div>© MMXXVI Benami House — Lisbon, Portugal</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Imprint</a>
            <a href="#" className="hover:text-white">EN · USD</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* expose */
Object.assign(window, { Navbar, Hero, FeaturedGrid, CampaignSection, CategoryStrip, TrustSection, PremiumFooterCTA, Footer });

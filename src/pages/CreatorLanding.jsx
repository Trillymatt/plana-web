import { useState, useEffect, useRef } from 'react';
import { useWaitlist } from '../hooks/useWaitlist';

/* ─────────────────── helpers ─────────────────── */
function useOnScreen(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const visible = useOnScreen(ref);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────── founding creator counter ─────────── */
const SPOTS_TOTAL = 10;
const SPOTS_REMAINING = 7;

/* ──────────────── waitlist form ──────────────── */
function CreatorForm() {
  const [email, setEmail] = useState('');
  const { submit, status, error } = useWaitlist();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    await submit(email, 'creator');
  }

  if (status === 'success') {
    return (
      <div style={sx.successWrap}>
        <span style={sx.successCheck}>&#10003;</span>
        <p style={sx.successText}>
          You're in. We'll be in touch with your onboarding details before launch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={sx.form}>
      <div style={sx.inputWrap}>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          style={sx.input}
          onFocus={(e) => { e.target.parentElement.style.borderColor = 'rgba(0,255,135,.4)'; }}
          onBlur={(e) => { e.target.parentElement.style.borderColor = BORDER; }}
        />
        <button type="submit" disabled={status === 'loading'} style={sx.btn}>
          {status === 'loading' ? 'Applying\u2026' : 'Apply for Early Access'}
        </button>
      </div>
      {status === 'error' && <p style={sx.errorText}>{error}</p>}
    </form>
  );
}

/* ──────────── fee comparison bar ──────────── */
function FeeBar({ platform, earned, fee, keep, accent, bad }) {
  const keepPct = Math.round((keep / earned) * 100);
  const feePct = Math.round((fee / earned) * 100);
  return (
    <div style={{ ...sx.feeCard, borderColor: bad ? 'rgba(255,80,80,.15)' : 'rgba(0,255,135,.15)' }}>
      <p style={{ ...sx.feePlatform, color: bad ? '#FF5050' : ACCENT }}>{platform}</p>
      <div style={sx.feeBarTrack}>
        <div style={{
          ...sx.feeBarFill,
          width: `${keepPct}%`,
          background: bad
            ? 'linear-gradient(90deg, rgba(255,80,80,.25), rgba(255,80,80,.08))'
            : 'linear-gradient(90deg, rgba(0,255,135,.3), rgba(0,255,135,.08))',
        }} />
      </div>
      <div style={sx.feeNumbers}>
        <div style={sx.feeNumBlock}>
          <span style={sx.feeLabel}>You earn</span>
          <span style={sx.feeValue}>${earned.toLocaleString()}</span>
        </div>
        <div style={sx.feeNumBlock}>
          <span style={sx.feeLabel}>They take</span>
          <span style={{ ...sx.feeValue, color: bad ? '#FF5050' : 'rgba(255,255,255,.4)' }}>
            -${fee.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500 }}>({feePct}%)</span>
          </span>
        </div>
        <div style={sx.feeNumBlock}>
          <span style={sx.feeLabel}>You keep</span>
          <span style={{ ...sx.feeValue, color: bad ? 'rgba(255,255,255,.6)' : ACCENT }}>
            ${keep.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ──────────── plan type card ──────────── */
function PlanTypeCard({ icon, title, description, detail, delay }) {
  return (
    <FadeIn delay={delay}>
      <div style={sx.planCard}>
        <span style={sx.planIcon}>{icon}</span>
        <h3 style={sx.planTitle}>{title}</h3>
        <p style={sx.planDesc}>{description}</p>
        <div style={sx.planDetailBar}>
          <span style={sx.planDetailText}>{detail}</span>
        </div>
      </div>
    </FadeIn>
  );
}

/* ──────────── perk row ──────────── */
function PerkItem({ children, delay }) {
  return (
    <FadeIn delay={delay}>
      <div style={sx.perkRow}>
        <span style={sx.perkCheck}>&#10003;</span>
        <p style={sx.perkText}>{children}</p>
      </div>
    </FadeIn>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function CreatorLanding() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // capture utm_creator for analytics (stored via useWaitlist's utm_source)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmCreator = params.get('utm_creator');
    if (utmCreator) {
      sessionStorage.setItem('plana_utm_creator', utmCreator);
    }
  }, []);

  const filledSpots = SPOTS_TOTAL - SPOTS_REMAINING;

  return (
    <div style={sx.page}>
      {/* ─── nav ─── */}
      <nav style={{
        ...sx.nav,
        backdropFilter: scrollY > 40 ? 'blur(16px)' : 'none',
        background: scrollY > 40 ? 'rgba(10,10,10,.85)' : 'transparent',
        borderBottom: scrollY > 40 ? `1px solid ${BORDER}` : '1px solid transparent',
      }}>
        <span style={sx.logo}>plana <span style={sx.logoTag}>creators</span></span>
        <a href="#apply" style={sx.navCta}>Apply Now</a>
      </nav>

      {/* ─── HERO ─── */}
      <section style={sx.hero}>
        <FadeIn>
          <div style={sx.spotsBadge}>
            <span style={sx.spotsDot} />
            <span>{SPOTS_REMAINING} of {SPOTS_TOTAL} founding creator spots remaining</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <h1 style={sx.heroH1}>
            Keep <span style={sx.heroAccent}>90%</span> of<br />what you earn.
          </h1>
        </FadeIn>

        <FadeIn delay={0.14}>
          <p style={sx.heroSub}>
            Sell meal plans, workout programmes, and custom 1:1 plans — without
            giving 30% to a platform that doesn't know your audience.
          </p>
        </FadeIn>

        <FadeIn delay={0.22}>
          <div id="apply">
            <CreatorForm />
          </div>
        </FadeIn>

        {/* spots visualiser */}
        <FadeIn delay={0.3}>
          <div style={sx.spotsVis}>
            {Array.from({ length: SPOTS_TOTAL }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...sx.spotBlock,
                  background: i < filledSpots ? ACCENT : 'rgba(255,255,255,.06)',
                  borderColor: i < filledSpots ? ACCENT : 'rgba(255,255,255,.08)',
                }}
              >
                {i < filledSpots && <span style={sx.spotFilled}>&#10003;</span>}
              </div>
            ))}
          </div>
          <p style={sx.spotsCaption}>
            <span style={{ color: ACCENT, fontWeight: 700 }}>{filledSpots} claimed</span>
            {' '}&middot; {SPOTS_REMAINING} remaining at 10% forever
          </p>
        </FadeIn>
      </section>

      {/* ─── FEE COMPARISON ─── */}
      <section style={sx.section}>
        <FadeIn>
          <p style={sx.sectionLabel}>The numbers</p>
          <h2 style={sx.sectionH2}>The math is simple.</h2>
        </FadeIn>

        <div style={sx.feeGrid}>
          <FadeIn delay={0.05}>
            <FeeBar platform="Other platforms" earned={1000} fee={300} keep={700} bad />
          </FadeIn>
          <FadeIn delay={0.15}>
            <FeeBar platform="Plana" earned={1000} fee={100} keep={900} />
          </FadeIn>
        </div>

        <FadeIn delay={0.25}>
          <div style={sx.feeLockBanner}>
            <span style={sx.feeLockIcon}>&#8734;</span>
            <p style={sx.feeLockText}>
              Founding creators lock in <strong style={{ color: '#fff' }}>10% forever</strong> — even if pricing changes later.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ─── THREE PLAN TYPES ─── */}
      <section style={sx.section}>
        <FadeIn>
          <p style={sx.sectionLabel}>Revenue streams</p>
          <h2 style={sx.sectionH2}>Three ways to monetise your audience</h2>
        </FadeIn>

        <div style={sx.planGrid}>
          <PlanTypeCard
            icon="&#9678;"
            title="Pre-Made Plans"
            description="Build once, sell forever. Post your $40 meal plan. It sells while you sleep. Grocery list generates automatically for every buyer."
            detail="Passive income, zero fulfillment"
            delay={0.05}
          />
          <PlanTypeCard
            icon="&#8635;"
            title="Subscriptions"
            description="Monthly recurring revenue. Set your price. Your subscribers get fresh plans every month and a direct line to you."
            detail="Predictable monthly revenue"
            delay={0.15}
          />
          <PlanTypeCard
            icon="&#9733;"
            title="Custom 1:1 Plans"
            description="Client fills out a detailed quiz — goals, injuries, diet, equipment. You get the full profile. You build their plan. Paid upfront."
            detail="Premium pricing, structured intake"
            delay={0.25}
          />
        </div>
      </section>

      {/* ─── SMART FEATURES ─── */}
      <section style={sx.section}>
        <FadeIn>
          <p style={sx.sectionLabel}>Platform features</p>
          <h2 style={sx.sectionH2}>We handle the boring parts.</h2>
          <p style={sx.sectionSub}>
            You focus on creating great plans. Plana takes care of everything that
            happens after someone hits "Buy."
          </p>
        </FadeIn>

        <div style={sx.featuresGrid}>
          {[
            {
              title: 'Auto grocery lists',
              desc: 'Every meal plan you sell automatically generates a categorised grocery list for your buyer. No PDFs. No spreadsheets.',
            },
            {
              title: 'Calendar sync',
              desc: 'Workout plans schedule directly into your client\'s Google or Apple Calendar. They always know what day it is.',
            },
            {
              title: 'No manual delivery',
              desc: 'No emailing PDFs. No back-and-forth DMs. Client buys, client gets instant access. You get paid.',
            },
            {
              title: 'Client quiz intake',
              desc: 'For custom plans, clients fill out a structured form — goals, experience, dietary needs, injuries. You just build.',
            },
          ].map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <div style={sx.featureCard}>
                <div style={sx.featureDot} />
                <h3 style={sx.featureTitle}>{f.title}</h3>
                <p style={sx.featureDesc}>{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── EARNINGS CALCULATOR ─── */}
      <section style={sx.section}>
        <FadeIn>
          <EarningsCalculator />
        </FadeIn>
      </section>

      {/* ─── FOUNDING CREATOR PERKS ─── */}
      <section style={sx.section}>
        <FadeIn>
          <p style={sx.sectionLabel}>Founding creators</p>
          <h2 style={sx.sectionH2}>Why join now?</h2>
        </FadeIn>

        <div style={sx.perksWrap}>
          <PerkItem delay={0.05}>
            <strong style={{ color: '#fff' }}>10% platform fee locked in forever.</strong>{' '}
            Standard pricing will be higher. Founding creators keep their rate no matter what.
          </PerkItem>
          <PerkItem delay={0.1}>
            <strong style={{ color: '#fff' }}>Direct access to the founder.</strong>{' '}
            Your feedback shapes what gets built next. Not a support ticket — a real conversation.
          </PerkItem>
          <PerkItem delay={0.15}>
            <strong style={{ color: '#fff' }}>First profiles live when the marketplace opens.</strong>{' '}
            Early visibility means early buyers. You're already there when traffic arrives.
          </PerkItem>
          <PerkItem delay={0.2}>
            <strong style={{ color: '#fff' }}>No contracts. No exclusivity.</strong>{' '}
            Run Plana alongside anything else you do. Leave whenever you want. We'd rather earn your loyalty.
          </PerkItem>
        </div>
      </section>

      {/* ─── CTA FOOTER ─── */}
      <section style={sx.ctaSection}>
        <FadeIn>
          <div style={sx.ctaSpotsBadge}>
            <span style={sx.spotsDot} />
            {SPOTS_REMAINING} spots left at 10%
          </div>
          <h2 style={sx.ctaH2}>
            Spots are limited.<br />
            Don't miss the founding<br />
            creator rate<span style={{ color: ACCENT }}>.</span>
          </h2>
          <CreatorForm />
          <p style={sx.ctaSmall}>No contracts. No exclusivity. Cancel anytime.</p>
        </FadeIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={sx.footer}>
        <span style={sx.logo}>plana</span>
        <p style={sx.footerNote}>&copy; {new Date().getFullYear()} Plana. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes plana-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: .4; }
        }
        input::placeholder { color: rgba(255,255,255,.3); }
        html { scroll-padding-top: 80px; }
        input[type=range] {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,.08);
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${ACCENT};
          cursor: pointer;
          border: 3px solid #0A0A0A;
          box-shadow: 0 0 0 2px rgba(0,255,135,.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${ACCENT};
          cursor: pointer;
          border: 3px solid #0A0A0A;
          box-shadow: 0 0 0 2px rgba(0,255,135,.3);
        }
      `}</style>
    </div>
  );
}

/* ──────────── earnings calculator ──────────── */
function EarningsCalculator() {
  const [plans, setPlans] = useState(50);
  const [price, setPrice] = useState(40);
  const gross = plans * price;
  const planaFee = Math.round(gross * 0.1);
  const otherFee = Math.round(gross * 0.3);
  const planaNet = gross - planaFee;
  const otherNet = gross - otherFee;
  const saved = planaNet - otherNet;

  return (
    <div style={sx.calcWrap}>
      <p style={sx.sectionLabel}>Your earnings</p>
      <h2 style={{ ...sx.sectionH2, textAlign: 'center' }}>See what you'd keep on Plana</h2>

      <div style={sx.calcSliders}>
        <div style={sx.calcSliderGroup}>
          <div style={sx.calcSliderLabel}>
            <span>Plans sold per month</span>
            <span style={sx.calcSliderValue}>{plans}</span>
          </div>
          <input
            type="range"
            min={5}
            max={500}
            step={5}
            value={plans}
            onChange={(e) => setPlans(Number(e.target.value))}
          />
        </div>
        <div style={sx.calcSliderGroup}>
          <div style={sx.calcSliderLabel}>
            <span>Average price per plan</span>
            <span style={sx.calcSliderValue}>${price}</span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
      </div>

      <div style={sx.calcResults}>
        <div style={sx.calcResultCard}>
          <span style={sx.calcResultLabel}>On other platforms (30%)</span>
          <span style={{ ...sx.calcResultAmount, color: 'rgba(255,255,255,.4)' }}>
            ${otherNet.toLocaleString()}<span style={sx.calcResultPeriod}>/mo</span>
          </span>
        </div>
        <div style={{ ...sx.calcResultCard, borderColor: 'rgba(0,255,135,.2)' }}>
          <span style={{ ...sx.calcResultLabel, color: ACCENT }}>On Plana (10%)</span>
          <span style={{ ...sx.calcResultAmount, color: ACCENT }}>
            ${planaNet.toLocaleString()}<span style={sx.calcResultPeriod}>/mo</span>
          </span>
        </div>
      </div>

      <div style={sx.calcSaved}>
        <span style={sx.calcSavedLabel}>Extra in your pocket each month</span>
        <span style={sx.calcSavedAmount}>+${saved.toLocaleString()}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */
const ACCENT = '#00FF87';
const BG = '#0A0A0A';
const CARD_BG = '#111111';
const BORDER = 'rgba(255,255,255,.06)';
const MAX_W = 1120;

const sx = {
  page: { background: BG, minHeight: '100vh', color: '#FAFAFA' },

  /* nav */
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 clamp(20px, 5vw, 48px)', height: 64,
    transition: 'all .3s ease',
  },
  logo: { fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em', color: '#fff' },
  logoTag: {
    fontSize: 12, fontWeight: 600, color: ACCENT,
    background: 'rgba(0,255,135,.1)', border: '1px solid rgba(0,255,135,.15)',
    borderRadius: 4, padding: '2px 6px', marginLeft: 6, verticalAlign: 'middle',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  },
  navCta: {
    fontSize: 14, fontWeight: 600, color: BG, background: ACCENT,
    padding: '8px 20px', borderRadius: 99, textDecoration: 'none',
  },

  /* hero */
  hero: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    textAlign: 'center', padding: '150px clamp(20px, 5vw, 48px) 80px',
    maxWidth: MAX_W, margin: '0 auto',
  },
  heroH1: {
    fontSize: 'clamp(36px, 6.5vw, 76px)', fontWeight: 800,
    lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 28px',
  },
  heroAccent: { color: ACCENT },
  heroSub: {
    fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(255,255,255,.5)',
    maxWidth: 520, margin: '0 0 40px', lineHeight: 1.7,
  },

  /* spots badge */
  spotsBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 600, color: ACCENT,
    background: 'rgba(0,255,135,.06)', border: '1px solid rgba(0,255,135,.15)',
    borderRadius: 99, padding: '7px 18px', marginBottom: 32,
    letterSpacing: '0.01em',
  },
  spotsDot: {
    width: 7, height: 7, borderRadius: '50%', background: ACCENT,
    display: 'inline-block', animation: 'plana-pulse 2s ease-in-out infinite',
  },

  /* spots visualiser */
  spotsVis: {
    display: 'flex', gap: 8, justifyContent: 'center',
    marginTop: 48, flexWrap: 'wrap',
  },
  spotBlock: {
    width: 40, height: 40, borderRadius: 8,
    border: '1px solid rgba(255,255,255,.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .3s',
  },
  spotFilled: { color: BG, fontSize: 14, fontWeight: 700 },
  spotsCaption: {
    fontSize: 13, color: 'rgba(255,255,255,.35)',
    textAlign: 'center', marginTop: 12,
  },

  /* sections */
  section: { maxWidth: MAX_W, margin: '0 auto', padding: '100px clamp(20px, 5vw, 48px)' },
  sectionLabel: {
    fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.12em', color: ACCENT, marginBottom: 12, textAlign: 'center',
  },
  sectionH2: {
    fontSize: 'clamp(26px, 4.2vw, 44px)', fontWeight: 800,
    lineHeight: 1.12, letterSpacing: '-0.03em', marginBottom: 16, textAlign: 'center',
  },
  sectionSub: {
    fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(255,255,255,.45)',
    maxWidth: 520, lineHeight: 1.7, margin: '0 auto 48px', textAlign: 'center',
  },

  /* fee comparison */
  feeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20, marginTop: 40,
  },
  feeCard: {
    background: CARD_BG, border: '1px solid', borderRadius: 16,
    padding: 'clamp(24px, 3vw, 32px)',
  },
  feePlatform: { fontSize: 15, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' },
  feeBarTrack: {
    height: 8, borderRadius: 4, background: 'rgba(255,255,255,.04)',
    marginBottom: 24, overflow: 'hidden',
  },
  feeBarFill: { height: '100%', borderRadius: 4, transition: 'width .6s ease' },
  feeNumbers: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  feeNumBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  feeLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,.3)' },
  feeValue: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' },

  feeLockBanner: {
    display: 'flex', alignItems: 'center', gap: 16,
    marginTop: 32, padding: '20px 28px', borderRadius: 14,
    background: 'rgba(0,255,135,.04)', border: '1px solid rgba(0,255,135,.1)',
  },
  feeLockIcon: {
    fontSize: 28, color: ACCENT, flexShrink: 0, width: 44, height: 44,
    borderRadius: '50%', background: 'rgba(0,255,135,.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  feeLockText: { fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.6 },

  /* plan type cards */
  planGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20, marginTop: 40,
  },
  planCard: {
    background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16,
    padding: 'clamp(28px, 3vw, 36px)', display: 'flex', flexDirection: 'column',
    height: '100%',
  },
  planIcon: {
    fontSize: 24, color: ACCENT, marginBottom: 16,
    width: 44, height: 44, borderRadius: 12,
    background: 'rgba(0,255,135,.08)', border: '1px solid rgba(0,255,135,.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  planTitle: {
    fontSize: 'clamp(18px, 2.2vw, 22px)', fontWeight: 700,
    lineHeight: 1.3, marginBottom: 12,
  },
  planDesc: { fontSize: 15, color: 'rgba(255,255,255,.5)', lineHeight: 1.7, marginBottom: 20, flex: 1 },
  planDetailBar: {
    background: 'rgba(0,255,135,.04)', border: '1px solid rgba(0,255,135,.08)',
    borderRadius: 8, padding: '10px 14px',
  },
  planDetailText: { fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: '0.01em' },

  /* smart features */
  featuresGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16, marginTop: 40,
  },
  featureCard: {
    background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14,
    padding: 'clamp(20px, 2.5vw, 28px)',
  },
  featureDot: {
    width: 8, height: 8, borderRadius: '50%', background: ACCENT, marginBottom: 16,
  },
  featureTitle: { fontSize: 17, fontWeight: 700, marginBottom: 8 },
  featureDesc: { fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 },

  /* earnings calculator */
  calcWrap: {
    background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20,
    padding: 'clamp(28px, 4vw, 56px)', textAlign: 'center',
  },
  calcSliders: {
    maxWidth: 480, margin: '40px auto 0',
    display: 'flex', flexDirection: 'column', gap: 28,
  },
  calcSliderGroup: { textAlign: 'left' },
  calcSliderLabel: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 10,
    fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,.6)',
  },
  calcSliderValue: {
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
    color: '#fff', fontSize: 15,
  },
  calcResults: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginTop: 36,
  },
  calcResultCard: {
    border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: '20px 24px', textAlign: 'center',
  },
  calcResultLabel: {
    fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: 'rgba(255,255,255,.35)',
    display: 'block', marginBottom: 8,
  },
  calcResultAmount: { fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' },
  calcResultPeriod: { fontSize: 16, fontWeight: 500, opacity: 0.5 },
  calcSaved: {
    marginTop: 24, padding: '16px 24px', borderRadius: 12,
    background: 'rgba(0,255,135,.06)', border: '1px solid rgba(0,255,135,.12)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: 480, margin: '24px auto 0', flexWrap: 'wrap', gap: 8,
  },
  calcSavedLabel: { fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.55)' },
  calcSavedAmount: {
    fontSize: 24, fontWeight: 800, color: ACCENT, letterSpacing: '-0.02em',
    fontFamily: "'JetBrains Mono', monospace",
  },

  /* perks */
  perksWrap: {
    maxWidth: 640, margin: '40px auto 0',
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  perkRow: {
    display: 'flex', gap: 16, padding: '20px 0',
    borderBottom: `1px solid ${BORDER}`,
  },
  perkCheck: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'rgba(0,255,135,.1)', color: ACCENT,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 2,
  },
  perkText: { fontSize: 15, color: 'rgba(255,255,255,.55)', lineHeight: 1.7 },

  /* cta */
  ctaSection: {
    textAlign: 'center', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '120px clamp(20px, 5vw, 48px)',
    borderTop: `1px solid ${BORDER}`,
  },
  ctaSpotsBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 600, color: ACCENT,
    background: 'rgba(0,255,135,.06)', border: '1px solid rgba(0,255,135,.15)',
    borderRadius: 99, padding: '7px 18px', marginBottom: 28,
  },
  ctaH2: {
    fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800,
    lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16,
  },
  ctaSmall: { fontSize: 13, color: 'rgba(255,255,255,.25)', marginTop: 20 },

  /* form */
  form: { width: '100%', maxWidth: 500, margin: '0 auto' },
  inputWrap: {
    display: 'flex', gap: 0, background: CARD_BG, borderRadius: 12,
    border: `1px solid ${BORDER}`, overflow: 'hidden', padding: 4,
    transition: 'border-color .2s',
  },
  input: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#FAFAFA', fontSize: 15, padding: '14px 16px',
    fontFamily: 'inherit', minWidth: 0,
  },
  btn: {
    background: ACCENT, color: BG, border: 'none', borderRadius: 10,
    padding: '14px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'opacity .2s',
    flexShrink: 0,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 10 },
  successWrap: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'rgba(0,255,135,.06)', border: '1px solid rgba(0,255,135,.2)',
    borderRadius: 12, padding: '16px 24px', maxWidth: 500, margin: '0 auto',
  },
  successCheck: {
    width: 28, height: 28, borderRadius: '50%', background: ACCENT,
    color: BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  successText: { color: ACCENT, fontSize: 15, fontWeight: 600, textAlign: 'left' },

  /* footer */
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '32px clamp(20px, 5vw, 48px)', borderTop: `1px solid ${BORDER}`,
    maxWidth: MAX_W, margin: '0 auto',
  },
  footerNote: { fontSize: 13, color: 'rgba(255,255,255,.25)' },
};

import { useState, useEffect, useRef } from 'react';
import { useWaitlist } from '../hooks/useWaitlist';

/* ───────────────────── tiny helpers ───────────────────── */
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
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────── waitlist form ──────────────── */
function WaitlistForm({ source, centered = true }) {
  const [email, setEmail] = useState('');
  const { submit, status, error, referralCode } = useWaitlist();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    await submit(email, source);
  }

  const [copied, setCopied] = useState(false);

  function copyReferral() {
    const url = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (status === 'success') {
    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    return (
      <div style={{ ...sx.successWrap, ...(centered ? { margin: '0 auto' } : {}) }}>
        <div style={sx.successTop}>
          <span style={sx.successCheck}>&#10003;</span>
          <p style={sx.successText}>You're on the list! We'll email you before launch day.</p>
        </div>
        <div style={sx.referralBlock}>
          <p style={sx.referralLabel}>Share your link to move up the waitlist:</p>
          <div style={sx.referralRow}>
            <input
              readOnly
              value={referralUrl}
              style={sx.referralInput}
              onClick={(e) => e.target.select()}
            />
            <button onClick={copyReferral} style={sx.referralBtn}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...sx.form, ...(centered ? { margin: '0 auto' } : {}) }}>
      <div style={sx.inputWrap}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          style={sx.input}
          onFocus={(e) => { e.target.parentElement.style.borderColor = 'rgba(0,122,255,.5)'; }}
          onBlur={(e) => { e.target.parentElement.style.borderColor = 'rgba(255,255,255,.08)'; }}
        />
        <button type="submit" disabled={status === 'loading'} style={sx.btn}>
          {status === 'loading' ? 'Joining\u2026' : 'Join the Waitlist'}
        </button>
      </div>
      {status === 'error' && <p style={sx.errorText}>{error}</p>}
    </form>
  );
}

/* ──────────────── social proof ──────────────── */
function SocialProof() {
  return (
    <div style={sx.socialProof}>
      <div style={sx.socialAvatars}>
        {['#007AFF', '#FF5733', '#CCFF00', '#00BCD4', '#FF9500'].map((c, i) => (
          <div key={i} style={{ ...sx.socialAvatar, background: c, zIndex: 5 - i, marginLeft: i > 0 ? -8 : 0 }} />
        ))}
      </div>
      <span style={sx.socialText}>Join <strong style={{ color: '#fff' }}>1,200+</strong> athletes on the priority list</span>
    </div>
  );
}

/* ──────────────── FOMO progress bar ──────────────── */
function FomoBar() {
  const ref = useRef(null);
  const visible = useOnScreen(ref, 0.5);
  return (
    <div ref={ref} style={sx.fomoWrap}>
      <div style={sx.fomoTop}>
        <span style={sx.fomoLabel}>Beta Access</span>
        <span style={sx.fomoPct}>85% Full</span>
      </div>
      <div style={sx.fomoTrack}>
        <div style={{
          ...sx.fomoFill,
          width: visible ? '85%' : '0%',
        }} />
      </div>
      <p style={sx.fomoSub}>Limited spots remaining — early users get priority access</p>
    </div>
  );
}

/* ──────────────── creator card ──────────────── */
const creators = [
  { name: 'Sarah Chen', handle: '@sarahlifts', type: 'Strength & Nutrition', plans: 12, tag: 'Popular' },
  { name: 'Marcus Reid', handle: '@marcusmoves', type: 'HIIT & Conditioning', plans: 8, tag: 'New' },
  { name: 'Priya Sharma', handle: '@priyaflow', type: 'Yoga & Mobility', plans: 15, tag: 'Trending' },
];

function CreatorCard({ creator, delay }) {
  const initials = creator.name.split(' ').map((w) => w[0]).join('');
  return (
    <FadeIn delay={delay}>
      <div style={sx.creatorCard}>
        <div style={sx.creatorTop}>
          <div style={sx.creatorAvatar}>{initials}</div>
          <div>
            <p style={sx.creatorName}>{creator.name}</p>
            <p style={sx.creatorHandle}>{creator.handle}</p>
          </div>
          <span style={sx.creatorTag}>{creator.tag}</span>
        </div>
        <p style={sx.creatorType}>{creator.type}</p>
        <div style={sx.creatorMeta}>
          <span>{creator.plans} plans</span>
          <span style={sx.creatorDot} />
          <span>Meal + Workout</span>
        </div>
      </div>
    </FadeIn>
  );
}

/* ──────────────── plan card ──────────────── */
function PlanCard({ delay }) {
  return (
    <FadeIn delay={delay}>
      <div style={sx.planCard}>
        <div style={sx.planBadgeRow}>
          <span style={sx.planBadge}>Meal Plan</span>
          <span style={{ ...sx.planBadge, background: 'rgba(0,122,255,.1)', color: CTA, borderColor: 'rgba(0,122,255,.2)' }}>Workout Plan</span>
        </div>
        <p style={sx.planTitle}>12-Week Lean Bulk</p>
        <p style={sx.planCreator}>by Sarah Chen</p>
        <div style={sx.planDivider} />
        <p style={sx.planIncludesLabel}>What's included:</p>
        <div style={sx.planIncludes}>
          {['84 meals with macros', 'Weekly grocery lists', '5-day workout split', 'Calendar sync', 'Swap-friendly alternatives'].map((item) => (
            <div key={item} style={sx.planIncludeItem}>
              <span style={sx.planCheckmark}>&#10003;</span>
              {item}
            </div>
          ))}
        </div>
        <div style={sx.planPriceRow}>
          <span style={sx.planPrice}>$29</span>
          <span style={sx.planPriceNote}>one-time purchase</span>
        </div>
      </div>
    </FadeIn>
  );
}

/* ──────────────────── grocery mock ──────────────────── */
const groceryCategories = [
  { label: 'Produce', items: ['Spinach', 'Avocado', 'Sweet potato', 'Blueberries'] },
  { label: 'Proteins', items: ['Chicken breast', 'Salmon fillet', 'Greek yoghurt'] },
  { label: 'Grains', items: ['Brown rice', 'Oats', 'Sourdough'] },
  { label: 'Pantry', items: ['Olive oil', 'Almond butter', 'Chia seeds'] },
];

function GroceryList() {
  const [checked, setChecked] = useState({});
  const toggle = (key) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div style={sx.groceryGrid}>
      {groceryCategories.map((cat) => (
        <div key={cat.label} style={sx.groceryCol}>
          <p style={sx.groceryCatLabel}>{cat.label}</p>
          {cat.items.map((item) => {
            const key = `${cat.label}-${item}`;
            const done = checked[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                style={{
                  ...sx.groceryItem,
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.4 : 1,
                  borderColor: done ? 'rgba(204,255,0,.25)' : 'rgba(255,255,255,.08)',
                }}
              >
                <span style={{
                  ...sx.groceryCheck,
                  background: done ? SUCCESS : 'transparent',
                  borderColor: done ? SUCCESS : 'rgba(255,255,255,.25)',
                }}>
                  {done && <span style={{ color: '#121212', fontSize: 11, lineHeight: 1 }}>&#10003;</span>}
                </span>
                {item}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ──────────────── calendar mock ──────────────── */
const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const workoutSlots = {
  Mon: { label: 'Push', time: '7:00 AM' },
  Tue: { label: 'Pull', time: '7:00 AM' },
  Wed: null,
  Thu: { label: 'Legs', time: '7:00 AM' },
  Fri: { label: 'Upper', time: '6:30 AM' },
  Sat: { label: 'Cardio', time: '9:00 AM' },
  Sun: null,
};

function CalendarMock() {
  return (
    <div style={sx.calGrid}>
      {calendarDays.map((d) => {
        const slot = workoutSlots[d];
        return (
          <div key={d} style={{ ...sx.calDay, borderColor: slot ? 'rgba(0,122,255,.3)' : 'rgba(255,255,255,.08)' }}>
            <span style={sx.calDayLabel}>{d}</span>
            {slot ? (
              <>
                <span style={sx.calWorkout}>{slot.label}</span>
                <span style={sx.calTime}>{slot.time}</span>
              </>
            ) : (
              <span style={sx.calRest}>Rest</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────── flow connector ──────────────── */
function FlowArrow() {
  return (
    <div style={sx.flowArrow}>
      <div style={sx.flowLine} />
      <span style={sx.flowLabel}>generates</span>
      <div style={sx.flowLine} />
    </div>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function ConsumerLanding() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const showStickyCta = scrollY > 600;

  return (
    <div style={sx.page}>
      {/* ─── nav bar (sticky header) ─── */}
      <nav style={{
        ...sx.nav,
        backdropFilter: scrollY > 40 ? 'blur(16px)' : 'none',
        background: scrollY > 40 ? 'rgba(18,18,18,.9)' : 'transparent',
        borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent',
      }}>
        <span style={sx.logo}>plana</span>
        <div style={sx.navLinks}>
          <a href="#how" style={sx.navLink}>How it works</a>
          {showStickyCta && (
            <a href="#waitlist" style={sx.navCta}>Join Waitlist</a>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={sx.hero}>
        <div style={sx.heroBadge}>
          <span style={sx.heroBadgeDot} />
          Coming soon
        </div>

        <FadeIn>
          <h1 style={sx.heroH1}>
            Your Personal Trainer,
            <br />
            <span style={sx.heroAccent}>Powered by AI.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.12}>
          <p style={sx.heroSub}>
            Buy expert meal plans and workout programmes from real fitness creators.
            Plana auto-generates your grocery list, syncs every session to your
            calendar, and keeps you on track — no screenshots, no spreadsheets.
          </p>
        </FadeIn>

        <FadeIn delay={0.22}>
          <div id="waitlist">
            <WaitlistForm source="consumer" />
          </div>
        </FadeIn>

        <FadeIn delay={0.32}>
          <SocialProof />
        </FadeIn>

        <FadeIn delay={0.4}>
          <FomoBar />
        </FadeIn>

        {/* scrolling marquee */}
        <div style={sx.marqueeWrap}>
          <div style={sx.marqueeTrack}>
            {['Strength', 'HIIT', 'Yoga', 'Nutrition', 'Pilates', 'Mobility', 'Running', 'Meal Prep', 'Bodybuilding', 'Crossfit', 'Strength', 'HIIT', 'Yoga', 'Nutrition', 'Pilates', 'Mobility', 'Running', 'Meal Prep', 'Bodybuilding', 'Crossfit'].map((t, i) => (
              <span key={i} style={sx.marqueeTag}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BROWSE CREATORS ─── */}
      <section id="how" style={sx.section}>
        <FadeIn>
          <p style={sx.sectionLabel}>Step 1</p>
          <h2 style={sx.sectionH2}>Find a creator you already trust</h2>
          <p style={sx.sectionSub}>
            Real coaches, real athletes, real nutritionists — not faceless AI content.
            Browse by goal, training style, or the creators you already follow on social.
          </p>
        </FadeIn>

        <div style={sx.creatorsGrid}>
          {creators.map((c, i) => (
            <CreatorCard key={c.handle} creator={c} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* ─── BUY A PLAN ─── */}
      <section style={sx.section}>
        <div style={sx.splitRow} className="plana-split">
          <div style={sx.splitText}>
            <FadeIn>
              <p style={sx.sectionLabel}>Step 2</p>
              <h2 style={sx.sectionH2}>Buy a plan. Get everything inside it.</h2>
              <p style={sx.sectionSub}>
                Each plan is a complete package — meals with macros, workouts with sets and reps,
                and the tools to actually follow through. Buy once. No subscriptions.
              </p>
              <div style={sx.valuePills}>
                {['Meal plans', 'Workout programmes', 'Macro breakdowns', 'Grocery lists', 'Calendar sync', 'Swap alternatives'].map((v) => (
                  <span key={v} style={sx.valuePill}>{v}</span>
                ))}
              </div>
            </FadeIn>
          </div>
          <div style={sx.splitCard}>
            <PlanCard delay={0.1} />
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ─── */}
      <div style={sx.bigDivider}>
        <FadeIn>
          <p style={sx.bigDividerText}>
            You buy the plan.<br />
            <span style={sx.heroAccent}>Plana unpacks it for you.</span>
          </p>
        </FadeIn>
      </div>

      {/* ─── GROCERY LIST ─── */}
      <section style={sx.section}>
        <div style={sx.splitRowReverse} className="plana-split-reverse">
          <div style={sx.splitCard}>
            <FadeIn delay={0.1}>
              <div style={sx.mockCard}>
                <div style={sx.mockCardHeader}>
                  <span style={sx.mockCardDot('#FF5F57')} />
                  <span style={sx.mockCardDot('#FEBC2E')} />
                  <span style={sx.mockCardDot('#28C840')} />
                  <span style={sx.mockCardTitle}>Week 1 — Grocery List</span>
                </div>
                <GroceryList />
              </div>
            </FadeIn>
          </div>
          <div style={sx.splitText}>
            <FadeIn>
              <p style={sx.sectionLabel}>Auto-generated</p>
              <h2 style={sx.sectionH2}>Your meal plan writes your grocery list</h2>
              <p style={sx.sectionSub}>
                Every meal in your plan is broken down into ingredients, sorted by
                supermarket aisle — Produce, Proteins, Grains, Pantry. Open it at the shop,
                check items off as you go. No mental maths, no forgotten avocados.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      <FlowArrow />

      {/* ─── CALENDAR SYNC ─── */}
      <section style={sx.section}>
        <div style={sx.splitRow} className="plana-split">
          <div style={sx.splitText}>
            <FadeIn>
              <p style={sx.sectionLabel}>Auto-synced</p>
              <h2 style={sx.sectionH2}>Your workouts land in your calendar</h2>
              <p style={sx.sectionSub}>
                Connect Google or Apple Calendar. Every workout session from your
                plan is scheduled automatically — the right day, the right time,
                the right split. Open your calendar, see what's next, go.
              </p>
              <div style={sx.calBadges}>
                <span style={sx.calBadge}>
                  <span style={sx.calBadgeIcon}>G</span>
                  Google Calendar
                </span>
                <span style={sx.calBadge}>
                  <span style={{ ...sx.calBadgeIcon, background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)' }}>A</span>
                  Apple Calendar
                </span>
              </div>
            </FadeIn>
          </div>
          <div style={sx.splitCard}>
            <FadeIn delay={0.1}>
              <div style={sx.mockCard}>
                <div style={sx.mockCardHeader}>
                  <span style={sx.mockCardDot('#FF5F57')} />
                  <span style={sx.mockCardDot('#FEBC2E')} />
                  <span style={sx.mockCardDot('#28C840')} />
                  <span style={sx.mockCardTitle}>This Week</span>
                </div>
                <CalendarMock />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── CUSTOM PLANS ─── */}
      <section style={sx.section}>
        <FadeIn>
          <div style={sx.customBlock}>
            <p style={sx.sectionLabel}>Coming soon</p>
            <h2 style={{ ...sx.sectionH2, textAlign: 'center' }}>Want something made just for you?</h2>
            <p style={{ ...sx.sectionSub, textAlign: 'center', margin: '0 auto 40px' }}>
              Answer a short quiz about your goals, dietary needs, and schedule.
              Your chosen creator builds a fully custom plan — your macros, your
              preferences, your life. Delivered straight into Plana.
            </p>
            <div style={sx.quizSteps}>
              {[
                { num: '1', text: 'Pick a creator' },
                { num: '2', text: 'Take the quiz' },
                { num: '3', text: 'Get your custom plan' },
              ].map((s, i) => (
                <div key={i} style={sx.quizStep}>
                  <span style={sx.quizNum}>{s.num}</span>
                  <span style={sx.quizText}>{s.text}</span>
                  {i < 2 && <span style={sx.quizArrow}>&rarr;</span>}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── CTA FOOTER ─── */}
      <section style={sx.ctaSection}>
        <FadeIn>
          <h2 style={sx.ctaH2}>
            Stop screenshotting plans<br />
            you'll never follow<span style={{ color: CTA }}>.</span>
          </h2>
          <p style={sx.ctaSub}>
            Get early access to Plana — the marketplace where buying a plan
            actually means following it.
          </p>
          <WaitlistForm source="consumer" />
          <p style={sx.ctaSmall}>Free to join. No credit card required.</p>
        </FadeIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={sx.footer}>
        <span style={sx.logo}>plana</span>
        <p style={sx.footerNote}>&copy; {new Date().getFullYear()} Plana. All rights reserved.</p>
      </footer>

      {/* inline keyframes */}
      <style>{`
        @keyframes plana-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes plana-pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: .4; }
        }
        @keyframes plana-fomo-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(0,122,255,.3); }
          50%      { box-shadow: 0 0 16px rgba(0,122,255,.5); }
        }
        input::placeholder { color: rgba(255,255,255,.3); }
        html { scroll-padding-top: 80px; }
        @media (max-width: 768px) {
          .plana-split { flex-direction: column !important; }
          .plana-split-reverse { flex-direction: column-reverse !important; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */
const CTA = '#007AFF';
const SUCCESS = '#CCFF00';
const BG = '#121212';
const CARD_BG = '#1A1A1A';
const BORDER = 'rgba(255,255,255,.08)';
const MAX_W = 1120;

const sx = {
  page: {
    background: BG,
    minHeight: '100vh',
    color: '#FAFAFA',
  },

  /* ── nav ── */
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(20px, 5vw, 48px)',
    height: 64,
    transition: 'all .3s ease',
  },
  logo: {
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: '-0.04em',
    color: '#fff',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(255,255,255,.5)',
    textDecoration: 'none',
  },
  navCta: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: CTA,
    padding: '8px 20px',
    borderRadius: 99,
    textDecoration: 'none',
    animation: 'plana-fomo-glow 2s ease-in-out infinite',
  },

  /* ── hero ── */
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '160px clamp(20px, 5vw, 48px) 80px',
    maxWidth: MAX_W,
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: CTA,
    background: 'rgba(0,122,255,.08)',
    border: '1px solid rgba(0,122,255,.2)',
    borderRadius: 99,
    padding: '6px 16px',
    marginBottom: 32,
    letterSpacing: '0.02em',
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: CTA,
    display: 'inline-block',
    animation: 'plana-pulse 2s ease-in-out infinite',
  },
  heroH1: {
    fontSize: 'clamp(34px, 5.8vw, 68px)',
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: '-0.035em',
    margin: '0 0 28px',
    maxWidth: 780,
  },
  heroAccent: {
    color: CTA,
  },
  heroSub: {
    fontSize: 'clamp(15px, 2vw, 18px)',
    color: 'rgba(255,255,255,.5)',
    maxWidth: 560,
    margin: '0 0 40px',
    lineHeight: 1.7,
  },

  /* ── social proof ── */
  socialProof: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  socialAvatars: {
    display: 'flex',
    alignItems: 'center',
  },
  socialAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid #121212',
  },
  socialText: {
    fontSize: 14,
    color: 'rgba(255,255,255,.5)',
  },

  /* ── FOMO bar ── */
  fomoWrap: {
    marginTop: 28,
    width: '100%',
    maxWidth: 420,
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 14,
    padding: '18px 22px',
  },
  fomoTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fomoLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  fomoPct: {
    fontSize: 14,
    fontWeight: 700,
    color: CTA,
    fontFamily: "'JetBrains Mono', monospace",
  },
  fomoTrack: {
    height: 8,
    borderRadius: 4,
    background: 'rgba(255,255,255,.06)',
    overflow: 'hidden',
  },
  fomoFill: {
    height: '100%',
    borderRadius: 4,
    background: `linear-gradient(90deg, ${CTA}, rgba(0,122,255,.6))`,
    transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
  },
  fomoSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,.3)',
    marginTop: 8,
  },

  /* ── marquee ── */
  marqueeWrap: {
    width: '100vw',
    overflow: 'hidden',
    marginTop: 80,
    borderTop: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
    padding: '18px 0',
  },
  marqueeTrack: {
    display: 'flex',
    gap: 12,
    width: 'max-content',
    animation: 'plana-marquee 30s linear infinite',
  },
  marqueeTag: {
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,.25)',
    padding: '6px 18px',
    border: `1px solid ${BORDER}`,
    borderRadius: 99,
    whiteSpace: 'nowrap',
  },

  /* ── sections ── */
  section: {
    maxWidth: MAX_W,
    margin: '0 auto',
    padding: '100px clamp(20px, 5vw, 48px)',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: CTA,
    marginBottom: 12,
  },
  sectionH2: {
    fontSize: 'clamp(26px, 4.2vw, 44px)',
    fontWeight: 800,
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
    marginBottom: 16,
  },
  sectionSub: {
    fontSize: 'clamp(15px, 1.8vw, 17px)',
    color: 'rgba(255,255,255,.45)',
    maxWidth: 520,
    lineHeight: 1.7,
    marginBottom: 32,
  },

  /* ── creator cards ── */
  creatorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    marginTop: 40,
  },
  creatorCard: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: 24,
  },
  creatorTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(0,122,255,.2), rgba(0,122,255,.05))',
    border: '1px solid rgba(0,122,255,.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    color: CTA,
    flexShrink: 0,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  creatorHandle: {
    fontSize: 13,
    color: 'rgba(255,255,255,.35)',
  },
  creatorTag: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: CTA,
    background: 'rgba(0,122,255,.1)',
    border: '1px solid rgba(0,122,255,.15)',
    borderRadius: 99,
    padding: '3px 10px',
    alignSelf: 'flex-start',
  },
  creatorType: {
    fontSize: 14,
    color: 'rgba(255,255,255,.55)',
    marginBottom: 12,
  },
  creatorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,.3)',
  },
  creatorDot: {
    width: 3,
    height: 3,
    borderRadius: '50%',
    background: 'rgba(255,255,255,.2)',
    display: 'inline-block',
  },

  /* ── plan card ── */
  planCard: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: 'clamp(24px, 3vw, 32px)',
    maxWidth: 380,
  },
  planBadgeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  planBadge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    padding: '4px 10px',
    borderRadius: 6,
    background: 'rgba(204,255,0,.08)',
    color: SUCCESS,
    border: '1px solid rgba(204,255,0,.2)',
  },
  planTitle: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  planCreator: {
    fontSize: 14,
    color: 'rgba(255,255,255,.4)',
    marginBottom: 20,
  },
  planDivider: {
    height: 1,
    background: BORDER,
    marginBottom: 20,
  },
  planIncludesLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,.35)',
    marginBottom: 12,
  },
  planIncludes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 24,
  },
  planIncludeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,.7)',
  },
  planCheckmark: {
    color: SUCCESS,
    fontSize: 13,
    fontWeight: 700,
  },
  planPriceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.02em',
  },
  planPriceNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,.3)',
  },

  /* ── split layouts ── */
  splitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(32px, 5vw, 80px)',
    flexWrap: 'wrap',
  },
  splitRowReverse: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(32px, 5vw, 80px)',
    flexWrap: 'wrap',
    flexDirection: 'row-reverse',
  },
  splitText: {
    flex: '1 1 320px',
    minWidth: 0,
  },
  splitCard: {
    flex: '1 1 320px',
    minWidth: 0,
  },

  /* ── value pills ── */
  valuePills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  valuePill: {
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,.6)',
    background: 'rgba(255,255,255,.04)',
    border: `1px solid ${BORDER}`,
    borderRadius: 99,
    padding: '6px 14px',
  },

  /* ── big divider ── */
  bigDivider: {
    textAlign: 'center',
    padding: '80px clamp(20px, 5vw, 48px)',
    borderTop: `1px solid ${BORDER}`,
    borderBottom: `1px solid ${BORDER}`,
  },
  bigDividerText: {
    fontSize: 'clamp(24px, 4vw, 42px)',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
  },

  /* ── mock card chrome ── */
  mockCard: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mockCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 20px',
    borderBottom: `1px solid ${BORDER}`,
  },
  mockCardDot: (c) => ({
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: c,
    display: 'inline-block',
  }),
  mockCardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,.45)',
    marginLeft: 8,
  },

  /* ── grocery ── */
  groceryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: 20,
    padding: 'clamp(16px, 3vw, 28px)',
  },
  groceryCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  groceryCatLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: CTA,
    marginBottom: 4,
  },
  groceryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'transparent',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    color: '#FAFAFA',
    cursor: 'pointer',
    transition: 'all .2s',
    fontFamily: 'inherit',
    textAlign: 'left',
    width: '100%',
  },
  groceryCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: '1.5px solid rgba(255,255,255,.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all .2s',
  },

  /* ── calendar ── */
  calGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
    padding: 'clamp(12px, 3vw, 24px)',
  },
  calDay: {
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 'clamp(8px, 1.5vw, 14px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    minHeight: 90,
    transition: 'border-color .3s',
  },
  calDayLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,.4)',
  },
  calWorkout: {
    fontSize: 'clamp(10px, 1.3vw, 13px)',
    fontWeight: 600,
    color: CTA,
    textAlign: 'center',
    marginTop: 'auto',
  },
  calTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,.3)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  calRest: {
    fontSize: 12,
    color: 'rgba(255,255,255,.15)',
    marginTop: 'auto',
  },
  calBadges: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  },
  calBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,.55)',
    background: 'rgba(255,255,255,.04)',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '8px 14px',
  },
  calBadgeIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: 'rgba(0,122,255,.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: CTA,
  },

  /* ── custom plans ── */
  customBlock: {
    background: CARD_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: 'clamp(32px, 5vw, 64px)',
    textAlign: 'center',
  },
  quizSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quizStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  quizNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(0,122,255,.1)',
    border: '1px solid rgba(0,122,255,.2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    color: CTA,
  },
  quizText: {
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(255,255,255,.7)',
  },
  quizArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,.15)',
    margin: '0 8px',
  },

  /* ── flow arrow ── */
  flowArrow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    maxWidth: 300,
    margin: '0 auto',
    padding: '0 clamp(20px, 5vw, 48px)',
  },
  flowLine: {
    flex: 1,
    height: 1,
    background: 'rgba(0,122,255,.2)',
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(0,122,255,.4)',
  },

  /* ── form ── */
  form: {
    width: '100%',
    maxWidth: 480,
  },
  inputWrap: {
    display: 'flex',
    gap: 0,
    background: CARD_BG,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    overflow: 'hidden',
    padding: 4,
    transition: 'border-color .2s',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#FAFAFA',
    fontSize: 15,
    padding: '14px 16px',
    fontFamily: 'inherit',
    minWidth: 0,
  },
  btn: {
    background: CTA,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '14px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'opacity .2s',
    flexShrink: 0,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: 10,
  },

  /* ── success + referral ── */
  successWrap: {
    background: 'rgba(204,255,0,.04)',
    border: '1px solid rgba(204,255,0,.2)',
    borderRadius: 16,
    padding: '24px 28px',
    maxWidth: 480,
  },
  successTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  successCheck: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: SUCCESS,
    color: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  successText: {
    color: SUCCESS,
    fontSize: 15,
    fontWeight: 600,
  },
  referralBlock: {
    background: 'rgba(255,255,255,.03)',
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: '14px 16px',
  },
  referralLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
    marginBottom: 10,
  },
  referralRow: {
    display: 'flex',
    gap: 8,
  },
  referralInput: {
    flex: 1,
    background: 'rgba(255,255,255,.04)',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: '#FAFAFA',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    minWidth: 0,
  },
  referralBtn: {
    background: CTA,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  /* ── cta ── */
  ctaSection: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '120px clamp(20px, 5vw, 48px)',
    borderTop: `1px solid ${BORDER}`,
  },
  ctaH2: {
    fontSize: 'clamp(30px, 5vw, 52px)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: 16,
  },
  ctaSub: {
    fontSize: 'clamp(15px, 1.8vw, 17px)',
    color: 'rgba(255,255,255,.4)',
    maxWidth: 460,
    lineHeight: 1.7,
    marginBottom: 36,
  },
  ctaSmall: {
    fontSize: 13,
    color: 'rgba(255,255,255,.25)',
    marginTop: 20,
  },

  /* ── footer ── */
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '32px clamp(20px, 5vw, 48px)',
    borderTop: `1px solid ${BORDER}`,
    maxWidth: MAX_W,
    margin: '0 auto',
  },
  footerNote: {
    fontSize: 13,
    color: 'rgba(255,255,255,.25)',
  },
};

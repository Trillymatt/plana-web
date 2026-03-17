import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SECTION_ORDER = {
  consumer: ['hero', 'browse-creators', 'buy-a-plan', 'grocery-list', 'calendar-sync', 'custom-plans', 'cta-footer'],
  creator: ['hero', 'fee-comparison', 'plan-types', 'platform-features', 'revenue-calculator', 'founding-perks', 'cta-footer'],
};

export default function AnalyticsDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('all');
  const [days, setDays] = useState(7);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const since = new Date(Date.now() - days * 86400000).toISOString();
      let query = supabase
        .from('page_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (page !== 'all') query = query.eq('page', page);

      const { data, error } = await query;
      if (error) console.error(error);
      setEvents(data || []);
      setLoading(false);
    }
    load();
  }, [page, days]);

  const sessions = new Set(events.map((e) => e.session_id));
  const totalSessions = sessions.size;
  const pageViews = events.filter((e) => e.event_type === 'page_view');
  const sectionViews = events.filter((e) => e.event_type === 'section_view');
  const scrollEvents = events.filter((e) => e.event_type === 'scroll_depth');
  const ctaClicks = events.filter((e) => e.event_type === 'cta_click');

  // section funnel
  const sectionCounts = {};
  sectionViews.forEach((e) => {
    const s = e.event_data?.section;
    if (s) sectionCounts[s] = (sectionCounts[s] || 0) + 1;
  });

  const activePage = page === 'all' ? 'consumer' : page;
  const orderedSections = SECTION_ORDER[activePage] || [];

  // scroll depth
  const scrollCounts = { 25: 0, 50: 0, 75: 0, 100: 0 };
  scrollEvents.forEach((e) => {
    const d = e.event_data?.depth;
    if (d && scrollCounts[d] !== undefined) scrollCounts[d]++;
  });

  // cta click breakdown
  const ctaBreakdown = {};
  ctaClicks.forEach((e) => {
    const a = e.event_data?.action || 'unknown';
    ctaBreakdown[a] = (ctaBreakdown[a] || 0) + 1;
  });

  // traffic sources
  const sources = {};
  pageViews.forEach((e) => {
    const ref = e.event_data?.referrer;
    const utm = e.event_data?.utm;
    let label = 'Direct';
    if (utm?.utm_source) label = utm.utm_source;
    else if (ref) {
      try { label = new URL(ref).hostname; } catch { label = ref; }
    }
    sources[label] = (sources[label] || 0) + 1;
  });
  const sortedSources = Object.entries(sources).sort((a, b) => b[1] - a[1]);

  // device breakdown from screen size
  let mobile = 0;
  let desktop = 0;
  pageViews.forEach((e) => {
    const screen = e.event_data?.screen;
    if (!screen) return;
    const width = parseInt(screen.split('x')[0], 10);
    if (width < 768) mobile++;
    else desktop++;
  });

  // page views by day
  const viewsByDay = {};
  pageViews.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    viewsByDay[day] = (viewsByDay[day] || 0) + 1;
  });
  const sortedDays = Object.entries(viewsByDay).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDayViews = Math.max(...sortedDays.map(([, v]) => v), 1);

  return (
    <div style={sx.page}>
      <div style={sx.container}>
        {/* header */}
        <div style={sx.header}>
          <div>
            <h1 style={sx.h1}>Plana Analytics</h1>
            <p style={sx.headerSub}>Waitlist funnel performance</p>
          </div>
          <div style={sx.filters}>
            <select value={page} onChange={(e) => setPage(e.target.value)} style={sx.select}>
              <option value="all">All pages</option>
              <option value="consumer">Consumer</option>
              <option value="creator">Creator</option>
            </select>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={sx.select}>
              <option value={1}>Last 24h</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 80 }}>Loading...</p>
        ) : events.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.4)', textAlign: 'center', padding: 80 }}>No events yet. Data will appear once visitors land on your pages.</p>
        ) : (
          <>
            {/* summary cards */}
            <div style={sx.cards}>
              <StatCard label="Page Views" value={pageViews.length} />
              <StatCard label="Unique Sessions" value={totalSessions} />
              <StatCard label="Sections Seen (avg)" value={totalSessions ? (sectionViews.length / totalSessions).toFixed(1) : '0'} />
              <StatCard label="CTA Clicks" value={ctaClicks.length} />
            </div>

            {/* views by day */}
            <div style={sx.card}>
              <h2 style={sx.cardTitle}>Page Views by Day</h2>
              <div style={sx.dayChart}>
                {sortedDays.map(([day, count]) => (
                  <div key={day} style={sx.dayRow}>
                    <span style={sx.dayLabel}>{day}</span>
                    <div style={sx.dayBarTrack}>
                      <div style={{ ...sx.dayBarFill, width: `${(count / maxDayViews) * 100}%` }} />
                    </div>
                    <span style={sx.dayCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* section funnel */}
            <div style={sx.card}>
              <h2 style={sx.cardTitle}>Section Funnel {page === 'all' && <span style={sx.cardHint}>(showing consumer order)</span>}</h2>
              <p style={sx.cardSub}>Where visitors drop off — each bar shows how many sessions viewed that section</p>
              <div style={sx.funnel}>
                {orderedSections.map((section, i) => {
                  const count = sectionCounts[section] || 0;
                  const pct = totalSessions ? Math.round((count / totalSessions) * 100) : 0;
                  const prevCount = i === 0 ? totalSessions : (sectionCounts[orderedSections[i - 1]] || 0);
                  const dropoff = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : 0;
                  return (
                    <div key={section} style={sx.funnelRow}>
                      <span style={sx.funnelLabel}>{section}</span>
                      <div style={sx.funnelBarTrack}>
                        <div style={{ ...sx.funnelBarFill, width: `${pct}%` }} />
                      </div>
                      <span style={sx.funnelPct}>{pct}%</span>
                      <span style={sx.funnelCount}>{count}</span>
                      {i > 0 && dropoff > 0 && (
                        <span style={sx.funnelDrop}>-{dropoff}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* scroll depth + device split */}
            <div style={sx.twoCol}>
              <div style={sx.card}>
                <h2 style={sx.cardTitle}>Scroll Depth</h2>
                <div style={sx.funnel}>
                  {[25, 50, 75, 100].map((d) => {
                    const count = scrollCounts[d];
                    const pct = totalSessions ? Math.round((count / totalSessions) * 100) : 0;
                    return (
                      <div key={d} style={sx.funnelRow}>
                        <span style={sx.funnelLabel}>{d}%</span>
                        <div style={sx.funnelBarTrack}>
                          <div style={{ ...sx.funnelBarFill, width: `${pct}%` }} />
                        </div>
                        <span style={sx.funnelPct}>{pct}%</span>
                        <span style={sx.funnelCount}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={sx.card}>
                <h2 style={sx.cardTitle}>Devices</h2>
                <div style={sx.deviceRow}>
                  <DeviceBar label="Mobile" count={mobile} total={mobile + desktop} color="#007AFF" />
                  <DeviceBar label="Desktop" count={desktop} total={mobile + desktop} color="#00BCD4" />
                </div>

                <h2 style={{ ...sx.cardTitle, marginTop: 32 }}>CTA Clicks</h2>
                {Object.keys(ctaBreakdown).length === 0 ? (
                  <p style={sx.emptyText}>No clicks yet</p>
                ) : (
                  <div style={sx.table}>
                    {Object.entries(ctaBreakdown).sort((a, b) => b[1] - a[1]).map(([action, count]) => (
                      <div key={action} style={sx.tableRow}>
                        <span style={sx.tableLabel}>{action}</span>
                        <span style={sx.tableValue}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* traffic sources */}
            <div style={sx.card}>
              <h2 style={sx.cardTitle}>Traffic Sources</h2>
              {sortedSources.length === 0 ? (
                <p style={sx.emptyText}>No data</p>
              ) : (
                <div style={sx.table}>
                  {sortedSources.map(([source, count]) => (
                    <div key={source} style={sx.tableRow}>
                      <span style={sx.tableLabel}>{source}</span>
                      <span style={sx.tableValue}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── small components ── */
function StatCard({ label, value }) {
  return (
    <div style={sx.statCard}>
      <span style={sx.statValue}>{value}</span>
      <span style={sx.statLabel}>{label}</span>
    </div>
  );
}

function DeviceBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={sx.deviceLabel}>
        <span>{label}</span>
        <span style={{ color }}>{pct}% ({count})</span>
      </div>
      <div style={sx.funnelBarTrack}>
        <div style={{ ...sx.funnelBarFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── styles ── */
const BG = '#0A0A0A';
const CARD = '#111111';
const BORDER = 'rgba(255,255,255,.06)';
const ACCENT = '#007AFF';

const sx = {
  page: { background: BG, minHeight: '100vh', color: '#FAFAFA', fontFamily: "'Inter', sans-serif" },
  container: { maxWidth: 960, margin: '0 auto', padding: '32px clamp(16px, 4vw, 32px)' },

  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 16, marginBottom: 32,
  },
  h1: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,.4)' },
  filters: { display: 'flex', gap: 10 },
  select: {
    background: CARD, color: '#FAFAFA', border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', cursor: 'pointer',
  },

  cards: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12, marginBottom: 24,
  },
  statCard: {
    background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4,
  },
  statValue: {
    fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em',
    fontFamily: "'JetBrains Mono', monospace",
  },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,.4)', fontWeight: 500 },

  card: {
    background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
    padding: 'clamp(16px, 3vw, 28px)', marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  cardHint: { fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.3)', marginLeft: 8 },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 20 },

  twoCol: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16, alignItems: 'start',
  },

  /* funnel / bars */
  funnel: { display: 'flex', flexDirection: 'column', gap: 10 },
  funnelRow: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  funnelLabel: {
    fontSize: 13, color: 'rgba(255,255,255,.55)', width: 140, flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
  },
  funnelBarTrack: {
    flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.04)',
    overflow: 'hidden',
  },
  funnelBarFill: {
    height: '100%', borderRadius: 4,
    background: `linear-gradient(90deg, ${ACCENT}, rgba(0,122,255,.5))`,
    transition: 'width .4s ease',
    minWidth: 2,
  },
  funnelPct: {
    fontSize: 13, fontWeight: 700, color: ACCENT, width: 40, textAlign: 'right',
    fontFamily: "'JetBrains Mono', monospace",
  },
  funnelCount: {
    fontSize: 12, color: 'rgba(255,255,255,.3)', width: 36, textAlign: 'right',
    fontFamily: "'JetBrains Mono', monospace",
  },
  funnelDrop: {
    fontSize: 11, fontWeight: 600, color: '#FF6B6B', width: 40, textAlign: 'right',
    fontFamily: "'JetBrains Mono', monospace",
  },

  /* day chart */
  dayChart: { display: 'flex', flexDirection: 'column', gap: 6 },
  dayRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dayLabel: {
    fontSize: 13, color: 'rgba(255,255,255,.45)', width: 90, flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
  },
  dayBarTrack: {
    flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.04)',
    overflow: 'hidden',
  },
  dayBarFill: {
    height: '100%', borderRadius: 3,
    background: 'rgba(0,122,255,.4)',
    transition: 'width .3s ease',
  },
  dayCount: {
    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.5)', width: 30,
    textAlign: 'right', fontFamily: "'JetBrains Mono', monospace",
  },

  /* device */
  deviceRow: { display: 'flex', gap: 20 },
  deviceLabel: {
    display: 'flex', justifyContent: 'space-between', fontSize: 13,
    fontWeight: 500, color: 'rgba(255,255,255,.5)', marginBottom: 6,
  },

  /* table */
  table: { display: 'flex', flexDirection: 'column' },
  tableRow: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
    borderBottom: `1px solid ${BORDER}`,
  },
  tableLabel: { fontSize: 14, color: 'rgba(255,255,255,.6)' },
  tableValue: {
    fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
  },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,.25)', padding: '12px 0' },
};

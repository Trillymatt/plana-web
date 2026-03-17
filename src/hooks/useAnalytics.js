import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function getSessionId() {
  let id = sessionStorage.getItem('plana_sid');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('plana_sid', id);
  }
  return id;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return Object.keys(utm).length ? utm : null;
}

function sendEvent(sessionId, page, eventType, eventData) {
  supabase
    .from('page_events')
    .insert({ session_id: sessionId, page, event_type: eventType, event_data: eventData })
    .then(() => {})
    .catch(() => {});
}

export function useAnalytics(page) {
  const sessionId = useRef(getSessionId());
  const tracked = useRef(new Set());

  // page view on mount
  useEffect(() => {
    sendEvent(sessionId.current, page, 'page_view', {
      url: window.location.href,
      referrer: document.referrer || null,
      utm: getUtmParams(),
      screen: `${window.innerWidth}x${window.innerHeight}`,
    });
  }, [page]);

  // scroll depth milestones
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    function handler() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((window.scrollY / docHeight) * 100);
      for (const m of milestones) {
        const key = `scroll_${m}`;
        if (pct >= m && !tracked.current.has(key)) {
          tracked.current.add(key);
          sendEvent(sessionId.current, page, 'scroll_depth', { depth: m });
        }
      }
    }
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [page]);

  // returns a callback ref — attach to any section element
  const trackSection = useCallback((sectionId) => {
    return (el) => {
      if (!el || tracked.current.has(sectionId)) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !tracked.current.has(sectionId)) {
            tracked.current.add(sectionId);
            sendEvent(sessionId.current, page, 'section_view', { section: sectionId });
            obs.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
    };
  }, [page]);

  const trackClick = useCallback((action) => {
    sendEvent(sessionId.current, page, 'cta_click', { action });
  }, [page]);

  return { trackSection, trackClick };
}

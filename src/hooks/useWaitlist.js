import { useState } from 'react';
import { supabase } from '../lib/supabase';

function generateReferralCode(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'PF' + Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

export function useWaitlist() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [referralCode, setReferralCode] = useState('');

  async function submit(email, source, socialHandle = null) {
    setStatus('loading');
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const ref = params.get('ref');

    const row = { email, source, utm_source: utmSource };
    if (socialHandle) row.social_handle = socialHandle;
    if (ref) row.referred_by = ref;

    const { error: dbError } = await supabase
      .from('waitlist')
      .insert(row);

    if (dbError) {
      if (dbError.code === '23505') {
        setReferralCode(generateReferralCode(email));
        setStatus('success');
        return;
      }
      setStatus('error');
      setError(dbError.message);
      return;
    }

    setReferralCode(generateReferralCode(email));
    setStatus('success');
  }

  return { submit, status, error, referralCode };
}

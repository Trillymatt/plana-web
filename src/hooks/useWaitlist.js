import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useWaitlist() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function submit(email, source) {
    setStatus('loading');
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');

    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({ email, source, utm_source: utmSource });

    if (dbError) {
      // Postgres unique violation — treat duplicate email as success
      if (dbError.code === '23505') {
        setStatus('success');
        return;
      }
      setStatus('error');
      setError(dbError.message);
      return;
    }

    setStatus('success');
  }

  return { submit, status, error };
}
